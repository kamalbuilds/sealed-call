use anchor_lang::prelude::*;
use solana_sha256_hasher::hashv;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{spl_token::native_mint, sync_native, SyncNative, Token};
use anchor_spl::token_2022::spl_token_2022::{
    self,
    extension::{BaseStateWithExtensions, ExtensionType, StateWithExtensions},
};
use anchor_spl::token_interface::{close_account, CloseAccount, Mint, TokenAccount, TokenInterface};

use super::withdraw::pay_from_vault;
use crate::damm::{self, SwapAccounts, DAMM_V2, EVENT_AUTHORITY, POOL_AUTHORITY};
use crate::errors::SealedError;
use crate::events::Revealed;
use crate::math::{locked_enough, split_fee, within_impact, within_reserve_share};
use crate::state::{Call, CallState, Config, CALL_SEED, CONFIG_SEED, VAULT_SEED};

#[derive(Accounts)]
pub struct RevealAndSwap<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Box<Account<'info, Config>>,
    #[account(
        mut,
        seeds = [CALL_SEED, call.caller.as_ref(), &call.call_id.to_le_bytes()],
        bump = call.bump,
        has_one = caller @ SealedError::Unauthorized
    )]
    pub call: Box<Account<'info, Call>>,
    #[account(mut, seeds = [VAULT_SEED, call.key().as_ref()], bump = call.vault_bump)]
    pub vault: SystemAccount<'info>,
    #[account(mut, address = config.treasury @ SealedError::Unauthorized)]
    pub treasury: SystemAccount<'info>,
    #[account(address = native_mint::ID)]
    pub native_mint: Box<InterfaceAccount<'info, Mint>>,
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        init_if_needed,
        payer = caller,
        associated_token::mint = native_mint,
        associated_token::authority = vault,
        associated_token::token_program = token_program
    )]
    pub vault_wsol: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = caller,
        associated_token::mint = mint,
        associated_token::authority = vault,
        associated_token::token_program = output_token_program
    )]
    pub vault_out: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: owned by DAMM v2; discriminator, length, mints and vaults are validated in the handler
    #[account(mut, owner = DAMM_V2 @ SealedError::NotDammPool)]
    pub pool: UncheckedAccount<'info>,
    /// CHECK: fixed DAMM v2 pool authority PDA
    #[account(address = POOL_AUTHORITY)]
    pub pool_authority: UncheckedAccount<'info>,
    /// CHECK: matched against the pool state in the handler
    #[account(mut)]
    pub token_a_vault: UncheckedAccount<'info>,
    /// CHECK: matched against the pool state in the handler
    #[account(mut)]
    pub token_b_vault: UncheckedAccount<'info>,
    /// CHECK: fixed DAMM v2 event authority PDA
    #[account(address = EVENT_AUTHORITY)]
    pub event_authority: UncheckedAccount<'info>,
    /// CHECK: the DAMM v2 program
    #[account(address = DAMM_V2, executable)]
    pub damm_program: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub output_token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

/// Bound to the call address so nobody can copy a seal into their own call and inherit the reveal.
pub fn commitment(call: &Pubkey, mint: &Pubkey, pool: &Pubkey, salt: &[u8; 32]) -> [u8; 32] {
    hashv(&[call.as_ref(), mint.as_ref(), pool.as_ref(), salt.as_ref()]).to_bytes()
}

/// Extensions that only describe the token. Anything else (transfer fee, hook, permanent delegate,
/// default frozen state, pausable, non-transferable, confidential transfers) can take value from claimants.
const SAFE_MINT_EXTENSIONS: [ExtensionType; 6] = [
    ExtensionType::MetadataPointer,
    ExtensionType::TokenMetadata,
    ExtensionType::GroupPointer,
    ExtensionType::TokenGroup,
    ExtensionType::GroupMemberPointer,
    ExtensionType::TokenGroupMember,
];

/// The output token must have a fixed supply and no freeze authority, so nobody can mint into the
/// followers' fill or freeze the vault's tokens before they claim.
fn check_mint(mint: &InterfaceAccount<Mint>) -> Result<()> {
    require!(
        mint.mint_authority.is_none() && mint.freeze_authority.is_none(),
        SealedError::MintAuthorityLive
    );
    let info = mint.to_account_info();
    if *info.owner == spl_token_2022::ID {
        let data = info.try_borrow_data()?;
        let state = StateWithExtensions::<spl_token_2022::state::Mint>::unpack(&data)?;
        for ext in state.get_extension_types()? {
            require!(SAFE_MINT_EXTENSIONS.contains(&ext), SealedError::UnsafeMintExtension);
        }
    }
    Ok(())
}

pub fn reveal_and_swap_handler(
    ctx: Context<RevealAndSwap>,
    mint: Pubkey,
    salt: [u8; 32],
    minimum_amount_out: u64,
) -> Result<()> {
    let a = ctx.accounts;
    require!(!a.config.paused, SealedError::Paused);
    require!(a.call.state == CallState::Open, SealedError::WrongState);
    let clock = Clock::get()?;
    require!(clock.unix_timestamp <= a.call.reveal_deadline, SealedError::DeadlinePassed);
    require!(minimum_amount_out > 0, SealedError::MinOutZero);

    // 1. the reveal must match the commitment
    require_keys_eq!(a.mint.key(), mint, SealedError::MintMismatch);
    require_keys_eq!(a.output_token_program.key(), *a.mint.to_account_info().owner, SealedError::WrongTokenProgram);
    let pool_key = a.pool.key();
    require!(commitment(&a.call.key(), &mint, &pool_key, &salt) == a.call.commitment, SealedError::HashMismatch);
    check_mint(&a.mint)?;

    // 2. the pool must be a real DAMM v2 pool trading exactly {wSOL, mint}; the wSOL side fixes the direction
    let pool = damm::read_pool(&a.pool.try_borrow_data()?)?;
    require_keys_eq!(a.token_a_vault.key(), pool.token_a_vault, SealedError::PoolVaultMismatch);
    require_keys_eq!(a.token_b_vault.key(), pool.token_b_vault, SealedError::PoolVaultMismatch);
    let wsol_is_a = if pool.token_a_mint == native_mint::ID && pool.token_b_mint == mint {
        true
    } else if pool.token_b_mint == native_mint::ID && pool.token_a_mint == mint {
        false
    } else {
        return err!(SealedError::PoolMintMismatch);
    };

    // A pool the caller made for this reveal could be priced anywhere and then drained or arbitraged by the
    // caller. Require a pool that was trading before the call opened, mostly locked liquidity, and depth.
    let live_before_open = match pool.activation_type {
        0 => pool.activation_point < a.call.opened_slot,
        1 => i64::try_from(pool.activation_point).map_or(false, |t| t < a.call.opened_at),
        _ => false,
    };
    require!(pool.pool_status == 0 && live_before_open, SealedError::PoolNotSeasoned);
    require!(
        locked_enough(pool.permanent_lock_liquidity, pool.liquidity, a.config.min_locked_liquidity_bps),
        SealedError::PoolLiquidityUnlocked
    );
    let wsol_vault = if wsol_is_a { &a.token_a_vault } else { &a.token_b_vault };
    let wsol_reserve = damm::token_amount(&wsol_vault.try_borrow_data()?)?;

    // 3. fees come out of the vault, the rest is wrapped and swapped in one go
    let total = a.call.total_lamports().ok_or(SealedError::Overflow)?;
    require!(total > 0, SealedError::NothingToSwap);
    let split = split_fee(total, a.call.fee_bps, a.call.caller_fee_share_bps).ok_or(SealedError::Overflow)?;
    require!(split.lamports_in > 0, SealedError::NothingToSwap);
    require!(
        within_reserve_share(split.lamports_in, wsol_reserve, a.config.max_swap_reserve_bps),
        SealedError::PoolTooThin
    );

    let call_key = a.call.key();
    let vault_bump = [a.call.vault_bump];
    let vault_seeds: &[&[u8]] = &[VAULT_SEED, call_key.as_ref(), &vault_bump];
    let signer: &[&[&[u8]]] = &[vault_seeds];

    pay_from_vault(&a.system_program, &a.vault, a.caller.to_account_info(), split.caller_fee, signer)?;
    pay_from_vault(&a.system_program, &a.vault, a.treasury.to_account_info(), split.treasury_fee, signer)?;
    pay_from_vault(&a.system_program, &a.vault, a.vault_wsol.to_account_info(), split.lamports_in, signer)?;
    sync_native(CpiContext::new(
        a.token_program.to_account_info(),
        SyncNative { account: a.vault_wsol.to_account_info() },
    ))?;

    // 4. swap through DAMM v2; the received amount is the output balance delta, never a return value
    let out_before = a.vault_out.amount;
    let (mint_a, mint_b, prog_a, prog_b) = if wsol_is_a {
        (
            a.native_mint.to_account_info(),
            a.mint.to_account_info(),
            a.token_program.to_account_info(),
            a.output_token_program.to_account_info(),
        )
    } else {
        (
            a.mint.to_account_info(),
            a.native_mint.to_account_info(),
            a.output_token_program.to_account_info(),
            a.token_program.to_account_info(),
        )
    };
    damm::swap(
        &SwapAccounts {
            pool: &a.pool.to_account_info(),
            input_token_account: &a.vault_wsol.to_account_info(),
            output_token_account: &a.vault_out.to_account_info(),
            token_a_vault: &a.token_a_vault.to_account_info(),
            token_b_vault: &a.token_b_vault.to_account_info(),
            token_a_mint: &mint_a,
            token_b_mint: &mint_b,
            payer: &a.vault.to_account_info(),
            token_a_program: &prog_a,
            token_b_program: &prog_b,
            pool_authority: &a.pool_authority.to_account_info(),
            event_authority: &a.event_authority.to_account_info(),
            damm_program: &a.damm_program.to_account_info(),
        },
        split.lamports_in,
        minimum_amount_out,
        signer,
    )?;
    a.vault_out.reload()?;
    let tokens_out = a.vault_out.amount.checked_sub(out_before).ok_or(SealedError::Overflow)?;
    require!(tokens_out >= minimum_amount_out, SealedError::SlippageExceeded);
    // the caller picks minimum_amount_out; the bound followers saw at deposit time is enforced here
    require!(
        within_impact(split.lamports_in, tokens_out, pool.sqrt_price, wsol_is_a, a.call.max_impact_bps),
        SealedError::PriceImpactExceeded
    );

    a.vault_wsol.reload()?;
    require!(a.vault_wsol.amount == 0, SealedError::SwapPartialFill);

    // 5. unwrap: close the wSOL account into the vault, then return the rent reserve and the wSOL
    //    account rent to the caller who funded both. The vault ends at zero lamports.
    close_account(CpiContext::new_with_signer(
        a.token_program.to_account_info(),
        CloseAccount {
            account: a.vault_wsol.to_account_info(),
            destination: a.vault.to_account_info(),
            authority: a.vault.to_account_info(),
        },
        signer,
    ))?;
    pay_from_vault(&a.system_program, &a.vault, a.caller.to_account_info(), a.vault.lamports(), signer)?;

    let call = &mut a.call;
    call.state = CallState::Executed;
    call.revealed_mint = mint;
    call.revealed_pool = pool_key;
    call.lamports_in = split.lamports_in;
    call.tokens_out = tokens_out;
    call.executed_at = clock.unix_timestamp;
    call.executed_slot = clock.slot;

    emit!(Revealed {
        call: call_key,
        caller: call.caller,
        mint,
        pool: pool_key,
        total_lamports: total,
        fee_lamports: split.fee,
        caller_fee_lamports: split.caller_fee,
        lamports_in: split.lamports_in,
        tokens_out,
        slot: clock.slot,
    });
    Ok(())
}

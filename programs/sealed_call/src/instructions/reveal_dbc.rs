use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{spl_token::native_mint, sync_native, SyncNative, Token};
use anchor_spl::token_interface::{close_account, CloseAccount, Mint, TokenAccount, TokenInterface};

use super::reveal::{check_mint, commitment_for, PoolKind};
use super::withdraw::pay_from_vault;
use crate::dbc::{self, SwapAccounts, DBC, EVENT_AUTHORITY, POOL_AUTHORITY};
use crate::errors::SealedError;
use crate::events::Revealed;
use crate::math::{split_fee, within_impact};
use crate::state::{Call, CallState, Config, CALL_SEED, CONFIG_SEED, VAULT_SEED};

/// Reveal a call sealed against a Meteora Dynamic Bonding Curve pool: the whole vault buys from the curve in one swap.
#[derive(Accounts)]
pub struct RevealAndSwapDbc<'info> {
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
    /// CHECK: owned by DBC; discriminator, length, mint, config and vaults are validated in the handler
    #[account(mut, owner = DBC @ SealedError::NotDbcPool)]
    pub pool: UncheckedAccount<'info>,
    /// CHECK: owned by DBC and matched against the pool state in the handler
    #[account(owner = DBC @ SealedError::NotDbcPool)]
    pub dbc_config: UncheckedAccount<'info>,
    /// CHECK: fixed DBC pool authority PDA
    #[account(address = POOL_AUTHORITY)]
    pub pool_authority: UncheckedAccount<'info>,
    /// CHECK: matched against the pool state in the handler
    #[account(mut)]
    pub base_vault: UncheckedAccount<'info>,
    /// CHECK: matched against the pool state in the handler
    #[account(mut)]
    pub quote_vault: UncheckedAccount<'info>,
    /// CHECK: fixed DBC event authority PDA
    #[account(address = EVENT_AUTHORITY)]
    pub event_authority: UncheckedAccount<'info>,
    /// CHECK: the DBC program
    #[account(address = DBC, executable)]
    pub dbc_program: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub output_token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn reveal_and_swap_dbc_handler(
    ctx: Context<RevealAndSwapDbc>,
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

    // 1. the reveal must match the commitment, which binds the DBC pool kind
    require_keys_eq!(a.mint.key(), mint, SealedError::MintMismatch);
    require_keys_eq!(a.output_token_program.key(), *a.mint.to_account_info().owner, SealedError::WrongTokenProgram);
    let pool_key = a.pool.key();
    require!(
        commitment_for(PoolKind::Dbc, &a.call.key(), &mint, &pool_key, &salt) == a.call.commitment,
        SealedError::HashMismatch
    );
    check_mint(&a.mint)?;

    // 2. the pool must be a live DBC pool selling exactly `mint` for wSOL on this config
    let pool = dbc::read_pool(&a.pool.try_borrow_data()?)?;
    require_keys_eq!(a.dbc_config.key(), pool.config, SealedError::DbcConfigMismatch);
    require_keys_eq!(pool.base_mint, mint, SealedError::PoolMintMismatch);
    require_keys_eq!(a.base_vault.key(), pool.base_vault, SealedError::PoolVaultMismatch);
    require_keys_eq!(a.quote_vault.key(), pool.quote_vault, SealedError::PoolVaultMismatch);
    require!(!pool.is_migrated && pool.migration_progress == 0, SealedError::PoolMigrated);

    // 3. fees come out of the vault, the rest is wrapped and swapped in one go
    let total = a.call.total_lamports().ok_or(SealedError::Overflow)?;
    require!(total > 0, SealedError::NothingToSwap);
    let split = split_fee(total, a.call.fee_bps, a.call.caller_fee_share_bps).ok_or(SealedError::Overflow)?;
    require!(split.lamports_in > 0, SealedError::NothingToSwap);

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
    // a donated wSOL balance must not block the reveal: measure the swap by what it spends
    a.vault_wsol.reload()?;
    let wsol_before = a.vault_wsol.amount;

    // 4. one swap on the curve; the received amount is the output balance delta, never a return value
    let out_before = a.vault_out.amount;
    dbc::swap(
        &SwapAccounts {
            config: &a.dbc_config.to_account_info(),
            pool: &a.pool.to_account_info(),
            input_token_account: &a.vault_wsol.to_account_info(),
            output_token_account: &a.vault_out.to_account_info(),
            base_vault: &a.base_vault.to_account_info(),
            quote_vault: &a.quote_vault.to_account_info(),
            base_mint: &a.mint.to_account_info(),
            quote_mint: &a.native_mint.to_account_info(),
            payer: &a.vault.to_account_info(),
            base_program: &a.output_token_program.to_account_info(),
            quote_program: &a.token_program.to_account_info(),
            pool_authority: &a.pool_authority.to_account_info(),
            event_authority: &a.event_authority.to_account_info(),
            dbc_program: &a.dbc_program.to_account_info(),
        },
        split.lamports_in,
        minimum_amount_out,
        signer,
    )?;
    a.vault_out.reload()?;
    let tokens_out = a.vault_out.amount.checked_sub(out_before).ok_or(SealedError::Overflow)?;
    require!(tokens_out >= minimum_amount_out, SealedError::SlippageExceeded);
    // wSOL is the quote side, so the base token is never "token a" of the price
    require!(
        within_impact(split.lamports_in, tokens_out, pool.sqrt_price, false, a.call.max_impact_bps),
        SealedError::PriceImpactExceeded
    );

    a.vault_wsol.reload()?;
    let wsol_spent = wsol_before.checked_sub(a.vault_wsol.amount).ok_or(SealedError::Overflow)?;
    require!(wsol_spent == split.lamports_in, SealedError::SwapPartialFill);

    // 5. unwrap and return the rent reserve to the caller, as in the DAMM v2 branch
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

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::errors::SealedError;
use crate::events::{CallerClaimed, Claimed};
use crate::math::pro_rata;
use crate::state::{Call, CallState, Position, CALL_SEED, POSITION_SEED, VAULT_SEED};

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub follower: Signer<'info>,
    #[account(mut, seeds = [CALL_SEED, call.caller.as_ref(), &call.call_id.to_le_bytes()], bump = call.bump)]
    pub call: Box<Account<'info, Call>>,
    #[account(seeds = [VAULT_SEED, call.key().as_ref()], bump = call.vault_bump)]
    pub vault: SystemAccount<'info>,
    #[account(
        mut,
        close = follower,
        seeds = [POSITION_SEED, call.key().as_ref(), follower.key().as_ref()],
        bump = position.bump,
        has_one = follower @ SealedError::Unauthorized
    )]
    pub position: Box<Account<'info, Position>>,
    #[account(address = call.revealed_mint @ SealedError::MintMismatch)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = vault,
        associated_token::token_program = token_program
    )]
    pub vault_out: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = follower,
        associated_token::mint = mint,
        associated_token::authority = follower,
        associated_token::token_program = token_program
    )]
    pub follower_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn claim_handler(ctx: Context<Claim>) -> Result<()> {
    let a = ctx.accounts;
    require!(a.call.state == CallState::Executed, SealedError::WrongState);
    require!(!a.position.claimed, SealedError::AlreadyClaimed);
    let total = a.call.total_lamports().ok_or(SealedError::Overflow)?;
    let amount = pro_rata(a.call.tokens_out, a.position.lamports, total).ok_or(SealedError::Overflow)?;

    send_tokens(
        &a.call,
        &a.token_program,
        &a.vault_out,
        &a.mint,
        a.follower_ata.to_account_info(),
        &a.vault,
        amount,
    )?;

    let call = &mut a.call;
    call.tokens_claimed = call.tokens_claimed.checked_add(amount).ok_or(SealedError::Overflow)?;
    call.follower_count = call.follower_count.checked_sub(1).ok_or(SealedError::Overflow)?;
    a.position.claimed = true;
    emit!(Claimed { call: call.key(), follower: a.follower.key(), lamports: a.position.lamports, amount });
    Ok(())
}

#[derive(Accounts)]
pub struct CallerClaim<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,
    #[account(
        mut,
        seeds = [CALL_SEED, call.caller.as_ref(), &call.call_id.to_le_bytes()],
        bump = call.bump,
        has_one = caller @ SealedError::Unauthorized
    )]
    pub call: Box<Account<'info, Call>>,
    #[account(seeds = [VAULT_SEED, call.key().as_ref()], bump = call.vault_bump)]
    pub vault: SystemAccount<'info>,
    #[account(address = call.revealed_mint @ SealedError::MintMismatch)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = vault,
        associated_token::token_program = token_program
    )]
    pub vault_out: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = caller,
        associated_token::mint = mint,
        associated_token::authority = caller,
        associated_token::token_program = token_program
    )]
    pub caller_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn caller_claim_handler(ctx: Context<CallerClaim>) -> Result<()> {
    let a = ctx.accounts;
    require!(a.call.state == CallState::Executed, SealedError::WrongState);
    let unlock = a.call.executed_at.checked_add(a.call.caller_lock_secs).ok_or(SealedError::Overflow)?;
    require!(Clock::get()?.unix_timestamp >= unlock, SealedError::CallerLockActive);
    require!(!a.call.caller_claimed, SealedError::AlreadyClaimed);
    let total = a.call.total_lamports().ok_or(SealedError::Overflow)?;
    let amount = pro_rata(a.call.tokens_out, a.call.caller_stake_lamports, total).ok_or(SealedError::Overflow)?;

    send_tokens(
        &a.call,
        &a.token_program,
        &a.vault_out,
        &a.mint,
        a.caller_ata.to_account_info(),
        &a.vault,
        amount,
    )?;

    let call = &mut a.call;
    call.caller_claimed = true;
    call.tokens_claimed = call.tokens_claimed.checked_add(amount).ok_or(SealedError::Overflow)?;
    emit!(CallerClaimed { call: call.key(), caller: call.caller, amount });
    Ok(())
}

/// transfer_checked out of the vault's output token account, signed by the vault PDA
pub fn send_tokens<'info>(
    call: &Account<'info, Call>,
    token_program: &Interface<'info, TokenInterface>,
    vault_out: &InterfaceAccount<'info, TokenAccount>,
    mint: &InterfaceAccount<'info, Mint>,
    to: AccountInfo<'info>,
    vault: &SystemAccount<'info>,
    amount: u64,
) -> Result<()> {
    let call_key = call.key();
    let bump = [call.vault_bump];
    let seeds: &[&[u8]] = &[VAULT_SEED, call_key.as_ref(), &bump];
    transfer_checked(
        CpiContext::new_with_signer(
            token_program.to_account_info(),
            TransferChecked {
                from: vault_out.to_account_info(),
                mint: mint.to_account_info(),
                to,
                authority: vault.to_account_info(),
            },
            &[seeds],
        ),
        amount,
        mint.decimals,
    )
}

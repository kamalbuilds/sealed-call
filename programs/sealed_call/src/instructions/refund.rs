use anchor_lang::prelude::*;

use super::withdraw::{pay_from_vault, refund_position};
use crate::errors::SealedError;
use crate::events::{CallExpired, Refunded};
use crate::state::{Call, CallState, Position, CALL_SEED, POSITION_SEED, VAULT_SEED};

#[derive(Accounts)]
pub struct Refund<'info> {
    /// CHECK: receives the refund; bound to the position by the seeds and `has_one` below
    #[account(mut)]
    pub follower: UncheckedAccount<'info>,
    #[account(mut, seeds = [CALL_SEED, call.caller.as_ref(), &call.call_id.to_le_bytes()], bump = call.bump)]
    pub call: Account<'info, Call>,
    #[account(mut, seeds = [VAULT_SEED, call.key().as_ref()], bump = call.vault_bump)]
    pub vault: SystemAccount<'info>,
    #[account(
        mut,
        close = follower,
        seeds = [POSITION_SEED, call.key().as_ref(), follower.key().as_ref()],
        bump = position.bump,
        constraint = position.follower == follower.key() @ SealedError::Unauthorized
    )]
    pub position: Account<'info, Position>,
    pub system_program: Program<'info, System>,
}

pub fn refund_handler(ctx: Context<Refund>) -> Result<()> {
    let a = ctx.accounts;
    require!(Clock::get()?.unix_timestamp > a.call.reveal_deadline, SealedError::DeadlineNotPassed);
    let amount = refund_position(&mut a.call, &a.position, &a.vault, a.follower.to_account_info(), &a.system_program)?;
    emit!(Refunded { call: a.call.key(), follower: a.follower.key(), amount });
    Ok(())
}

#[derive(Accounts)]
pub struct Expire<'info> {
    /// CHECK: receives the stake; must be the call's caller
    #[account(mut, address = call.caller @ SealedError::Unauthorized)]
    pub caller: UncheckedAccount<'info>,
    #[account(mut, seeds = [CALL_SEED, call.caller.as_ref(), &call.call_id.to_le_bytes()], bump = call.bump)]
    pub call: Account<'info, Call>,
    #[account(mut, seeds = [VAULT_SEED, call.key().as_ref()], bump = call.vault_bump)]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn expire_handler(ctx: Context<Expire>) -> Result<()> {
    let a = ctx.accounts;
    require!(a.call.state == CallState::Open, SealedError::WrongState);
    require!(Clock::get()?.unix_timestamp > a.call.reveal_deadline, SealedError::DeadlineNotPassed);
    require!(a.call.follower_count == 0, SealedError::FollowersRemain);

    // stake plus the rent reserve the caller funded at open: the vault empties
    let returned = a.vault.lamports();
    let call_key = a.call.key();
    let seeds: &[&[u8]] = &[VAULT_SEED, call_key.as_ref(), &[a.call.vault_bump]];
    pay_from_vault(&a.system_program, &a.vault, a.caller.to_account_info(), returned, &[seeds])?;
    a.call.state = CallState::Expired;
    emit!(CallExpired { call: call_key, caller: a.call.caller, returned_lamports: returned });
    Ok(())
}

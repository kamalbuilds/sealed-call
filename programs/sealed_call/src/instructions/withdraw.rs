use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::errors::SealedError;
use crate::events::Withdrawn;
use crate::state::{Call, CallState, Position, CALL_SEED, POSITION_SEED, VAULT_SEED};

/// System transfer out of the vault PDA. A zero amount is a no-op.
pub fn pay_from_vault<'info>(
    system_program: &Program<'info, System>,
    vault: &SystemAccount<'info>,
    to: AccountInfo<'info>,
    lamports: u64,
    signer: &[&[&[u8]]],
) -> Result<()> {
    if lamports == 0 {
        return Ok(());
    }
    transfer(
        CpiContext::new_with_signer(
            system_program.to_account_info(),
            Transfer { from: vault.to_account_info(), to },
            signer,
        ),
        lamports,
    )
}

/// Shared by `withdraw` (follower signs) and `refund` (anyone cranks): pay the position back in full.
pub fn refund_position<'info>(
    call: &mut Account<'info, Call>,
    position: &Account<'info, Position>,
    vault: &SystemAccount<'info>,
    follower: AccountInfo<'info>,
    system_program: &Program<'info, System>,
) -> Result<u64> {
    require!(call.state == CallState::Open, SealedError::WrongState);
    let amount = position.lamports;
    call.follower_lamports = call.follower_lamports.checked_sub(amount).ok_or(SealedError::Overflow)?;
    call.follower_count = call.follower_count.checked_sub(1).ok_or(SealedError::Overflow)?;
    let call_key = call.key();
    let seeds: &[&[u8]] = &[VAULT_SEED, call_key.as_ref(), &[call.vault_bump]];
    pay_from_vault(system_program, vault, follower, amount, &[seeds])?;
    Ok(amount)
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub follower: Signer<'info>,
    #[account(mut, seeds = [CALL_SEED, call.caller.as_ref(), &call.call_id.to_le_bytes()], bump = call.bump)]
    pub call: Account<'info, Call>,
    #[account(mut, seeds = [VAULT_SEED, call.key().as_ref()], bump = call.vault_bump)]
    pub vault: SystemAccount<'info>,
    #[account(
        mut,
        close = follower,
        seeds = [POSITION_SEED, call.key().as_ref(), follower.key().as_ref()],
        bump = position.bump,
        has_one = follower @ SealedError::Unauthorized
    )]
    pub position: Account<'info, Position>,
    pub system_program: Program<'info, System>,
}

pub fn withdraw_handler(ctx: Context<Withdraw>) -> Result<()> {
    let a = ctx.accounts;
    let amount = refund_position(&mut a.call, &a.position, &a.vault, a.follower.to_account_info(), &a.system_program)?;
    emit!(Withdrawn { call: a.call.key(), follower: a.follower.key(), amount });
    Ok(())
}

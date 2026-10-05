use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::errors::SealedError;
use crate::events::Deposited;
use crate::state::{Call, CallState, Config, Position, CONFIG_SEED, POSITION_SEED, VAULT_SEED};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub follower: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [crate::state::CALL_SEED, call.caller.as_ref(), &call.call_id.to_le_bytes()],
        bump = call.bump
    )]
    pub call: Account<'info, Call>,
    #[account(mut, seeds = [VAULT_SEED, call.key().as_ref()], bump = call.vault_bump)]
    pub vault: SystemAccount<'info>,
    #[account(
        init_if_needed,
        payer = follower,
        space = 8 + Position::INIT_SPACE,
        seeds = [POSITION_SEED, call.key().as_ref(), follower.key().as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,
    pub system_program: Program<'info, System>,
}

pub fn deposit_handler(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let cfg = &ctx.accounts.config;
    let call = &mut ctx.accounts.call;
    let pos = &mut ctx.accounts.position;
    require!(!cfg.paused, SealedError::Paused);
    require!(call.state == CallState::Open, SealedError::WrongState);
    require!(Clock::get()?.unix_timestamp < call.reveal_deadline, SealedError::DeadlinePassed);
    require!(ctx.accounts.follower.key() != call.caller, SealedError::CallerCannotDeposit);
    require!(amount > 0, SealedError::ZeroAmount);

    let new_pos = pos.lamports.checked_add(amount).ok_or(SealedError::Overflow)?;
    require!(new_pos <= cfg.max_deposit_lamports, SealedError::DepositCapExceeded);
    let new_followers = call.follower_lamports.checked_add(amount).ok_or(SealedError::Overflow)?;
    let new_vault = call.caller_stake_lamports.checked_add(new_followers).ok_or(SealedError::Overflow)?;
    require!(new_vault <= call.max_vault_lamports, SealedError::VaultCapExceeded);

    if pos.lamports == 0 {
        pos.follower = ctx.accounts.follower.key();
        pos.claimed = false;
        pos.bump = ctx.bumps.position;
        call.follower_count = call.follower_count.checked_add(1).ok_or(SealedError::Overflow)?;
    }
    pos.lamports = new_pos;
    call.follower_lamports = new_followers;

    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer { from: ctx.accounts.follower.to_account_info(), to: ctx.accounts.vault.to_account_info() },
        ),
        amount,
    )?;

    emit!(Deposited {
        call: call.key(),
        follower: pos.follower,
        amount,
        position_lamports: pos.lamports,
        follower_count: call.follower_count,
    });
    Ok(())
}

use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::errors::SealedError;
use crate::events::CallOpened;
use crate::math::bps_of;
use crate::state::{Call, CallState, Config, CALL_SEED, CONFIG_SEED, VAULT_SEED};

#[derive(Accounts)]
#[instruction(call_id: u64)]
pub struct OpenCall<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        init,
        payer = caller,
        space = 8 + Call::INIT_SPACE,
        seeds = [CALL_SEED, caller.key().as_ref(), &call_id.to_le_bytes()],
        bump
    )]
    pub call: Account<'info, Call>,
    #[account(mut, seeds = [VAULT_SEED, call.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn open_call_handler(
    ctx: Context<OpenCall>,
    call_id: u64,
    commitment: [u8; 32],
    reveal_window_secs: i64,
    caller_lock_secs: i64,
    max_vault_lamports: u64,
    max_impact_bps: u16,
    caller_stake_lamports: u64,
) -> Result<()> {
    let cfg = &ctx.accounts.config;
    require!(!cfg.paused, SealedError::Paused);
    require!(
        reveal_window_secs > 0 && reveal_window_secs <= cfg.max_reveal_window_secs,
        SealedError::InvalidRevealWindow
    );
    require!(caller_lock_secs >= cfg.min_caller_lock_secs, SealedError::InvalidCallerLock);
    require!(max_vault_lamports <= cfg.max_call_lamports, SealedError::VaultCapTooHigh);
    require!(max_impact_bps > 0 && max_impact_bps <= cfg.max_price_impact_bps, SealedError::InvalidImpact);
    let min_stake = bps_of(max_vault_lamports, cfg.min_caller_stake_bps).ok_or(SealedError::Overflow)?;
    require!(caller_stake_lamports > 0, SealedError::ZeroAmount);
    require!(caller_stake_lamports >= min_stake, SealedError::StakeTooLow);
    require!(caller_stake_lamports <= max_vault_lamports, SealedError::StakeAboveVault);

    let clock = Clock::get()?;
    let now = clock.unix_timestamp;
    let deadline = now.checked_add(reveal_window_secs).ok_or(SealedError::Overflow)?;

    let call = &mut ctx.accounts.call;
    call.caller = ctx.accounts.caller.key();
    call.call_id = call_id;
    call.commitment = commitment;
    call.opened_at = now;
    call.opened_slot = clock.slot;
    call.reveal_deadline = deadline;
    call.caller_lock_secs = caller_lock_secs;
    call.max_vault_lamports = max_vault_lamports;
    call.max_impact_bps = max_impact_bps;
    call.fee_bps = cfg.fee_bps;
    call.caller_fee_share_bps = cfg.caller_fee_share_bps;
    call.caller_stake_lamports = caller_stake_lamports;
    call.follower_lamports = 0;
    call.follower_count = 0;
    call.state = CallState::Open;
    call.revealed_mint = Pubkey::default();
    call.revealed_pool = Pubkey::default();
    call.lamports_in = 0;
    call.tokens_out = 0;
    call.executed_at = 0;
    call.executed_slot = 0;
    call.tokens_claimed = 0;
    call.caller_claimed = false;
    call.bump = ctx.bumps.call;
    call.vault_bump = ctx.bumps.vault;

    // The vault is a system account: it carries a rent-exempt reserve on top of the stake so
    // every later refund can leave it above the rent floor. The reserve returns to the caller
    // when the call executes or expires.
    let reserve = Rent::get()?.minimum_balance(0);
    let funded = caller_stake_lamports.checked_add(reserve).ok_or(SealedError::Overflow)?;
    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer { from: ctx.accounts.caller.to_account_info(), to: ctx.accounts.vault.to_account_info() },
        ),
        funded,
    )?;

    emit!(CallOpened {
        call: call.key(),
        caller: call.caller,
        call_id,
        commitment,
        reveal_deadline: deadline,
        caller_lock_secs,
        max_vault_lamports,
        max_impact_bps,
        fee_bps: call.fee_bps,
        caller_fee_share_bps: call.caller_fee_share_bps,
        caller_stake_lamports,
    });
    Ok(())
}

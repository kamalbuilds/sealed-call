use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use super::claim::send_tokens;
use crate::errors::SealedError;
use crate::events::DustSwept;
use crate::state::{Call, CallState, Config, CALL_SEED, CONFIG_SEED, VAULT_SEED};

#[derive(Accounts)]
pub struct SweepDust<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump, has_one = admin @ SealedError::Unauthorized)]
    pub config: Box<Account<'info, Config>>,
    #[account(mut, seeds = [CALL_SEED, call.caller.as_ref(), &call.call_id.to_le_bytes()], bump = call.bump)]
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
    /// CHECK: bound to config.treasury
    #[account(address = config.treasury @ SealedError::Unauthorized)]
    pub treasury: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = mint,
        associated_token::authority = treasury,
        associated_token::token_program = token_program
    )]
    pub treasury_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn sweep_dust_handler(ctx: Context<SweepDust>) -> Result<()> {
    let a = ctx.accounts;
    require!(a.call.state == CallState::Executed, SealedError::WrongState);
    require!(a.call.follower_count == 0 && a.call.caller_claimed, SealedError::FollowersRemain);
    let amount = a.vault_out.amount;
    require!(amount > 0, SealedError::NothingToSweep);
    send_tokens(&a.call, &a.token_program, &a.vault_out, &a.mint, a.treasury_ata.to_account_info(), &a.vault, amount)?;
    emit!(DustSwept { call: a.call.key(), amount });
    Ok(())
}

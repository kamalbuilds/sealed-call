use anchor_lang::prelude::*;

use crate::errors::SealedError;
use crate::events::{ConfigInitialized, ConfigUpdated, PausedSet};
use crate::state::{Config, CONFIG_SEED, MAX_FEE_BPS};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct ConfigParams {
    pub treasury: Pubkey,
    pub fee_bps: u16,
    pub caller_fee_share_bps: u16,
    pub max_call_lamports: u64,
    pub max_deposit_lamports: u64,
    pub min_caller_stake_bps: u16,
    pub min_caller_lock_secs: i64,
    pub max_reveal_window_secs: i64,
}

impl ConfigParams {
    fn validate(&self) -> Result<()> {
        require!(self.fee_bps <= MAX_FEE_BPS, SealedError::InvalidConfig);
        require!(self.caller_fee_share_bps <= 10_000, SealedError::InvalidConfig);
        require!(self.min_caller_stake_bps <= 10_000, SealedError::InvalidConfig);
        require!(self.max_call_lamports > 0 && self.max_deposit_lamports > 0, SealedError::InvalidConfig);
        require!(self.min_caller_lock_secs >= 0 && self.max_reveal_window_secs > 0, SealedError::InvalidConfig);
        require!(self.treasury != Pubkey::default(), SealedError::InvalidConfig);
        Ok(())
    }

    fn apply(&self, c: &mut Config) {
        c.treasury = self.treasury;
        c.fee_bps = self.fee_bps;
        c.caller_fee_share_bps = self.caller_fee_share_bps;
        c.max_call_lamports = self.max_call_lamports;
        c.max_deposit_lamports = self.max_deposit_lamports;
        c.min_caller_stake_bps = self.min_caller_stake_bps;
        c.min_caller_lock_secs = self.min_caller_lock_secs;
        c.max_reveal_window_secs = self.max_reveal_window_secs;
    }

    fn event(&self) -> ConfigUpdated {
        ConfigUpdated {
            treasury: self.treasury,
            fee_bps: self.fee_bps,
            caller_fee_share_bps: self.caller_fee_share_bps,
            max_call_lamports: self.max_call_lamports,
            max_deposit_lamports: self.max_deposit_lamports,
            min_caller_stake_bps: self.min_caller_stake_bps,
            min_caller_lock_secs: self.min_caller_lock_secs,
            max_reveal_window_secs: self.max_reveal_window_secs,
        }
    }
}

#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(init, payer = admin, space = 8 + Config::INIT_SPACE, seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, Config>,
    pub program: Program<'info, crate::program::SealedCall>,
    /// Only the program's upgrade authority can create the config, so nobody can front-run the deployer.
    #[account(
        constraint = program.programdata_address()? == Some(program_data.key()) @ SealedError::Unauthorized,
        constraint = program_data.upgrade_authority_address == Some(admin.key()) @ SealedError::Unauthorized,
    )]
    pub program_data: Account<'info, ProgramData>,
    pub system_program: Program<'info, System>,
}

pub fn init_config_handler(ctx: Context<InitConfig>, params: ConfigParams) -> Result<()> {
    params.validate()?;
    let c = &mut ctx.accounts.config;
    c.admin = ctx.accounts.admin.key();
    c.paused = false;
    c.bump = ctx.bumps.config;
    params.apply(c);
    emit!(ConfigInitialized { admin: c.admin, treasury: c.treasury });
    emit!(params.event());
    Ok(())
}

#[derive(Accounts)]
pub struct AdminOnly<'info> {
    pub admin: Signer<'info>,
    #[account(mut, seeds = [CONFIG_SEED], bump = config.bump, has_one = admin @ SealedError::Unauthorized)]
    pub config: Account<'info, Config>,
}

pub fn set_config_handler(ctx: Context<AdminOnly>, params: ConfigParams) -> Result<()> {
    params.validate()?;
    params.apply(&mut ctx.accounts.config);
    emit!(params.event());
    Ok(())
}

pub fn set_paused_handler(ctx: Context<AdminOnly>, paused: bool) -> Result<()> {
    ctx.accounts.config.paused = paused;
    emit!(PausedSet { paused });
    Ok(())
}

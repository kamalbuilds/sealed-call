use anchor_lang::prelude::*;

pub mod damm;
pub mod dbc;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod math;
pub mod state;

pub use instructions::*;

declare_id!("JBwReCk6DRFZREGjCfNiMQUsFFc66FSLBrejnjzKgU4N");

#[program]
pub mod sealed_call {
    use super::*;

    pub fn init_config(ctx: Context<InitConfig>, params: ConfigParams) -> Result<()> {
        init_config_handler(ctx, params)
    }

    pub fn set_config(ctx: Context<AdminOnly>, params: ConfigParams) -> Result<()> {
        set_config_handler(ctx, params)
    }

    pub fn set_paused(ctx: Context<AdminOnly>, paused: bool) -> Result<()> {
        set_paused_handler(ctx, paused)
    }

    pub fn open_call(
        ctx: Context<OpenCall>,
        call_id: u64,
        commitment: [u8; 32],
        reveal_window_secs: i64,
        caller_lock_secs: i64,
        max_vault_lamports: u64,
        max_impact_bps: u16,
        caller_stake_lamports: u64,
    ) -> Result<()> {
        open_call_handler(
            ctx,
            call_id,
            commitment,
            reveal_window_secs,
            caller_lock_secs,
            max_vault_lamports,
            max_impact_bps,
            caller_stake_lamports,
        )
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        deposit_handler(ctx, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        withdraw_handler(ctx)
    }

    pub fn reveal_and_swap(
        ctx: Context<RevealAndSwap>,
        mint: Pubkey,
        salt: [u8; 32],
        minimum_amount_out: u64,
    ) -> Result<()> {
        reveal_and_swap_handler(ctx, mint, salt, minimum_amount_out)
    }

    pub fn reveal_and_swap_dbc(
        ctx: Context<RevealAndSwapDbc>,
        mint: Pubkey,
        salt: [u8; 32],
        minimum_amount_out: u64,
    ) -> Result<()> {
        reveal_and_swap_dbc_handler(ctx, mint, salt, minimum_amount_out)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        claim_handler(ctx)
    }

    pub fn caller_claim(ctx: Context<CallerClaim>) -> Result<()> {
        caller_claim_handler(ctx)
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        refund_handler(ctx)
    }

    pub fn expire(ctx: Context<Expire>) -> Result<()> {
        expire_handler(ctx)
    }

    pub fn sweep_dust(ctx: Context<SweepDust>) -> Result<()> {
        sweep_dust_handler(ctx)
    }
}

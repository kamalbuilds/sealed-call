use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use sealed_call::cpi::accounts::OpenCall;
use sealed_call::program::SealedCall;
use sealed_call::state::Call;

declare_id!("4SGjnSXNiXNMaoy3wUeW3N3qn8LkZ72XsxT3MenyoD5Z");

pub const OPENER_SEED: &[u8] = b"opener";

#[error_code]
pub enum OpenerError {
    #[msg("arithmetic overflow")]
    Overflow,
}

#[program]
pub mod cpi_opener {
    use super::*;

    /// Opens a sealed call whose caller is the `opener` PDA of `owner`. The PDA is funded for the
    /// call account rent, the vault reserve and the caller stake, then signs the CPI with
    /// invoke_signed.
    pub fn open_from_pda(
        ctx: Context<OpenFromPda>,
        call_id: u64,
        commitment: [u8; 32],
        reveal_window_secs: i64,
        caller_lock_secs: i64,
        max_vault_lamports: u64,
        max_impact_bps: u16,
        caller_stake_lamports: u64,
    ) -> Result<()> {
        let rent = Rent::get()?;
        let call_rent = rent.minimum_balance(8 + Call::INIT_SPACE);
        let vault_reserve = rent.minimum_balance(0);
        let spend = call_rent
            .checked_add(vault_reserve)
            .and_then(|v| v.checked_add(caller_stake_lamports))
            .ok_or(OpenerError::Overflow)?;
        // After the CPI the PDA keeps one rent-exempt system account worth of lamports, because a
        // system account holding less than that is rejected at the end of the transaction.
        let target = spend.checked_add(vault_reserve).ok_or(OpenerError::Overflow)?;
        let held = ctx.accounts.opener.lamports();
        if held < target {
            transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.owner.to_account_info(),
                        to: ctx.accounts.opener.to_account_info(),
                    },
                ),
                target - held,
            )?;
        }

        let owner_key = ctx.accounts.owner.key();
        let signer_seeds: &[&[&[u8]]] = &[&[OPENER_SEED, owner_key.as_ref(), &[ctx.bumps.opener]]];
        sealed_call::cpi::open_call(
            CpiContext::new_with_signer(
                ctx.accounts.sealed_call_program.to_account_info(),
                OpenCall {
                    caller: ctx.accounts.opener.to_account_info(),
                    config: ctx.accounts.config.to_account_info(),
                    call: ctx.accounts.call.to_account_info(),
                    vault: ctx.accounts.vault.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
                signer_seeds,
            ),
            call_id,
            commitment,
            reveal_window_secs,
            caller_lock_secs,
            max_vault_lamports,
            max_impact_bps,
            caller_stake_lamports,
        )
    }
}

#[derive(Accounts)]
pub struct OpenFromPda<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut, seeds = [OPENER_SEED, owner.key().as_ref()], bump)]
    pub opener: SystemAccount<'info>,
    /// CHECK: sealed_call validates the config PDA.
    pub config: UncheckedAccount<'info>,
    /// CHECK: sealed_call derives and initializes the call PDA from the opener key and call_id.
    #[account(mut)]
    pub call: UncheckedAccount<'info>,
    /// CHECK: sealed_call derives the vault PDA from the call key.
    #[account(mut)]
    pub vault: UncheckedAccount<'info>,
    pub sealed_call_program: Program<'info, SealedCall>,
    pub system_program: Program<'info, System>,
}

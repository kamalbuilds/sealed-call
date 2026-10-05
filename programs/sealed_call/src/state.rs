use anchor_lang::prelude::*;

pub const CONFIG_SEED: &[u8] = b"config";
pub const CALL_SEED: &[u8] = b"call";
pub const VAULT_SEED: &[u8] = b"vault";
pub const POSITION_SEED: &[u8] = b"pos";
pub const MAX_FEE_BPS: u16 = 300;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub fee_bps: u16,
    pub caller_fee_share_bps: u16,
    pub max_call_lamports: u64,
    pub max_deposit_lamports: u64,
    pub min_caller_stake_bps: u16,
    pub min_caller_lock_secs: i64,
    pub max_reveal_window_secs: i64,
    pub paused: bool,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum CallState {
    Open,
    Executed,
    Expired,
}

#[account]
#[derive(InitSpace)]
pub struct Call {
    pub caller: Pubkey,
    pub call_id: u64,
    pub commitment: [u8; 32],
    pub opened_at: i64,
    pub reveal_deadline: i64,
    pub caller_lock_secs: i64,
    pub max_vault_lamports: u64,
    pub caller_stake_lamports: u64,
    pub follower_lamports: u64,
    pub follower_count: u32,
    pub state: CallState,
    pub revealed_mint: Pubkey,
    pub revealed_pool: Pubkey,
    pub lamports_in: u64,
    pub tokens_out: u64,
    pub executed_at: i64,
    pub executed_slot: u64,
    pub tokens_claimed: u64,
    pub caller_claimed: bool,
    pub bump: u8,
    pub vault_bump: u8,
}

impl Call {
    /// contribution base for pro-rata claims: lamports before fee
    pub fn total_lamports(&self) -> Option<u64> {
        self.caller_stake_lamports.checked_add(self.follower_lamports)
    }
}

#[account]
#[derive(InitSpace)]
pub struct Position {
    pub follower: Pubkey,
    pub lamports: u64,
    pub claimed: bool,
    pub bump: u8,
}

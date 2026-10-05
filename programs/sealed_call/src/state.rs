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
    /// ceiling for a call's max_impact_bps
    pub max_price_impact_bps: u16,
    /// pool must hold at least this share of its liquidity permanently locked
    pub min_locked_liquidity_bps: u16,
    /// the swap may use at most this share of the pool's wSOL reserve
    pub max_swap_reserve_bps: u16,
    pub min_deposit_lamports: u64,
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
    pub opened_slot: u64,
    pub reveal_deadline: i64,
    pub caller_lock_secs: i64,
    pub max_vault_lamports: u64,
    /// worst fill vs the pool spot price at reveal, fixed at open so followers see it before depositing
    pub max_impact_bps: u16,
    /// fee terms fixed at open: a later set_config never reprices a funded call
    pub fee_bps: u16,
    pub caller_fee_share_bps: u16,
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
    pub call: Pubkey,
    pub follower: Pubkey,
    pub lamports: u64,
    pub claimed: bool,
    pub bump: u8,
}

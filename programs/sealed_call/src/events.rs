use anchor_lang::prelude::*;

#[event]
pub struct ConfigInitialized {
    pub admin: Pubkey,
    pub treasury: Pubkey,
}

#[event]
pub struct ConfigUpdated {
    pub treasury: Pubkey,
    pub fee_bps: u16,
    pub caller_fee_share_bps: u16,
    pub max_call_lamports: u64,
    pub max_deposit_lamports: u64,
    pub min_caller_stake_bps: u16,
    pub min_caller_lock_secs: i64,
    pub max_reveal_window_secs: i64,
    pub max_price_impact_bps: u16,
    pub min_locked_liquidity_bps: u16,
    pub max_swap_reserve_bps: u16,
    pub min_deposit_lamports: u64,
}

#[event]
pub struct PausedSet {
    pub paused: bool,
}

#[event]
pub struct CallOpened {
    pub call: Pubkey,
    pub caller: Pubkey,
    pub call_id: u64,
    pub commitment: [u8; 32],
    pub reveal_deadline: i64,
    pub caller_lock_secs: i64,
    pub max_vault_lamports: u64,
    pub max_impact_bps: u16,
    pub fee_bps: u16,
    pub caller_fee_share_bps: u16,
    pub caller_stake_lamports: u64,
}

#[event]
pub struct Deposited {
    pub call: Pubkey,
    pub follower: Pubkey,
    pub amount: u64,
    pub position_lamports: u64,
    pub follower_count: u32,
}

#[event]
pub struct Withdrawn {
    pub call: Pubkey,
    pub follower: Pubkey,
    pub amount: u64,
}

#[event]
pub struct Revealed {
    pub call: Pubkey,
    pub caller: Pubkey,
    pub mint: Pubkey,
    pub pool: Pubkey,
    pub total_lamports: u64,
    pub fee_lamports: u64,
    pub caller_fee_lamports: u64,
    pub lamports_in: u64,
    pub tokens_out: u64,
    pub slot: u64,
}

#[event]
pub struct Claimed {
    pub call: Pubkey,
    pub follower: Pubkey,
    pub lamports: u64,
    pub amount: u64,
}

#[event]
pub struct CallerClaimed {
    pub call: Pubkey,
    pub caller: Pubkey,
    pub amount: u64,
}

#[event]
pub struct Refunded {
    pub call: Pubkey,
    pub follower: Pubkey,
    pub amount: u64,
}

#[event]
pub struct CallExpired {
    pub call: Pubkey,
    pub caller: Pubkey,
    pub returned_lamports: u64,
}

#[event]
pub struct DustSwept {
    pub call: Pubkey,
    pub amount: u64,
}

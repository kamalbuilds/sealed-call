use anchor_lang::prelude::*;

#[error_code]
pub enum SealedError {
    #[msg("signer is not authorized for this action")]
    Unauthorized,
    #[msg("program is paused")]
    Paused,
    #[msg("config parameter out of range")]
    InvalidConfig,
    #[msg("reveal window must be in (0, max_reveal_window_secs]")]
    InvalidRevealWindow,
    #[msg("caller lock is below the configured minimum")]
    InvalidCallerLock,
    #[msg("max vault exceeds the configured per-call cap")]
    VaultCapTooHigh,
    #[msg("caller stake is below the minimum share of max vault")]
    StakeTooLow,
    #[msg("caller stake exceeds max vault")]
    StakeAboveVault,
    #[msg("amount must be greater than zero")]
    ZeroAmount,
    #[msg("call is not in the required state")]
    WrongState,
    #[msg("reveal deadline has passed")]
    DeadlinePassed,
    #[msg("reveal deadline has not passed")]
    DeadlineNotPassed,
    #[msg("caller cannot deposit into their own call")]
    CallerCannotDeposit,
    #[msg("per-follower deposit cap exceeded")]
    DepositCapExceeded,
    #[msg("call vault cap exceeded")]
    VaultCapExceeded,
    #[msg("revealed (mint, pool, salt) does not match the commitment")]
    HashMismatch,
    #[msg("mint account does not match the revealed mint")]
    MintMismatch,
    #[msg("pool is not a DAMM v2 pool")]
    NotDammPool,
    #[msg("pool does not trade exactly wSOL and the revealed mint")]
    PoolMintMismatch,
    #[msg("pool vault accounts do not match the pool state")]
    PoolVaultMismatch,
    #[msg("output token program does not own the mint")]
    WrongTokenProgram,
    #[msg("minimum_amount_out must be greater than zero")]
    MinOutZero,
    #[msg("nothing to swap")]
    NothingToSwap,
    #[msg("swap returned fewer tokens than minimum_amount_out")]
    SlippageExceeded,
    #[msg("max_impact_bps must be above zero and within the config ceiling")]
    InvalidImpact,
    #[msg("fill is worse than the pool spot price allows for this call")]
    PriceImpactExceeded,
    #[msg("caller lock period has not elapsed")]
    CallerLockActive,
    #[msg("already claimed")]
    AlreadyClaimed,
    #[msg("follower positions remain")]
    FollowersRemain,
    #[msg("nothing to sweep")]
    NothingToSweep,
    #[msg("arithmetic overflow")]
    Overflow,
}

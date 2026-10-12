//! Meteora Dynamic Bonding Curve (DBC) constants, pool layout reads and the `swap` CPI.
//! Layout offsets come from `PoolState` in dynamic-bonding-curve (`VirtualPool`, 416 bytes + 8 discriminator).

use anchor_lang::prelude::*;
use anchor_lang::solana_program::{instruction::Instruction, program::invoke_signed};

use crate::errors::SealedError;

pub const DBC: Pubkey = pubkey!("dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN");
/// PDA ["pool_authority"] of the DBC program
pub const POOL_AUTHORITY: Pubkey = pubkey!("FhVo3mqL8PW5pH5U2CN4XE33DokiyZnUwuGpH2hmHLuM");
/// PDA ["__event_authority"] of the DBC program
pub const EVENT_AUTHORITY: Pubkey = pubkey!("8Ks12pbrD6PXxfty1hVQiE9sc289zgU1zHkvXhrSdriF");

pub const POOL_DISCRIMINATOR: [u8; 8] = [213, 224, 5, 209, 98, 69, 119, 92];
pub const SWAP_DISCRIMINATOR: [u8; 8] = [248, 198, 158, 145, 225, 117, 135, 200];
pub const POOL_LEN: usize = 8 + 416;

const CONFIG: usize = 72;
const BASE_MINT: usize = 136;
const BASE_VAULT: usize = 168;
const QUOTE_VAULT: usize = 200;
const SQRT_PRICE: usize = 280;
const IS_MIGRATED: usize = 305;
const MIGRATION_PROGRESS: usize = 308;

pub struct PoolView {
    pub config: Pubkey,
    pub base_mint: Pubkey,
    pub base_vault: Pubkey,
    pub quote_vault: Pubkey,
    /// Q64.64 sqrt of the spot price, quote (wSOL) per base token in raw units
    pub sqrt_price: u128,
    pub is_migrated: bool,
    /// 0 = still on the bonding curve
    pub migration_progress: u8,
}

fn key_at(data: &[u8], off: usize) -> Result<Pubkey> {
    let bytes: [u8; 32] = data
        .get(off..off + 32)
        .and_then(|s| s.try_into().ok())
        .ok_or(SealedError::NotDbcPool)?;
    Ok(Pubkey::new_from_array(bytes))
}

/// Parse the pool account. The caller must already have checked `owner == DBC`.
pub fn read_pool(data: &[u8]) -> Result<PoolView> {
    require!(data.len() == POOL_LEN && data[..8] == POOL_DISCRIMINATOR, SealedError::NotDbcPool);
    Ok(PoolView {
        config: key_at(data, CONFIG)?,
        base_mint: key_at(data, BASE_MINT)?,
        base_vault: key_at(data, BASE_VAULT)?,
        quote_vault: key_at(data, QUOTE_VAULT)?,
        sqrt_price: u128::from_le_bytes(data[SQRT_PRICE..SQRT_PRICE + 16].try_into().unwrap()),
        is_migrated: data[IS_MIGRATED] != 0,
        migration_progress: data[MIGRATION_PROGRESS],
    })
}

pub struct SwapAccounts<'a, 'info> {
    pub config: &'a AccountInfo<'info>,
    pub pool: &'a AccountInfo<'info>,
    pub input_token_account: &'a AccountInfo<'info>,
    pub output_token_account: &'a AccountInfo<'info>,
    pub base_vault: &'a AccountInfo<'info>,
    pub quote_vault: &'a AccountInfo<'info>,
    pub base_mint: &'a AccountInfo<'info>,
    pub quote_mint: &'a AccountInfo<'info>,
    /// signer (the call vault PDA)
    pub payer: &'a AccountInfo<'info>,
    pub base_program: &'a AccountInfo<'info>,
    pub quote_program: &'a AccountInfo<'info>,
    pub pool_authority: &'a AccountInfo<'info>,
    pub event_authority: &'a AccountInfo<'info>,
    pub dbc_program: &'a AccountInfo<'info>,
}

/// CPI `swap(amount_in, minimum_amount_out)` (exact in, quote to base) with no referral
/// (the program id in the optional slot marks it as None).
pub fn swap<'info>(
    a: &SwapAccounts<'_, 'info>,
    amount_in: u64,
    minimum_amount_out: u64,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    let mut data = Vec::with_capacity(24);
    data.extend_from_slice(&SWAP_DISCRIMINATOR);
    data.extend_from_slice(&amount_in.to_le_bytes());
    data.extend_from_slice(&minimum_amount_out.to_le_bytes());
    let ix = Instruction {
        program_id: DBC,
        accounts: vec![
            AccountMeta::new_readonly(POOL_AUTHORITY, false),
            AccountMeta::new_readonly(a.config.key(), false),
            AccountMeta::new(a.pool.key(), false),
            AccountMeta::new(a.input_token_account.key(), false),
            AccountMeta::new(a.output_token_account.key(), false),
            AccountMeta::new(a.base_vault.key(), false),
            AccountMeta::new(a.quote_vault.key(), false),
            AccountMeta::new_readonly(a.base_mint.key(), false),
            AccountMeta::new_readonly(a.quote_mint.key(), false),
            AccountMeta::new_readonly(a.payer.key(), true),
            AccountMeta::new_readonly(a.base_program.key(), false),
            AccountMeta::new_readonly(a.quote_program.key(), false),
            AccountMeta::new_readonly(DBC, false),
            AccountMeta::new_readonly(EVENT_AUTHORITY, false),
            AccountMeta::new_readonly(DBC, false),
        ],
        data,
    };
    let infos = [
        a.pool_authority.clone(),
        a.config.clone(),
        a.pool.clone(),
        a.input_token_account.clone(),
        a.output_token_account.clone(),
        a.base_vault.clone(),
        a.quote_vault.clone(),
        a.base_mint.clone(),
        a.quote_mint.clone(),
        a.payer.clone(),
        a.base_program.clone(),
        a.quote_program.clone(),
        a.dbc_program.clone(),
        a.event_authority.clone(),
        a.dbc_program.clone(),
    ];
    invoke_signed(&ix, &infos, signer_seeds)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn authorities_match_seed_derivation() {
        let (pa, _) = Pubkey::find_program_address(&[b"pool_authority"], &DBC);
        assert_eq!(pa, POOL_AUTHORITY);
        let (ea, _) = Pubkey::find_program_address(&[b"__event_authority"], &DBC);
        assert_eq!(ea, EVENT_AUTHORITY);
    }

    #[test]
    fn read_pool_rejects_wrong_length_and_discriminator_and_reads_fields() {
        let mut d = vec![0u8; POOL_LEN];
        assert!(read_pool(&d).is_err());
        d[..8].copy_from_slice(&POOL_DISCRIMINATOR);
        d[CONFIG..CONFIG + 32].copy_from_slice(&[3u8; 32]);
        d[BASE_MINT..BASE_MINT + 32].copy_from_slice(&[7u8; 32]);
        d[QUOTE_VAULT..QUOTE_VAULT + 32].copy_from_slice(&[9u8; 32]);
        d[SQRT_PRICE..SQRT_PRICE + 16].copy_from_slice(&(5u128 << 64).to_le_bytes());
        let p = read_pool(&d).unwrap();
        assert_eq!(p.config, Pubkey::new_from_array([3u8; 32]));
        assert_eq!(p.base_mint, Pubkey::new_from_array([7u8; 32]));
        assert_eq!(p.quote_vault, Pubkey::new_from_array([9u8; 32]));
        assert_eq!(p.sqrt_price, 5u128 << 64);
        assert!(!p.is_migrated && p.migration_progress == 0);
        d[IS_MIGRATED] = 1;
        d[MIGRATION_PROGRESS] = 3;
        let p = read_pool(&d).unwrap();
        assert!(p.is_migrated && p.migration_progress == 3);
        assert!(read_pool(&d[..POOL_LEN - 1]).is_err());
    }
}

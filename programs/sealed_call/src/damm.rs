//! Meteora DAMM v2 (cp-amm) constants, pool layout reads and the `swap` CPI.
//! Layout offsets come from the `Pool` account in the program IDL (v0.2.5, 1112 bytes).

use anchor_lang::prelude::*;
use anchor_lang::solana_program::{instruction::Instruction, program::invoke_signed};

use crate::errors::SealedError;

pub const DAMM_V2: Pubkey = pubkey!("cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG");
pub const POOL_AUTHORITY: Pubkey = pubkey!("HLnpSz9h2S4hiLQ43rnSD9XkcUThA7B8hQMKmDaiTLcC");
/// PDA ["__event_authority"] of the DAMM v2 program
pub const EVENT_AUTHORITY: Pubkey = pubkey!("3rmHSu74h1ZcmAisVcWerTCiRDQbUrBKmcwptYGjHfet");

pub const POOL_DISCRIMINATOR: [u8; 8] = [241, 154, 109, 4, 17, 177, 109, 188];
pub const SWAP_DISCRIMINATOR: [u8; 8] = [248, 198, 158, 145, 225, 117, 135, 200];
pub const POOL_LEN: usize = 1112;

const TOKEN_A_MINT: usize = 168;
const TOKEN_B_MINT: usize = 200;
const TOKEN_A_VAULT: usize = 232;
const TOKEN_B_VAULT: usize = 264;
const SQRT_PRICE: usize = 456;

pub struct PoolView {
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub token_a_vault: Pubkey,
    pub token_b_vault: Pubkey,
    /// Q64.64 sqrt of the spot price, token_b per token_a in raw units
    pub sqrt_price: u128,
}

fn key_at(data: &[u8], off: usize) -> Result<Pubkey> {
    let bytes: [u8; 32] = data
        .get(off..off + 32)
        .and_then(|s| s.try_into().ok())
        .ok_or(SealedError::NotDammPool)?;
    Ok(Pubkey::new_from_array(bytes))
}

/// Parse the pool account. The caller must already have checked `owner == DAMM_V2`.
pub fn read_pool(data: &[u8]) -> Result<PoolView> {
    require!(data.len() == POOL_LEN && data[..8] == POOL_DISCRIMINATOR, SealedError::NotDammPool);
    Ok(PoolView {
        token_a_mint: key_at(data, TOKEN_A_MINT)?,
        token_b_mint: key_at(data, TOKEN_B_MINT)?,
        token_a_vault: key_at(data, TOKEN_A_VAULT)?,
        token_b_vault: key_at(data, TOKEN_B_VAULT)?,
        sqrt_price: u128::from_le_bytes(data[SQRT_PRICE..SQRT_PRICE + 16].try_into().unwrap()),
    })
}

pub struct SwapAccounts<'a, 'info> {
    pub pool: &'a AccountInfo<'info>,
    pub input_token_account: &'a AccountInfo<'info>,
    pub output_token_account: &'a AccountInfo<'info>,
    pub token_a_vault: &'a AccountInfo<'info>,
    pub token_b_vault: &'a AccountInfo<'info>,
    pub token_a_mint: &'a AccountInfo<'info>,
    pub token_b_mint: &'a AccountInfo<'info>,
    /// signer (the call vault PDA)
    pub payer: &'a AccountInfo<'info>,
    pub token_a_program: &'a AccountInfo<'info>,
    pub token_b_program: &'a AccountInfo<'info>,
    pub pool_authority: &'a AccountInfo<'info>,
    pub event_authority: &'a AccountInfo<'info>,
    pub damm_program: &'a AccountInfo<'info>,
}

/// CPI `swap(amount_in, minimum_amount_out)` with no referral (the program id marks the optional slot as None).
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
        program_id: DAMM_V2,
        accounts: vec![
            AccountMeta::new_readonly(POOL_AUTHORITY, false),
            AccountMeta::new(a.pool.key(), false),
            AccountMeta::new(a.input_token_account.key(), false),
            AccountMeta::new(a.output_token_account.key(), false),
            AccountMeta::new(a.token_a_vault.key(), false),
            AccountMeta::new(a.token_b_vault.key(), false),
            AccountMeta::new_readonly(a.token_a_mint.key(), false),
            AccountMeta::new_readonly(a.token_b_mint.key(), false),
            AccountMeta::new_readonly(a.payer.key(), true),
            AccountMeta::new_readonly(a.token_a_program.key(), false),
            AccountMeta::new_readonly(a.token_b_program.key(), false),
            AccountMeta::new_readonly(DAMM_V2, false),
            AccountMeta::new_readonly(EVENT_AUTHORITY, false),
            AccountMeta::new_readonly(DAMM_V2, false),
        ],
        data,
    };
    let infos = [
        a.pool_authority.clone(),
        a.pool.clone(),
        a.input_token_account.clone(),
        a.output_token_account.clone(),
        a.token_a_vault.clone(),
        a.token_b_vault.clone(),
        a.token_a_mint.clone(),
        a.token_b_mint.clone(),
        a.payer.clone(),
        a.token_a_program.clone(),
        a.token_b_program.clone(),
        a.damm_program.clone(),
        a.event_authority.clone(),
        a.damm_program.clone(),
    ];
    invoke_signed(&ix, &infos, signer_seeds)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn event_authority_matches_seed_derivation() {
        let (pda, _) = Pubkey::find_program_address(&[b"__event_authority"], &DAMM_V2);
        assert_eq!(pda, EVENT_AUTHORITY);
        let (pa, _) = Pubkey::find_program_address(&[b"pool_authority"], &DAMM_V2);
        assert_eq!(pa, POOL_AUTHORITY);
    }

    #[test]
    fn read_pool_rejects_wrong_length_and_discriminator() {
        let mut d = vec![0u8; POOL_LEN];
        assert!(read_pool(&d).is_err());
        d[..8].copy_from_slice(&POOL_DISCRIMINATOR);
        d[TOKEN_A_MINT..TOKEN_A_MINT + 32].copy_from_slice(&[7u8; 32]);
        d[TOKEN_B_VAULT..TOKEN_B_VAULT + 32].copy_from_slice(&[9u8; 32]);
        let p = read_pool(&d).unwrap();
        assert_eq!(p.token_a_mint, Pubkey::new_from_array([7u8; 32]));
        assert_eq!(p.token_b_vault, Pubkey::new_from_array([9u8; 32]));
        assert_eq!(p.sqrt_price, 0);
        assert!(read_pool(&d[..POOL_LEN - 1]).is_err());
    }
}

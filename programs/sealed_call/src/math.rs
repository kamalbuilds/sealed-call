//! Pure arithmetic shared by the instructions and the property tests.

pub const BPS: u128 = 10_000;

/// floor(part * numerator / denominator) in u128; None on zero denominator or u64 overflow.
pub fn pro_rata(numerator: u64, part: u64, denominator: u64) -> Option<u64> {
    if denominator == 0 {
        return None;
    }
    let v = (numerator as u128).checked_mul(part as u128)? / denominator as u128;
    u64::try_from(v).ok()
}

/// floor(value * bps / 10_000)
pub fn bps_of(value: u64, bps: u16) -> Option<u64> {
    let v = (value as u128).checked_mul(bps as u128)? / BPS;
    u64::try_from(v).ok()
}

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct FeeSplit {
    pub fee: u64,
    pub caller_fee: u64,
    pub treasury_fee: u64,
    pub lamports_in: u64,
}

pub fn split_fee(total: u64, fee_bps: u16, caller_share_bps: u16) -> Option<FeeSplit> {
    let fee = bps_of(total, fee_bps)?;
    let caller_fee = bps_of(fee, caller_share_bps)?;
    Some(FeeSplit {
        fee,
        caller_fee,
        treasury_fee: fee.checked_sub(caller_fee)?,
        lamports_in: total.checked_sub(fee)?,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    #[test]
    fn fee_split_example() {
        let s = split_fee(1_000_000_000, 100, 3000).unwrap();
        assert_eq!(s, FeeSplit { fee: 10_000_000, caller_fee: 3_000_000, treasury_fee: 7_000_000, lamports_in: 990_000_000 });
    }

    #[test]
    fn pro_rata_rejects_zero_total_and_overflow() {
        assert_eq!(pro_rata(10, 1, 0), None);
        assert_eq!(pro_rata(u64::MAX, 2, 1), None);
        assert_eq!(pro_rata(u64::MAX, u64::MAX, u64::MAX), Some(u64::MAX));
    }

    // contributions: index 0 is the caller stake, the rest are followers
    fn contributions() -> impl Strategy<Value = Vec<u64>> {
        prop::collection::vec(1u64..=1_000_000_000_000, 1..64)
    }

    proptest! {
        #[test]
        fn sum_of_claims_never_exceeds_tokens_out(parts in contributions(), tokens_out in 1u64..=u64::MAX / 2) {
            let total: u64 = parts.iter().sum();
            let sum: u128 = parts.iter().map(|p| pro_rata(tokens_out, *p, total).unwrap() as u128).sum();
            prop_assert!(sum <= tokens_out as u128);
        }

        #[test]
        fn dust_is_bounded_by_claimants(parts in contributions(), tokens_out in 1u64..=u64::MAX / 2) {
            let total: u64 = parts.iter().sum();
            let sum: u128 = parts.iter().map(|p| pro_rata(tokens_out, *p, total).unwrap() as u128).sum();
            let dust = tokens_out as u128 - sum;
            prop_assert!(dust < parts.len() as u128 + 1);
        }

        #[test]
        fn every_claimant_gets_the_same_price(parts in contributions(), tokens_out in 1u64..=u64::MAX / 2) {
            let total: u64 = parts.iter().sum();
            for p in &parts {
                let c = pro_rata(tokens_out, *p, total).unwrap() as u128;
                // c = floor(tokens_out * p / total)  <=>  c * total <= tokens_out * p < (c + 1) * total
                let lhs = c * (total as u128);
                let prod = (tokens_out as u128) * (*p as u128);
                let upper = (c + 1) * (total as u128);
                prop_assert!(lhs <= prod);
                prop_assert!(prod < upper);
            }
        }

        #[test]
        fn fee_split_conserves_lamports(total in 1u64..=u64::MAX / 2, fee_bps in 0u16..=300, share in 0u16..=10_000) {
            let s = split_fee(total, fee_bps, share).unwrap();
            prop_assert_eq!(s.caller_fee + s.treasury_fee, s.fee);
            prop_assert_eq!(s.fee + s.lamports_in, total);
            prop_assert!(s.fee as u128 <= total as u128 * 300 / 10_000);
        }
    }
}

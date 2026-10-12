// Meteora Dynamic Bonding Curve (DBC) support for sealed calls: pool decoding, the DBC seal hash and the reveal instruction.
import { ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT, TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { sha256 } from "@noble/hashes/sha256";
import BN from "bn.js";

import { configPda, tokenProgramOf, vaultPda, type SealedProgram } from "./index";

export const DBC = new PublicKey("dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN");
export const DBC_POOL_AUTHORITY = new PublicKey("FhVo3mqL8PW5pH5U2CN4XE33DokiyZnUwuGpH2hmHLuM");
export const DBC_EVENT_AUTHORITY = new PublicKey("8Ks12pbrD6PXxfty1hVQiE9sc289zgU1zHkvXhrSdriF");

/** Pool kind byte appended to the seal preimage. DAMM v2 seals keep the original four-part preimage. */
export const POOL_KIND_DBC = 1;

export const DBC_POOL_LEN = 8 + 416;
const DBC_POOL_DISCRIMINATOR = Uint8Array.from([213, 224, 5, 209, 98, 69, 119, 92]);
const OFF_CONFIG = 72;
const OFF_BASE_MINT = 136;
const OFF_BASE_VAULT = 168;
const OFF_QUOTE_VAULT = 200;
const OFF_BASE_RESERVE = 232;
const OFF_QUOTE_RESERVE = 240;
const OFF_SQRT_PRICE = 280;
const OFF_IS_MIGRATED = 305;
const OFF_MIGRATION_PROGRESS = 308;

/** sha256(call || mint || pool || salt || 0x01), identical to `commitment_for(PoolKind::Dbc, ..)` in reveal.rs */
export function commitmentDbc(call: PublicKey, mint: PublicKey, pool: PublicKey, salt: Uint8Array): Uint8Array {
  if (salt.length !== 32) throw new Error("salt must be 32 bytes");
  const buf = new Uint8Array(129);
  buf.set(call.toBytes(), 0);
  buf.set(mint.toBytes(), 32);
  buf.set(pool.toBytes(), 64);
  buf.set(salt, 96);
  buf[128] = POOL_KIND_DBC;
  return sha256(buf);
}

export type DbcPoolInfo = {
  address: PublicKey;
  config: PublicKey;
  baseMint: PublicKey;
  baseVault: PublicKey;
  quoteVault: PublicKey;
  baseReserve: bigint;
  quoteReserve: bigint;
  /** Q64.64 sqrt of the spot price, wSOL per base token in raw units */
  sqrtPrice: bigint;
  isMigrated: boolean;
  migrationProgress: number;
};

export function decodeDbcPool(address: PublicKey, data: Uint8Array): DbcPoolInfo {
  if (data.length !== DBC_POOL_LEN) throw new Error(`DBC pool account length ${data.length}, expected ${DBC_POOL_LEN}`);
  for (let i = 0; i < 8; i++) if (data[i] !== DBC_POOL_DISCRIMINATOR[i]) throw new Error("not a DBC virtual pool account");
  const key = (off: number) => new PublicKey(data.slice(off, off + 32));
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const u128 = (off: number) => dv.getBigUint64(off, true) | (dv.getBigUint64(off + 8, true) << 64n);
  return {
    address,
    config: key(OFF_CONFIG),
    baseMint: key(OFF_BASE_MINT),
    baseVault: key(OFF_BASE_VAULT),
    quoteVault: key(OFF_QUOTE_VAULT),
    baseReserve: dv.getBigUint64(OFF_BASE_RESERVE, true),
    quoteReserve: dv.getBigUint64(OFF_QUOTE_RESERVE, true),
    sqrtPrice: u128(OFF_SQRT_PRICE),
    isMigrated: data[OFF_IS_MIGRATED] !== 0,
    migrationProgress: data[OFF_MIGRATION_PROGRESS],
  };
}

export async function readDbcPool(connection: Connection, pool: PublicKey): Promise<DbcPoolInfo> {
  const acc = await connection.getAccountInfo(pool, "confirmed");
  if (!acc) throw new Error(`pool ${pool.toBase58()} not found`);
  if (!acc.owner.equals(DBC)) throw new Error(`pool ${pool.toBase58()} is not owned by the DBC program`);
  return decodeDbcPool(pool, acc.data);
}

/** Tokens received at the pre-swap spot price, no fee and no curve slippage. wSOL is the quote side of a DBC pool. */
export function dbcSpotOut(amountIn: bigint, sqrtPrice: bigint): bigint {
  const p = sqrtPrice * sqrtPrice;
  return p === 0n ? 0n : (amountIn << 128n) / p;
}

export type RevealDbcArgs = {
  caller: PublicKey;
  call: PublicKey;
  mint: PublicKey;
  pool: PublicKey;
  salt: Uint8Array;
  minimumAmountOut: BN | bigint | number;
  /** config.treasury; read from chain when omitted */
  treasury?: PublicKey;
  /** the decoded DBC pool; read from chain when omitted */
  poolInfo?: DbcPoolInfo;
  mintProgram?: PublicKey;
};

export async function revealAndSwapDbcIx(program: SealedProgram, a: RevealDbcArgs) {
  const connection = program.provider.connection;
  const treasury = a.treasury ?? (await program.account.config.fetch(configPda(), "confirmed")).treasury;
  const info = a.poolInfo ?? (await readDbcPool(connection, a.pool));
  const mintProgram = a.mintProgram ?? (await tokenProgramOf(connection, a.mint));
  const vault = vaultPda(a.call);
  const min = BN.isBN(a.minimumAmountOut) ? (a.minimumAmountOut as BN) : new BN(a.minimumAmountOut.toString());
  return program.methods
    .revealAndSwapDbc(a.mint, Array.from(a.salt), min)
    .accountsPartial({
      caller: a.caller,
      config: configPda(),
      call: a.call,
      vault,
      treasury,
      nativeMint: NATIVE_MINT,
      mint: a.mint,
      vaultWsol: getAssociatedTokenAddressSync(NATIVE_MINT, vault, true, TOKEN_PROGRAM_ID),
      vaultOut: getAssociatedTokenAddressSync(a.mint, vault, true, mintProgram),
      pool: a.pool,
      dbcConfig: info.config,
      poolAuthority: DBC_POOL_AUTHORITY,
      baseVault: info.baseVault,
      quoteVault: info.quoteVault,
      eventAuthority: DBC_EVENT_AUTHORITY,
      dbcProgram: DBC,
      tokenProgram: TOKEN_PROGRAM_ID,
      outputTokenProgram: mintProgram,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

import { AnchorProvider, Program, type Wallet } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { sha256 } from "@noble/hashes/sha256";
import BN from "bn.js";

import idlJson from "./idl/sealed_call.json";
import type { SealedCall } from "./idl/sealed_call";

export type { SealedCall };
export { idlJson as idl };

export const PROGRAM_ID = new PublicKey("JBwReCk6DRFZREGjCfNiMQUsFFc66FSLBrejnjzKgU4N");
export const DAMM_V2 = new PublicKey("cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG");
export const POOL_AUTHORITY = new PublicKey("HLnpSz9h2S4hiLQ43rnSD9XkcUThA7B8hQMKmDaiTLcC");
export const EVENT_AUTHORITY = new PublicKey("3rmHSu74h1ZcmAisVcWerTCiRDQbUrBKmcwptYGjHfet");
export { NATIVE_MINT };

export const POOL_LEN = 1112;
const POOL_DISCRIMINATOR = Uint8Array.from([241, 154, 109, 4, 17, 177, 109, 188]);
const OFF_TOKEN_A_MINT = 168;
const OFF_TOKEN_B_MINT = 200;
const OFF_TOKEN_A_VAULT = 232;
const OFF_TOKEN_B_VAULT = 264;
const OFF_SQRT_PRICE = 456;

export type SealedProgram = Program<SealedCall>;
export type ConfigParams = {
  treasury: PublicKey;
  feeBps: number;
  callerFeeShareBps: number;
  maxCallLamports: BN;
  maxDepositLamports: BN;
  minCallerStakeBps: number;
  minCallerLockSecs: BN;
  maxRevealWindowSecs: BN;
  maxPriceImpactBps: number;
  minLockedLiquidityBps: number;
  maxSwapReserveBps: number;
  minDepositLamports: BN;
};

export function makeProgram(connection: Connection, wallet?: Wallet): SealedProgram {
  const w: Wallet =
    wallet ?? {
      publicKey: PublicKey.default,
      signTransaction: () => Promise.reject(new Error("read-only program has no wallet")),
      signAllTransactions: () => Promise.reject(new Error("read-only program has no wallet")),
      payer: Keypair.generate(),
    };
  const provider = new AnchorProvider(connection, w, { commitment: "confirmed" });
  return new Program<SealedCall>(idlJson as SealedCall, provider);
}

export const configPda = (): PublicKey => PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID)[0];

export const callPda = (caller: PublicKey, callId: BN | bigint | number): PublicKey =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("call"), caller.toBuffer(), new BN(callId.toString()).toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID,
  )[0];

export const vaultPda = (call: PublicKey): PublicKey =>
  PublicKey.findProgramAddressSync([Buffer.from("vault"), call.toBuffer()], PROGRAM_ID)[0];

export const positionPda = (call: PublicKey, follower: PublicKey): PublicKey =>
  PublicKey.findProgramAddressSync([Buffer.from("pos"), call.toBuffer(), follower.toBuffer()], PROGRAM_ID)[0];

export const programDataPda = (): PublicKey =>
  PublicKey.findProgramAddressSync([PROGRAM_ID.toBuffer()], new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111"))[0];

/** sha256(call || mint || pool || salt), identical to `commitment` in programs/sealed_call/src/instructions/reveal.rs */
export function commitment(call: PublicKey, mint: PublicKey, pool: PublicKey, salt: Uint8Array): Uint8Array {
  if (salt.length !== 32) throw new Error("salt must be 32 bytes");
  const buf = new Uint8Array(128);
  buf.set(call.toBytes(), 0);
  buf.set(mint.toBytes(), 32);
  buf.set(pool.toBytes(), 64);
  buf.set(salt, 96);
  return sha256(buf);
}

export function randomSalt(): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(32));
}

export type PoolInfo = {
  address: PublicKey;
  tokenAMint: PublicKey;
  tokenBMint: PublicKey;
  tokenAVault: PublicKey;
  tokenBVault: PublicKey;
  /** Q64.64 sqrt of the spot price, token_b per token_a in raw units */
  sqrtPrice: bigint;
};

export function decodePool(address: PublicKey, data: Uint8Array): PoolInfo {
  if (data.length !== POOL_LEN) throw new Error(`pool account length ${data.length}, expected ${POOL_LEN}`);
  for (let i = 0; i < 8; i++) if (data[i] !== POOL_DISCRIMINATOR[i]) throw new Error("not a DAMM v2 pool account");
  const key = (off: number) => new PublicKey(data.slice(off, off + 32));
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const sqrtPrice = dv.getBigUint64(OFF_SQRT_PRICE, true) | (dv.getBigUint64(OFF_SQRT_PRICE + 8, true) << 64n);
  return {
    address,
    tokenAMint: key(OFF_TOKEN_A_MINT),
    tokenBMint: key(OFF_TOKEN_B_MINT),
    tokenAVault: key(OFF_TOKEN_A_VAULT),
    tokenBVault: key(OFF_TOKEN_B_VAULT),
    sqrtPrice,
  };
}

export async function readPool(connection: Connection, pool: PublicKey): Promise<PoolInfo> {
  const acc = await connection.getAccountInfo(pool, "confirmed");
  if (!acc) throw new Error(`pool ${pool.toBase58()} not found`);
  if (!acc.owner.equals(DAMM_V2)) throw new Error(`pool ${pool.toBase58()} is not owned by DAMM v2`);
  return decodePool(pool, acc.data);
}

/** The non-wSOL mint of a pool and whether wSOL is token A. Throws unless the pool trades exactly wSOL and one other mint. */
export function poolSides(pool: PoolInfo): { wsolIsA: boolean; mint: PublicKey } {
  if (pool.tokenAMint.equals(NATIVE_MINT)) return { wsolIsA: true, mint: pool.tokenBMint };
  if (pool.tokenBMint.equals(NATIVE_MINT)) return { wsolIsA: false, mint: pool.tokenAMint };
  throw new Error("pool does not trade wSOL");
}

/** Tokens received at the pre-swap spot price, no fee and no curve slippage. floor(amountIn * price) with price = sqrt^2 / 2^128. */
export function spotOut(amountIn: bigint, sqrtPrice: bigint, wsolIsA: boolean): bigint {
  const p = sqrtPrice * sqrtPrice;
  if (p === 0n) return 0n;
  return wsolIsA ? (amountIn * p) >> 128n : (amountIn << 128n) / p;
}

export async function tokenProgramOf(connection: Connection, mint: PublicKey): Promise<PublicKey> {
  const acc = await connection.getAccountInfo(mint, "confirmed");
  if (!acc) throw new Error(`mint ${mint.toBase58()} not found`);
  return acc.owner;
}

export const withComputeBudget = (units: number, ixs: TransactionInstruction[]): TransactionInstruction[] => [
  ComputeBudgetProgram.setComputeUnitLimit({ units }),
  ...ixs,
];

const toBn = (v: BN | bigint | number) => (BN.isBN(v) ? (v as BN) : new BN(v.toString()));

export async function initConfigIx(program: SealedProgram, admin: PublicKey, params: ConfigParams) {
  return program.methods
    .initConfig(params)
    .accountsPartial({
      admin,
      config: configPda(),
      program: PROGRAM_ID,
      programData: programDataPda(),
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export async function setConfigIx(program: SealedProgram, admin: PublicKey, params: ConfigParams) {
  return program.methods.setConfig(params).accountsPartial({ admin, config: configPda() }).instruction();
}

export async function setPausedIx(program: SealedProgram, admin: PublicKey, paused: boolean) {
  return program.methods.setPaused(paused).accountsPartial({ admin, config: configPda() }).instruction();
}

export type OpenCallArgs = {
  caller: PublicKey;
  callId: BN | bigint | number;
  commitment: Uint8Array;
  revealWindowSecs: number;
  callerLockSecs: number;
  maxVaultLamports: BN | bigint | number;
  maxImpactBps: number;
  callerStakeLamports: BN | bigint | number;
};

export async function openCallIx(program: SealedProgram, a: OpenCallArgs) {
  const call = callPda(a.caller, a.callId);
  return program.methods
    .openCall(
      toBn(a.callId),
      Array.from(a.commitment),
      new BN(a.revealWindowSecs),
      new BN(a.callerLockSecs),
      toBn(a.maxVaultLamports),
      a.maxImpactBps,
      toBn(a.callerStakeLamports),
    )
    .accountsPartial({
      caller: a.caller,
      config: configPda(),
      call,
      vault: vaultPda(call),
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export async function depositIx(program: SealedProgram, follower: PublicKey, call: PublicKey, amount: BN | bigint | number) {
  return program.methods
    .deposit(toBn(amount))
    .accountsPartial({
      follower,
      config: configPda(),
      call,
      vault: vaultPda(call),
      position: positionPda(call, follower),
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export async function withdrawIx(program: SealedProgram, follower: PublicKey, call: PublicKey) {
  return program.methods
    .withdraw()
    .accountsPartial({
      follower,
      call,
      vault: vaultPda(call),
      position: positionPda(call, follower),
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export type RevealArgs = {
  caller: PublicKey;
  call: PublicKey;
  mint: PublicKey;
  pool: PublicKey;
  salt: Uint8Array;
  minimumAmountOut: BN | bigint | number;
  /** config.treasury; read from chain when omitted */
  treasury?: PublicKey;
  /** the pool's token vaults; decoded from the pool account when omitted */
  poolVaults?: { tokenAVault: PublicKey; tokenBVault: PublicKey };
  /** token program owning `mint`; read from chain when omitted */
  mintProgram?: PublicKey;
};

export async function revealAndSwapIx(program: SealedProgram, a: RevealArgs) {
  const connection = program.provider.connection;
  const treasury = a.treasury ?? (await program.account.config.fetch(configPda(), "confirmed")).treasury;
  const poolVaults = a.poolVaults ?? (await readPool(connection, a.pool));
  const mintProgram = a.mintProgram ?? (await tokenProgramOf(connection, a.mint));
  const vault = vaultPda(a.call);
  return program.methods
    .revealAndSwap(a.mint, Array.from(a.salt), toBn(a.minimumAmountOut))
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
      poolAuthority: POOL_AUTHORITY,
      tokenAVault: poolVaults.tokenAVault,
      tokenBVault: poolVaults.tokenBVault,
      eventAuthority: EVENT_AUTHORITY,
      dammProgram: DAMM_V2,
      tokenProgram: TOKEN_PROGRAM_ID,
      outputTokenProgram: mintProgram,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

async function claimContext(program: SealedProgram, call: PublicKey) {
  const data = await program.account.call.fetch(call, "confirmed");
  const mint = data.revealedMint;
  const tokenProgram = await tokenProgramOf(program.provider.connection, mint);
  const vault = vaultPda(call);
  return { mint, tokenProgram, vault, vaultOut: getAssociatedTokenAddressSync(mint, vault, true, tokenProgram) };
}

export async function claimIx(program: SealedProgram, follower: PublicKey, call: PublicKey) {
  const c = await claimContext(program, call);
  return program.methods
    .claim()
    .accountsPartial({
      follower,
      call,
      vault: c.vault,
      position: positionPda(call, follower),
      mint: c.mint,
      vaultOut: c.vaultOut,
      followerAta: getAssociatedTokenAddressSync(c.mint, follower, true, c.tokenProgram),
      tokenProgram: c.tokenProgram,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export async function callerClaimIx(program: SealedProgram, caller: PublicKey, call: PublicKey) {
  const c = await claimContext(program, call);
  return program.methods
    .callerClaim()
    .accountsPartial({
      caller,
      call,
      vault: c.vault,
      mint: c.mint,
      vaultOut: c.vaultOut,
      callerAta: getAssociatedTokenAddressSync(c.mint, caller, true, c.tokenProgram),
      tokenProgram: c.tokenProgram,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export async function refundIx(program: SealedProgram, call: PublicKey, follower: PublicKey) {
  return program.methods
    .refund()
    .accountsPartial({
      follower,
      call,
      vault: vaultPda(call),
      position: positionPda(call, follower),
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export async function expireIx(program: SealedProgram, call: PublicKey) {
  const data = await program.account.call.fetch(call, "confirmed");
  return program.methods
    .expire()
    .accountsPartial({ caller: data.caller, call, vault: vaultPda(call), systemProgram: SystemProgram.programId })
    .instruction();
}

export async function sweepDustIx(program: SealedProgram, admin: PublicKey, call: PublicKey) {
  const c = await claimContext(program, call);
  const treasury = (await program.account.config.fetch(configPda(), "confirmed")).treasury;
  return program.methods
    .sweepDust()
    .accountsPartial({
      admin,
      config: configPda(),
      call,
      vault: c.vault,
      mint: c.mint,
      vaultOut: c.vaultOut,
      treasury,
      treasuryAta: getAssociatedTokenAddressSync(c.mint, treasury, true, c.tokenProgram),
      tokenProgram: c.tokenProgram,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export type CallAccount = Awaited<ReturnType<SealedProgram["account"]["call"]["fetch"]>>;
export type PositionAccount = Awaited<ReturnType<SealedProgram["account"]["position"]["fetch"]>>;
export type ConfigAccount = Awaited<ReturnType<SealedProgram["account"]["config"]["fetch"]>>;

export const callState = (c: CallAccount): "open" | "executed" | "expired" => {
  if ("open" in c.state) return "open";
  if ("executed" in c.state) return "executed";
  return "expired";
};

export const fetchConfig = (program: SealedProgram): Promise<ConfigAccount> =>
  program.account.config.fetch(configPda(), "confirmed");

export const fetchCall = (program: SealedProgram, call: PublicKey): Promise<CallAccount> =>
  program.account.call.fetch(call, "confirmed");

/** Every call, via getProgramAccounts with a memcmp on the Call discriminator. */
export async function fetchCalls(program: SealedProgram): Promise<{ publicKey: PublicKey; account: CallAccount }[]> {
  return program.account.call.all();
}

/**
 * Every position of one call. A Position stores its follower but not its call, so the program accounts are filtered
 * by discriminator and each one is kept only when its address equals the PDA derived for (call, follower).
 */
export async function fetchPositions(
  program: SealedProgram,
  call: PublicKey,
): Promise<{ publicKey: PublicKey; account: PositionAccount }[]> {
  const all = await program.account.position.all();
  return all.filter((p) => p.publicKey.equals(positionPda(call, p.account.follower)));
}

export function toTransaction(feePayer: PublicKey, blockhash: string, ixs: TransactionInstruction[]): Transaction {
  const tx = new Transaction({ feePayer, recentBlockhash: blockhash });
  tx.add(...ixs);
  return tx;
}

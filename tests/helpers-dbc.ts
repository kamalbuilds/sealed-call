import {
  ActivationType,
  BaseFeeMode,
  CollectFeeMode,
  DynamicBondingCurveClient,
  MigrationFeeOption,
  MigrationOption,
  TokenAuthorityOption,
  TokenDecimal,
  TokenType,
  buildCurveWithMarketCap,
  SwapMode,
  deriveDbcPoolAddress,
  getCurrentPoint,
} from "@meteora-ag/dynamic-bonding-curve-sdk";
import { NATIVE_MINT } from "@solana/spl-token";
import { ComputeBudgetProgram, Keypair, PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import { connection, send } from "./helpers";

/** The config and base mint keypairs of a launch, and the pool address they fix. The pool address is known before anything exists on chain. */
export type LaunchPlan = { config: Keypair; baseMint: Keypair; pool: PublicKey };

export function planDbcLaunch(): LaunchPlan {
  const config = Keypair.generate();
  const baseMint = Keypair.generate();
  return { config, baseMint, pool: deriveDbcPoolAddress(NATIVE_MINT, baseMint.publicKey, config.publicKey) };
}

export type DbcLaunch = {
  config: PublicKey;
  baseMint: PublicKey;
  pool: PublicKey;
  sigs: { createConfig: string; createPool: string };
};

/**
 * A real Meteora DBC launch: a config with a constant-product curve (1B supply, 6 decimals, flat 1% fee, no dynamic fee,
 * no rate limiter, immutable token authority) and a pool on it, created by `payer` with the DBC program's own instructions.
 * Prices are fully diluted market caps in SOL.
 */
export async function createDbcLaunch(
  payer: Keypair,
  plan: LaunchPlan,
  o: { initialMarketCap: number; migrationMarketCap: number; name?: string; symbol?: string },
): Promise<DbcLaunch> {
  const client = new DynamicBondingCurveClient(connection, "confirmed");
  const curve = buildCurveWithMarketCap({
    token: {
      tokenType: TokenType.SPLToken,
      tokenBaseDecimal: TokenDecimal.SIX,
      tokenQuoteDecimal: TokenDecimal.NINE,
      tokenAuthorityOption: TokenAuthorityOption.Immutable,
      totalTokenSupply: 1_000_000_000,
      leftover: 0,
    },
    fee: {
      baseFeeParams: {
        baseFeeMode: BaseFeeMode.FeeSchedulerLinear,
        feeSchedulerParam: { startingFeeBps: 100, endingFeeBps: 100, numberOfPeriod: 0, totalDuration: 0 },
      },
      dynamicFeeEnabled: false,
      collectFeeMode: CollectFeeMode.QuoteToken,
      creatorTradingFeePercentage: 0,
      poolCreationFee: 0,
      enableFirstSwapWithMinFee: false,
    },
    migration: {
      migrationOption: MigrationOption.MET_DAMM_V2,
      migrationFeeOption: MigrationFeeOption.FixedBps100,
      migrationFee: { feePercentage: 0, creatorFeePercentage: 0 },
    },
    liquidityDistribution: {
      partnerLiquidityPercentage: 0,
      partnerPermanentLockedLiquidityPercentage: 100,
      creatorLiquidityPercentage: 0,
      creatorPermanentLockedLiquidityPercentage: 0,
    },
    lockedVesting: {
      totalLockedVestingAmount: 0,
      numberOfVestingPeriod: 0,
      cliffUnlockAmount: 0,
      totalVestingDuration: 0,
      cliffDurationFromMigrationTime: 0,
    },
    activationType: ActivationType.Timestamp,
    initialMarketCap: o.initialMarketCap,
    migrationMarketCap: o.migrationMarketCap,
  });

  const { config, baseMint } = plan;
  const cfgTx = await client.partner.createConfig({
    config: config.publicKey,
    feeClaimer: payer.publicKey,
    leftoverReceiver: payer.publicKey,
    payer: payer.publicKey,
    quoteMint: NATIVE_MINT,
    ...curve,
  });
  const createConfig = await send(cfgTx.instructions, [payer, config]);

  const poolTx = await client.creator.createPool({
    baseMint: baseMint.publicKey,
    config: config.publicKey,
    name: o.name ?? "Sealed Launch",
    symbol: o.symbol ?? "SEAL",
    uri: "https://sealed-call.vercel.app/launch.json",
    payer: payer.publicKey,
    poolCreator: payer.publicKey,
  });
  const createPool = await send([ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }), ...poolTx.instructions], [payer, baseMint]);
  return { config: config.publicKey, baseMint: baseMint.publicKey, pool: plan.pool, sigs: { createConfig: createConfig.sig, createPool: createPool.sig } };
}

const client = () => new DynamicBondingCurveClient(connection, "confirmed");

/** What the DBC SDK says an exact-in wSOL buy of `lamportsIn` returns from the pool's current state. */
export async function dbcQuote(pool: PublicKey, lamportsIn: bigint): Promise<{ out: bigint; nextSqrtPrice: bigint }> {
  const c = client();
  const vp = await c.state.getPool(pool);
  if (!vp) throw new Error(`pool ${pool.toBase58()} not found`);
  const config = await c.state.getPoolConfig(vp.poolState.config);
  if (!config) throw new Error("pool config not found");
  const currentPoint = await getCurrentPoint(connection, config.activationType);
  const q = await c.pool.swapQuote2({
    virtualPool: vp,
    config,
    swapBaseForQuote: false,
    hasReferral: false,
    eligibleForFirstSwapWithMinFee: false,
    currentPoint,
    swapMode: SwapMode.ExactIn,
    amountIn: new BN(lamportsIn.toString()),
  });
  return { out: BigInt(q.outputAmount.toString()), nextSqrtPrice: BigInt(q.nextSqrtPrice.toString()) };
}

/** A plain wallet buy on the curve, the way a bot or any other buyer would race a launch. Returns the base tokens received. */
export async function dbcBuy(buyer: Keypair, pool: PublicKey, lamportsIn: bigint): Promise<{ sig: string; out: bigint }> {
  const { getAssociatedTokenAddressSync } = await import("@solana/spl-token");
  const c = client();
  const vp = await c.state.getPool(pool);
  if (!vp) throw new Error(`pool ${pool.toBase58()} not found`);
  const quote = await dbcQuote(pool, lamportsIn);
  const tx = await c.pool.swap({
    amountIn: new BN(lamportsIn.toString()),
    minimumAmountOut: new BN(((quote.out * 99n) / 100n).toString()),
    swapBaseForQuote: false,
    owner: buyer.publicKey,
    pool,
    referralTokenAccount: null,
  });
  const ata = getAssociatedTokenAddressSync(vp.poolState.baseMint, buyer.publicKey);
  const before = await connection.getTokenAccountBalance(ata).then((b) => BigInt(b.value.amount)).catch(() => 0n);
  const { sig } = await send([ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }), ...tx.instructions], [buyer]);
  const after = BigInt((await connection.getTokenAccountBalance(ata)).value.amount);
  return { sig, out: after - before };
}

/** Buys until the curve completes: a partial-fill swap larger than the remaining room takes only what the curve can absorb. */
export async function dbcFillCurve(buyer: Keypair, pool: PublicKey, lamportsIn: bigint): Promise<string> {
  const tx = await client().pool.swap2({
    swapMode: SwapMode.PartialFill,
    amountIn: new BN(lamportsIn.toString()),
    minimumAmountOut: new BN(1),
    swapBaseForQuote: false,
    owner: buyer.publicKey,
    pool,
    referralTokenAccount: null,
  });
  return (await send([ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }), ...tx.instructions], [buyer])).sig;
}

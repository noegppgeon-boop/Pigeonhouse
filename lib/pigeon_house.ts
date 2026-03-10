"use client";

import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, Keypair, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";
import BN from "bn.js";

import {
  PIGEON_HOUSE_PROGRAM_ID,
  PIGEON_MINT,
  HOOK_PROGRAM_ID,
  METAPLEX_METADATA_PROGRAM,
  RPC_URL,
  TOKEN_DECIMALS,
  PIGEON_DECIMALS,
  getQuoteAssetByMint,
} from "./constants";
import {
  getGlobalConfigPDA,
  getBondingCurvePDA,
  getFeeVaultPDA,
  getMetadataPDA,
  getATA,
  getHookConfigPDA,
  getFeeAccrualVaultPDA,
  getExtraAccountMetasPDA,
  getQuoteAssetConfigPDA,
} from "./pda";

// ── IDL (loaded at runtime) ──
let cachedIdl: any = null;
let cachedHookIdl: any = null;

async function getIdl(): Promise<any> {
  if (cachedIdl) return cachedIdl;
  const res = await fetch("/idl/pigeon_house.json");
  cachedIdl = await res.json();
  return cachedIdl;
}

async function getHookIdl(): Promise<any> {
  if (cachedHookIdl) return cachedHookIdl;
  const res = await fetch("/idl/pigeon_hook.json");
  cachedHookIdl = await res.json();
  return cachedHookIdl;
}

function getConnection(): Connection {
  return new Connection(RPC_URL, "confirmed");
}

async function getProgram(wallet?: anchor.Wallet): Promise<anchor.Program> {
  const idl = await getIdl();
  const connection = getConnection();

  if (wallet) {
    const provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    return new anchor.Program(idl, provider);
  }

  // Read-only
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any) => txs,
  } as anchor.Wallet;
  const provider = new anchor.AnchorProvider(connection, dummyWallet, {
    commitment: "confirmed",
  });
  return new anchor.Program(idl, provider);
}

async function getHookProgram(wallet: anchor.Wallet): Promise<anchor.Program> {
  const idl = await getHookIdl();
  const connection = getConnection();
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new anchor.Program(idl, provider);
}

// ── Types ──
export interface GlobalConfigData {
  authority: PublicKey;
  pigeonMint: PublicKey;
  treasury: PublicKey;
  platformFeeBps: number;
  graduationPigeonAmount: BN;
  totalTokensLaunched: BN;
  totalPigeonBurned: BN;
}

export interface BondingCurveData {
  tokenMint: PublicKey;
  creator: PublicKey;
  quoteMint?: PublicKey;
  virtualPigeonReserves: BN;
  virtualTokenReserves: BN;
  realPigeonReserves: BN;
  realTokenReserves: BN;
  tokenTotalSupply: BN;
  complete: boolean;
  createdAt: BN;
  name: string;
  symbol: string;
  uri: string;
  bump: number;
}

// ── Read Functions ──

export async function getGlobalConfig(): Promise<GlobalConfigData | null> {
  try {
    const program = await getProgram();
    const pda = getGlobalConfigPDA();
    console.log("[getGlobalConfig] programId:", program.programId.toBase58(), "pda:", pda.toBase58());
    console.log("[getGlobalConfig] account keys:", Object.keys(program.account));
    const accountAccessor = (program.account as any).globalConfig || (program.account as any).GlobalConfig;
    if (!accountAccessor) {
      console.error("[getGlobalConfig] No globalConfig accessor! Available:", Object.keys(program.account));
      return null;
    }
    const result = await accountAccessor.fetch(pda);
    console.log("[getGlobalConfig] result:", result);
    return result as any;
  } catch (err: any) {
    console.error("[getGlobalConfig] ERROR:", err?.message || err);
    return null;
  }
}

export async function getBondingCurve(
  mint: PublicKey
): Promise<BondingCurveData | null> {
  try {
    const program = await getProgram();
    const pda = getBondingCurvePDA(mint);
    return (await (program.account as any).bondingCurve.fetch(pda)) as any;
  } catch {
    return null;
  }
}

export async function getAllBondingCurves(): Promise<
  { publicKey: PublicKey; account: BondingCurveData }[]
> {
  try {
    const program = await getProgram();
    const accounts = await (program.account as any).bondingCurve.all();
    return accounts as any;
  } catch {
    return [];
  }
}

// ── Quote Functions ──

export function getQuoteBuy(
  curve: BondingCurveData,
  pigeonIn: BN,
  feeBps: number
): { tokensOut: BN; fee: BN; netPigeon: BN } {
  const fee = pigeonIn.mul(new BN(feeBps)).div(new BN(10_000));
  const netPigeon = pigeonIn.sub(fee);

  // AMM uses ONLY virtual reserves (pump.fun style)
  const vp = curve.virtualPigeonReserves;
  const vt = curve.virtualTokenReserves;
  const k = vp.mul(vt);
  const newVp = vp.add(netPigeon);
  const newVt = k.div(newVp);
  const tokensOut = vt.sub(newVt);

  return { tokensOut, fee, netPigeon };
}

export function getQuoteSell(
  curve: BondingCurveData,
  tokensIn: BN,
  feeBps: number
): { pigeonOut: BN; fee: BN; netPigeonOut: BN } {
  // AMM uses ONLY virtual reserves (pump.fun style)
  const vp = curve.virtualPigeonReserves;
  const vt = curve.virtualTokenReserves;
  const k = vp.mul(vt);
  const newVt = vt.add(tokensIn);
  const newVp = k.div(newVt);
  const pigeonOut = vp.sub(newVp);

  const fee = pigeonOut.mul(new BN(feeBps)).div(new BN(10_000));
  const netPigeonOut = pigeonOut.sub(fee);

  return { pigeonOut, fee, netPigeonOut };
}

// Safe BN to number: divide first to avoid 53-bit overflow
function bnToSafeNumber(bn: BN, decimals: number = 0): number {
  if (decimals > 0) {
    const divisor = new BN(10).pow(new BN(decimals));
    const whole = bn.div(divisor);
    const frac = bn.mod(divisor);
    return whole.toNumber() + frac.toNumber() / divisor.toNumber();
  }
  // If fits in 53 bits, use directly
  try { return bn.toNumber(); } catch { return parseFloat(bn.toString()); }
}

export function getCurrentPrice(curve: BondingCurveData): number {
  // Price = PIGEON per token (pump.fun style: virtual only)
  const vp = curve.virtualPigeonReserves;
  const vt = curve.virtualTokenReserves;
  if (vt.isZero()) return 0;
  // Use mul/div to stay in BN, then convert safely
  // price = vp / vt — scale by 1e12 to keep precision
  const scale = new BN("1000000000000");
  const scaledPrice = vp.mul(scale).div(vt);
  return bnToSafeNumber(scaledPrice) / 1e12;
}

export function getMarketCap(curve: BondingCurveData): BN {
  // pump.fun style: virtual only
  const vp = curve.virtualPigeonReserves;
  const vt = curve.virtualTokenReserves;
  if (vt.isZero()) return new BN(0);
  // mcap = price * total_supply = vp * total_supply / vt
  const mcap = vp
    .mul(curve.tokenTotalSupply)
    .div(vt);
  return mcap;
}

export function getProgressPercent(
  curve: BondingCurveData,
  graduationAmount: BN
): number {
  if (graduationAmount.isZero()) return 0;
  // Use BN math: (realReserves * 10000) / graduationAmount -> basis points -> / 100
  const bps = curve.realPigeonReserves.mul(new BN(10000)).div(graduationAmount);
  const percent = bnToSafeNumber(bps) / 100;
  return Math.min(percent, 100);
}

// ── Write Functions ──

export async function executeBuy(
  wallet: anchor.Wallet,
  tokenMint: PublicKey,
  quoteAmountIn: BN,
  slippageBps: number,
  referrer?: string
): Promise<string> {
  const program = await getProgram(wallet);
  const curve = await getBondingCurve(tokenMint);
  if (!curve) throw new Error("Bonding curve not found");

  const config = await getGlobalConfig();
  if (!config) throw new Error("GlobalConfig not found");

  // Determine quote asset
  const quoteMintKey = curve.quoteMint ?? PIGEON_MINT;
  const quoteAsset = getQuoteAssetByMint(quoteMintKey.toBase58());
  const quoteTokenProgram = quoteAsset?.tokenProgram ?? TOKEN_2022_PROGRAM_ID;
  const isPigeon = quoteMintKey.equals(PIGEON_MINT);

  const { tokensOut } = getQuoteBuy(curve, quoteAmountIn, config.platformFeeBps);
  const minTokensOut = tokensOut.mul(new BN(10_000 - slippageBps)).div(new BN(10_000));

  const bondingCurve = getBondingCurvePDA(tokenMint);
  const feeVault = getFeeVaultPDA();
  const quoteConfigPDA = getQuoteAssetConfigPDA(quoteMintKey);

  // Build remaining accounts
  const remainingAccounts: { pubkey: PublicKey; isWritable: boolean; isSigner: boolean }[] = [];

  // Referrer (optional)
  if (referrer) {
    remainingAccounts.push({ pubkey: getATA(new PublicKey(referrer), quoteMintKey, quoteTokenProgram), isWritable: true, isSigner: false });
  }

  // Non-PIGEON quotes need reserve + burn accrual vaults
  if (!isPigeon) {
    const { getBurnAccrualPDA, getStrategicReservePDA } = await import("./pda");
    const reserveVault = getStrategicReservePDA(quoteMintKey);
    const reserveVaultAta = getATA(reserveVault, quoteMintKey, quoteTokenProgram);
    const burnVault = getBurnAccrualPDA(quoteMintKey);
    const burnVaultAta = getATA(burnVault, quoteMintKey, quoteTokenProgram);

    remainingAccounts.push(
      { pubkey: reserveVault, isWritable: true, isSigner: false },
      { pubkey: reserveVaultAta, isWritable: true, isSigner: false },
      { pubkey: burnVault, isWritable: true, isSigner: false },
      { pubkey: burnVaultAta, isWritable: true, isSigner: false },
    );
  }

  // Pre-create buyer's token ATA (required for Token-2022)
  const buyerTokenAta = getATA(wallet.publicKey, tokenMint);
  const createBuyerTokenAtaIx = createAssociatedTokenAccountIdempotentInstruction(
    wallet.publicKey, buyerTokenAta, wallet.publicKey, tokenMint, TOKEN_2022_PROGRAM_ID
  );

  return await program.methods
    .buy(quoteAmountIn, minTokensOut)
    .preInstructions([createBuyerTokenAtaIx])
    .accounts({
      buyer: wallet.publicKey,
      globalConfig: getGlobalConfigPDA(),
      bondingCurve,
      quoteConfig: quoteConfigPDA,
      feeVault: feeVault,
      tokenMint,
      quoteMint: quoteMintKey,
      bondingCurveQuoteVault: getATA(bondingCurve, quoteMintKey, quoteTokenProgram),
      bondingCurveTokenVault: getATA(bondingCurve, tokenMint),
      buyerQuoteAta: getATA(wallet.publicKey, quoteMintKey, quoteTokenProgram),
      buyerTokenAta: getATA(wallet.publicKey, tokenMint),
      treasuryQuoteAta: getATA(config.treasury, quoteMintKey, quoteTokenProgram),
      pigeonMint: PIGEON_MINT,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      quoteTokenProgram,
    })
    .remainingAccounts(remainingAccounts)
    .rpc();
}

export async function executeSell(
  wallet: anchor.Wallet,
  tokenMint: PublicKey,
  tokenAmountIn: BN,
  slippageBps: number,
  referrer?: string
): Promise<string> {
  const program = await getProgram(wallet);
  const curve = await getBondingCurve(tokenMint);
  if (!curve) throw new Error("Bonding curve not found");

  const config = await getGlobalConfig();
  if (!config) throw new Error("GlobalConfig not found");

  // Determine quote asset
  const quoteMintKey = curve.quoteMint ?? PIGEON_MINT;
  const quoteAsset = getQuoteAssetByMint(quoteMintKey.toBase58());
  const quoteTokenProgram = quoteAsset?.tokenProgram ?? TOKEN_2022_PROGRAM_ID;
  const isPigeon = quoteMintKey.equals(PIGEON_MINT);

  const { netPigeonOut } = getQuoteSell(curve, tokenAmountIn, config.platformFeeBps);
  const minQuoteOut = netPigeonOut.mul(new BN(10_000 - slippageBps)).div(new BN(10_000));

  const bondingCurve = getBondingCurvePDA(tokenMint);
  const feeVault = getFeeVaultPDA();
  const quoteConfigPDA = getQuoteAssetConfigPDA(quoteMintKey);

  // Build remaining accounts
  const remainingAccounts: { pubkey: PublicKey; isWritable: boolean; isSigner: boolean }[] = [];

  if (referrer) {
    remainingAccounts.push({ pubkey: getATA(new PublicKey(referrer), quoteMintKey, quoteTokenProgram), isWritable: true, isSigner: false });
  }

  if (!isPigeon) {
    const { getBurnAccrualPDA, getStrategicReservePDA } = await import("./pda");
    const reserveVault = getStrategicReservePDA(quoteMintKey);
    const reserveVaultAta = getATA(reserveVault, quoteMintKey, quoteTokenProgram);
    const burnVault = getBurnAccrualPDA(quoteMintKey);
    const burnVaultAta = getATA(burnVault, quoteMintKey, quoteTokenProgram);

    remainingAccounts.push(
      { pubkey: reserveVault, isWritable: true, isSigner: false },
      { pubkey: reserveVaultAta, isWritable: true, isSigner: false },
      { pubkey: burnVault, isWritable: true, isSigner: false },
      { pubkey: burnVaultAta, isWritable: true, isSigner: false },
    );
  }

  return await program.methods
    .sell(tokenAmountIn, minQuoteOut)
    .accounts({
      seller: wallet.publicKey,
      globalConfig: getGlobalConfigPDA(),
      bondingCurve,
      quoteConfig: quoteConfigPDA,
      feeVault: feeVault,
      tokenMint,
      quoteMint: quoteMintKey,
      bondingCurveQuoteVault: getATA(bondingCurve, quoteMintKey, quoteTokenProgram),
      bondingCurveTokenVault: getATA(bondingCurve, tokenMint),
      sellerQuoteAta: getATA(wallet.publicKey, quoteMintKey, quoteTokenProgram),
      sellerTokenAta: getATA(wallet.publicKey, tokenMint),
      treasuryQuoteAta: getATA(config.treasury, quoteMintKey, quoteTokenProgram),
      pigeonMint: PIGEON_MINT,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      quoteTokenProgram,
    })
    .remainingAccounts(remainingAccounts)
    .rpc();
}

// ── Create Token ──

export async function executeCreateToken(
  wallet: anchor.Wallet,
  name: string,
  symbol: string,
  uri: string,
  initialBuyPigeon?: BN,
  quoteMint?: PublicKey
): Promise<{ txSig: string; tokenMint: PublicKey }> {
  const program = await getProgram(wallet);
  const connection = getConnection();

  // Quote asset — default to PIGEON
  const effectiveQuoteMint = quoteMint ?? PIGEON_MINT;
  const quoteAsset = getQuoteAssetByMint(effectiveQuoteMint.toBase58());
  const quoteTokenProgram = quoteAsset?.tokenProgram ?? TOKEN_2022_PROGRAM_ID;
  const quoteConfigPDA = getQuoteAssetConfigPDA(effectiveQuoteMint);

  // Generate new token mint keypair
  const tokenMint = Keypair.generate();
  const bondingCurve = getBondingCurvePDA(tokenMint.publicKey);
  const feeVault = getFeeVaultPDA();
  const metadataPDA = getMetadataPDA(tokenMint.publicKey);

  // Allocate mint account space (Token-2022 mint + extensions)
  // getMintLen([TransferFeeConfig, TransferHook]) = 346
  // Base(82) + padding(83) + AccountType(1) + TransferFeeConfig(4+108) + TransferHook(4+64) = 346
  const mintSpace = 346; // Exact: Token-2022 mint + TransferFeeConfig + TransferHook
  const mintRent = await connection.getMinimumBalanceForRentExemption(mintSpace);
  const createMintIx = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: tokenMint.publicKey,
    lamports: mintRent,
    space: mintSpace,
    programId: TOKEN_2022_PROGRAM_ID,
  });

  const initialBuy = initialBuyPigeon && !initialBuyPigeon.isZero() ? initialBuyPigeon : null;

  const tx = await program.methods
    .createToken(name, symbol, uri, initialBuy)
    .accounts({
      creator: wallet.publicKey,
      globalConfig: getGlobalConfigPDA(),
      quoteConfig: quoteConfigPDA,
      tokenMint: tokenMint.publicKey,
      bondingCurve,
      bondingCurveQuoteVault: getATA(bondingCurve, effectiveQuoteMint, quoteTokenProgram),
      bondingCurveTokenVault: getATA(bondingCurve, tokenMint.publicKey),
      quoteMint: effectiveQuoteMint,
      pigeonMint: PIGEON_MINT,
      metadata: SystemProgram.programId,
      metadataProgram: SystemProgram.programId,
      creatorQuoteAta: getATA(wallet.publicKey, effectiveQuoteMint, quoteTokenProgram),
      creatorTokenAta: getATA(wallet.publicKey, tokenMint.publicKey),
      feeVaultPigeonAta: getATA(feeVault, PIGEON_MINT),
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
      quoteTokenProgram,
    })
    .preInstructions([createMintIx])
    .signers([tokenMint])
    .rpc();

  // Auto-initialize hook FeeAccrualVault + ExtraAccountMetaList for the new token
  // This is needed for graduation (TransferHook activation)
  try {
    await initFeeVault(wallet, tokenMint.publicKey);
  } catch (e) {
    console.warn("initFeeVault failed (non-critical, can retry later):", e);
  }

  return { txSig: tx, tokenMint: tokenMint.publicKey };
}

// ── Hook: Init Fee Vault ──

export async function initFeeVault(
  wallet: anchor.Wallet,
  tokenMint: PublicKey
): Promise<string> {
  const hookProgram = await getHookProgram(wallet);
  const hookConfig = getHookConfigPDA();
  const feeAccrualVault = getFeeAccrualVaultPDA(tokenMint);
  const extraAccountMetas = getExtraAccountMetasPDA(tokenMint);
  const vaultPigeonAta = getATA(feeAccrualVault, PIGEON_MINT);

  const tx = await hookProgram.methods
    .initFeeVault()
    .accounts({
      payer: wallet.publicKey,
      hookConfig,
      tokenMint,
      feeAccrualVault,
      extraAccountMetas,
      vaultPigeonAta,
      pigeonMint: PIGEON_MINT,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

// ── Event Subscription ──

export async function subscribeToEvents(
  callback: (event: any, name: string) => void
): Promise<number> {
  const program = await getProgram();
  const listenerId = program.addEventListener("TokenCreated", (event) =>
    callback(event, "TokenCreated")
  );
  program.addEventListener("TokenPurchased", (event) =>
    callback(event, "TokenPurchased")
  );
  program.addEventListener("TokenSold", (event) =>
    callback(event, "TokenSold")
  );
  program.addEventListener("TokenGraduated", (event) =>
    callback(event, "TokenGraduated")
  );
  program.addEventListener("FeeBurned", (event) =>
    callback(event, "FeeBurned")
  );
  return listenerId;
}

// ── Format Helpers ──

function safeBnToFloat(amount: BN | bigint | number, decimals: number): number {
  if (typeof amount === "number") return amount / 10 ** decimals;
  const s = amount.toString();
  if (s.length <= decimals) {
    return parseFloat("0." + s.padStart(decimals, "0"));
  }
  const whole = s.slice(0, s.length - decimals);
  const frac = s.slice(s.length - decimals);
  return parseFloat(whole + "." + frac);
}

export function formatPigeon(amount: BN | bigint | number): string {
  const val = safeBnToFloat(amount, PIGEON_DECIMALS);
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(2)}K`;
  return val.toFixed(2);
}

export function formatToken(amount: BN | bigint | number): string {
  const val = safeBnToFloat(amount, TOKEN_DECIMALS);
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)}B`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(2)}K`;
  return val.toFixed(2);
}

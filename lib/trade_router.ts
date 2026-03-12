/**
 * Trade Router SDK — post-graduation swap routing through Raydium CPMM
 * with automatic fee collection and PIGEON burn
 */
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
// ── Constants ──
export const TRADE_ROUTER_PROGRAM = new PublicKey("CvSNrkb7SH77vjP3oSpfyDsdXxwGB7enLRdPusbzeLGR");
export const RAYDIUM_CPMM_PROGRAM = new PublicKey("CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C");
export const PIGEON_MINT = new PublicKey("4fSWEw2wbYEUCcMtitzmeGUfqinoafXxkhqZrA9Gpump");
export const TREASURY = new PublicKey("7EhCAjUGGE8WNLHnJ7gkfxQa3k4tBTLJAKsg459dEKi");

// AMM Config (index 12, 0.30% trade fee)
const AMM_CONFIG = new PublicKey("61GwTFRpjM3emvpnNoMT54oKnmjrQF6m1UQxmZRZQFRZ");

// Config PDA
export const [ROUTER_CONFIG_PDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("router_config")],
  TRADE_ROUTER_PROGRAM,
);

// CPMM authority PDA
const [CPMM_AUTHORITY] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault_and_lp_mint_auth_seed")],
  RAYDIUM_CPMM_PROGRAM,
);

// Fee vault PIGEON ATA (owned by config PDA)
export const FEE_VAULT_PIGEON = getAssociatedTokenAddressSync(
  PIGEON_MINT, ROUTER_CONFIG_PDA, true, TOKEN_2022_PROGRAM_ID,
);

// Treasury PIGEON ATA
export const TREASURY_PIGEON_ATA = getAssociatedTokenAddressSync(
  PIGEON_MINT, TREASURY, true, TOKEN_2022_PROGRAM_ID,
);

// Pre-computed discriminator for "global:swap" = sha256("global:swap")[0..8]
// Hardcoded to avoid crypto dependency in browser
const SWAP_DISC = Buffer.from([248, 198, 158, 145, 225, 117, 135, 200]);

// ── Helpers ──

/** Derive CPMM pool PDA */
export function getPoolPDA(
  ammConfig: PublicKey,
  token0Mint: PublicKey,
  token1Mint: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), ammConfig.toBuffer(), token0Mint.toBuffer(), token1Mint.toBuffer()],
    RAYDIUM_CPMM_PROGRAM,
  );
}

/** Derive CPMM pool vault PDA */
export function getVaultPDA(pool: PublicKey, tokenMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pool_vault"), pool.toBuffer(), tokenMint.toBuffer()],
    RAYDIUM_CPMM_PROGRAM,
  );
}

/** Derive CPMM observation PDA */
export function getObservationPDA(pool: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("observation"), pool.toBuffer()],
    RAYDIUM_CPMM_PROGRAM,
  );
}

/** Order token mints for CPMM (token0 < token1) */
export function orderMints(mintA: PublicKey, mintB: PublicKey): [PublicKey, PublicKey] {
  return mintA.toBuffer().compare(mintB.toBuffer()) < 0
    ? [mintA, mintB]
    : [mintB, mintA];
}

// ── Main SDK ──

export interface RouterSwapParams {
  /** User wallet */
  wallet: {
    publicKey: PublicKey;
    signTransaction: (tx: Transaction) => Promise<Transaction>;
  };
  /** Connection */
  connection: Connection;
  /** Token mint being traded (the launched token) */
  tokenMint: PublicKey;
  /** Quote mint (PIGEON for now) */
  quoteMint: PublicKey;
  /** True = buy token (quote→token), false = sell token (token→quote) */
  isBuy: boolean;
  /** Amount in smallest units */
  amountIn: bigint;
  /** Minimum output (slippage protection) */
  minimumAmountOut: bigint;
  /** CPMM pool address (if known, otherwise derived) */
  pool?: PublicKey;
}

/**
 * Execute a routed swap through Trade Router → Raydium CPMM
 * Returns transaction signature
 */
export async function executeRouterSwap(params: RouterSwapParams): Promise<string> {
  const { wallet, connection, tokenMint, quoteMint, isBuy, amountIn, minimumAmountOut } = params;

  // Order mints for CPMM
  const [token0, token1] = orderMints(tokenMint, quoteMint);
  
  // Derive pool if not provided
  const pool = params.pool ?? getPoolPDA(AMM_CONFIG, token0, token1)[0];
  const [vault0] = getVaultPDA(pool, token0);
  const [vault1] = getVaultPDA(pool, token1);
  const [observation] = getObservationPDA(pool);

  // Determine input/output based on buy/sell
  const inputMint = isBuy ? quoteMint : tokenMint;
  const outputMint = isBuy ? tokenMint : quoteMint;
  
  const inputIsToken0 = inputMint.equals(token0);
  const inputVault = inputIsToken0 ? vault0 : vault1;
  const outputVault = inputIsToken0 ? vault1 : vault0;

  // Both are Token-2022 (PIGEON and launched tokens)
  const inputTokenProgram = TOKEN_2022_PROGRAM_ID;
  const outputTokenProgram = TOKEN_2022_PROGRAM_ID;

  // User ATAs
  const userInputAta = getAssociatedTokenAddressSync(inputMint, wallet.publicKey, false, inputTokenProgram);
  const userOutputAta = getAssociatedTokenAddressSync(outputMint, wallet.publicKey, false, outputTokenProgram);

  // Fee vault: if input is PIGEON, pass mint for instant burn; otherwise pass ATA for accumulation
  const isPigeonInput = inputMint.equals(PIGEON_MINT);
  const feeVault = isPigeonInput
    ? PIGEON_MINT // mint account (for burn CPI)
    : getAssociatedTokenAddressSync(inputMint, ROUTER_CONFIG_PDA, true, inputTokenProgram);
  
  // Treasury ATA for input mint
  const treasuryAta = getAssociatedTokenAddressSync(inputMint, TREASURY, true, inputTokenProgram);

  // Build instruction data
  const data = Buffer.alloc(24);
  SWAP_DISC.copy(data, 0);
  data.writeBigUInt64LE(amountIn, 8);
  data.writeBigUInt64LE(minimumAmountOut, 16);

  const swapIx = new TransactionInstruction({
    programId: TRADE_ROUTER_PROGRAM,
    keys: [
      // Router accounts
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: ROUTER_CONFIG_PDA, isSigner: false, isWritable: true },
      { pubkey: feeVault, isSigner: false, isWritable: true },
      { pubkey: treasuryAta, isSigner: false, isWritable: true },
      // CPMM accounts
      { pubkey: RAYDIUM_CPMM_PROGRAM, isSigner: false, isWritable: false },
      { pubkey: CPMM_AUTHORITY, isSigner: false, isWritable: false },
      { pubkey: AMM_CONFIG, isSigner: false, isWritable: false },
      { pubkey: pool, isSigner: false, isWritable: true },
      { pubkey: userInputAta, isSigner: false, isWritable: true },
      { pubkey: userOutputAta, isSigner: false, isWritable: true },
      { pubkey: inputVault, isSigner: false, isWritable: true },
      { pubkey: outputVault, isSigner: false, isWritable: true },
      { pubkey: inputTokenProgram, isSigner: false, isWritable: false },
      { pubkey: outputTokenProgram, isSigner: false, isWritable: false },
      { pubkey: inputMint, isSigner: false, isWritable: true },
      { pubkey: outputMint, isSigner: false, isWritable: false },
      { pubkey: observation, isSigner: false, isWritable: true },
    ],
    data,
  });

  // Build transaction
  const tx = new Transaction();
  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));
  tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 }));

  // Ensure user has output ATA
  const outputAtaInfo = await connection.getAccountInfo(userOutputAta);
  if (!outputAtaInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey, userOutputAta, wallet.publicKey, outputMint, outputTokenProgram,
      )
    );
  }

  // Ensure fee vault ATA exists for non-PIGEON input (PIGEON uses mint directly for burn)
  if (!isPigeonInput) {
    const feeVaultInfo = await connection.getAccountInfo(feeVault);
    if (!feeVaultInfo) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey, feeVault, ROUTER_CONFIG_PDA, inputMint, inputTokenProgram,
        )
      );
    }
  }

  // Ensure treasury ATA exists for this input mint
  const treasuryAtaInfo = await connection.getAccountInfo(treasuryAta);
  if (!treasuryAtaInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey, treasuryAta, TREASURY, inputMint, inputTokenProgram,
      )
    );
  }

  tx.add(swapIx);

  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = wallet.publicKey;

  const signed = await wallet.signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
  await connection.confirmTransaction(sig, "confirmed");

  return sig;
}

import { PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export const PIGEON_HOUSE_PROGRAM_ID = new PublicKey(
  "BV1RxkAaD5DjXMsnofkVikFUUYdrDg1v8YgsQ3iyDNoL"
);

// Mainnet PIGEON (pump.fun, Token-2022, 6 decimals)
export const PIGEON_MINT = new PublicKey(
  "4fSWEw2wbYEUCcMtitzmeGUfqinoafXxkhqZrA9Gpump"
);

// Native SOL (wrapped)
export const SOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);

// SKR token (SPL, 6 decimals)
export const SKR_MINT = new PublicKey(
  "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3"
);

export const HOOK_PROGRAM_ID = new PublicKey(
  "49NjaVFxXUhWg59g4bEDtcNQxsArFz9MnyeQGPxUDugi"
);

export const DEAD_WALLET = new PublicKey(
  "1nc1nerator11111111111111111111111111111111"
);

export const METAPLEX_METADATA_PROGRAM = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ||
  "https://api.devnet.solana.com";

export const DEFAULT_SLIPPAGE_BPS = 500; // 5%

// Bonding curve constants (must match on-chain)
export const INITIAL_VIRTUAL_PIGEON = 818_107_000_000n;    // ~818K PIGEON = 30 SOL
export const INITIAL_VIRTUAL_TOKEN = 1_073_000_000_000_000n; // 1.073B tokens
export const INITIAL_REAL_TOKEN = 793_100_000_000_000n;
export const TOKEN_TOTAL_SUPPLY = 1_000_000_000_000_000n;
export const TOKEN_DECIMALS = 6;
export const PIGEON_DECIMALS = 6;

// Fee structure
export const BURN_FEE_BPS = 150;           // 1.5% burned from every trade
export const TREASURY_FEE_BPS = 50;        // 0.5% to treasury
export const REFERRAL_FEE_BPS = 0;         // 0% referrer (disabled, extra goes to burn)
export const PLATFORM_FEE_BPS = 200;       // 2% total platform fee
export const TOKEN_TRANSFER_FEE_BPS = 50;  // 0.5% transfer fee on every token transfer → treasury
// Post-graduation: Meteora DAMM v2 pool created, LP burned

// ── Quote Assets ──

export type QuoteAssetKey = "pigeon" | "sol" | "skr";

export interface QuoteAssetInfo {
  mint: PublicKey;
  symbol: string;
  icon: string;
  logo: string;
  decimals: number;
  color: string;
  colorClass: string;
  textClass: string;
  tokenProgram: PublicKey;
  reserveEnabled: boolean;
}

export const QUOTE_ASSETS: Record<QuoteAssetKey, QuoteAssetInfo> = {
  pigeon: {
    mint: PIGEON_MINT,
    symbol: "PIGEON",
    icon: "🐦",
    logo: "/tokens/pigeon.png",
    decimals: 6,
    color: "amber",
    colorClass: "bg-amber-500/20",
    textClass: "text-amber-400",
    tokenProgram: TOKEN_2022_PROGRAM_ID,
    reserveEnabled: false,
  },
  sol: {
    mint: SOL_MINT,
    symbol: "SOL",
    icon: "◎",
    logo: "/tokens/sol.png",
    decimals: 9,
    color: "purple",
    colorClass: "bg-purple-500/20",
    textClass: "text-purple-400",
    tokenProgram: TOKEN_PROGRAM_ID,
    reserveEnabled: true,
  },
  skr: {
    mint: SKR_MINT,
    symbol: "SKR",
    icon: "🔮",
    logo: "/tokens/skr.png",
    decimals: 6,
    color: "teal",
    colorClass: "bg-teal-500/20",
    textClass: "text-teal-400",
    tokenProgram: TOKEN_PROGRAM_ID,
    reserveEnabled: true,
  },
};

export function getQuoteAssetByMint(mint: string): QuoteAssetInfo | undefined {
  return Object.values(QUOTE_ASSETS).find(q => q.mint.toBase58() === mint);
}

export function getQuoteKeyByMint(mint: string): QuoteAssetKey | undefined {
  for (const [key, val] of Object.entries(QUOTE_ASSETS)) {
    if (val.mint.toBase58() === mint) return key as QuoteAssetKey;
  }
  return undefined;
}

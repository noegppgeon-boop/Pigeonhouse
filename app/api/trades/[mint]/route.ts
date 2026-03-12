import { rateLimit, getClientIP } from "@/lib/rateLimit";
import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PIGEON_HOUSE_PROGRAM_ID, QUOTE_ASSETS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const HELIUS_KEY = process.env.HELIUS_API_KEY
  || process.env.NEXT_PUBLIC_RPC_URL?.match(/api-key=([^&]+)/)?.[1]
  || "eb49a51b-3242-4758-8de7-db8d9f629e57";

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 15_000;

// All known quote mints
const QUOTE_MINTS = new Set(
  Object.values(QUOTE_ASSETS).map(q => q.mint.toBase58())
);

export async function GET(
  _req: Request,
  { params }: { params: { mint: string } }
) {
  const { ok: rl } = rateLimit(getClientIP(_req));
  if (!rl) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const mint = params.mint;
  const now = Date.now();

  const cached = cache.get(mint);
  if (cached && now - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const mintPubkey = new PublicKey(mint);
    const [bondingCurvePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding_curve"), mintPubkey.toBuffer()],
      PIGEON_HOUSE_PROGRAM_ID
    );
    const bcAddr = bondingCurvePDA.toBase58();

    // Fetch enhanced TXs for the token mint
    const url = `https://api-mainnet.helius-rpc.com/v0/addresses/${mint}/transactions?api-key=${HELIUS_KEY}&limit=100`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Helius ${res.status}`);
    const txs: any[] = await res.json();

    const trades: any[] = [];

    for (const tx of txs) {
      if (!tx.tokenTransfers || tx.tokenTransfers.length === 0) continue;

      let quoteAmount = 0;
      let tokenAmount = 0;
      let type: "buy" | "sell" | null = null;
      let trader = "";
      let quoteMint = "";
      let quoteSymbol = "";

      for (const t of tx.tokenTransfers) {
        const amt = Math.abs(t.tokenAmount || 0);
        if (amt === 0) continue;

        const isQuote = QUOTE_MINTS.has(t.mint);
        const isToken = t.mint === mint;

        // Check if this transfer involves the bonding curve
        const toBC = t.toUserAccount === bcAddr;
        const fromBC = t.fromUserAccount === bcAddr;

        if (isQuote && (toBC || fromBC)) {
          if (toBC && !type) {
            // Quote going TO bonding curve = BUY
            type = "buy";
            quoteAmount = amt;
            trader = t.fromUserAccount || "";
            quoteMint = t.mint;
          } else if (fromBC && !type) {
            // Quote coming FROM bonding curve = SELL
            type = "sell";
            quoteAmount = amt;
            trader = t.toUserAccount || "";
            quoteMint = t.mint;
          }
        }

        if (isToken && (toBC || fromBC)) {
          if (amt > tokenAmount) tokenAmount = amt;
          // Double-check type from token flow
          if (fromBC && !type) {
            type = "buy";
            trader = t.toUserAccount || "";
          } else if (toBC && !type) {
            type = "sell";
            trader = t.fromUserAccount || "";
          }
        }
      }

      if (!type || tokenAmount === 0) continue;

      // Resolve quote symbol
      for (const [key, val] of Object.entries(QUOTE_ASSETS)) {
        if (val.mint.toBase58() === quoteMint) {
          quoteSymbol = val.symbol;
          break;
        }
      }

      const price = tokenAmount > 0 ? quoteAmount / tokenAmount : 0;

      trades.push({
        type,
        signature: tx.signature,
        timestamp: tx.timestamp || 0,
        tokenAmount,
        pigeonAmount: quoteAmount, // keep field name for chart compat
        quoteAmount,
        quoteSymbol: quoteSymbol || "PIGEON",
        price,
        trader,
      });
    }

    const result = { trades, lastUpdated: now };
    cache.set(mint, { data: result, ts: now });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[trades]", err.message?.slice(0, 200));
    return NextResponse.json({ error: err.message, trades: [] }, { status: 500 });
  }
}

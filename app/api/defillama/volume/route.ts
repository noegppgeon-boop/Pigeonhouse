import { NextResponse, NextRequest } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { PIGEON_HOUSE_PROGRAM_ID, QUOTE_ASSETS } from "@/lib/constants";
import { rateLimit, getClientIP } from "@/lib/rateLimit";

const HELIUS_KEY =
  process.env.HELIUS_API_KEY ||
  process.env.NEXT_PUBLIC_RPC_URL?.match(/api-key=([^&]+)/)?.[1] ||
  "";

/**
 * GET /api/defillama/volume
 * Returns 24h volume from on-chain trade events via Helius Enhanced TX API.
 * Public endpoint, 120s cache.
 */
export async function GET(req: NextRequest) {
  const { ok } = rateLimit(`defillama-vol:${getClientIP(req)}`, 60_000, 10);
  if (!ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  try {
    if (!HELIUS_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const programId = PIGEON_HOUSE_PROGRAM_ID.toBase58();
    const url = `https://api-mainnet.helius-rpc.com/v0/addresses/${programId}/transactions?api-key=${HELIUS_KEY}&limit=100`;

    const res = await fetch(url);
    const txs = await res.json();

    if (!Array.isArray(txs)) {
      return NextResponse.json({ error: "Invalid response from Helius" }, { status: 500 });
    }

    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 86400;

    // Quote mint → price USD (from DexScreener)
    const prices: Record<string, number> = {};
    try {
      const pigeonRes = await fetch("https://api.dexscreener.com/latest/dex/tokens/4fSWEw2wbYEUCcMtitzmeGUfqinoafXxkhqZrA9Gpump");
      const pd = await pigeonRes.json();
      if (pd?.pairs?.[0]?.priceUsd) prices["4fSWEw2wbYEUCcMtitzmeGUfqinoafXxkhqZrA9Gpump"] = parseFloat(pd.pairs[0].priceUsd);

      const solRes = await fetch("https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112");
      const sd = await solRes.json();
      if (sd?.pairs?.[0]?.priceUsd) prices["So11111111111111111111111111111111111111112"] = parseFloat(sd.pairs[0].priceUsd);
    } catch {}

    // Parse buy/sell events
    let dailyVolumeUsd = 0;
    let dailyFeesUsd = 0;
    let tradeCount = 0;

    // Known instruction discriminators
    const BUY_DISC = "66063d1201daebea";
    const SELL_DISC = "33e685a4017f83ad";

    for (const tx of txs) {
      if (!tx.timestamp || tx.timestamp < oneDayAgo) continue;

      // Check instructions for buy/sell
      const instructions = tx.instructions || [];
      for (const ix of instructions) {
        if (ix.programId !== programId) continue;

        const data = ix.data || "";
        const isBuy = data.startsWith(BUY_DISC);
        const isSell = data.startsWith(SELL_DISC);

        if (!isBuy && !isSell) continue;
        tradeCount++;

        // Extract volume from token transfers in the transaction
        const tokenTransfers = tx.tokenTransfers || [];
        for (const transfer of tokenTransfers) {
          const mint = transfer.mint;
          if (mint && prices[mint] && transfer.tokenAmount) {
            dailyVolumeUsd += Math.abs(transfer.tokenAmount) * prices[mint];
          }
        }
      }
    }

    // Fees = 2% of volume
    dailyFeesUsd = dailyVolumeUsd * 0.02;
    const dailyBurnUsd = dailyVolumeUsd * 0.015; // 1.5% burn
    const dailyTreasuryUsd = dailyVolumeUsd * 0.005; // 0.5% treasury

    return NextResponse.json(
      {
        dailyVolume: dailyVolumeUsd,
        dailyFees: dailyFeesUsd,
        dailyRevenue: dailyTreasuryUsd,
        dailyBurnValue: dailyBurnUsd,
        tradeCount,
        timestamp: now,
        chain: "solana",
        note: "Volume based on last 100 transactions. Full historical data requires indexer.",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

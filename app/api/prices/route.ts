import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Cache prices for 30s
let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 30_000;

const PIGEON_MINT = "4fSWEw2wbYEUCcMtitzmeGUfqinoafXxkhqZrA9Gpump";
const SOL_MINT = "So11111111111111111111111111111111111111112";
const SKR_MINT = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    // Fetch PIGEON and SOL USD prices from DexScreener
    const [pigeonRes, solRes] = await Promise.all([
      fetch(`https://api.dexscreener.com/latest/dex/tokens/${PIGEON_MINT}`),
      fetch(`https://api.dexscreener.com/latest/dex/tokens/${SOL_MINT}`),
    ]);

    let pigeonUsd = 0;
    let solUsd = 0;
    let skrUsd = 0;

    if (pigeonRes.ok) {
      const d = await pigeonRes.json();
      const pair = d.pairs?.find((p: any) => p.quoteToken?.symbol === "SOL" || p.quoteToken?.address === SOL_MINT);
      if (pair?.priceUsd) pigeonUsd = parseFloat(pair.priceUsd);
    }

    if (solRes.ok) {
      const d = await solRes.json();
      // SOL/USDC pair
      const pair = d.pairs?.find((p: any) =>
        (p.baseToken?.address === SOL_MINT || p.quoteToken?.address === SOL_MINT) &&
        p.priceUsd
      );
      if (pair) {
        solUsd = pair.baseToken?.address === SOL_MINT
          ? parseFloat(pair.priceUsd)
          : 1 / parseFloat(pair.priceUsd);
      }
    }

    // Fallback: derive SOL price from PIGEON pair if needed
    if (solUsd === 0 && pigeonRes.ok) {
      const d = await pigeonRes.json().catch(() => null);
      const pair = d?.pairs?.find((p: any) => p.priceNative && p.priceUsd);
      if (pair) {
        solUsd = parseFloat(pair.priceUsd) / parseFloat(pair.priceNative);
      }
    }

    // SKR — try DexScreener
    try {
      const skrRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${SKR_MINT}`);
      if (skrRes.ok) {
        const d = await skrRes.json();
        if (d.pairs?.[0]?.priceUsd) skrUsd = parseFloat(d.pairs[0].priceUsd);
      }
    } catch {}

    const result = {
      [PIGEON_MINT]: { usd: pigeonUsd },
      [SOL_MINT]: { usd: solUsd },
      [SKR_MINT]: { usd: skrUsd },
      // Convenience aliases
      pigeon: pigeonUsd,
      sol: solUsd,
      skr: skrUsd,
      updatedAt: now,
    };

    cache = { data: result, ts: now };
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message, pigeon: 0, sol: 0, skr: 0 }, { status: 500 });
  }
}

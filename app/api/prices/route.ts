import { NextResponse } from "next/server";
import { rateLimit, getClientIP } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 30_000;

const PIGEON_MINT = "4fSWEw2wbYEUCcMtitzmeGUfqinoafXxkhqZrA9Gpump";
const SOL_MINT = "So11111111111111111111111111111111111111112";
const SKR_MINT = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";

export async function GET(req: Request) {
  const ip = getClientIP(req);
  const rl = rateLimit(`prices:${ip}`, 60_000, 60);
  if (!rl.ok) return NextResponse.json({ error: "rate limited" }, { status: 429 });

  const now = Date.now();
  if (cache && now - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    let pigeonUsd = 0;
    let solUsd = 0;
    let skrUsd = 0;

    // Fetch PIGEON pairs — gives us PIGEON/USD and derived SOL/USD
    const pigeonRes = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${PIGEON_MINT}`
    );

    if (pigeonRes.ok) {
      const d = await pigeonRes.json();
      // Find a SOL-quoted pair with USD price
      const solPair = d.pairs?.find(
        (p: any) =>
          p.quoteToken?.symbol === "SOL" &&
          p.priceUsd &&
          p.priceNative &&
          parseFloat(p.priceNative) > 0
      );
      if (solPair) {
        pigeonUsd = parseFloat(solPair.priceUsd);
        // Derive SOL price: PIGEON_USD / PIGEON_SOL = SOL_USD
        solUsd = pigeonUsd / parseFloat(solPair.priceNative);
      } else {
        // Fallback: any pair with priceUsd
        const anyPair = d.pairs?.find((p: any) => p.priceUsd);
        if (anyPair) pigeonUsd = parseFloat(anyPair.priceUsd);
      }
    }

    // SKR price
    try {
      const skrRes = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${SKR_MINT}`
      );
      if (skrRes.ok) {
        const d = await skrRes.json();
        const pair = d.pairs?.find((p: any) => p.priceUsd);
        if (pair) skrUsd = parseFloat(pair.priceUsd);
      }
    } catch {}

    const result = {
      pigeon: pigeonUsd,
      sol: solUsd,
      skr: skrUsd,
      updatedAt: now,
    };

    cache = { data: result, ts: now };
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message, pigeon: 0, sol: 0, skr: 0 },
      { status: 500 }
    );
  }
}

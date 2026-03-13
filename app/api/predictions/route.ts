import { NextResponse } from "next/server";

const POLY_API = "https://gamma-api.polymarket.com";
const KALSHI_API = "https://api.elections.kalshi.com/trade-api/v2";

interface Signal {
  id: string;
  source: "polymarket" | "kalshi";
  type: "whale_entry" | "volume_spike" | "new_market_heat" | "top_mover";
  title: string;
  description: string;
  volume24h: number;
  volumeTotal: number;
  liquidity: number;
  yesPrice?: number;
  noPrice?: number;
  priceChange24h?: number;
  url: string;
  detectedAt: string;
}

async function getPolymarketSignals(): Promise<Signal[]> {
  const signals: Signal[] = [];

  try {
    // 1. Top volume (whale activity indicator)
    const topVolRes = await fetch(
      `${POLY_API}/markets?limit=30&active=true&closed=false&order=volume24hr&ascending=false`,
      { next: { revalidate: 120 } }
    );
    const topVol = await topVolRes.json();

    for (const m of topVol.slice(0, 30)) {
      const vol24h = parseFloat(m.volume24hr || "0");
      const volTotal = parseFloat(m.volumeClob || "0");
      const liquidity = parseFloat(m.liquidityClob || "0");

      if (vol24h < 5000) continue;

      // Volume spike: 24h volume > 20% of total volume = unusual activity
      const isSpike = volTotal > 0 && vol24h / volTotal > 0.15;
      // Whale entry: high volume + high liquidity ratio
      const isWhale = vol24h > 500000;
      // New market heat: created recently with significant volume
      const startDate = new Date(m.startDate || 0);
      const ageHours = (Date.now() - startDate.getTime()) / (1000 * 60 * 60);
      const isNewHeat = ageHours < 48 && vol24h > 50000;

      let type: Signal["type"] = "top_mover";
      let description = "";

      if (isNewHeat) {
        type = "new_market_heat";
        description = `New market (${Math.round(ageHours)}h old) with $${(vol24h / 1000).toFixed(0)}K volume in 24h`;
      } else if (isSpike) {
        type = "volume_spike";
        description = `Volume spike: $${(vol24h / 1000).toFixed(0)}K in 24h (${((vol24h / volTotal) * 100).toFixed(0)}% of all-time volume)`;
      } else if (isWhale) {
        type = "whale_entry";
        description = `Heavy activity: $${(vol24h / 1000000).toFixed(1)}M traded in 24h`;
      } else {
        description = `$${(vol24h / 1000).toFixed(0)}K volume in 24h`;
      }

      // Parse outcome prices from tokens
      let yesPrice: number | undefined;
      let noPrice: number | undefined;
      try {
        const tokens = JSON.parse(m.clobTokenIds || "[]");
        const prices = JSON.parse(m.outcomePrices || "[]");
        if (prices.length >= 2) {
          yesPrice = parseFloat(prices[0]);
          noPrice = parseFloat(prices[1]);
        }
      } catch {}

      const slug = m.slug || m.conditionId || "";

      signals.push({
        id: m.conditionId || m.id || String(Math.random()),
        source: "polymarket",
        type,
        title: m.question || "Unknown",
        description,
        volume24h: vol24h,
        volumeTotal: volTotal,
        liquidity,
        yesPrice,
        noPrice,
        url: `https://polymarket.com/event/${slug}`,
        detectedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Polymarket fetch error:", err);
  }

  return signals;
}

async function getKalshiSignals(): Promise<Signal[]> {
  const signals: Signal[] = [];

  try {
    const res = await fetch(
      `${KALSHI_API}/markets?limit=50&status=open`,
      { next: { revalidate: 120 } }
    );
    const data = await res.json();
    const markets = data.markets || [];

    for (const m of markets) {
      const vol = m.volume || 0;
      if (vol < 100) continue;

      signals.push({
        id: m.ticker || String(Math.random()),
        source: "kalshi",
        type: vol > 10000 ? "whale_entry" : "top_mover",
        title: m.title || m.subtitle || "Unknown",
        description: `Volume: ${vol} contracts`,
        volume24h: m.volume_24h || 0,
        volumeTotal: vol,
        liquidity: 0,
        yesPrice: m.yes_ask ? m.yes_ask / 100 : undefined,
        noPrice: m.no_ask ? m.no_ask / 100 : undefined,
        url: `https://kalshi.com/markets/${m.ticker}`,
        detectedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Kalshi fetch error:", err);
  }

  return signals;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source"); // polymarket | kalshi | all
  const type = searchParams.get("type"); // whale_entry | volume_spike | new_market_heat | top_mover
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  let signals: Signal[] = [];

  if (!source || source === "all" || source === "polymarket") {
    signals.push(...(await getPolymarketSignals()));
  }
  if (!source || source === "all" || source === "kalshi") {
    signals.push(...(await getKalshiSignals()));
  }

  // Filter by type
  if (type) {
    signals = signals.filter((s) => s.type === type);
  }

  // Sort by volume24h desc
  signals.sort((a, b) => b.volume24h - a.volume24h);

  // Limit
  signals = signals.slice(0, limit);

  // Stats
  const stats = {
    totalSignals: signals.length,
    whaleEntries: signals.filter((s) => s.type === "whale_entry").length,
    volumeSpikes: signals.filter((s) => s.type === "volume_spike").length,
    newMarketHeat: signals.filter((s) => s.type === "new_market_heat").length,
    totalVolume24h: signals.reduce((acc, s) => acc + s.volume24h, 0),
  };

  return NextResponse.json({ signals, stats, updatedAt: new Date().toISOString() });
}

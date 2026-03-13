import { NextResponse } from "next/server";

const POLY_API = "https://gamma-api.polymarket.com";

// Sports/esports noise filter — skip these unless they're truly massive
const SPORTS_KEYWORDS = [
  "vs.", "spread:", "o/u ", "wins by over", "points scored",
  "win on 2026", "win on 2025", "BO3", "BO5",
  // teams
  "knicks", "pacers", "suns", "raptors", "cavaliers", "mavericks",
  "warriors", "rockets", "pistons", "grizzlies", "pelicans", "oilers",
  "kings", "islanders", "timberwolves", "celtics", "lakers", "nets",
];

function isSportsNoise(title: string): boolean {
  const lower = title.toLowerCase();
  return SPORTS_KEYWORDS.some((kw) => lower.includes(kw));
}

interface Signal {
  id: string;
  source: "polymarket" | "kalshi";
  type: "smart_money" | "volume_spike" | "new_gem" | "high_conviction" | "contrarian" | "dormant_revival";
  title: string;
  description: string;
  volume24h: number;
  volumeTotal: number;
  liquidity: number;
  yesPrice?: number;
  noPrice?: number;
  priceChange?: string;
  url: string;
  slug: string;
  tags: string[];
  detectedAt: string;
}

function categorize(title: string): string[] {
  const lower = title.toLowerCase();
  const tags: string[] = [];
  if (lower.includes("fed") || lower.includes("interest rate") || lower.includes("inflation") || lower.includes("gdp") || lower.includes("recession")) tags.push("macro");
  if (lower.includes("iran") || lower.includes("russia") || lower.includes("ukraine") || lower.includes("china") || lower.includes("ceasefire") || lower.includes("strike") || lower.includes("war") || lower.includes("hormuz")) tags.push("geopolitics");
  if (lower.includes("president") || lower.includes("election") || lower.includes("democrat") || lower.includes("republican") || lower.includes("trump") || lower.includes("senate") || lower.includes("congress") || lower.includes("governor") || lower.includes("pope")) tags.push("politics");
  if (lower.includes("bitcoin") || lower.includes("ethereum") || lower.includes("crypto") || lower.includes("solana") || lower.includes("token")) tags.push("crypto");
  if (lower.includes("elon") || lower.includes("musk") || lower.includes("tweet")) tags.push("musk");
  if (lower.includes("ai") || lower.includes("openai") || lower.includes("google") || lower.includes("tesla") || lower.includes("apple") || lower.includes("nvidia")) tags.push("tech");
  if (lower.includes("regime") || lower.includes("coup") || lower.includes("sanctions")) tags.push("blackswan");
  if (tags.length === 0) tags.push("other");
  return tags;
}

async function fetchPolymarketSignals(): Promise<Signal[]> {
  const signals: Signal[] = [];

  try {
    // Fetch top 100 markets by 24h volume
    const res = await fetch(
      `${POLY_API}/markets?limit=100&active=true&closed=false&order=volume24hr&ascending=false`,
      { next: { revalidate: 60 } } // Cache 1 min
    );
    const markets = await res.json();

    const now = Date.now();

    for (const m of markets) {
      const vol24h = parseFloat(m.volume24hr || "0");
      const volTotal = parseFloat(m.volumeClob || "0");
      const liquidity = parseFloat(m.liquidityClob || "0");
      const question = m.question || "";

      if (vol24h < 5000) continue;

      // Filter sports noise (allow if >$5M volume — truly massive)
      if (isSportsNoise(question) && vol24h < 5_000_000) continue;

      // Parse prices
      let yesPrice: number | undefined;
      let noPrice: number | undefined;
      try {
        const prices = JSON.parse(m.outcomePrices || "[]");
        if (prices.length >= 2) {
          yesPrice = parseFloat(prices[0]);
          noPrice = parseFloat(prices[1]);
        }
      } catch {}

      // Age
      const startDate = new Date(m.startDate || 0);
      const ageHours = (now - startDate.getTime()) / (1000 * 60 * 60);

      // Volume ratio (24h vs all-time)
      const volRatio = volTotal > 0 ? vol24h / volTotal : 0;

      // Determine signal type
      let type: Signal["type"] = "smart_money";
      let description = "";

      // 1. CONTRARIAN: Big volume on extreme underdog (<10% or >90%) but NOT settled
      if (yesPrice !== undefined && vol24h > 100_000) {
        const isExtreme = yesPrice < 0.10 || yesPrice > 0.90;
        const isContrarian = (yesPrice < 0.15 && yesPrice > 0.02) || (yesPrice > 0.85 && yesPrice < 0.98);
        if (isContrarian && volRatio > 0.1) {
          type = "contrarian";
          const side = yesPrice < 0.5 ? "YES" : "NO";
          const odds = yesPrice < 0.5 ? yesPrice : (1 - yesPrice);
          description = `${side} side getting action at ${(odds * 100).toFixed(0)}¢ — smart money or degen? $${(vol24h / 1000).toFixed(0)}K in 24h`;
        } else if (isExtreme && !isContrarian) {
          type = "high_conviction";
          description = `Market near-settled at ${(yesPrice * 100).toFixed(0)}¢ YES — $${(vol24h / 1000).toFixed(0)}K still flowing`;
        }
      }

      // 2. NEW GEM: <72h old with significant volume
      if (ageHours < 72 && vol24h > 50_000 && type === "smart_money") {
        type = "new_gem";
        description = `${Math.round(ageHours)}h old, already $${(vol24h / 1000).toFixed(0)}K volume — early mover opportunity`;
      }

      // 3. DORMANT REVIVAL: low previous activity, sudden 24h spike
      if (volRatio > 0.30 && volTotal > 50_000 && ageHours > 168 && type === "smart_money") {
        type = "dormant_revival";
        description = `Dormant market woke up — ${(volRatio * 100).toFixed(0)}% of all-time volume in 24h ($${(vol24h / 1000).toFixed(0)}K)`;
      }

      // 4. VOLUME SPIKE: >20% of total in 24h
      if (volRatio > 0.20 && vol24h > 200_000 && type === "smart_money") {
        type = "volume_spike";
        description = `${(volRatio * 100).toFixed(0)}% of all-time volume in 24h — something brewing`;
      }

      // 5. SMART MONEY: high volume, normal pattern
      if (type === "smart_money") {
        if (vol24h >= 1_000_000) {
          description = `$${(vol24h / 1_000_000).toFixed(1)}M in 24h — heavy flow, institutional-level interest`;
        } else {
          description = `$${(vol24h / 1000).toFixed(0)}K in 24h — active market`;
        }
      }

      const slug = m.slug || m.conditionId || "";
      const tags = categorize(question);

      signals.push({
        id: m.conditionId || m.id || String(Math.random()),
        source: "polymarket",
        type,
        title: question,
        description,
        volume24h: vol24h,
        volumeTotal: volTotal,
        liquidity,
        yesPrice,
        noPrice,
        url: `https://polymarket.com/event/${slug}`,
        slug,
        tags,
        detectedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Polymarket fetch error:", err);
  }

  return signals;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const tag = searchParams.get("tag");
  const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 100);
  const minVol = parseFloat(searchParams.get("minVol") || "0");

  let signals = await fetchPolymarketSignals();

  // Filters
  if (type && type !== "all") {
    signals = signals.filter((s) => s.type === type);
  }
  if (tag && tag !== "all") {
    signals = signals.filter((s) => s.tags.includes(tag));
  }
  if (minVol > 0) {
    signals = signals.filter((s) => s.volume24h >= minVol);
  }

  // Sort: gems first (contrarian > new_gem > dormant_revival > volume_spike > smart_money), then by volume
  const typePriority: Record<string, number> = {
    contrarian: 0, new_gem: 1, dormant_revival: 2, volume_spike: 3, high_conviction: 4, smart_money: 5,
  };
  signals.sort((a, b) => {
    const pa = typePriority[a.type] ?? 99;
    const pb = typePriority[b.type] ?? 99;
    if (pa !== pb) return pa - pb;
    return b.volume24h - a.volume24h;
  });

  signals = signals.slice(0, limit);

  const stats = {
    totalSignals: signals.length,
    contrarian: signals.filter((s) => s.type === "contrarian").length,
    newGems: signals.filter((s) => s.type === "new_gem").length,
    dormantRevival: signals.filter((s) => s.type === "dormant_revival").length,
    volumeSpikes: signals.filter((s) => s.type === "volume_spike").length,
    smartMoney: signals.filter((s) => s.type === "smart_money").length,
    highConviction: signals.filter((s) => s.type === "high_conviction").length,
    totalVolume24h: signals.reduce((acc, s) => acc + s.volume24h, 0),
    uniqueTags: [...new Set(signals.flatMap((s) => s.tags))],
  };

  return NextResponse.json({ signals, stats, updatedAt: new Date().toISOString() });
}

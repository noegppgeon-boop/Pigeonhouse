"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Zap, Flame, BarChart3, ExternalLink, RefreshCw, Filter } from "lucide-react";

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
  url: string;
  detectedAt: string;
}

interface PredictionData {
  signals: Signal[];
  stats: {
    totalSignals: number;
    whaleEntries: number;
    volumeSpikes: number;
    newMarketHeat: number;
    totalVolume24h: number;
  };
  updatedAt: string;
}

const TYPE_CONFIG = {
  whale_entry: { icon: "🐋", label: "Whale Entry", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  volume_spike: { icon: "📈", label: "Volume Spike", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  new_market_heat: { icon: "🔥", label: "New & Hot", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  top_mover: { icon: "⚡", label: "Top Mover", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
};

function formatUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function PriceBar({ yes, no }: { yes?: number; no?: number }) {
  if (yes === undefined) return null;
  const yPct = Math.round((yes || 0) * 100);
  return (
    <div className="flex items-center gap-2 text-xs mt-2">
      <span className="text-green-400 font-mono">{yPct}¢ YES</span>
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full bg-green-500 rounded-full" style={{ width: `${yPct}%` }} />
      </div>
      <span className="text-red-400 font-mono">{100 - yPct}¢ NO</span>
    </div>
  );
}

export default function PredictionsPage() {
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [source, setSource] = useState<string>("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (source !== "all") params.set("source", source);
      if (filter !== "all") params.set("type", filter);
      const res = await fetch(`/api/predictions?${params}`);
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filter, source]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-purple-400" />
            Prediction Market Signals
          </h1>
          <p className="text-white/50 mt-2">
            Real-time signals from Polymarket & Kalshi — whale entries, volume spikes, and hot new markets
          </p>
        </div>

        {/* Stats */}
        {data?.stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: "Total Signals", value: data.stats.totalSignals, icon: <Zap className="w-4 h-4" /> },
              { label: "Whale Entries", value: data.stats.whaleEntries, icon: <span>🐋</span> },
              { label: "Volume Spikes", value: data.stats.volumeSpikes, icon: <TrendingUp className="w-4 h-4" /> },
              { label: "New & Hot", value: data.stats.newMarketHeat, icon: <Flame className="w-4 h-4" /> },
              { label: "24h Volume", value: formatUSD(data.stats.totalVolume24h), icon: <BarChart3 className="w-4 h-4" /> },
            ].map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-white/40 text-xs mb-1">
                  {s.icon} {s.label}
                </div>
                <div className="text-lg font-bold">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-1 text-white/40 text-sm">
            <Filter className="w-4 h-4" /> Filter:
          </div>
          {["all", "whale_entry", "volume_spike", "new_market_heat", "top_mover"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                filter === f
                  ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                  : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
              }`}
            >
              {f === "all" ? "All" : TYPE_CONFIG[f as keyof typeof TYPE_CONFIG]?.label}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            {["all", "polymarket", "kalshi"].map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                  source === s
                    ? "bg-white/15 border-white/30 text-white"
                    : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                }`}
              >
                {s === "all" ? "All Sources" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
            <button onClick={fetchData} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10">
              <RefreshCw className={`w-4 h-4 text-white/50 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Signals */}
        <div className="space-y-3">
          {loading && !data ? (
            <div className="text-center text-white/30 py-20">Loading signals...</div>
          ) : data?.signals.length === 0 ? (
            <div className="text-center text-white/30 py-20">No signals found</div>
          ) : (
            data?.signals.map((signal) => {
              const cfg = TYPE_CONFIG[signal.type];
              return (
                <a
                  key={signal.id}
                  href={signal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block border rounded-xl p-4 hover:bg-white/5 transition-all ${cfg.bg}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                        <span className="text-xs text-white/30 uppercase">{signal.source}</span>
                      </div>
                      <h3 className="font-semibold text-white/90">{signal.title}</h3>
                      <p className="text-sm text-white/40 mt-1">{signal.description}</p>
                      <PriceBar yes={signal.yesPrice} no={signal.noPrice} />
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-white/80">{formatUSD(signal.volume24h)}</div>
                      <div className="text-xs text-white/30">24h volume</div>
                      {signal.liquidity > 0 && (
                        <div className="text-xs text-white/20 mt-1">{formatUSD(signal.liquidity)} liq</div>
                      )}
                      <ExternalLink className="w-3 h-3 text-white/20 mt-2 ml-auto" />
                    </div>
                  </div>
                </a>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-white/20 text-xs mt-8">
          Data from Polymarket & Kalshi public APIs • Refreshed every 2 min • Not financial advice
          {data?.updatedAt && (
            <span> • Updated: {new Date(data.updatedAt).toLocaleTimeString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}

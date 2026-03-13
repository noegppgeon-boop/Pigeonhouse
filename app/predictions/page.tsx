"use client";

import { useState, useEffect, useCallback } from "react";

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
  url: string;
  slug: string;
  tags: string[];
  detectedAt: string;
}

interface PredictionData {
  signals: Signal[];
  stats: {
    totalSignals: number;
    contrarian: number;
    newGems: number;
    dormantRevival: number;
    volumeSpikes: number;
    smartMoney: number;
    highConviction: number;
    totalVolume24h: number;
    uniqueTags: string[];
  };
  updatedAt: string;
}

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  contrarian: { icon: "🎯", label: "Contrarian", color: "text-[var(--crimson)]" },
  new_gem: { icon: "💎", label: "New Gem", color: "text-[var(--teal)]" },
  dormant_revival: { icon: "👻", label: "Dormant Revival", color: "text-[var(--bronze)]" },
  volume_spike: { icon: "📈", label: "Volume Spike", color: "text-[var(--crimson-muted)]" },
  high_conviction: { icon: "🔒", label: "Near-Settled", color: "text-txt-secondary" },
  smart_money: { icon: "🐋", label: "Smart Money", color: "text-txt-secondary" },
};

const TAG_CONFIG: Record<string, { icon: string; label: string }> = {
  macro: { icon: "📊", label: "Macro" },
  geopolitics: { icon: "🌍", label: "Geopolitics" },
  politics: { icon: "🏛️", label: "Politics" },
  crypto: { icon: "₿", label: "Crypto" },
  tech: { icon: "🤖", label: "Tech" },
  musk: { icon: "🚀", label: "Musk" },
  blackswan: { icon: "🦢", label: "Black Swan" },
  other: { icon: "📌", label: "Other" },
};

function formatUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function PriceBar({ yes }: { yes?: number }) {
  if (yes === undefined) return null;
  const yPct = Math.round(yes * 100);
  const isYesFavored = yPct > 50;
  return (
    <div className="flex items-center gap-2 text-[11px] mt-2.5">
      <span className={`font-mono font-medium ${isYesFavored ? "text-[var(--teal)]" : "text-txt-muted"}`}>{yPct}¢</span>
      <div className="flex-1 h-[5px] rounded-full bg-[var(--bg-elevated)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${yPct}%`, background: isYesFavored ? "var(--teal)" : "var(--crimson)" }}
        />
      </div>
      <span className={`font-mono font-medium ${!isYesFavored ? "text-[var(--crimson)]" : "text-txt-muted"}`}>{100 - yPct}¢</span>
    </div>
  );
}

export default function PredictionsPage() {
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [tag, setTag] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "40" });
      if (filter !== "all") params.set("type", filter);
      if (tag !== "all") params.set("tag", tag);
      const res = await fetch(`/api/predictions?${params}`);
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [filter, tag]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 60s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="font-lore text-[22px] sm:text-[26px] font-bold text-txt flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--crimson)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Prediction Signals
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                autoRefresh ? "bg-[var(--teal-dim)] border-[var(--teal)] text-[var(--teal)]" : "bg-[var(--bg-card)] border-[var(--border)] text-txt-muted"
              }`}
            >
              {autoRefresh ? "● LIVE" : "○ PAUSED"}
            </button>
            <button
              onClick={() => { setLoading(true); fetchData(); }}
              className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-2)] transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`text-txt-muted ${loading ? "animate-spin" : ""}`}>
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-[12px] text-txt-secondary mt-1">
          Contrarian bets, dormant revivals, new gems — filtered from Polymarket. Sports noise removed. Auto-refreshes every 60s.
        </p>
      </div>

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { icon: "🎯", label: "Contrarian", value: data.stats.contrarian },
            { icon: "💎", label: "New Gems", value: data.stats.newGems },
            { icon: "👻", label: "Revivals", value: data.stats.dormantRevival },
            { icon: "📈", label: "Spikes", value: data.stats.volumeSpikes },
            { icon: "🐋", label: "Smart Money", value: data.stats.smartMoney },
            { icon: "🔒", label: "Settled", value: data.stats.highConviction },
            { icon: "💰", label: "24h Vol", value: formatUSD(data.stats.totalVolume24h) },
          ].map((s, i) => (
            <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-txt-muted">{s.icon} {s.label}</div>
              <div className="font-lore text-[15px] font-bold text-txt">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters: Signal Type */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] text-txt-muted mr-1">Signal:</span>
        {["all", "contrarian", "new_gem", "dormant_revival", "volume_spike", "smart_money", "high_conviction"].map((f) => {
          const cfg = f !== "all" ? TYPE_CONFIG[f] : null;
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-lg text-[11px] border transition-all ${
                filter === f
                  ? "bg-[var(--crimson-dim)] border-[var(--crimson)] text-[var(--crimson)] font-medium"
                  : "bg-[var(--bg-card)] border-[var(--border)] text-txt-muted hover:border-[var(--border-2)]"
              }`}
            >
              {f === "all" ? "All" : `${cfg?.icon} ${cfg?.label}`}
            </button>
          );
        })}
      </div>

      {/* Filters: Category Tags */}
      {data?.stats?.uniqueTags && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-txt-muted mr-1">Category:</span>
          {["all", ...data.stats.uniqueTags.sort()].map((t) => {
            const cfg = t !== "all" ? TAG_CONFIG[t] || { icon: "📌", label: t } : null;
            return (
              <button key={t} onClick={() => setTag(t)}
                className={`px-2.5 py-1 rounded-lg text-[11px] border transition-all ${
                  tag === t
                    ? "bg-[var(--bg-elevated)] border-[var(--border-2)] text-txt font-medium"
                    : "bg-[var(--bg-card)] border-[var(--border)] text-txt-muted hover:border-[var(--border-2)]"
                }`}
              >
                {t === "all" ? "All" : `${cfg?.icon} ${cfg?.label}`}
              </button>
            );
          })}
        </div>
      )}

      {/* Signal List */}
      <div className="space-y-2">
        {loading && !data ? (
          <div className="text-center text-txt-muted py-16 text-[13px]">Loading signals...</div>
        ) : data?.signals.length === 0 ? (
          <div className="text-center text-txt-muted py-16 text-[13px]">No signals match your filters</div>
        ) : (
          data?.signals.map((signal) => {
            const cfg = TYPE_CONFIG[signal.type] || TYPE_CONFIG.smart_money;
            return (
              <div
                key={signal.id}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--border-2)] hover:bg-[var(--bg-elevated)] transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border border-[var(--border)] font-medium ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {signal.tags.map((t) => {
                        const tc = TAG_CONFIG[t];
                        return tc ? (
                          <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--bg-elevated)] text-txt-muted">
                            {tc.icon} {tc.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                    <h3 className="font-lore text-[14px] font-semibold text-txt leading-snug">
                      {signal.title}
                    </h3>
                    <p className="text-[12px] text-txt-secondary mt-1">{signal.description}</p>
                    <PriceBar yes={signal.yesPrice} />
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <div className="font-lore text-[16px] font-bold text-txt">{formatUSD(signal.volume24h)}</div>
                    <div className="text-[10px] text-txt-muted">24h vol</div>
                    {signal.liquidity > 0 && (
                      <div className="text-[10px] text-txt-muted">{formatUSD(signal.liquidity)} liq</div>
                    )}
                    <a
                      href={signal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 px-3 py-1 rounded-lg text-[10px] font-medium border border-[var(--crimson)] text-[var(--crimson)] bg-[var(--crimson-dim)] hover:bg-[var(--crimson)] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      Trade →
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="text-center space-y-1 pt-2">
        <p className="text-[10px] text-txt-muted">
          Data from Polymarket public API · Sports noise filtered · Auto-refresh {autoRefresh ? "on" : "off"} · Not financial advice
        </p>
        {data?.updatedAt && (
          <p className="text-[10px] text-txt-disabled">
            Last update: {new Date(data.updatedAt).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}

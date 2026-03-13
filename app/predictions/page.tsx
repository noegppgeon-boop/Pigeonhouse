"use client";

import { useState, useEffect } from "react";

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
  whale_entry: { icon: "🐋", label: "Whale Entry", color: "text-[var(--teal)]", border: "border-[var(--teal)]/20", bg: "bg-[var(--teal-dim)]" },
  volume_spike: { icon: "📈", label: "Volume Spike", color: "text-[var(--bronze)]", border: "border-[var(--bronze)]/20", bg: "bg-[var(--bronze-dim)]" },
  new_market_heat: { icon: "🔥", label: "New & Hot", color: "text-[var(--crimson)]", border: "border-[var(--crimson)]/20", bg: "bg-[var(--crimson-dim)]" },
  top_mover: { icon: "⚡", label: "Top Mover", color: "text-txt-secondary", border: "border-[var(--border)]", bg: "bg-[var(--bg-card)]" },
};

function formatUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function PriceBar({ yes }: { yes?: number }) {
  if (yes === undefined) return null;
  const yPct = Math.round(yes * 100);
  return (
    <div className="flex items-center gap-2 text-[11px] mt-2.5">
      <span className="font-mono text-[var(--teal)] font-medium">{yPct}¢ YES</span>
      <div className="flex-1 h-[5px] rounded-full bg-[var(--bg-elevated)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${yPct}%`, background: yPct > 50 ? "var(--teal)" : "var(--crimson)" }}
        />
      </div>
      <span className="font-mono text-[var(--crimson)] font-medium">{100 - yPct}¢ NO</span>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 text-center">
      <div className="text-[11px] text-txt-muted mb-0.5">{icon} {label}</div>
      <div className="font-lore text-lg font-bold text-txt">{value}</div>
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
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-lore text-[22px] sm:text-[26px] font-bold text-txt flex items-center gap-2.5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--crimson)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Prediction Signals
        </h1>
        <p className="text-[13px] text-txt-secondary mt-1">
          Real-time signals from Polymarket & Kalshi — whale entries, volume spikes, and hot new markets.
        </p>
      </div>

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
          <StatCard icon="📊" label="Signals" value={data.stats.totalSignals} />
          <StatCard icon="🐋" label="Whales" value={data.stats.whaleEntries} />
          <StatCard icon="📈" label="Spikes" value={data.stats.volumeSpikes} />
          <StatCard icon="🔥" label="New & Hot" value={data.stats.newMarketHeat} />
          <StatCard icon="💰" label="24h Volume" value={formatUSD(data.stats.totalVolume24h)} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {["all", "whale_entry", "volume_spike", "new_market_heat", "top_mover"].map((f) => {
          const active = filter === f;
          const cfg = f !== "all" ? TYPE_CONFIG[f as keyof typeof TYPE_CONFIG] : null;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[12px] border transition-all font-medium ${
                active
                  ? "bg-[var(--crimson-dim)] border-[var(--crimson)] text-[var(--crimson)]"
                  : "bg-[var(--bg-card)] border-[var(--border)] text-txt-secondary hover:border-[var(--border-2)]"
              }`}
            >
              {f === "all" ? "All" : `${cfg?.icon} ${cfg?.label}`}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          {["all", "polymarket", "kalshi"].map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] border transition-all ${
                source === s
                  ? "bg-[var(--bg-elevated)] border-[var(--border-2)] text-txt font-medium"
                  : "bg-[var(--bg-card)] border-[var(--border)] text-txt-muted hover:text-txt-secondary"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <button
            onClick={fetchData}
            className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-2)] transition-all"
            title="Refresh"
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`text-txt-muted ${loading ? "animate-spin" : ""}`}
            >
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Signal List */}
      <div className="space-y-2">
        {loading && !data ? (
          <div className="text-center text-txt-muted py-16 text-[13px]">Loading signals...</div>
        ) : data?.signals.length === 0 ? (
          <div className="text-center text-txt-muted py-16 text-[13px]">No signals found</div>
        ) : (
          data?.signals.map((signal) => {
            const cfg = TYPE_CONFIG[signal.type];
            return (
              <a
                key={signal.id}
                href={signal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--border-2)] hover:bg-[var(--bg-elevated)] transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${cfg.color} ${cfg.border} ${cfg.bg}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      <span className="text-[10px] text-txt-muted uppercase tracking-wide">{signal.source}</span>
                    </div>
                    <h3 className="font-lore text-[14px] font-semibold text-txt leading-snug group-hover:text-[var(--crimson)] transition-colors">
                      {signal.title}
                    </h3>
                    <p className="text-[12px] text-txt-secondary mt-1">{signal.description}</p>
                    <PriceBar yes={signal.yesPrice} />
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-lore text-[16px] font-bold text-txt">{formatUSD(signal.volume24h)}</div>
                    <div className="text-[10px] text-txt-muted">24h vol</div>
                    {signal.liquidity > 0 && (
                      <div className="text-[10px] text-txt-muted mt-0.5">{formatUSD(signal.liquidity)} liq</div>
                    )}
                    <svg
                      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="text-txt-muted mt-2 ml-auto opacity-0 group-hover:opacity-60 transition-opacity"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </div>
                </div>
              </a>
            );
          })
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-[10px] text-txt-muted pt-2">
        Data from Polymarket & Kalshi public APIs · Refreshed every 2 min · Not financial advice
        {data?.updatedAt && (
          <> · {new Date(data.updatedAt).toLocaleTimeString()}</>
        )}
      </p>
    </div>
  );
}

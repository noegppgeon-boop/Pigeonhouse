"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight, Zap, ExternalLink } from "lucide-react";
import { EMPTY_STATES, LOADING_STATES } from "@/lib/lore";

interface Trade {
  type: "buy" | "sell";
  signature: string;
  timestamp: number;
  tokenAmount: number;
  pigeonAmount: number;
  slot: number;
}

export default function RecentTrades({ mint }: { mint: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/trades/${mint}`);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setTrades(data.trades || []);
      } catch { setTrades([]); }
      finally { setLoading(false); }
    }
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [mint]);

  function timeAgo(ts: number) {
    const diff = Math.floor(Date.now() / 1000 - ts);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  }

  function fmtAmount(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toFixed(0);
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[12px] font-semibold text-txt-secondary flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-teal" />
          <span>Recent Trades</span>
          <span className="font-lore italic text-txt-muted text-[11px] font-normal hidden sm:inline">— live feed</span>
        </h3>
        {trades.length > 0 && (
          <span className="text-[10px] text-txt-muted">{trades.length} trades</span>
        )}
      </div>

      {loading ? (
        <div className="py-8 text-center">
          <div className="animate-spin h-4 w-4 border-2 border-crimson border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-[11px] text-txt-muted font-lore italic">{LOADING_STATES.trades}</p>
        </div>
      ) : trades.length === 0 ? (
        <div className="py-8 text-center">
          <Zap className="h-4 w-4 text-txt-muted mx-auto mb-2" />
          <p className="text-[12px] text-txt-secondary font-medium">{EMPTY_STATES.noTrades.text}</p>
          <p className="text-[10px] text-txt-muted font-lore italic mt-0.5">{EMPTY_STATES.noTrades.lore}</p>
        </div>
      ) : (
        <div className="space-y-0">
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-1.5 text-[10px] text-txt-muted uppercase tracking-wider font-semibold border-b border-[var(--border)]">
            <span className="w-12">Type</span>
            <span className="flex-1 text-right">Amount</span>
            <span className="w-16 text-right">PIGEON</span>
            <span className="w-10 text-right">Age</span>
            <span className="w-6" />
          </div>
          {trades.slice(0, 20).map((t, i) => (
            <div
              key={t.signature}
              className={`flex items-center justify-between px-2 py-2 text-[11px] border-b border-[var(--border)] last:border-0 hover:bg-bg-elevated/50 transition-colors ${i === 0 ? "animate-event-highlight" : ""}`}
              style={i < 3 ? { animationDelay: `${i * 100}ms` } : undefined}
            >
              {/* Type */}
              <div className="w-12 flex items-center gap-1">
                {t.type === "buy" ? (
                  <>
                    <ArrowUpRight className="h-3 w-3 text-green" />
                    <span className="font-semibold text-green">BUY</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-3 w-3 text-crimson" />
                    <span className="font-semibold text-crimson">SELL</span>
                  </>
                )}
              </div>
              {/* Token amount */}
              <span className="flex-1 text-right font-mono text-txt-secondary">
                {t.tokenAmount > 0 ? fmtAmount(t.tokenAmount) : "—"}
              </span>
              {/* PIGEON */}
              <span className="w-16 text-right font-mono text-txt-muted">
                {t.pigeonAmount > 0 ? fmtAmount(t.pigeonAmount) : "—"}
              </span>
              {/* Time */}
              <span className="w-10 text-right text-txt-muted">
                {t.timestamp ? timeAgo(t.timestamp) : "—"}
              </span>
              {/* Explorer */}
              <a href={`https://solscan.io/tx/${t.signature}`} target="_blank" rel="noopener noreferrer"
                className="w-6 flex justify-end text-txt-muted hover:text-teal transition-colors">
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

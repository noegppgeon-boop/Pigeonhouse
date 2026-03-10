"use client";

import { BarChart3 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

interface Trade {
  type: "buy" | "sell";
  signature: string;
  timestamp: number;
  tokenAmount: number;
  pigeonAmount: number;
  price: number;
}

interface Candle {
  time: number;
  o: number;
  h: number;
  l: number;
  c: number;
  green: boolean;
  volume: number;
}

type Timeframe = "1M" | "5M" | "15M" | "1H" | "4H";

const TF_SECONDS: Record<Timeframe, number> = {
  "1M": 60, "5M": 300, "15M": 900, "1H": 3600, "4H": 14400,
};

function buildCandles(trades: Trade[], tfSec: number): Candle[] {
  if (!trades.length) return [];
  const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp);
  const buckets = new Map<number, Trade[]>();
  for (const t of sorted) {
    if (!t.timestamp || !t.price) continue;
    const bucket = Math.floor(t.timestamp / tfSec) * tfSec;
    if (!buckets.has(bucket)) buckets.set(bucket, []);
    buckets.get(bucket)!.push(t);
  }
  const candles: Candle[] = [];
  const keys = [...buckets.keys()].sort((a, b) => a - b);
  for (const k of keys) {
    const group = buckets.get(k)!;
    const prices = group.map((t) => t.price);
    const o = prices[0];
    const c = prices[prices.length - 1];
    candles.push({ time: k, o, h: Math.max(...prices), l: Math.min(...prices), c, green: c >= o, volume: group.reduce((s, t) => s + t.pigeonAmount, 0) });
  }
  if (candles.length >= 2) {
    const filled: Candle[] = [candles[0]];
    for (let i = 1; i < candles.length; i++) {
      const prev = candles[i - 1];
      const curr = candles[i];
      let t = prev.time + tfSec;
      while (t < curr.time) {
        filled.push({ time: t, o: prev.c, h: prev.c, l: prev.c, c: prev.c, green: true, volume: 0 });
        t += tfSec;
      }
      filled.push(curr);
    }
    return filled.slice(-60);
  }
  return candles;
}

export default function ChartArea({ mint }: { mint?: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [tf, setTf] = useState<Timeframe>("5M");

  useEffect(() => {
    if (!mint) { setLoading(false); return; }
    async function load() {
      try {
        const res = await fetch(`/api/trades/${mint}`);
        if (!res.ok) throw new Error("err");
        const data = await res.json();
        setTrades(data.trades || []);
      } catch { setTrades([]); }
      finally { setLoading(false); }
    }
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [mint]);

  const candles = useMemo(() => buildCandles(trades, TF_SECONDS[tf]), [trades, tf]);

  const svgW = 560, svgH = 220;
  const padL = 0, padR = 0, padT = 10, padB = 20;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;

  const prices = candles.flatMap((c) => [c.h, c.l]);
  const minP = prices.length ? Math.min(...prices) * 0.98 : 0;
  const maxP = prices.length ? Math.max(...prices) * 1.02 : 1;
  const range = maxP - minP || 1;
  const scaleY = (v: number) => padT + chartH - ((v - minP) / range) * chartH;

  const barW = candles.length > 0 ? Math.min(20, (chartW / candles.length) * 0.7) : 10;
  const gap = candles.length > 1 ? (chartW - candles.length * barW) / (candles.length - 1) : 0;

  const useLine = candles.length <= 2 && trades.length > 1;
  const sortedTrades = useMemo(() => {
    if (!useLine) return [];
    return [...trades].filter((t) => t.timestamp && t.price).sort((a, b) => a.timestamp - b.timestamp);
  }, [useLine, trades]);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[12px] font-semibold text-txt-secondary flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-bronze" />
          <span>Price Chart</span>
          <span className="font-lore italic text-txt-muted text-[11px] font-normal hidden sm:inline">— the flame&apos;s path</span>
        </h3>
        <div className="flex gap-0.5 bg-bg-elevated rounded-md p-0.5">
          {(["1M", "5M", "15M", "1H", "4H"] as Timeframe[]).map((t) => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                tf === t
                  ? "bg-bg-card text-txt shadow-sm"
                  : "text-txt-muted hover:text-txt-secondary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-56 flex items-center justify-center">
          <div className="animate-spin h-5 w-5 border-2 border-crimson border-t-transparent rounded-full" />
        </div>
      ) : candles.length === 0 && !useLine ? (
        <div className="h-56 flex flex-col items-center justify-center">
          <BarChart3 className="h-5 w-5 text-txt-muted mb-2" />
          <p className="text-[12px] text-txt-secondary font-medium">Awaiting first trade</p>
          <p className="text-[10px] text-txt-muted font-lore italic mt-0.5">The chart awakens with the first offering</p>
        </div>
      ) : (
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-56" preserveAspectRatio="xMidYMid meet">
          {/* Grid */}
          {[0.25, 0.5, 0.75].map((pct) => (
            <line key={pct} x1={padL} y1={padT + chartH * pct} x2={svgW - padR} y2={padT + chartH * pct}
              stroke="var(--border)" strokeDasharray="4 4" opacity={0.5} />
          ))}
          {/* Price labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const val = maxP - pct * range;
            return (
              <text key={pct} x={svgW - 2} y={padT + chartH * pct - 2} textAnchor="end"
                fill="var(--text-tertiary)" fontSize="8" fontFamily="monospace">
                {val < 0.001 ? val.toExponential(2) : val.toFixed(val < 1 ? 6 : 2)}
              </text>
            );
          })}

          {useLine ? (
            <>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1A7A6D" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#1A7A6D" stopOpacity="0" />
                </linearGradient>
              </defs>
              {(() => {
                const pts = sortedTrades.map((t, i) => {
                  const x = padL + (i / (sortedTrades.length - 1)) * chartW;
                  return `${x},${scaleY(t.price)}`;
                });
                const areaPath = `M${pts[0]} ${pts.map(p => `L${p}`).join(" ")} L${padL + chartW},${padT + chartH} L${padL},${padT + chartH} Z`;
                return (
                  <>
                    <path d={areaPath} fill="url(#lineGrad)" />
                    <polyline points={pts.join(" ")} fill="none" stroke="#1A7A6D" strokeWidth="2" strokeLinejoin="round" />
                    {sortedTrades.map((t, i) => (
                      <circle key={i} cx={padL + (i / (sortedTrades.length - 1)) * chartW} cy={scaleY(t.price)} r="3"
                        fill={t.type === "buy" ? "#2D7A4F" : "#B33A3A"} />
                    ))}
                  </>
                );
              })()}
            </>
          ) : (
            candles.map((c, i) => {
              const x = padL + i * (barW + gap);
              const wickX = x + barW / 2;
              const bodyTop = scaleY(Math.max(c.o, c.c));
              const bodyBot = scaleY(Math.min(c.o, c.c));
              const color = c.green ? "#2D7A4F" : "#B33A3A";
              return (
                <g key={i}>
                  <line x1={wickX} y1={scaleY(c.h)} x2={wickX} y2={scaleY(c.l)} stroke={color} strokeWidth={1.5} />
                  <rect x={x + barW * 0.15} y={bodyTop} width={barW * 0.7} height={Math.max(bodyBot - bodyTop, 1.5)} fill={color} rx={1.5} />
                </g>
              );
            })
          )}

          {/* Current price line */}
          {candles.length > 0 && (
            <line x1={padL} y1={scaleY(candles[candles.length - 1].c)} x2={svgW - padR} y2={scaleY(candles[candles.length - 1].c)}
              stroke="#A67C52" strokeWidth={0.8} strokeDasharray="3 3" opacity={0.7} />
          )}
        </svg>
      )}
    </div>
  );
}

"use client";

import { BarChart3 } from "lucide-react";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";

/* ── Types ── */
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
  volume: number;
  tradeCount: number;
}

type Timeframe = "1M" | "5M" | "15M" | "1H" | "4H";

const TF_SECONDS: Record<Timeframe, number> = {
  "1M": 60,
  "5M": 300,
  "15M": 900,
  "1H": 3600,
  "4H": 14400,
};

const TF_LABELS: Record<Timeframe, string> = {
  "1M": "1m",
  "5M": "5m",
  "15M": "15m",
  "1H": "1H",
  "4H": "4H",
};

/* ── Build candles ── */
function buildCandles(trades: Trade[], tfSec: number): Candle[] {
  if (!trades.length) return [];
  const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp);
  const buckets = new Map<number, Trade[]>();

  for (const t of sorted) {
    if (!t.timestamp || !t.price || t.price <= 0) continue;
    const bucket = Math.floor(t.timestamp / tfSec) * tfSec;
    if (!buckets.has(bucket)) buckets.set(bucket, []);
    buckets.get(bucket)!.push(t);
  }

  const candles: Candle[] = [];
  const keys = [...buckets.keys()].sort((a, b) => a - b);

  for (const k of keys) {
    const group = buckets.get(k)!;
    const prices = group.map((t) => t.price);
    candles.push({
      time: k,
      o: prices[0],
      h: Math.max(...prices),
      l: Math.min(...prices),
      c: prices[prices.length - 1],
      volume: group.reduce((s, t) => s + t.pigeonAmount, 0),
      tradeCount: group.length,
    });
  }

  // Fill gaps between candles (max 50 gap candles to avoid bloat)
  if (candles.length >= 2) {
    const filled: Candle[] = [candles[0]];
    for (let i = 1; i < candles.length; i++) {
      const prev = candles[i - 1];
      const curr = candles[i];
      const gapCount = Math.floor((curr.time - prev.time) / tfSec) - 1;
      // Only fill small gaps (< 20 candles), skip big ones
      if (gapCount > 0 && gapCount <= 20) {
        let t = prev.time + tfSec;
        while (t < curr.time) {
          filled.push({ time: t, o: prev.c, h: prev.c, l: prev.c, c: prev.c, volume: 0, tradeCount: 0 });
          t += tfSec;
        }
      }
      filled.push(curr);
    }
    return filled.slice(-300);
  }
  return candles;
}

/* ── Auto-select best timeframe based on trade spread ── */
function autoTimeframe(trades: Trade[]): Timeframe {
  if (trades.length < 2) return "5M";
  const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp);
  const span = sorted[sorted.length - 1].timestamp - sorted[0].timestamp;

  // Target: 15-60 candles for good readability
  if (span < 600) return "1M";       // < 10min
  if (span < 3600) return "5M";      // < 1h
  if (span < 14400) return "15M";    // < 4h
  if (span < 86400) return "1H";     // < 24h
  return "4H";
}

/* ── Theme (parchment palette) ── */
const CHART_COLORS = {
  bg: "#EDE8DD",
  gridLines: "#D9D3C7",
  text: "#6B6560",
  crosshair: "#A67C52",
  upColor: "#1A7A6D",
  downColor: "#8B2500",
  volumeUp: "rgba(26, 122, 109, 0.25)",
  volumeDown: "rgba(139, 37, 0, 0.25)",
};

interface ChartProps {
  mint?: string;
  progress?: number;
  isComplete?: boolean;
  graduationThreshold?: number;
  currentReserves?: number;
  quoteSymbol?: string;
}

/* ── Main component ── */
export default function ChartArea({ mint, progress = 0, isComplete = false, graduationThreshold = 0, currentReserves = 0, quoteSymbol = "PIGEON" }: ChartProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [tf, setTf] = useState<Timeframe | null>(null); // null = auto
  const [userSetTf, setUserSetTf] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const [chartReady, setChartReady] = useState(false);
  const initialFitDone = useRef(false);

  // Fetch trades
  useEffect(() => {
    if (!mint) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/trades/${mint}`);
        if (!res.ok) throw new Error("err");
        const data = await res.json();
        if (!cancelled) setTrades(data.trades || []);
      } catch { if (!cancelled) setTrades([]); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    const iv = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [mint]);

  // Auto-select timeframe when trades load (only if user hasn't manually chosen)
  useEffect(() => {
    if (!userSetTf && trades.length > 0) {
      setTf(autoTimeframe(trades));
    }
  }, [trades, userSetTf]);

  const activeTf = tf ?? "5M";
  const candles = useMemo(() => buildCandles(trades, TF_SECONDS[activeTf]), [trades, activeTf]);

  // Calculate dynamic bar spacing based on candle count
  const barSpacing = useMemo(() => {
    if (candles.length <= 5) return 40;
    if (candles.length <= 15) return 24;
    if (candles.length <= 40) return 16;
    if (candles.length <= 80) return 10;
    return 6;
  }, [candles.length]);

  // Create chart (dynamic import to avoid SSR)
  useEffect(() => {
    if (!chartContainerRef.current) return;
    let disposed = false;

    import("lightweight-charts").then((lc) => {
      if (disposed || !chartContainerRef.current) return;

      const chart = lc.createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 400,
        layout: {
          background: { type: lc.ColorType.Solid, color: CHART_COLORS.bg },
          textColor: CHART_COLORS.text,
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: CHART_COLORS.gridLines },
          horzLines: { color: CHART_COLORS.gridLines },
        },
        crosshair: {
          mode: lc.CrosshairMode.Normal,
          vertLine: { color: CHART_COLORS.crosshair, width: 1, style: lc.LineStyle.Dashed, labelBackgroundColor: "#A67C52" },
          horzLine: { color: CHART_COLORS.crosshair, width: 1, style: lc.LineStyle.Dashed, labelBackgroundColor: "#A67C52" },
        },
        rightPriceScale: {
          borderColor: CHART_COLORS.gridLines,
          scaleMargins: { top: 0.08, bottom: 0.22 },
        },
        timeScale: {
          borderColor: CHART_COLORS.gridLines,
          timeVisible: true,
          secondsVisible: false,
          barSpacing: 16,
          minBarSpacing: 4,
          rightOffset: 3,
        },
        handleScale: { axisPressedMouseMove: true },
        handleScroll: { vertTouchDrag: false },
      });

      const candleSeries = chart.addCandlestickSeries({
        upColor: CHART_COLORS.upColor,
        downColor: CHART_COLORS.downColor,
        wickUpColor: CHART_COLORS.upColor,
        wickDownColor: CHART_COLORS.downColor,
        borderUpColor: CHART_COLORS.upColor,
        borderDownColor: CHART_COLORS.downColor,
        borderVisible: false,
      });

      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });

      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      volumeSeriesRef.current = volumeSeries;
      setChartReady(true);

      // Resize
      const ro = new ResizeObserver((entries) => {
        if (entries[0]) chart.applyOptions({ width: entries[0].contentRect.width });
      });
      ro.observe(chartContainerRef.current!);

      (chart as any).__ro = ro;
      (chart as any).__container = chartContainerRef.current;
    });

    return () => {
      disposed = true;
      if (chartRef.current) {
        const ro = (chartRef.current as any).__ro;
        const container = (chartRef.current as any).__container;
        if (ro && container) ro.unobserve(container);
        ro?.disconnect();
        chartRef.current.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
        volumeSeriesRef.current = null;
        setChartReady(false);
        initialFitDone.current = false;
      }
    };
  }, []);

  // Update data
  useEffect(() => {
    if (!chartReady || !candleSeriesRef.current || !volumeSeriesRef.current) return;

    const candleData = candles.map((c) => ({
      time: c.time as any,
      open: c.o,
      high: c.h,
      low: c.l,
      close: c.c,
    }));

    const volumeData = candles.map((c) => ({
      time: c.time as any,
      value: c.volume,
      color: c.c >= c.o ? CHART_COLORS.volumeUp : CHART_COLORS.volumeDown,
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    // Update bar spacing dynamically
    if (chartRef.current) {
      chartRef.current.timeScale().applyOptions({ barSpacing });
    }

    // Only fit content on first load, not on every refresh (preserves user zoom)
    if (chartRef.current && candles.length > 0 && !initialFitDone.current) {
      chartRef.current.timeScale().fitContent();
      initialFitDone.current = true;
    }
  }, [candles, chartReady, barSpacing]);

  // Reset fit when timeframe changes
  useEffect(() => {
    if (chartRef.current && candles.length > 0 && userSetTf) {
      chartRef.current.timeScale().fitContent();
    }
  }, [activeTf]);

  // Price helpers
  const formatPrice = useCallback((price: number) => {
    if (price === 0) return "0";
    if (price < 0.000001) return price.toExponential(2);
    if (price < 0.001) return price.toFixed(8);
    if (price < 1) return price.toFixed(6);
    return price.toFixed(4);
  }, []);

  const lastCandle = candles[candles.length - 1];
  const firstCandle = candles[0];
  const priceChange =
    lastCandle && firstCandle && firstCandle.o > 0
      ? ((lastCandle.c - firstCandle.o) / firstCandle.o) * 100
      : 0;

  const tradeCount = trades.length;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <h3 className="text-[12px] font-semibold text-txt-secondary flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-bronze" />
            <span>Price Chart</span>
          </h3>
          {lastCandle && (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-txt font-mono font-medium">
                {formatPrice(lastCandle.c)}
              </span>
              <span className={`font-semibold ${priceChange >= 0 ? "text-teal" : "text-crimson"}`}>
                {priceChange >= 0 ? "+" : ""}
                {priceChange.toFixed(2)}%
              </span>
              <span className="text-txt-muted text-[10px]">
                {tradeCount} trade{tradeCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Timeframe buttons */}
        <div className="flex gap-0.5 bg-bg-elevated rounded-md p-0.5 border border-border">
          {(Object.keys(TF_LABELS) as Timeframe[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTf(t); setUserSetTf(true); initialFitDone.current = false; }}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all ${
                activeTf === t
                  ? "bg-bg-card text-txt shadow-sm"
                  : "text-txt-muted hover:text-txt-secondary"
              }`}
            >
              {TF_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Bonding Curve Progress */}
      {!isComplete && graduationThreshold > 0 && (
        <div className="px-4 py-2.5 border-b border-border bg-bg-elevated/50">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse" />
              <span className="text-[10px] font-semibold text-txt-secondary uppercase tracking-wider">Bonding Curve</span>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-txt-muted">
                {currentReserves.toLocaleString(undefined, { maximumFractionDigits: 0 })} / {graduationThreshold.toLocaleString(undefined, { maximumFractionDigits: 0 })} {quoteSymbol}
              </span>
              <span className={`font-mono font-bold ${progress >= 80 ? "text-amber-500" : progress >= 40 ? "text-bronze" : "text-crimson"}`}>
                {progress.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="relative h-2 rounded-full bg-border overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(progress, 100)}%`,
                background: progress >= 80
                  ? "linear-gradient(90deg, #D97706, #F59E0B)"
                  : progress >= 40
                  ? "linear-gradient(90deg, #A67C52, #D97706)"
                  : "linear-gradient(90deg, #8B2500, #C73E1D)",
              }}
            />
            <div className="absolute top-0 bottom-0 w-px bg-teal" style={{ left: "100%" }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-txt-muted">0</span>
            <span className="text-[9px] text-teal font-mono">🎓 Graduation</span>
          </div>
        </div>
      )}

      {isComplete && (
        <div className="px-4 py-2 border-b border-teal/20 bg-teal/5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-teal">🎓 Graduated — Trading on Raydium CPMM</span>
            <span className="text-[9px] text-teal/60 font-mono ml-auto">1.20% creator fee → burn 🔥</span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ position: "relative" }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ height: 400, background: CHART_COLORS.bg }}>
            <div className="animate-spin h-5 w-5 border-2 border-crimson border-t-transparent rounded-full" />
          </div>
        )}
        {!loading && candles.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ height: 400, background: CHART_COLORS.bg }}>
            <BarChart3 className="h-6 w-6 text-txt-muted mb-3" />
            <p className="text-[12px] text-txt-secondary font-medium">Awaiting first trade</p>
            <p className="text-[10px] text-txt-muted font-lore italic mt-1">The chart awakens with the first offering</p>
          </div>
        )}
        <div
          ref={chartContainerRef}
          style={{ width: "100%", height: 400, visibility: candles.length > 0 ? "visible" : "hidden" }}
        />
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Clock, Target, BarChart3, Flame, Rocket,
  Zap, Star, Copy, ExternalLink, ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { usePlatformStats, type CurveItem } from "@/hooks/usePlatformStats";
import { useRealtimeFeed } from "@/hooks/useRealtimeFeed";
import { Skeleton } from "@/components/shared/Skeleton";
import BN from "bn.js";
import { formatNumber, shortenAddress, timeAgo } from "@/lib/utils";
import { useTokenImage } from "@/hooks/useTokenImage";
import { SECTION_HEADERS, EMPTY_STATES, SEARCH_COPY } from "@/lib/lore";
import { Search, Eye } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { QuoteFilter } from "@/components/shared/QuoteFilter";
import { type QuoteAssetKey, QUOTE_ASSETS, getQuoteAssetByMint } from "@/lib/constants";

type TabKey = "new" | "heating" | "graduating" | "burn" | "volume" | "watched";

const TABS: { key: TabKey; label: string; icon: typeof TrendingUp; lore: string }[] = [
  { key: "new", label: "New", icon: Clock, lore: "freshly kindled" },
  { key: "heating", label: "Heating", icon: Zap, lore: "gaining momentum" },
  { key: "graduating", label: "Near Graduation", icon: Target, lore: "approaching ascension" },
  { key: "burn", label: "Top Burn", icon: Flame, lore: "most offerings consumed" },
  { key: "volume", label: "Top Volume", icon: BarChart3, lore: "highest trade activity" },
  { key: "watched", label: "Watched", icon: Eye, lore: "your flock" },
];

function getStatusLabel(progress: number, complete: boolean): { label: string; color: string; bg: string } {
  if (complete) return { label: "Ascended", color: "text-teal", bg: "bg-teal/8 border-teal/15" };
  if (progress >= 80) return { label: "Graduating", color: "text-amber", bg: "bg-amber/8 border-amber/15" };
  if (progress >= 40) return { label: "Heating", color: "text-bronze", bg: "bg-bronze/8 border-bronze/15" };
  if (progress >= 10) return { label: "Pre-Grad", color: "text-txt-secondary", bg: "bg-bg-elevated border-[var(--border)]" };
  return { label: "New", color: "text-crimson", bg: "bg-crimson/8 border-crimson/15" };
}

export default function Board() {
  const { stats, loading, refetch } = usePlatformStats();
  const { events, lastUpdate } = useRealtimeFeed();
  const [activeTab, setActiveTab] = useState<TabKey>("new");

  // Auto-refetch when WebSocket detects new activity
  useEffect(() => {
    if (lastUpdate > 0) {
      const timer = setTimeout(() => refetch(), 500); // small debounce
      return () => clearTimeout(timer);
    }
  }, [lastUpdate, refetch]);
  const [searchQuery, setSearchQuery] = useState("");
  const [quoteFilter, setQuoteFilter] = useState<QuoteAssetKey | "all">("all");
  const { watchlist, toggle: toggleWatch, isWatched } = useWatchlist();
  const { items: recentlyViewed } = useRecentlyViewed();

  const allCurves = stats?.recentTokens ?? [];
  const graduationAmount = stats?.graduationAmount ?? new BN(1);
  const quoteGradMap = stats?.quoteGradMap ?? {};
  const getGradForCurve = (c: CurveItem): BN => {
    const qm = c.account.quoteMint?.toBase58();
    if (qm && quoteGradMap[qm]) return new BN(quoteGradMap[qm]);
    return graduationAmount;
  };

  // Tab-based filtering & sorting
  const filtered = (() => {
    const items = [...allCurves];
    const gradNum = graduationAmount.toNumber();
    switch (activeTab) {
      case "new":
        return items.sort((a, b) => b.account.createdAt.toNumber() - a.account.createdAt.toNumber());
      case "heating":
        return items
          .filter((c) => !c.account.complete)
          .sort((a, b) => b.account.realPigeonReserves.toNumber() - a.account.realPigeonReserves.toNumber());
      case "graduating":
        return items
          .filter((c) => !c.account.complete)
          .sort((a, b) => {
            const aG = getGradForCurve(a).toNumber();
            const bG = getGradForCurve(b).toNumber();
            const aP = aG > 0 ? a.account.realPigeonReserves.toNumber() / aG : 0;
            const bP = bG > 0 ? b.account.realPigeonReserves.toNumber() / bG : 0;
            return bP - aP;
          });
      case "burn":
        return items.sort((a, b) => b.account.realPigeonReserves.toNumber() - a.account.realPigeonReserves.toNumber());
      case "volume":
        return items.sort((a, b) => b.account.realPigeonReserves.toNumber() - a.account.realPigeonReserves.toNumber());
      case "watched":
        return items.filter((c) => watchlist.includes(c.account.tokenMint.toBase58()));
      default:
        return items;
    }
  })().filter((item) => {
    // Quote filter
    if (quoteFilter !== "all") {
      const itemQuoteMint = item.account.quoteMint?.toBase58?.() ?? "";
      const expectedMint = QUOTE_ASSETS[quoteFilter]?.mint.toBase58() ?? "";
      if (itemQuoteMint !== expectedMint) return false;
    }
    // Search filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.account.name?.toLowerCase().includes(q) ||
      item.account.symbol?.toLowerCase().includes(q) ||
      item.account.tokenMint.toBase58().toLowerCase().includes(q)
    );
  });

  return (
    <div className="animate-fade-in space-y-4">

      {/* ── Header Row ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-h1 text-txt">{SECTION_HEADERS.board.title}</h1>
          <p className="lore-subtitle hidden sm:block">{SECTION_HEADERS.board.lore}</p>
        </div>
        <Link
          href="/launch"
          className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 text-[13px] font-bold text-[#F5F0E8] bg-crimson rounded-lg hover:opacity-90 transition-opacity shadow-sm w-full sm:w-auto"
        >
          <Rocket className="h-4 w-4" />
          Inscribe Token
        </Link>
      </div>

      {/* ── Summary Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 sm:flex sm:items-center gap-0 border border-[var(--border)] rounded-lg bg-bg-card">
        {loading ? (
          <div className="flex gap-4 p-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-8 w-28" />)}
          </div>
        ) : (
          <>
            <SummaryCell label="Inscribed" value={String(stats?.totalTokensLaunched ?? 0)} icon={Star} />
            <SummaryDivider />
            <SummaryCell label="Volume" value={stats?.totalVolume ? formatNumber(stats.totalVolume.toNumber() / 1e6) : "0"} icon={BarChart3} suffix="PIGEON" />
            <SummaryDivider />
            <SummaryCell label="Burned" value={stats?.totalPigeonBurned ? formatNumber(stats.totalPigeonBurned.toNumber() / 1e6) : "0"} icon={Flame} color="text-crimson" />
            <SummaryDivider />
            <SummaryCell label="Fee" value={stats?.feeBps ? `${stats.feeBps / 100}%` : "2%"} icon={Zap} />
          </>
        )}
      </div>

      {/* ── Quote Filter ── */}
      <QuoteFilter value={quoteFilter} onChange={setQuoteFilter} />

      {/* ── Search + Tab Bar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-txt-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={SEARCH_COPY.placeholder}
            className="w-full pl-9 pr-3 py-2 rounded-md text-[12px] bg-bg-card border border-[var(--border)] text-txt placeholder:text-txt-muted focus:border-crimson outline-none transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-txt-muted hover:text-txt">✕</button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`
                flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[12px] font-semibold whitespace-nowrap transition-all
                ${active
                  ? "bg-crimson/10 text-crimson border border-crimson/20"
                  : "text-txt-muted hover:text-txt-secondary hover:bg-bg-elevated border border-transparent"
                }
              `}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Token Grid ── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="card p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="card p-16 text-center">
            <div className="mx-auto mb-4">
              <img src="/logo-v1.png" alt="PigeonHouse" className="w-14 h-14 rounded-lg mx-auto animate-float" />
            </div>
            <p className="text-body font-semibold text-txt mb-1">{EMPTY_STATES.noTokens.text}</p>
            <p className="text-body-sm text-txt-muted font-lore italic mb-6">{EMPTY_STATES.noTokens.lore}</p>
            <Link href="/launch" className="btn-primary inline-flex items-center gap-2 text-body-sm">
              <Rocket className="h-4 w-4" />
              Inscribe Token
            </Link>
          </motion.div>
        ) : filtered.length === 0 && activeTab === "watched" ? (
          <motion.div key="watched-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-lg bg-amber/8 flex items-center justify-center mb-4">
              <Star className="h-5 w-5 text-amber" />
            </div>
            <p className="text-body font-semibold text-txt mb-1">No tokens watched</p>
            <p className="text-body-sm text-txt-muted font-lore italic">Star a token to track it here</p>
          </motion.div>
        ) : filtered.length === 0 && searchQuery ? (
          <motion.div key="search-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-lg bg-bronze/8 flex items-center justify-center mb-4">
              <Search className="h-5 w-5 text-bronze" />
            </div>
            <p className="text-body font-semibold text-txt mb-1">{SEARCH_COPY.noResults}</p>
            <p className="text-body-sm text-txt-muted font-lore italic">{SEARCH_COPY.noResultsLore}</p>
          </motion.div>
        ) : (
          <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-grid">
            {filtered.map((item, i) => (
              <BoardCard
                key={item.account.tokenMint.toBase58()}
                item={item}
                graduationAmount={getGradForCurve(item)}
                index={i}
                isWatched={isWatched(item.account.tokenMint.toBase58())}
                onToggleWatch={toggleWatch}
                lastUpdate={lastUpdate}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════
   BOARD CARD
   ═══════════════════════════════════════ */

function BoardCard({ item, graduationAmount, index, isWatched, onToggleWatch, lastUpdate = 0 }: {
  item: CurveItem; graduationAmount: BN; index: number;
  isWatched: boolean; onToggleWatch: (mint: string) => void;
  lastUpdate?: number;
}) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (lastUpdate > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);
  const { account } = item;
  const mint = account.tokenMint.toBase58();
  const name = account.name || "Unknown";
  const symbol = account.symbol || "???";
  const complete = account.complete;
  const image = useTokenImage(account.uri || null);
  const pigeonReserve = account.realPigeonReserves?.toNumber?.() ?? 0;
  const gradNum = graduationAmount.toNumber();
  const progress = gradNum > 0 ? Math.min(100, (pigeonReserve / gradNum) * 100) : 0;
  const vp = account.virtualPigeonReserves?.toNumber?.() ?? 0;
  const vt = account.virtualTokenReserves?.toNumber?.() ?? 0;
  const rp = account.realPigeonReserves?.toNumber?.() ?? 0;
  const rt = account.realTokenReserves?.toNumber?.() ?? 0;
  // Price = (VP+RP) / (VT+RT) — includes real reserves for accurate current price
  const quoteMintStr = account.quoteMint?.toBase58?.() ?? "";
  const quoteAsset = getQuoteAssetByMint(quoteMintStr);
  const quoteDecimals = quoteAsset?.decimals ?? 6;
  const tokenDecimals = 6; // all launched tokens are 6 decimals
  const decimalDiff = quoteDecimals - tokenDecimals;
  const totalQuote = vp + rp;
  const totalToken = vt + rt;
  const price = totalToken > 0 ? (totalQuote / totalToken) / (10 ** decimalDiff) : 0;
  const createdAt = account.createdAt?.toNumber?.() ?? 0;
  const burned = pigeonReserve * 0.015; // 1.5% burn
  const status = getStatusLabel(progress, complete);
  const creatorShort = shortenAddress(account.creator.toBase58(), 3);

  const [copied, setCopied] = useState(false);
  function copyMint(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(mint);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
    >
      <Link href={`/token/${mint}`} className="block group">
        <div className={`card card-interactive hover-lift p-0 h-full overflow-hidden transition-all duration-300 ${pulse ? "ring-2 ring-crimson/40 shadow-lg shadow-crimson/10" : ""}`}>

          {/* ── Card Header ── */}
          <div className="p-3.5 pb-0">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="relative shrink-0">
                {image ? (
                  <img src={image} alt={symbol} className="w-10 h-10 rounded-md object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-crimson/15 flex items-center justify-center text-crimson font-bold text-[15px] font-lore">
                    {symbol.charAt(0)}
                  </div>
                )}
              </div>

              {/* Name + Meta */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[14px] font-semibold text-txt truncate leading-tight">{name}</p>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${status.bg} ${status.color} ${status.label === "New" ? "badge-new-pulse" : ""}`}>
                    {status.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] flex-wrap">
                  <span className="font-mono text-txt-muted">${symbol}</span>
                  {price > 0 && (
                    <>
                      <span className="text-txt-disabled hidden sm:inline">·</span>
                      <span className="font-mono text-txt-secondary truncate max-w-[100px]">
                        {price < 0.001 ? price.toExponential(1) : price.toFixed(6)}
                      </span>
                    </>
                  )}
                  {createdAt > 0 && (
                    <>
                      <span className="text-txt-disabled hidden sm:inline">·</span>
                      <span className="text-txt-muted whitespace-nowrap">{timeAgo(createdAt)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Watch + Trade CTA */}
              <div className="shrink-0 flex items-center gap-1">
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWatch(mint); }}
                  className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                    isWatched
                      ? "bg-amber/15 text-amber"
                      : "opacity-0 group-hover:opacity-100 bg-bg-elevated text-txt-muted hover:text-amber"
                  }`}
                  title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
                >
                  <Star className={`h-3.5 w-3.5 ${isWatched ? "fill-current" : ""}`} />
                </button>
                <div className="w-7 h-7 rounded-md bg-crimson/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="h-3.5 w-3.5 text-crimson" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Progress Bar ── */}
          <div className="px-3.5 pt-3 pb-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-txt-muted font-lore italic">Ascension</span>
              <span className="text-[11px] text-txt-secondary font-mono font-medium">{progress.toFixed(1)}%</span>
            </div>
            <div className="h-[4px] rounded-full bg-border overflow-hidden">
              <motion.div
                className={`h-full rounded-full progress-glow ${complete ? "bg-teal" : "bg-gradient-to-r from-bronze to-crimson"}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.02 }}
              />
            </div>
          </div>

          {/* ── Stats Row ── */}
          <div className="px-3.5 pt-2.5 pb-3 flex items-center justify-between gap-2">
            {/* Creator */}
            <div className="flex items-center gap-1.5 text-[10px] text-txt-muted">
              <div className="w-4 h-4 rounded bg-bg-elevated flex items-center justify-center text-[8px] font-bold text-txt-muted">
                {account.creator.toBase58().charAt(0)}
              </div>
              <span className="font-mono">{creatorShort}</span>
            </div>

            {/* Volume + Burn */}
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1 text-txt-muted">
                <TrendingUp className="h-2.5 w-2.5" />
                <span className="font-mono">{pigeonReserve > 0 ? formatNumber(pigeonReserve / 1e6) : "0"}</span>
              </div>
              <div className="flex items-center gap-1 text-crimson">
                <Flame className="h-2.5 w-2.5" />
                <span className="font-mono">{burned > 0 ? formatNumber(burned / 1e6) : "0"}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={copyMint} className="p-1 rounded hover:bg-bg-elevated transition-colors" title="Copy mint address">
                {copied ? <span className="text-[9px] text-teal font-medium">✓</span> : <Copy className="h-2.5 w-2.5 text-txt-muted" />}
              </button>
              <a href={`https://solscan.io/token/${mint}`} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded hover:bg-bg-elevated transition-colors" title="View on explorer">
                <ExternalLink className="h-2.5 w-2.5 text-txt-muted" />
              </a>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   SUMMARY STRIP COMPONENTS
   ═══════════════════════════════════════ */

function SummaryCell({ label, value, icon: Icon, suffix, color }: {
  label: string; value: string; icon: typeof Flame; suffix?: string; color?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 min-w-0">
      <Icon className={`h-3.5 w-3.5 shrink-0 ${color || "text-txt-muted"}`} />
      <div className="min-w-0">
        <p className="text-[10px] text-txt-muted uppercase tracking-wider font-medium leading-none">{label}</p>
        <p className={`text-[14px] font-mono font-semibold leading-tight mt-0.5 ${color || "text-txt"}`}>
          {value}
          {suffix && <span className="text-[10px] text-txt-muted font-normal ml-1">{suffix}</span>}
        </p>
      </div>
    </div>
  );
}

function SummaryDivider() {
  return <div className="hidden sm:block w-px h-8 bg-[var(--border)] shrink-0" />;
}

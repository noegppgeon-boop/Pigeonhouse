"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, ExternalLink, Copy, Flame, Target, Award,
  Share2, Check, Link2, TrendingUp, BarChart3, Zap,
  Shield, Eye, User, Clock
} from "lucide-react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useBondingCurve } from "@/hooks/useBondingCurve";
import TradePanel from "@/components/token/TradePanel";
import ChartArea from "@/components/token/ChartArea";
import RecentTrades from "@/components/token/RecentTrades";
import { formatPigeon, formatToken } from "@/lib/pigeon_house";
import { Skeleton } from "@/components/shared/Skeleton";
import { formatNumber, shortenAddress, timeAgo } from "@/lib/utils";
import { useTokenImage } from "@/hooks/useTokenImage";
import { QuoteBadge } from "@/components/shared/QuoteBadge";
import BN from "bn.js";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

function getStatus(progress: number, complete: boolean) {
  if (complete) return { label: "Ascended", color: "text-teal", bg: "bg-teal/8 border-teal/20" };
  if (progress >= 80) return { label: "Graduating", color: "text-amber", bg: "bg-amber/8 border-amber/20" };
  if (progress >= 40) return { label: "Heating", color: "text-bronze", bg: "bg-bronze/8 border-bronze/20" };
  if (progress >= 10) return { label: "Pre-Grad", color: "text-txt-secondary", bg: "bg-bg-elevated border-[var(--border)]" };
  return { label: "Kindled", color: "text-crimson", bg: "bg-crimson/8 border-crimson/20" };
}

export default function TokenPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const mintAddress = params.mint as string;
  const { publicKey } = useWallet();
  const { add: addRecentlyViewed } = useRecentlyViewed();
  const { curve, config, loading, price, mcap, progress, refetch } =
    useBondingCurve(mintAddress);
  const tokenImage = useTokenImage(curve?.uri);
  const referrer = searchParams.get("ref") || null;

  const [copied, setCopied] = useState(false);
  const [mintCopied, setMintCopied] = useState(false);

  // Track recently viewed
  useEffect(() => {
    if (curve) addRecentlyViewed(mintAddress, curve.name || "Unknown", curve.symbol || "???");
  }, [curve?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  function copyReferralLink() {
    if (!publicKey) return;
    const url = `${window.location.origin}/token/${mintAddress}?ref=${publicKey.toBase58()}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyMint() {
    navigator.clipboard.writeText(mintAddress);
    setMintCopied(true);
    setTimeout(() => setMintCopied(false), 1500);
  }

  /* ── Loading ── */
  if (loading && !curve) {
    return (
      <div className="animate-fade-in space-y-4">
        <Skeleton className="h-4 w-20" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-[72px]" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton variant="chart" className="h-64" />
          </div>
          <Skeleton className="lg:col-span-2 h-96" />
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!curve || !config) {
    return (
      <div className="text-center py-20">
        <div className="w-14 h-14 rounded-lg bg-crimson/8 flex items-center justify-center mx-auto mb-4">
          <Eye className="h-6 w-6 text-crimson" />
        </div>
        <p className="text-body font-semibold text-txt mb-1">Token not found</p>
        <p className="text-body-sm text-txt-muted font-lore italic mb-4">This inscription may not exist in the archive</p>
        <Link href="/" className="text-teal text-body-sm hover:underline">← Back to the archive</Link>
      </div>
    );
  }

  const isComplete = curve.complete;
  const remaining = config.graduationPigeonAmount.sub(curve.realPigeonReserves);
  const shortMint = shortenAddress(mintAddress, 6);
  const status = getStatus(progress, isComplete);
  const createdAt = curve.createdAt?.toNumber?.() ?? 0;
  const burnedEstimate = (curve.realPigeonReserves?.toNumber?.() ?? 0) * 0.015 / 1e6;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5">

      {/* ── Back ── */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] text-txt-muted hover:text-txt-secondary transition-colors">
        <ArrowLeft className="h-3 w-3" />
        Archive
      </Link>

      {/* ══════════════════════════════════
          TOKEN IDENTITY
         ══════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Avatar + Identity */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {tokenImage ? (
            <img src={tokenImage} alt={curve.symbol} className="w-14 h-14 rounded-lg object-cover shrink-0 shadow-sm" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-crimson/15 flex items-center justify-center text-crimson text-xl font-bold font-lore shrink-0 shadow-sm">
              {curve.symbol.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-bold text-txt leading-tight tracking-tight">{curve.name}</h1>
                <QuoteBadge quoteMint={curve.quoteMint?.toBase58?.()} compact />
              </div>
              <span className="text-[12px] font-mono text-txt-muted">${curve.symbol}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${status.bg} ${status.color}`}>
                {isComplete ? <Award className="h-2.5 w-2.5" /> : <Flame className="h-2.5 w-2.5" />}
                {status.label}
              </span>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 flex-wrap text-[11px] text-txt-muted">
              {/* Creator */}
              <Link href={`/profile/${curve.creator.toBase58()}`} className="flex items-center gap-1 hover:text-teal transition-colors">
                <User className="h-3 w-3" />
                <span className="font-mono">{shortenAddress(curve.creator.toBase58(), 4)}</span>
              </Link>
              {/* Age */}
              {createdAt > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo(createdAt)}
                </span>
              )}
              {/* Mint */}
              <button onClick={copyMint} className="flex items-center gap-1 hover:text-txt-secondary transition-colors font-mono">
                {mintCopied ? <Check className="h-3 w-3 text-teal" /> : <Copy className="h-3 w-3" />}
                {shortMint}
              </button>
              {/* Explorer */}
              <a href={`https://solscan.io/token/${mintAddress}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-txt-secondary transition-colors">
                <ExternalLink className="h-3 w-3" />
                Explorer
              </a>
            </div>
          </div>
        </div>

        {/* Share & Earn */}
        <div className="shrink-0">
          {publicKey ? (
            <button onClick={copyReferralLink}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-semibold transition-all border ${
                copied
                  ? "bg-teal/8 text-teal border-teal/20"
                  : "bg-bg-card text-txt-secondary border-[var(--border)] hover:border-[var(--border-3)]"
              }`}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Share & Earn 0.5%"}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-bg-card border border-[var(--border)] text-[11px] text-txt-muted">
              <Link2 className="h-3 w-3" />
              Connect wallet to earn referrals
            </div>
          )}
        </div>
      </div>

      {/* Referral banner */}
      {referrer && referrer !== publicKey?.toBase58() && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal/5 border border-teal/10 text-[11px]">
          <Share2 className="h-3.5 w-3.5 text-teal" />
          <span className="text-txt-secondary">
            Via referral from <span className="font-mono text-teal">{shortenAddress(referrer)}</span> — they earn 0.5%
          </span>
        </div>
      )}

      {/* ══════════════════════════════════
          SUMMARY METRICS
         ══════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <MetricCard label="Price" value={price.toFixed(8)} unit="PIGEON" icon={TrendingUp} color="text-txt" />
        <MetricCard label="Market Cap" value={formatNumber(typeof mcap === 'number' ? mcap : 0)} unit="PIGEON" icon={BarChart3} color="text-bronze" />
        <MetricCard label="Ascension" value={`${progress.toFixed(1)}%`} unit={isComplete ? "Ascended" : `${formatPigeon(remaining)} to go`} icon={Target} color="text-crimson" />
        <MetricCard label="Est. Burned" value={formatNumber(burnedEstimate)} unit="PIGEON 🔥" icon={Flame} color="text-crimson" />
        <MetricCard label="Reserves" value={formatPigeon(curve.realPigeonReserves)} unit="PIGEON" icon={Zap} color="text-teal" />
      </div>

      {/* ── Graduation Progress ── */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-txt-muted flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-bronze" />
            <span className="font-lore italic">Ascension Progress</span>
          </span>
          <span className="text-[12px] font-mono text-txt-secondary font-semibold">{progress.toFixed(2)}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-border overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isComplete ? "bg-teal" : "bg-gradient-to-r from-bronze to-crimson"}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-txt-muted font-mono">
          <span>{formatPigeon(curve.realPigeonReserves)} raised</span>
          <span>{formatPigeon(config.graduationPigeonAmount)} target</span>
        </div>
      </div>

      {/* ══════════════════════════════════
          MAIN CONTENT: LEFT + RIGHT RAIL
         ══════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── LEFT: Chart + Trades + Info ── */}
        <div className="lg:col-span-3 space-y-5">
          <ChartArea mint={mintAddress} />
          <RecentTrades mint={mintAddress} />

          {/* Token Info */}
          <div className="card p-4 space-y-3">
            <h3 className="text-[11px] text-txt-muted uppercase tracking-widest font-semibold flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              Token Details
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <InfoRow label="Total Supply" value={formatToken(curve.tokenTotalSupply)} />
              <InfoRow label="Real Reserves" value={formatPigeon(curve.realPigeonReserves)} />
              <InfoRow label="Virtual PIGEON" value={formatPigeon(curve.virtualPigeonReserves)} />
              <InfoRow label="Virtual Token" value={formatToken(curve.virtualTokenReserves)} />
            </div>
            <div className="border-t border-[var(--border)] pt-2">
              <InfoRow label="Creator" value={shortenAddress(curve.creator.toBase58())} link={`/profile/${curve.creator.toBase58()}`} />
            </div>
          </div>
        </div>

        {/* ── RIGHT: Trade Rail (sticky) ── */}
        <div className="lg:col-span-2" id="trade-panel">
          <div className="lg:sticky lg:top-4 space-y-4 trade-rail-sticky">
            <TradePanel
              curve={curve}
              config={config}
              mintAddress={mintAddress}
              referrer={referrer}
              onSuccess={refetch}
            />

            {/* ── Proof Module (obsidian) ── */}
            <div className="card-obsidian obsidian-hover p-4 space-y-3">
              <h3 className="text-[10px] uppercase tracking-widest font-semibold flex items-center gap-1.5" style={{ color: "#9C9590" }}>
                <Eye className="h-3 w-3" />
                On-Chain Proof
              </h3>
              <ProofRow icon={Flame} label="Burn mechanism" value="Active" status="active" />
              <ProofRow icon={Shield} label="Fee" value="2% per trade" status="active" />
              <ProofRow icon={Zap} label="Sweep lane" value="Permissionless" status="active" />
              <ProofRow icon={Target} label="LP lock" value="Permanent (dead wallet)" status="active" />
              <div className="pt-2 border-t border-[#3A3632]">
                <a href={`https://solscan.io/token/${mintAddress}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] hover:underline transition-colors" style={{ color: "#9C9590" }}>
                  Verify on-chain
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Trade FAB */}
      <div className="fixed bottom-20 right-4 md:hidden z-40">
        <a href="#trade-panel"
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-crimson text-[#F5F0E8] text-[13px] font-bold shadow-lg shadow-crimson/20 hover:opacity-90 transition-opacity">
          <TrendingUp className="h-4 w-4" />
          Trade
        </a>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════ */

function MetricCard({ label, value, unit, icon: Icon, color }: {
  label: string; value: string; unit: string; icon: typeof TrendingUp; color: string;
}) {
  return (
    <div className="card p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`h-3 w-3 ${color}`} />
        <span className="text-[10px] text-txt-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[14px] font-mono font-bold text-txt leading-tight">{value}</p>
      <p className="text-[10px] text-txt-muted mt-0.5">{unit}</p>
    </div>
  );
}

function InfoRow({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div className="flex justify-between text-[12px]">
      <span className="text-txt-muted">{label}</span>
      {link ? (
        <Link href={link} className="font-mono text-teal hover:underline">{value}</Link>
      ) : (
        <span className="font-mono text-txt-secondary">{value}</span>
      )}
    </div>
  );
}

function ProofRow({ icon: Icon, label, value, status }: {
  icon: typeof Flame; label: string; value: string; status: "active" | "pending";
}) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <div className="flex items-center gap-2" style={{ color: "#E8E4DC" }}>
        <Icon className="h-3 w-3 text-crimson" />
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-mono" style={{ color: "#9C9590" }}>{value}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-green" : "bg-amber"}`} />
      </div>
    </div>
  );
}

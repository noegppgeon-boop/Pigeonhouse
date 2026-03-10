"use client";

import { motion } from "framer-motion";
import {
  Wallet, TrendingUp, Flame, BarChart3, Rocket,
  Eye, ArrowRight, Shield
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { shortenAddress } from "@/lib/utils";
import { SECTION_HEADERS, EMPTY_STATES, LOADING_STATES } from "@/lib/lore";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

export default function PortfolioPage() {
  const { publicKey, connected } = useWallet();

  if (!connected) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto text-center py-20">
        <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-crimson/8 flex items-center justify-center">
          <Wallet className="h-7 w-7 text-crimson" />
        </div>
        <h1 className="text-[20px] font-bold text-txt mb-1">Your Portfolio</h1>
        <p className="text-[13px] text-txt-secondary mb-1">Connect your wallet to view positions, activity, and burn contributions</p>
        <p className="text-[11px] text-txt-muted font-lore italic mb-6">The archive opens only to those who reveal themselves</p>
        <WalletMultiButton />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-txt flex items-center gap-2.5 tracking-tight">
            <Wallet className="h-5 w-5 text-teal" />
            {SECTION_HEADERS.portfolio.title}
          </h1>
          <p className="lore-subtitle">{SECTION_HEADERS.portfolio.lore}</p>
        </div>
        <Link href={`/profile/${publicKey!.toBase58()}`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold text-txt-secondary bg-bg-elevated border border-[var(--border)] hover:border-[var(--border-3)] transition-colors">
          <Eye className="h-3 w-3" />
          Public Profile
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* ══════════════════════════════════
          SUMMARY STRIP
         ══════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <SummaryCard icon={Wallet} label="Holdings" value="—" color="text-teal" />
        <SummaryCard icon={TrendingUp} label="Total PnL" value="—" color="text-teal" />
        <SummaryCard icon={Flame} label="PIGEON Burned" value="—" color="text-crimson" />
        <SummaryCard icon={BarChart3} label="Trades" value="—" color="text-bronze" />
      </div>

      {/* ══════════════════════════════════
          POSITIONS
         ══════════════════════════════════ */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[12px] font-semibold text-txt-secondary flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-teal" />
            Open Positions
          </h3>
        </div>
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-lg bg-bg-elevated flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="h-5 w-5 text-txt-muted" />
          </div>
          <p className="text-[12px] text-txt-secondary font-medium">{EMPTY_STATES.noPositions.text}</p>
          <p className="text-[10px] text-txt-muted font-lore italic mt-1 max-w-xs mx-auto">
            {EMPTY_STATES.noPositions.lore}
          </p>
          <Link href="/"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-[12px] font-semibold bg-crimson text-[#F5F0E8] hover:opacity-90 transition-opacity">
            <Rocket className="h-3.5 w-3.5" />
            Explore Tokens
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════
          ACTIVITY
         ══════════════════════════════════ */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[12px] font-semibold text-txt-secondary flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-bronze" />
            Recent Activity
          </h3>
        </div>
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-lg bg-bg-elevated flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="h-5 w-5 text-txt-muted" />
          </div>
          <p className="text-[12px] text-txt-secondary font-medium">{EMPTY_STATES.noActivity.text}</p>
          <p className="text-[10px] text-txt-muted font-lore italic mt-1">{EMPTY_STATES.noActivity.lore}</p>
        </div>
      </div>

      {/* Archive card */}
      <div className="card-obsidian p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-bronze" />
          <span className="text-[11px] font-semibold" style={{ color: "#E8E4DC" }}>The Trial</span>
          <span className="text-[9px] font-mono tracking-widest ml-auto" style={{ color: "#9C9590" }}>PARTIAL</span>
        </div>
        <p className="text-[10px] mt-2 leading-relaxed" style={{ color: "#9C9590" }}>
          Portfolio data is derived from on-chain transaction history. Positions and PnL tracking will be fully decrypted in a future update.
        </p>
      </div>
    </motion.div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: {
  icon: typeof Wallet; label: string; value: string; color: string;
}) {
  return (
    <div className="card p-3.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <span className="text-[10px] text-txt-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-[16px] font-mono font-bold leading-tight ${color}`}>{value}</p>
    </div>
  );
}

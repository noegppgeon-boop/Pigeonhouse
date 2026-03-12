"use client";

import { motion } from "framer-motion";
import {
  BarChart3, Flame, Rocket, Trophy, TrendingUp,
  Target, Zap, Shield, Lock, Eye, Award
} from "lucide-react";
import Link from "next/link";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { formatNumber } from "@/lib/utils";
import { SECTION_HEADERS } from "@/lib/lore";

export default function StatsPage() {
  const { stats, loading } = usePlatformStats();

  const totalTokens = stats?.totalTokensLaunched ?? 0;
  const totalVolume = stats?.totalVolume?.toNumber?.() ?? 0;
  const totalBurned = stats?.totalPigeonBurned?.toNumber?.() ?? 0;
  const feeBps = stats?.feeBps ?? 200;

  const activeTokens = stats?.recentTokens?.filter((t: any) => !t.account.complete).length ?? 0;
  const graduatingSoon = stats?.graduatingSoon?.length ?? 0;
  const graduatedTokens = stats?.recentTokens?.filter((t: any) => t.account.complete).length ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-[20px] font-bold text-txt flex items-center gap-2.5 tracking-tight">
          <BarChart3 className="h-5 w-5 text-bronze" />
          {SECTION_HEADERS.stats.title}
        </h1>
        <p className="lore-subtitle">{SECTION_HEADERS.stats.lore}</p>
      </div>

      {/* ══════════════════════════════════
          PRIMARY METRICS
         ══════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <MetricCard icon={Rocket} label="Tokens Inscribed" value={totalTokens.toString()} color="text-crimson" />
        <MetricCard icon={TrendingUp} label="Total Volume" value={formatNumber(totalVolume / 1e6)} unit="PIGEON" color="text-teal" />
        <MetricCard icon={Flame} label="PIGEON Burned" value={formatNumber(totalBurned / 1e6)} color="text-crimson" />
        <MetricCard icon={Target} label="Trade Fee" value={`${feeBps / 100}%`} unit="per trade" color="text-bronze" />
      </div>

      {/* ══════════════════════════════════
          TOKEN STATUS + BURN ECONOMICS
         ══════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Token Distribution */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[12px] font-semibold text-txt-secondary flex items-center gap-2">
              <Rocket className="h-3.5 w-3.5 text-crimson" />
              Token Distribution
            </h3>
            <span className="text-[10px] font-mono text-txt-muted">{totalTokens} total</span>
          </div>

          <div className="space-y-3.5">
            <DistBar label="Pre-Graduation" sublabel="Active on bonding curve" count={activeTokens} total={totalTokens} color="bg-crimson" />
            <DistBar label="Heating" sublabel="Approaching threshold" count={graduatingSoon} total={totalTokens} color="bg-bronze" />
            <DistBar label="Ascended" sublabel="Graduated to Raydium CPMM" count={graduatedTokens} total={totalTokens} color="bg-teal" />
          </div>

          {totalTokens === 0 && (
            <div className="text-center py-8">
              <p className="text-[11px] text-txt-muted font-lore italic">No sparks kindled yet — the forge awaits</p>
            </div>
          )}
        </div>

        {/* Burn Economics */}
        <div className="card-obsidian obsidian-hover p-5 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-4 w-4 text-crimson" />
            <h3 className="text-[13px] font-lore font-semibold text-txt">The Economics of Fire</h3>
          </div>

          <div className="space-y-2.5">
            <EconRow label="Trade Fee" value="2% per trade" tag="ACTIVE" tagColor="text-teal" />
            <EconRow label="Burn Allocation" value="1% → permanent burn" tag="SEALED" tagColor="text-crimson" />
            <EconRow label="Treasury" value="0.5% → protocol treasury" />
            <EconRow label="Referral" value="0.5% → referrer (or extra burn)" />
            <div className="h-px my-1" style={{ background: "var(--border)" }} />
            <EconRow label="Hook Fee (Post-Grad)" value="0.25% TransferFee" tag="HOOK" tagColor="text-bronze" />
            <EconRow label="SOL/SKR Fees" value="1.5% strategic reserve + 0.5% treasury" tag="RESERVE" tagColor="text-teal" />
            <EconRow label="LP Lock" value="Dead wallet — forever" tag="PERMANENT" tagColor="text-teal" />
            <EconRow label="Creator Reward" value="0.5% at graduation → creator" />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          TRENDING TOKENS
         ══════════════════════════════════ */}
      {stats && stats.trendingTokens && stats.trendingTokens.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h3 className="text-[12px] font-semibold text-txt-secondary flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-teal" />
              Trending Tokens
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-txt-muted uppercase tracking-wider w-10">#</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-txt-muted uppercase tracking-wider">Token</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-txt-muted uppercase tracking-wider">Volume</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-txt-muted uppercase tracking-wider w-36">Ascension</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-txt-muted uppercase tracking-wider w-24">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.trendingTokens.slice(0, 10).map((t: any, i: number) => {
                  const gradAmt = stats.graduationAmount?.toNumber?.() ?? 1;
                  const progress = gradAmt > 0 ? Math.min(100, (t.account.realPigeonReserves.toNumber() / gradAmt) * 100) : 0;
                  return (
                    <motion.tr key={t.publicKey.toBase58()}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="group border-b border-[var(--border)] last:border-0 hover:bg-bg-elevated/60 transition-colors">
                      <td className="px-4 py-3 text-[12px] text-txt-muted font-mono">{i + 1}</td>
                      <td className="px-4 py-3">
                        <Link href={`/token/${t.account.tokenMint.toBase58()}`}
                          className="flex items-center gap-2.5 group-hover:text-teal transition-colors">
                          <div className="w-7 h-7 rounded-md bg-crimson/15 flex items-center justify-center text-crimson font-bold font-lore text-[11px]">
                            {t.account.symbol.charAt(0)}
                          </div>
                          <div>
                            <span className="block text-[12px] font-semibold text-txt group-hover:text-teal transition-colors">{t.account.name}</span>
                            <span className="text-[10px] font-mono text-txt-muted">${t.account.symbol}</span>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[12px] font-mono text-txt-secondary">{formatNumber(t.account.realPigeonReserves.toNumber() / 1e6)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-bronze to-crimson"
                              style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-txt-muted w-10 text-right">{progress.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {t.account.complete ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold bg-teal/10 text-teal border border-teal/20">
                            <Trophy className="h-2.5 w-2.5" /> Ascended
                          </span>
                        ) : progress >= 80 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold bg-bronze/10 text-bronze border border-bronze/20">
                            Heating
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold bg-crimson/8 text-crimson border border-crimson/15">
                            Kindled
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          ARCHIVE NOTE
         ══════════════════════════════════ */}
      <div className="card-obsidian p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 text-bronze" />
          <span className="text-[11px] font-semibold text-txt">The Vow</span>
          <span className="text-[9px] font-mono tracking-widest ml-auto animate-tag-flicker text-txt-muted">DECRYPTED</span>
        </div>
        <p className="text-[10px] mt-2 leading-relaxed text-txt-muted">
          All metrics on this page are derived from on-chain state. No off-chain databases, no cached estimates. What you see is what the chain holds.
        </p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════ */

function MetricCard({ icon: Icon, label, value, unit, color }: {
  icon: typeof Flame; label: string; value: string; unit?: string; color: string;
}) {
  return (
    <div className="card p-3.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <span className="text-[10px] text-txt-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-[16px] font-mono font-bold leading-tight ${color}`}>{value}</p>
      {unit && <p className="text-[10px] text-txt-muted mt-0.5">{unit}</p>}
    </div>
  );
}

function DistBar({ label, sublabel, count, total, color }: {
  label: string; sublabel: string; count: number; total: number; color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <div>
          <span className="text-[12px] text-txt font-medium">{label}</span>
          <span className="text-[10px] text-txt-muted ml-2">{sublabel}</span>
        </div>
        <span className="text-[12px] font-mono font-semibold text-txt">{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

function EconRow({ label, value, tag, tagColor }: {
  label: string; value: string; tag?: string; tagColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px] text-txt-muted">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-txt">{value}</span>
        {tag && <span className={`text-[8px] font-mono font-bold tracking-widest ${tagColor}`}>{tag}</span>}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Flame, TrendingUp, ExternalLink, Copy, Check,
  Award, Trophy, Target, Rocket, Star, Shield, BarChart3,
  Crown, Eye, Lock
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/shared/Skeleton";
import { shortenAddress, formatNumber, timeAgo } from "@/lib/utils";
import { EMPTY_STATES, SCORING } from "@/lib/lore";

interface CreatedToken {
  mint: string; symbol: string; name: string;
  realPigeonReserves: number; complete: boolean; createdAt: number;
}

function getScore(tokens: CreatedToken[]): number {
  const graduated = tokens.filter(t => t.complete).length;
  const active = tokens.filter(t => !t.complete).length;
  const burnContribution = tokens.reduce((s, t) => s + t.realPigeonReserves, 0) * 0.01;
  return Math.min(100, Math.round(
    (graduated * 30) + (tokens.length * 5) + (burnContribution > 100 ? 20 : burnContribution / 5) + (active > 0 ? 10 : 0)
  ));
}

function getTier(score: number) {
  if (score >= 80) return { name: "Archon", color: "text-crimson", bg: "bg-crimson/10", border: "border-crimson/20", icon: Crown };
  if (score >= 50) return { name: "Elder", color: "text-bronze", bg: "bg-bronze/10", border: "border-bronze/20", icon: Award };
  if (score >= 20) return { name: "Keeper", color: "text-teal", bg: "bg-teal/10", border: "border-teal/20", icon: Shield };
  return { name: "Initiate", color: "text-txt-muted", bg: "bg-bg-elevated", border: "border-[var(--border)]", icon: Star };
}

export default function ProfilePage() {
  const params = useParams();
  const address = params.address as string;
  const [createdTokens, setCreatedTokens] = useState<CreatedToken[]>([]);
  const [pigeonBalance, setPigeonBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/profile/${address}`);
        if (res.ok) {
          const data = await res.json();
          setCreatedTokens(data.createdTokens || []);
          setPigeonBalance(data.pigeonBalance || 0);
        }
      } catch {}
      setLoading(false);
    })();
  }, [address]);

  const graduated = createdTokens.filter(t => t.complete).length;
  const active = createdTokens.filter(t => !t.complete).length;
  const totalVolume = createdTokens.reduce((s, t) => s + t.realPigeonReserves, 0);
  const burnContribution = totalVolume * 0.01;
  const score = getScore(createdTokens);
  const tier = getTier(score);
  const TierIcon = tier.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

      {/* ══════════════════════════════════
          PROFILE HEADER
         ══════════════════════════════════ */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-lg bg-crimson/15 flex items-center justify-center text-crimson font-bold font-lore text-xl">
            {address.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[18px] font-bold font-mono text-txt">{shortenAddress(address, 6)}</h1>
              <button onClick={() => { navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="p-1.5 rounded hover:bg-bg-elevated transition-colors">
                {copied ? <Check className="h-3.5 w-3.5 text-teal" /> : <Copy className="h-3.5 w-3.5 text-txt-muted" />}
              </button>
              <a href={`https://solscan.io/account/${address}`} target="_blank" rel="noopener noreferrer"
                className="p-1.5 rounded hover:bg-bg-elevated transition-colors">
                <ExternalLink className="h-3.5 w-3.5 text-txt-muted" />
              </a>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${tier.bg} ${tier.color} border ${tier.border}`}>
                <TierIcon className="h-2.5 w-2.5" /> {tier.name}
              </span>
              <span className="text-[10px] text-txt-muted">{createdTokens.length} launches</span>
            </div>
          </div>

          {/* Score Circle */}
          <div className="text-center shrink-0">
            <div className={`w-14 h-14 rounded-full border-2 ${tier.border} flex items-center justify-center`}>
              <span className="text-[20px] font-bold font-mono text-txt">{score}</span>
            </div>
            <p className="text-[9px] text-txt-muted mt-1 uppercase tracking-wider">Score</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          STATS
         ══════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <ProfileStat icon={Rocket} label="Launches" value={createdTokens.length.toString()} color="text-crimson" />
        <ProfileStat icon={Trophy} label="Ascended" value={graduated.toString()} color="text-teal" />
        <ProfileStat icon={Target} label="Active" value={active.toString()} color="text-bronze" />
        <ProfileStat icon={Flame} label="Burn Contribution" value={formatNumber(burnContribution / 1e6)} unit="PIGEON" color="text-crimson" />
      </div>

      {/* ══════════════════════════════════
          TRUST MARKERS
         ══════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <TrustBadge icon={Shield} label="Verified Creator" active={graduated > 0} lore="Has graduated a token" />
        <TrustBadge icon={Trophy} label="Ascension Achieved" active={graduated > 0} lore="Token reached Meteora" />
        <TrustBadge icon={Flame} label="Burns PIGEON" active={burnContribution > 0} lore="Contributed to deflation" />
        <TrustBadge icon={Target} label="Active Builder" active={active > 0} lore="Maintains live tokens" />
      </div>

      {/* ══════════════════════════════════
          LAUNCH HISTORY
         ══════════════════════════════════ */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-[12px] font-semibold text-txt-secondary flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-bronze" />
            Launch History
          </h3>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : createdTokens.length === 0 ? (
          <div className="text-center py-14">
            <div className="w-12 h-12 rounded-lg bg-bg-elevated flex items-center justify-center mx-auto mb-3">
              <Rocket className="h-5 w-5 text-txt-muted" />
            </div>
            <p className="text-[12px] text-txt-secondary font-medium">{EMPTY_STATES.noLaunches.text}</p>
            <p className="text-[10px] text-txt-muted font-lore italic mt-1">{EMPTY_STATES.noLaunches.lore}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-txt-muted uppercase tracking-wider">Token</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-txt-muted uppercase tracking-wider">Volume</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-txt-muted uppercase tracking-wider">Created</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-txt-muted uppercase tracking-wider w-24">Status</th>
                </tr>
              </thead>
              <tbody>
                {createdTokens.map((token, i) => (
                  <motion.tr key={token.mint}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="group border-b border-[var(--border)] last:border-0 hover:bg-bg-elevated/60 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/token/${token.mint}`}
                        className="flex items-center gap-2.5 group-hover:text-teal transition-colors">
                        <div className="w-7 h-7 rounded-md bg-crimson/15 flex items-center justify-center text-crimson font-bold font-lore text-[11px]">
                          {token.symbol.charAt(0)}
                        </div>
                        <div>
                          <span className="block text-[12px] font-semibold text-txt group-hover:text-teal transition-colors">{token.name}</span>
                          <span className="text-[10px] font-mono text-txt-muted">${token.symbol}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[12px] font-mono text-txt-secondary">{formatNumber(token.realPigeonReserves / 1e6)}</span>
                      <span className="text-[10px] text-txt-muted ml-1">PIGEON</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[11px] text-txt-muted">{token.createdAt > 0 ? timeAgo(token.createdAt) : "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {token.complete ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold bg-teal/10 text-teal border border-teal/20">
                          <Trophy className="h-2.5 w-2.5" /> Ascended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold bg-crimson/8 text-crimson border border-crimson/15">
                          Kindled
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scoring methodology */}
      <div className="card-obsidian p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 text-bronze" />
          <span className="text-[11px] font-semibold text-txt">The Counterfeit</span>
          <span className="text-[9px] font-mono tracking-widest ml-auto animate-tag-flicker text-txt-muted">DECRYPTED</span>
        </div>
        <p className="text-[10px] mt-2 leading-relaxed text-txt-muted">
          {SCORING.formula}. {SCORING.disclaimer}
        </p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════ */

function ProfileStat({ icon: Icon, label, value, unit, color }: {
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

function TrustBadge({ icon: Icon, label, active, lore }: {
  icon: typeof Shield; label: string; active: boolean; lore: string;
}) {
  return (
    <div className={`card p-3 transition-opacity ${active ? "" : "opacity-35"}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-3.5 w-3.5 ${active ? "text-teal" : "text-txt-muted"}`} />
        <span className="text-[11px] font-medium text-txt">{label}</span>
        {active && <Check className="h-3 w-3 text-teal ml-auto" />}
      </div>
      <p className="text-[9px] text-txt-muted">{lore}</p>
    </div>
  );
}

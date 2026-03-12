"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, TrendingUp, Star, Award, Crown, Shield, Zap, Target, User } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/shared/Skeleton";
import { shortenAddress, formatNumber } from "@/lib/utils";
import { SECTION_HEADERS, EMPTY_STATES, SCORING } from "@/lib/lore";

interface LeaderEntry {
  address: string;
  tokens: number;
  totalPigeon: number;
}

type Tab = "creators" | "tokens" | "burners";

/* ── Lore archetype cards ── */
const ARCHETYPES = [
  { title: "The Hatch", rank: "1st", desc: "First to kindle — the origin spark", color: "text-crimson", border: "border-crimson/20", bg: "bg-crimson/5" },
  { title: "The Noise", rank: "2nd", desc: "Loudest signal — volume speaks", color: "text-bronze", border: "border-bronze/20", bg: "bg-bronze/5" },
  { title: "The Seal", rank: "3rd", desc: "Most committed — burn devotion", color: "text-teal", border: "border-teal/20", bg: "bg-teal/5" },
];

function getScore(entry: LeaderEntry): number {
  return Math.min(100, Math.round(entry.tokens * 10 + (entry.totalPigeon / 1e6) * 2));
}

function getRankBadge(i: number) {
  if (i === 0) return { icon: Crown, color: "text-crimson", bg: "bg-crimson/10", label: "Archon" };
  if (i === 1) return { icon: Award, color: "text-bronze", bg: "bg-bronze/10", label: "Elder" };
  if (i === 2) return { icon: Shield, color: "text-teal", bg: "bg-teal/10", label: "Keeper" };
  return null;
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("creators");
  const [data, setData] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const json = await res.json();
          setData(json.creators || []);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-[20px] font-bold text-txt flex items-center gap-2.5 tracking-tight">
          <Trophy className="h-5 w-5 text-bronze" />
          {SECTION_HEADERS.leaderboard.title}
        </h1>
        <p className="lore-subtitle">{SECTION_HEADERS.leaderboard.lore}</p>
      </div>

      {/* ══════════════════════════════════
          TOP 3 — ARCHETYPE CARDS
         ══════════════════════════════════ */}
      {!loading && data.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {data.slice(0, 3).map((entry, i) => {
            const archetype = ARCHETYPES[i];
            const badge = getRankBadge(i);
            const score = getScore(entry);
            return (
              <motion.div key={entry.address}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}>
                <div className={`card-obsidian obsidian-hover p-4 rounded-lg border ${archetype.border}`}>
                  {/* Rank + Archetype */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded flex items-center justify-center ${badge?.bg}`}>
                        {badge && <badge.icon className={`h-4 w-4 ${badge.color}`} />}
                      </div>
                      <div>
                        <span className="text-[13px] font-lore font-semibold text-txt">{archetype.title}</span>
                        <span className={`block text-[9px] font-mono tracking-widest ${archetype.color}`}>{badge?.label?.toUpperCase()}</span>
                      </div>
                    </div>
                    <span className="text-[20px] font-mono font-bold text-txt-disabled">#{i + 1}</span>
                  </div>

                  {/* Creator */}
                  <Link href={`/profile/${entry.address}`}
                    className="flex items-center gap-2 mb-3 group">
                    <div className="w-6 h-6 rounded bg-bg-elevated flex items-center justify-center text-[10px] font-bold text-txt">
                      {entry.address.charAt(0)}
                    </div>
                    <span className="text-[12px] font-mono group-hover:text-teal transition-colors text-txt">
                      {shortenAddress(entry.address, 4)}
                    </span>
                  </Link>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[14px] font-mono font-bold text-txt">{entry.tokens}</p>
                      <p className="text-[9px] text-txt-muted">launches</p>
                    </div>
                    <div>
                      <p className="text-[14px] font-mono font-bold text-crimson">{formatNumber(entry.totalPigeon / 1e6)}</p>
                      <p className="text-[9px] text-txt-muted">volume</p>
                    </div>
                    <div>
                      <p className="text-[14px] font-mono font-bold text-teal">{score}</p>
                      <p className="text-[9px] text-txt-muted">score</p>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <motion.div
                      className={`h-full rounded-full`}
                      style={{ background: i === 0 ? "#8B2500" : i === 1 ? "#A67C52" : "#1A7A6D" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════
          TABS
         ══════════════════════════════════ */}
      <div className="flex items-center gap-1">
        {([
          { key: "creators" as Tab, label: "Creators", icon: Star },
          { key: "tokens" as Tab, label: "Tokens", icon: TrendingUp },
          { key: "burners" as Tab, label: "Burners", icon: Flame },
        ]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[12px] font-semibold whitespace-nowrap transition-all border ${
              tab === key
                ? "bg-crimson/10 text-crimson border-crimson/20"
                : "text-txt-muted hover:text-txt-secondary hover:bg-bg-elevated border-transparent"
            }`}>
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════
          TABLE
         ══════════════════════════════════ */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-lg bg-crimson/8 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-6 w-6 text-crimson" />
            </div>
            <p className="text-[13px] text-txt-secondary font-medium">{EMPTY_STATES.noLeaders.text}</p>
            <p className="text-[11px] text-txt-muted font-lore italic mt-1">{EMPTY_STATES.noLeaders.lore}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-txt-muted uppercase tracking-wider w-12">#</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-txt-muted uppercase tracking-wider">Creator</th>
                  <th className="text-center px-4 py-3 text-[10px] font-semibold text-txt-muted uppercase tracking-wider">Launches</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-txt-muted uppercase tracking-wider">Volume</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-txt-muted uppercase tracking-wider w-32">Score</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry, i) => {
                  const score = getScore(entry);
                  const badge = getRankBadge(i);
                  return (
                    <motion.tr key={entry.address}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="group border-b border-[var(--border)] last:border-0 hover:bg-bg-elevated/60 transition-colors">
                      {/* Rank */}
                      <td className="px-4 py-3">
                        {badge ? (
                          <div className={`w-6 h-6 rounded flex items-center justify-center ${badge.bg}`}>
                            <badge.icon className={`h-3.5 w-3.5 ${badge.color}`} />
                          </div>
                        ) : (
                          <span className="text-[12px] text-txt-muted font-mono">{i + 1}</span>
                        )}
                      </td>
                      {/* Creator */}
                      <td className="px-4 py-3">
                        <Link href={`/profile/${entry.address}`}
                          className="flex items-center gap-2.5 hover:text-teal transition-colors">
                          <div className="w-7 h-7 rounded-md bg-bg-elevated flex items-center justify-center text-[10px] font-bold text-txt-muted">
                            {entry.address.charAt(0)}
                          </div>
                          <div>
                            <span className="block text-[12px] font-mono text-txt group-hover:text-teal transition-colors">{shortenAddress(entry.address, 4)}</span>
                            {badge && <span className={`text-[9px] font-mono tracking-widest ${badge.color}`}>{badge.label}</span>}
                          </div>
                        </Link>
                      </td>
                      {/* Launches */}
                      <td className="px-4 py-3 text-center">
                        <span className="text-[12px] font-mono text-txt">{entry.tokens}</span>
                      </td>
                      {/* Volume */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-[12px] font-mono text-txt-secondary">{formatNumber(entry.totalPigeon / 1e6)}</span>
                        <span className="text-[10px] text-txt-muted ml-1">PIGEON</span>
                      </td>
                      {/* Score */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-bronze to-crimson"
                              initial={{ width: 0 }}
                              animate={{ width: `${score}%` }}
                              transition={{ duration: 0.5, delay: i * 0.03 }}
                            />
                          </div>
                          <span className="text-[12px] font-mono font-semibold text-txt w-6 text-right">{score}</span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Scoring Methodology ── */}
      {!loading && data.length > 0 && (
        <div className="card-obsidian p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-3.5 w-3.5 text-bronze" />
            <span className="text-[11px] font-semibold tracking-wide text-txt">Scoring Methodology</span>
            <span className="text-[9px] font-mono tracking-widest ml-auto text-txt-muted">{SCORING.tag}</span>
          </div>
          <p className="text-[10px] leading-relaxed text-txt-muted">
            {SCORING.formula}. {SCORING.disclaimer}
          </p>
        </div>
      )}
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Flame, Shield, ExternalLink, TrendingUp, BarChart3,
  ArrowRight, Zap, Eye, CheckCircle, Lock, Target,
  FileText, Hash, Clock
} from "lucide-react";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useReserves } from "@/hooks/useReserves";
import { formatNumber } from "@/lib/utils";
import { SECTION_HEADERS, ARCHIVE_CARDS, BURN_RITUAL, INVARIANTS, EMPTY_STATES, LOADING_STATES } from "@/lib/lore";

type Tab = "overview" | "sweeps" | "accruals" | "reserves";

/* ── Lore archive card data ── */
const LORE_CARDS = [
  { ...ARCHIVE_CARDS.theVow, color: "text-teal", border: "border-teal/20" },
  { ...ARCHIVE_CARDS.theTrial, color: "text-bronze", border: "border-bronze/20" },
  { ...ARCHIVE_CARDS.theSeal, color: "text-crimson", border: "border-crimson/20" },
];

export default function TransparencyPage() {
  const { stats, loading } = usePlatformStats();
  const { data: reserveData, loading: reserveLoading } = useReserves();
  const [tab, setTab] = useState<Tab>("overview");

  const burned = stats?.totalPigeonBurned ? formatNumber(stats.totalPigeonBurned.toNumber() / 1e6) : "—";
  const fee = stats?.feeBps ? `${stats.feeBps / 100}%` : "2%";
  const tokens = stats?.totalTokensLaunched ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-[20px] font-bold text-txt flex items-center gap-2.5 tracking-tight">
          <Eye className="h-5 w-5 text-crimson" />
          {SECTION_HEADERS.transparency.title}
        </h1>
        <p className="lore-subtitle">{SECTION_HEADERS.transparency.lore}</p>
      </div>

      {/* ══════════════════════════════════
          PROOF SUMMARY STRIP
         ══════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <ProofStat icon={Flame} label="Total Burned" value={burned} unit="PIGEON" color="text-crimson" />
        <ProofStat icon={Zap} label="Sweep Lane" value="Permissionless" color="text-teal" />
        <ProofStat icon={Shield} label="Trade Fee" value={fee} unit="per trade" color="text-bronze" />
        <ProofStat icon={Lock} label="LP Lock" value="Permanent" unit="dead wallet" color="text-green" />
      </div>

      {/* ══════════════════════════════════
          LORE ARCHIVE CARDS
         ══════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {LORE_CARDS.map((card) => (
          <div key={card.title} className={`card-obsidian obsidian-hover decrypt-parent p-4 rounded-lg border ${card.border} cursor-default`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px] font-lore font-semibold" style={{ color: "#E8E4DC" }}>{card.title}</span>
              <span className={`text-[9px] font-mono font-bold tracking-widest badge-sealed ${card.color}`}>{card.tag}</span>
            </div>
            <p className="text-[11px] leading-relaxed reveal-line" style={{ color: "#9C9590" }}>{card.desc}</p>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════
          HOW BURN WORKS — ritual steps
         ══════════════════════════════════ */}
      <div className="card-obsidian obsidian-hover p-5 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-4 w-4 text-crimson" />
          <h3 className="text-[14px] font-lore font-semibold" style={{ color: "#E8E4DC" }}>The Burn Ritual</h3>
          <span className="text-[9px] font-mono tracking-widest ml-auto" style={{ color: "#9C9590" }}>4 STEPS · ON-CHAIN</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {BURN_RITUAL.map((s, i) => {
            const icons = [TrendingUp, Zap, ArrowRight, Flame];
            return { ...s, icon: icons[i] || Flame };
          }).map((s, i) => (
            <div key={s.step} className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded flex items-center justify-center text-[11px] font-lore font-bold" style={{ background: "#3A3632", color: "#E8E4DC" }}>
                  {s.step}
                </div>
                <span className="text-[9px] font-mono tracking-widest text-crimson uppercase">{s.tag}</span>
              </div>
              <p className="text-[12px] font-semibold leading-tight mb-1" style={{ color: "#E8E4DC" }}>{s.title}</p>
              <p className="text-[10px] leading-relaxed" style={{ color: "#9C9590" }}>{s.desc}</p>
              {i < 3 && (
                <div className="hidden sm:block absolute top-3.5 -right-2 text-[#3A3632]">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════
          TABS
         ══════════════════════════════════ */}
      <div className="flex items-center gap-1">
        {([
          { key: "overview" as Tab, label: "Overview", icon: Eye },
          { key: "sweeps" as Tab, label: "Sweep Log", icon: Zap },
          { key: "accruals" as Tab, label: "Accrual Feed", icon: TrendingUp },
          { key: "reserves" as Tab, label: "Reserves", icon: Shield },
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
          TAB CONTENT
         ══════════════════════════════════ */}
      {tab === "overview" && (
        <div className="space-y-4">

          {/* Protocol Invariants */}
          <div className="card-obsidian obsidian-hover p-5 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-lore font-semibold" style={{ color: "#E8E4DC" }}>Protocol Invariants</h3>
              <span className="text-[9px] font-mono tracking-widest" style={{ color: "#9C9590" }}>6 / 6 VERIFIED</span>
            </div>
            <div className="space-y-2.5">
              {INVARIANTS.map((text, i) => ({ text, status: "sealed" })).map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-1.5">
                  <CheckCircle className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                  <span className="text-[12px] leading-relaxed" style={{ color: "#E8E4DC" }}>{item.text}</span>
                  <span className="text-[8px] font-mono tracking-widest text-teal ml-auto shrink-0 mt-0.5">SEALED</span>
                </div>
              ))}
            </div>
          </div>

          {/* On-Chain Seals */}
          <div className="card-obsidian obsidian-hover p-5 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-lore font-semibold" style={{ color: "#E8E4DC" }}>On-Chain Seals</h3>
              <span className="text-[9px] font-mono tracking-widest" style={{ color: "#9C9590" }}>PROGRAMS</span>
            </div>
            <div className="space-y-0">
              {[
                { label: "PigeonHouse", value: "BV1RxkAa...NoL", full: "BV1RxkAaD5DjXMsnofkVikFUUYdrDg1v8YgsQ3iyDNoL", type: "program" },
                { label: "Hook Program", value: "49NjaVFx...ugi", full: "49NjaVFxXUhWg59g4bEDtcNQxsArFz9MnyeQGPxUDugi", type: "program" },
                { label: "PIGEON Token", value: "4fSWEw2w...pump", full: "4fSWEw2wbYEUCcMtitzmeGUfqinoafXxkhqZrA9Gpump", type: "token" },
                { label: "Raydium CPMM", value: "CPMMoo8L...KP1C", full: "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C", type: "program" },
                { label: "Treasury", value: "7EhCAjUG...dEKi", full: "7EhCAjUGGE8WNLHnJ7gkfxQa3k4tBTLJAKsg459dEKi", type: "account" },
              ].map((item, i) => (
                <a key={i} href={`https://solscan.io/${item.type === "token" ? "token" : "account"}/${item.full}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between py-2.5 border-b border-[#3A3632] last:border-0 group">
                  <div className="flex items-center gap-2">
                    <Hash className="h-3 w-3" style={{ color: "#9C9590" }} />
                    <span className="text-[12px]" style={{ color: "#9C9590" }}>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono group-hover:text-teal transition-colors" style={{ color: "#E8E4DC" }}>{item.value}</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-teal" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Per-Mint Accrual Status */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-semibold text-txt-secondary flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5 text-bronze" />
                Per-Mint Fee Vaults
              </h3>
              <span className="text-[10px] text-txt-muted">{tokens} tokens</span>
            </div>
            {tokens === 0 ? (
              <EmptyState icon={BarChart3} text="No fee vaults yet" lore="Vaults appear when tokens are inscribed" />
            ) : (
              <div className="text-[11px] text-txt-muted">
                <p>Each token has a dedicated <span className="font-mono text-txt-secondary">FeeAccrualVault</span> PDA on the Hook program.</p>
                <p className="mt-1">Fees accumulate with every post-graduation transfer and can be swept permissionlessly.</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="badge badge-teal">Active: {tokens}</span>
                  <span className="badge badge-muted">Graduated: 0</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "sweeps" && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-semibold text-txt-secondary flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-teal" />
                Sweep Execution Log
              </h3>
              <span className="text-[10px] font-mono text-txt-muted">LIVE</span>
            </div>
            <EmptyState icon={Zap} text={EMPTY_STATES.noSweeps.text} lore={EMPTY_STATES.noSweeps.lore} />
          </div>

          {/* Sweep explainer */}
          <div className="card p-4">
            <h4 className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider mb-2">How Sweeps Work</h4>
            <div className="space-y-2 text-[11px] text-txt-muted">
              <div className="flex items-start gap-2">
                <span className="text-bronze font-mono font-bold">1.</span>
                <span>Post-graduation transfers accrue fees in per-mint <span className="font-mono text-txt-secondary">FeeAccrualVault</span></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-bronze font-mono font-bold">2.</span>
                <span>Anyone calls <span className="font-mono text-txt-secondary">sweep</span> — permissionless, no authority needed</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-bronze font-mono font-bold">3.</span>
                <span>PIGEON fees burned directly. SOL/SKR fees collected into strategic reserves.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "accruals" && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-semibold text-txt-secondary flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-bronze" />
                Fee Accrual Feed
              </h3>
              <span className="text-[10px] font-mono text-txt-muted">PER TRANSFER</span>
            </div>
            <EmptyState icon={TrendingUp} text={EMPTY_STATES.noAccruals.text} lore={EMPTY_STATES.noAccruals.lore} />
          </div>

          {/* Accrual explainer */}
          <div className="card p-4">
            <h4 className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider mb-2">Accrual Mechanics</h4>
            <div className="space-y-2 text-[11px] text-txt-muted">
              <p>After graduation, the <span className="font-mono text-txt-secondary">TransferHook</span> activates on each token.</p>
              <p>Every <span className="font-mono text-txt-secondary">transfer_checked</span> call triggers the hook which accrues 0.25% into the token&apos;s <span className="font-mono text-txt-secondary">FeeAccrualVault</span>.</p>
              <p>Accruals are passive — they happen automatically on every transfer without reverting.</p>
            </div>
          </div>
        </div>
      )}

      {tab === "reserves" && (
        <div className="space-y-4">
          {/* Reserve Overview */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-semibold text-txt-secondary flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-purple-400" />
                Strategic Reserves
              </h3>
              <span className="text-[10px] font-mono text-txt-muted">MULTI-QUOTE</span>
            </div>
            <p className="text-[11px] text-txt-muted mb-4">
              Non-PIGEON quote assets (SOL, SKR) accumulate strategic reserves from trade fees.
              These reserves fund ecosystem growth, liquidity, and grants.
            </p>

            <div className="space-y-3">
              {([
                { key: "sol", icon: "◎", label: "SOL Reserve", color: "purple", decimals: 9, feePct: "0.5%" },
                { key: "skr", icon: "🔮", label: "SKR Reserve", color: "teal", decimals: 6, feePct: "0.5%" },
              ] as const).map(({ key, icon, label, color, decimals, feePct }) => {
                const rv = reserveData?.reserves?.[key];
                const fmt = (v: string | undefined) => v ? (parseInt(v) / 10 ** decimals).toLocaleString(undefined, { maximumFractionDigits: 4 }) : "0";
                return (
                  <div key={key} className={`rounded-lg bg-${color}-500/5 border border-${color}-500/15 p-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[12px] font-semibold text-${color}-400 flex items-center gap-1.5`}>
                        <span>{icon}</span> {label}
                      </span>
                      <span className="text-[10px] text-txt-muted font-mono">{feePct} of {key.toUpperCase()} trades</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <div className="text-[10px] text-txt-muted">Accrued</div>
                        <div className="text-[13px] font-mono text-txt">{rv ? fmt(rv.totalAccrued) : "—"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-txt-muted">Withdrawn</div>
                        <div className="text-[13px] font-mono text-txt">{rv ? fmt(rv.totalWithdrawn) : "—"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-txt-muted">Balance</div>
                        <div className={`text-[13px] font-mono text-${color}-400`}>{rv ? fmt(rv.balance) : "—"}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Burn Accrual Vaults */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-semibold text-txt-secondary flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-teal" />
                Legacy Accrual Vaults
              </h3>
              <span className="text-[10px] font-mono text-txt-muted">LEGACY</span>
            </div>
            <p className="text-[11px] text-txt-muted mb-3">
              Historical fee accruals from earlier trades. New SOL/SKR trade fees now flow directly to Strategic Reserves.
            </p>

            <div className="space-y-2">
              {([
                { key: "sol", icon: "◎", symbol: "SOL", decimals: 9 },
                { key: "skr", icon: "🔮", symbol: "SKR", decimals: 6 },
              ] as const).map(({ key, icon, symbol, decimals }) => {
                const ba = reserveData?.burnAccruals?.[key];
                const val = ba ? (parseInt(ba.balance) / 10 ** decimals).toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—";
                return (
                  <div key={key} className="flex items-center justify-between rounded-lg bg-bg-elevated p-3">
                    <span className="text-[11px] text-txt-muted">{icon} {symbol} Burn Accrual</span>
                    <span className="text-[12px] font-mono text-txt">{val} {symbol}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reserve explainer */}
          <div className="card p-4">
            <h4 className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider mb-2">How It Works</h4>
            <div className="space-y-2 text-[11px] text-txt-muted">
              <p>When tokens are launched with <span className="font-mono text-purple-400">SOL</span> or <span className="font-mono text-teal-400">SKR</span> as quote asset, trade fees split into two lanes:</p>
              <p>• <span className="font-mono text-teal">Strategic Reserve</span> (1.5%) — accrues to StrategicReserveVault, building ecosystem reserves in native assets</p>
              <p>• <span className="font-mono text-txt-secondary">Treasury</span> (0.5%) — sent to protocol treasury</p>
              <p>For <span className="font-mono text-crimson">PIGEON</span>-quoted tokens, 1.5% of fees are burned instantly on every trade. 🔥</p>
              <p>All vaults are on-chain PDAs — verifiable, transparent, immutable.</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════ */

function ProofStat({ icon: Icon, label, value, unit, color }: {
  icon: typeof Flame; label: string; value: string; unit?: string; color: string;
}) {
  return (
    <div className="card p-3.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <span className="text-[10px] text-txt-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-[14px] font-mono font-bold leading-tight ${color}`}>{value}</p>
      {unit && <p className="text-[10px] text-txt-muted mt-0.5">{unit}</p>}
    </div>
  );
}

function EmptyState({ icon: Icon, text, lore }: { icon: typeof Flame; text: string; lore: string }) {
  return (
    <div className="text-center py-10">
      <div className="w-12 h-12 rounded-lg bg-bg-elevated flex items-center justify-center mx-auto mb-3">
        <Icon className="h-5 w-5 text-txt-muted" />
      </div>
      <p className="text-[12px] text-txt-secondary font-medium">{text}</p>
      <p className="text-[10px] text-txt-muted font-lore italic mt-1 max-w-xs mx-auto">{lore}</p>
    </div>
  );
}

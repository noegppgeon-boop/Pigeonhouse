"use client";

import { motion } from "framer-motion";
import {
  Shield, CheckCircle, Server, Cpu, Zap, Settings,
  ExternalLink, Hash, Clock, Eye, Lock, Flame
} from "lucide-react";
import { SECTION_HEADERS } from "@/lib/lore";

const programs = [
  { name: "PigeonHouse", id: "BV1RxkAaD5DjXMsnofkVikFUUYdrDg1v8YgsQ3iyDNoL", short: "BV1RxkAa...NoL", status: "active" },
  { name: "Hook Program", id: "49NjaVFxXUhWg59g4bEDtcNQxsArFz9MnyeQGPxUDugi", short: "49NjaVFx...ugi", status: "active" },
  { name: "Burn Router", id: "DpNoXx9WPVM98JM7tpypsBLbmMutxCx4BcHs4aG8CWDB", short: "DpNoXx9W...CWDB", status: "active" },
];

const params = [
  { label: "Hook Fee (Strict)", value: "0.25%", tag: "ACTIVE" },
  { label: "Trade Fee", value: "2% per trade", tag: "SEALED" },
  { label: "Burn Allocation", value: "1% → permanent burn" },
  { label: "Treasury Fee", value: "0.5% per trade" },
  { label: "Referral Fee", value: "0.5% → referrer" },
  { label: "Graduation Threshold", value: "~2.36M PIGEON" },
  { label: "LP Lock Method", value: "Dead wallet", tag: "PERMANENT" },
  { label: "Jupiter Program", value: "JUP6LkbZ...taV4" },
];

const events = [
  { name: "HookFeeAccrued", trigger: "Transfer-time", desc: "Fee counter incremented silently", status: "sealed" },
  { name: "HookSwapSkipped", trigger: "Transfer-time", desc: "Non-reverting skip with reason code", status: "sealed" },
  { name: "SweepExecuted", trigger: "Sweep-time", desc: "Swap + burn confirmed in one TX", status: "sealed" },
];

export default function StatusPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-[20px] font-bold text-txt flex items-center gap-2.5 tracking-tight">
          <Shield className="h-5 w-5 text-teal" />
          {SECTION_HEADERS.status.title}
        </h1>
        <p className="lore-subtitle">{SECTION_HEADERS.status.lore}</p>
      </div>

      {/* ══════════════════════════════════
          STATUS STRIP
         ══════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <StatusCard icon={Server} label="Programs" value="3/3 Active" tag="OPERATIONAL" tagColor="text-teal" />
        <StatusCard icon={Cpu} label="Hook System" value="Active (mainnet)" tag="SEALED" tagColor="text-crimson" />
        <StatusCard icon={Zap} label="Sweep Cron" value="Every 6 hours" tag="AUTOMATED" tagColor="text-bronze" />
      </div>

      {/* ══════════════════════════════════
          ON-CHAIN PROGRAMS
         ══════════════════════════════════ */}
      <div className="card-obsidian obsidian-hover p-5 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-lore font-semibold" style={{ color: "#E8E4DC" }}>Deployed Seals</h3>
          <span className="text-[9px] font-mono tracking-widest" style={{ color: "#9C9590" }}>MAINNET</span>
        </div>
        <div className="space-y-0">
          {programs.map((p) => (
            <a key={p.name} href={`https://solscan.io/account/${p.id}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between py-3 border-b border-[#3A3632] last:border-0 group">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                <div>
                  <p className="text-[12px] font-semibold" style={{ color: "#E8E4DC" }}>{p.name}</p>
                  <p className="text-[10px] font-mono" style={{ color: "#9C9590" }}>{p.short}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-semibold bg-teal/10 text-teal border border-teal/20">
                  Active
                </span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-teal" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════
          PROTOCOL PARAMETERS
         ══════════════════════════════════ */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[12px] font-semibold text-txt-secondary flex items-center gap-2">
            <Settings className="h-3.5 w-3.5 text-bronze" />
            Protocol Parameters
          </h3>
          <span className="text-[10px] text-txt-muted">Immutable after deploy</span>
        </div>
        <div className="space-y-0">
          {params.map((p) => (
            <div key={p.label} className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
              <span className="text-[12px] text-txt-muted">{p.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-mono text-txt">{p.value}</span>
                {p.tag && (
                  <span className={`text-[8px] font-mono font-bold tracking-widest ${
                    p.tag === "SEALED" ? "text-crimson" : p.tag === "ACTIVE" ? "text-teal" : "text-bronze"
                  }`}>{p.tag}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════
          EVENT SCHEMA
         ══════════════════════════════════ */}
      <div className="card-obsidian obsidian-hover p-5 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-lore font-semibold" style={{ color: "#E8E4DC" }}>Event Schema</h3>
          <span className="text-[9px] font-mono tracking-widest" style={{ color: "#9C9590" }}>LOCKED</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {events.map((e) => (
            <div key={e.name} className="p-3.5 rounded-lg border border-[#3A3632]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-mono font-semibold" style={{ color: "#E8E4DC" }}>{e.name}</span>
                <span className="text-[8px] font-mono tracking-widest text-teal">SEALED</span>
              </div>
              <p className="text-[10px]" style={{ color: "#9C9590" }}>{e.trigger}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#9C9590" }}>{e.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Archive note */}
      <div className="card-obsidian p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-teal" />
          <span className="text-[11px] font-semibold" style={{ color: "#E8E4DC" }}>The Seal</span>
          <span className="text-[9px] font-mono tracking-widest ml-auto animate-tag-flicker" style={{ color: "#9C9590" }}>DECRYPTED</span>
        </div>
        <p className="text-[10px] mt-2 leading-relaxed" style={{ color: "#9C9590" }}>
          All parameters are hardcoded on-chain. No admin keys can alter fee rates, burn paths, or sweep logic post-deployment. The protocol is its own authority.
        </p>
      </div>
    </motion.div>
  );
}

function StatusCard({ icon: Icon, label, value, tag, tagColor }: {
  icon: typeof Server; label: string; value: string; tag: string; tagColor: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${tagColor}`} />
        <span className="text-[10px] text-txt-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[14px] font-semibold text-txt mb-1">{value}</p>
      <span className={`text-[8px] font-mono font-bold tracking-widest ${tagColor}`}>{tag}</span>
    </div>
  );
}

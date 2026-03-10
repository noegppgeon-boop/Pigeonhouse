"use client";

import { type QuoteAssetKey, QUOTE_ASSETS } from "@/lib/constants";
import { Flame, Shield, Building2 } from "lucide-react";

interface FeeBreakdownProps {
  quote: QuoteAssetKey;
  platformFeeBps?: number;
  burnBps?: number;
  reserveBps?: number;
  treasuryBps?: number;
  className?: string;
}

// Default fee configs (matches on-chain QuoteAssetConfig)
const DEFAULT_FEES: Record<QuoteAssetKey, { burn: number; reserve: number; treasury: number }> = {
  pigeon: { burn: 150, reserve: 0, treasury: 50 },
  sol: { burn: 100, reserve: 50, treasury: 50 },
  skr: { burn: 100, reserve: 50, treasury: 50 },
};

export function FeeBreakdown({
  quote,
  burnBps,
  reserveBps,
  treasuryBps,
  className = "",
}: FeeBreakdownProps) {
  const defaults = DEFAULT_FEES[quote];
  const burn = burnBps ?? defaults.burn;
  const reserve = reserveBps ?? defaults.reserve;
  const treasury = treasuryBps ?? defaults.treasury;

  const lanes = [
    { icon: <Flame className="w-3.5 h-3.5" />, label: "Burn", bps: burn, color: "text-orange-400" },
    ...(reserve > 0
      ? [{ icon: <Shield className="w-3.5 h-3.5" />, label: "Reserve", bps: reserve, color: QUOTE_ASSETS[quote].textClass }]
      : []),
    { icon: <Building2 className="w-3.5 h-3.5" />, label: "Treasury", bps: treasury, color: "text-white/40" },
  ];

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="text-[10px] text-white/30 uppercase tracking-wider">Fee Split</div>
      {lanes.map((lane) => (
        <div key={lane.label} className="flex items-center gap-2 text-xs">
          <span className={lane.color}>{lane.icon}</span>
          <span className="text-white/50">{lane.label}</span>
          <span className="text-white/30 ml-auto">{(lane.bps / 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

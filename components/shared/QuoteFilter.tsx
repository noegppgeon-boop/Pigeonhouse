"use client";

import { QUOTE_ASSETS, type QuoteAssetKey } from "@/lib/constants";

interface QuoteFilterProps {
  value: QuoteAssetKey | "all";
  onChange: (v: QuoteAssetKey | "all") => void;
}

const pills: { key: QuoteAssetKey | "all"; label: string; icon?: string }[] = [
  { key: "all", label: "All" },
  { key: "pigeon", label: "PIGEON", icon: QUOTE_ASSETS.pigeon.icon },
  { key: "sol", label: "SOL", icon: QUOTE_ASSETS.sol.icon },
  { key: "skr", label: "SKR", icon: QUOTE_ASSETS.skr.icon },
];

export function QuoteFilter({ value, onChange }: QuoteFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {pills.map((pill) => {
        const active = value === pill.key;
        return (
          <button
            key={pill.key}
            onClick={() => onChange(pill.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              active
                ? "bg-bg-card text-txt border border-bronze/30 shadow-sm"
                : "bg-bg-elevated text-txt-muted border border-transparent hover:bg-bg-card hover:text-txt-secondary"
            }`}
          >
            {pill.icon && <span>{pill.icon}</span>}
            <span>{pill.label}</span>
          </button>
        );
      })}
    </div>
  );
}

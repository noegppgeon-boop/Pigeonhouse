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
                ? "bg-white/10 text-white border border-white/20"
                : "bg-white/5 text-white/50 border border-transparent hover:bg-white/8 hover:text-white/70"
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

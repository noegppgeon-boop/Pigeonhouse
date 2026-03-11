"use client";

import { QUOTE_ASSETS, type QuoteAssetKey } from "@/lib/constants";
import { QUOTE_LORE } from "@/lib/lore";
import { Flame, Shield, Coins } from "lucide-react";

interface QuoteSelectorProps {
  selected: QuoteAssetKey;
  onSelect: (key: QuoteAssetKey) => void;
}

const icons: Record<QuoteAssetKey, React.ReactNode> = {
  pigeon: <Flame className="w-5 h-5" />,
  sol: <Coins className="w-5 h-5" />,
  skr: <Shield className="w-5 h-5" />,
};

const ACTIVE_STYLES: Record<QuoteAssetKey, string> = {
  pigeon: "border-amber-600/50 bg-amber-50/60 ring-1 ring-amber-600/30",
  sol: "border-purple-600/50 bg-purple-50/60 ring-1 ring-purple-600/30",
  skr: "border-teal/50 bg-teal/10 ring-1 ring-teal/30",
};

export function QuoteSelector({ selected, onSelect }: QuoteSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="text-sm text-txt-muted font-medium">Choose Your Launch Rail</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.keys(QUOTE_ASSETS) as QuoteAssetKey[]).map((key) => {
          const asset = QUOTE_ASSETS[key];
          const lore = QUOTE_LORE[key];
          const active = selected === key;

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`relative flex flex-col items-start p-4 rounded-xl border transition-all text-left ${
                active
                  ? ACTIVE_STYLES[key]
                  : "border-border bg-bg-elevated hover:bg-bg-card hover:border-bronze/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={active ? asset.textClass : "text-txt-muted"}>
                  {icons[key]}
                </span>
                <span className={`font-semibold ${active ? "text-txt" : "text-txt-secondary"}`}>
                  {asset.symbol}
                </span>
              </div>

              <p className="text-xs text-txt-muted mb-3 leading-relaxed">
                {lore.tagline}
              </p>

              <div className="text-[10px] text-txt-tertiary leading-relaxed">
                {lore.feeNote}
              </div>

              {active && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-bronze" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

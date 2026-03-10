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

export function QuoteSelector({ selected, onSelect }: QuoteSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="text-sm text-white/50 font-medium">Choose Your Launch Rail</div>
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
                  ? `border-${asset.color}-500/50 bg-${asset.color}-500/10 ring-1 ring-${asset.color}-500/30`
                  : "border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={active ? asset.textClass : "text-white/40"}>
                  {icons[key]}
                </span>
                <span className={`font-semibold ${active ? "text-white" : "text-white/60"}`}>
                  {asset.symbol}
                </span>
              </div>

              <p className="text-xs text-white/40 mb-3 leading-relaxed">
                {lore.tagline}
              </p>

              <div className="text-[10px] text-white/30 leading-relaxed">
                {lore.feeNote}
              </div>

              {active && (
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-${asset.color}-400`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

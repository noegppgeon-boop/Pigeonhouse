"use client";

import { QUOTE_ASSETS, getQuoteKeyByMint, type QuoteAssetKey } from "@/lib/constants";

interface QuoteBadgeProps {
  quote?: QuoteAssetKey;
  quoteMint?: string;
  compact?: boolean;
  className?: string;
}

export function QuoteBadge({ quote, quoteMint, compact, className = "" }: QuoteBadgeProps) {
  const key = quote || (quoteMint ? getQuoteKeyByMint(quoteMint) : undefined);
  if (!key) return null;

  const asset = QUOTE_ASSETS[key];

  return (
    <span
      className={`${asset.colorClass} ${asset.textClass} inline-flex items-center gap-1 rounded text-xs font-mono ${
        compact ? "px-1 py-0.5" : "px-1.5 py-0.5"
      } ${className}`}
    >
      <span>{asset.icon}</span>
      {!compact && <span>{asset.symbol}</span>}
    </span>
  );
}

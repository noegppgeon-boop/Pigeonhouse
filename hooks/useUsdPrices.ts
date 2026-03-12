"use client";

import { useState, useEffect } from "react";

export interface UsdPrices {
  pigeon: number;
  sol: number;
  skr: number;
}

const DEFAULT: UsdPrices = { pigeon: 0, sol: 0, skr: 0 };

export function useUsdPrices(): UsdPrices {
  const [prices, setPrices] = useState<UsdPrices>(DEFAULT);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/prices");
        if (!res.ok) return;
        const d = await res.json();
        if (!cancelled) {
          setPrices({
            pigeon: d.pigeon || 0,
            sol: d.sol || 0,
            skr: d.skr || 0,
          });
        }
      } catch {}
    }

    load();
    const iv = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  return prices;
}

/** Convert quote-denominated value to USD */
export function toUsd(amount: number, quoteKey: string, prices: UsdPrices): number {
  switch (quoteKey) {
    case "pigeon": return amount * prices.pigeon;
    case "sol": return amount * prices.sol;
    case "skr": return amount * prices.skr;
    default: return amount * prices.pigeon;
  }
}

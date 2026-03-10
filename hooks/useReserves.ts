"use client";

import { useState, useEffect, useCallback } from "react";

interface ReserveVault {
  totalAccrued: string;
  totalWithdrawn: string;
  balance: string;
}

interface BurnAccrualVault {
  totalAccrued: string;
  totalSwept: string;
  balance: string;
}

interface QuoteAssetConfig {
  symbol: string;
  decimals: number;
  platformFeeBps: number;
  pigeonBurnBps: number;
  reserveBps: number;
  treasuryBps: number;
  referralBps: number;
  enabledForLaunch: boolean;
  enabledForTrade: boolean;
  reserveEnabled: boolean;
  reserveCap: string;
}

export interface ReservesData {
  quoteAssets: Record<string, QuoteAssetConfig | null>;
  reserves: Record<string, ReserveVault | null>;
  burnAccruals: Record<string, BurnAccrualVault | null>;
}

export function useReserves() {
  const [data, setData] = useState<ReservesData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/reserves");
      if (!res.ok) throw new Error(`API ${res.status}`);
      const d = await res.json();
      setData(d);
    } catch (err: any) {
      console.error("[useReserves]", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading };
}

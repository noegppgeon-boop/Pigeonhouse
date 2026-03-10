"use client";

import { useState, useEffect, useCallback } from "react";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";

export interface CurveItem {
  publicKey: PublicKey;
  account: {
    tokenMint: PublicKey;
    creator: PublicKey;
    virtualPigeonReserves: BN;
    virtualTokenReserves: BN;
    realPigeonReserves: BN;
    realTokenReserves: BN;
    tokenTotalSupply: BN;
    complete: boolean;
    createdAt: BN;
    name: string;
    symbol: string;
    uri: string;
    bump: number;
  };
}

export interface PlatformStats {
  totalTokensLaunched: number;
  totalPigeonBurned: BN;
  totalVolume: BN;
  graduationAmount: BN;
  feeBps: number;
  recentTokens: CurveItem[];
  trendingTokens: CurveItem[];
  graduatingSoon: CurveItem[];
}

function deserializeCurve(raw: any): CurveItem {
  return {
    publicKey: new PublicKey(raw.publicKey),
    account: {
      tokenMint: new PublicKey(raw.account.tokenMint),
      creator: new PublicKey(raw.account.creator),
      virtualPigeonReserves: new BN(raw.account.virtualPigeonReserves),
      virtualTokenReserves: new BN(raw.account.virtualTokenReserves),
      realPigeonReserves: new BN(raw.account.realPigeonReserves),
      realTokenReserves: new BN(raw.account.realTokenReserves),
      tokenTotalSupply: new BN(raw.account.tokenTotalSupply),
      complete: raw.account.complete,
      createdAt: new BN(raw.account.createdAt),
      name: raw.account.name,
      symbol: raw.account.symbol,
      uri: raw.account.uri,
      bump: raw.account.bump,
    },
  };
}

export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/platform");
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();

      if (!data.config) {
        setLoading(false);
        return;
      }

      const allCurves = data.curves.map(deserializeCurve);
      const graduationAmount = new BN(data.config.graduationPigeonAmount);

      const recentTokens = [...allCurves].sort(
        (a, b) =>
          b.account.createdAt.toNumber() - a.account.createdAt.toNumber()
      );

      const trendingTokens = [...allCurves]
        .filter((c) => !c.account.complete)
        .sort(
          (a, b) =>
            b.account.realPigeonReserves.toNumber() -
            a.account.realPigeonReserves.toNumber()
        );

      const graduatingSoon = [...allCurves]
        .filter((c) => !c.account.complete)
        .sort((a, b) => {
          const gradNum = graduationAmount.toNumber();
          const aP = a.account.realPigeonReserves.toNumber() / gradNum;
          const bP = b.account.realPigeonReserves.toNumber() / gradNum;
          return bP - aP;
        });

      const totalVolume = allCurves.reduce(
        (acc: BN, c: CurveItem) => acc.add(c.account.realPigeonReserves),
        new BN(0)
      );

      setStats({
        totalTokensLaunched: parseInt(data.config.totalTokensLaunched),
        totalPigeonBurned: new BN(data.config.totalPigeonBurned),
        totalVolume,
        graduationAmount,
        feeBps: data.config.platformFeeBps,
        recentTokens: recentTokens.slice(0, 20),
        trendingTokens: trendingTokens.slice(0, 10),
        graduatingSoon: graduatingSoon.slice(0, 10),
      });
    } catch (err: any) {
      console.error("[PlatformStats] FAILED:", err?.message || err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}

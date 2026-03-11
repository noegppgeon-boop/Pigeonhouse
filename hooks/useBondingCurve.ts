"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import {
  getQuoteBuy,
  getQuoteSell,
  getCurrentPrice,
  getMarketCap,
  getProgressPercent,
  type BondingCurveData,
  type GlobalConfigData,
} from "@/lib/pigeon_house";
import { getQuoteAssetByMint } from "@/lib/constants";

function deserializeCurve(raw: any): BondingCurveData {
  return {
    tokenMint: new PublicKey(raw.tokenMint),
    creator: new PublicKey(raw.creator),
    quoteMint: raw.quoteMint ? new PublicKey(raw.quoteMint) : undefined,
    virtualPigeonReserves: new BN(raw.virtualPigeonReserves),
    virtualTokenReserves: new BN(raw.virtualTokenReserves),
    realPigeonReserves: new BN(raw.realPigeonReserves),
    realTokenReserves: new BN(raw.realTokenReserves),
    tokenTotalSupply: new BN(raw.tokenTotalSupply),
    complete: raw.complete,
    createdAt: new BN(raw.createdAt),
    name: raw.name,
    symbol: raw.symbol,
    uri: raw.uri,
    bump: raw.bump,
  };
}

function deserializeConfig(raw: any): GlobalConfigData {
  return {
    authority: new PublicKey(raw.authority),
    pigeonMint: new PublicKey(raw.pigeonMint),
    treasury: new PublicKey(raw.treasury),
    platformFeeBps: raw.platformFeeBps,
    graduationPigeonAmount: new BN(raw.graduationPigeonAmount),
    totalTokensLaunched: new BN(raw.totalTokensLaunched),
    totalPigeonBurned: new BN(raw.totalPigeonBurned),
  };
}

export function useBondingCurve(mintAddress: string | null) {
  const [curve, setCurve] = useState<BondingCurveData | null>(null);
  const [config, setConfig] = useState<GlobalConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!mintAddress) return;
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`/api/token/${mintAddress}`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCurve(deserializeCurve(data.curve));
      setConfig(deserializeConfig(data.config));
      setError(null);
    } catch (err: any) {
      console.error("[useBondingCurve]", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mintAddress]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 15_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const quoteBuy = useCallback(
    (pigeonIn: BN) => {
      if (!curve || !config) return null;
      return getQuoteBuy(curve, pigeonIn, config.platformFeeBps);
    },
    [curve, config]
  );

  const quoteSell = useCallback(
    (tokensIn: BN) => {
      if (!curve || !config) return null;
      return getQuoteSell(curve, tokensIn, config.platformFeeBps);
    },
    [curve, config]
  );

  const quoteDecimals = useMemo(() => {
    if (!curve?.quoteMint) return 6;
    const qa = getQuoteAssetByMint(curve.quoteMint.toBase58());
    return qa?.decimals ?? 6;
  }, [curve]);
  const price = useMemo(() => (curve ? getCurrentPrice(curve, quoteDecimals) : 0), [curve, quoteDecimals]);
  const mcap = useMemo(() => (curve ? getMarketCap(curve, quoteDecimals) : new BN(0)), [curve, quoteDecimals]);
  const progress = useMemo(
    () =>
      curve && config
        ? getProgressPercent(curve, config.graduationPigeonAmount)
        : 0,
    [curve, config]
  );

  return {
    curve,
    config,
    loading,
    error,
    price,
    mcap,
    progress,
    quoteBuy,
    quoteSell,
    refetch: fetchData,
  };
}

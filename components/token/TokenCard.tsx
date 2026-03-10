"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, TrendingUp, Award } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useTokenImage } from "@/hooks/useTokenImage";
import BN from "bn.js";

interface TokenCardProps {
  mintAddress: string;
  curve: any;
  graduationAmount: BN;
  index?: number;
}

export default function TokenCard({ mintAddress, curve, graduationAmount, index = 0 }: TokenCardProps) {
  const name = curve.name || "Unknown";
  const symbol = curve.symbol || "???";
  const complete = curve.complete ?? false;
  const uri = curve.uri || null;
  const image = useTokenImage(uri);
  const pigeonReserve = curve.realPigeonReserves?.toNumber?.() ?? 0;
  const gradNum = graduationAmount.toNumber();
  const progress = gradNum > 0 ? Math.min(100, (pigeonReserve / gradNum) * 100) : 0;

  const vp = curve.virtualPigeonReserves?.toNumber?.() ?? 0;
  const vt = curve.virtualTokenReserves?.toNumber?.() ?? 0;
  const price = vt > 0 ? vp / vt : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
    >
      <Link href={`/token/${mintAddress}`}>
        <div className="card card-interactive card-lift p-3.5 h-full">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-2.5">
            {image ? (
              <img src={image} alt={symbol} className="w-8 h-8 rounded object-cover shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextElementSibling?.classList.remove("hidden"); }} />
            ) : null}
            <div className={`w-8 h-8 rounded bg-crimson flex items-center justify-center text-[#F5F0E8] font-bold text-caption shrink-0 ${image ? "hidden" : ""}`}>
              {symbol.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-body-sm font-semibold text-txt truncate">{name}</p>
                {complete ? (
                  <span className="badge badge-teal"><Award className="h-2.5 w-2.5" /> Ascended</span>
                ) : (
                  <span className="badge badge-crimson">Kindled</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-micro text-txt-muted font-mono">${symbol}</span>
                {price > 0 && (
                  <span className="text-micro text-txt-secondary font-mono">
                    {price < 0.001 ? price.toExponential(2) : price.toFixed(6)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar — bronze to crimson gradient */}
          <div className="mb-2.5">
            <div className="flex justify-between mb-1">
              <span className="text-micro text-txt-muted font-lore italic">Ascension</span>
              <span className="text-micro text-txt-secondary font-mono">{progress.toFixed(1)}%</span>
            </div>
            <div className="h-[3px] rounded-full bg-border-strong overflow-hidden">
              <motion.div
                className={`h-full ${complete ? "progress-fill-graduated" : "progress-fill"}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-micro">
            <div className="flex items-center gap-1 text-txt-muted">
              <TrendingUp className="h-3 w-3" />
              <span className="font-mono">{pigeonReserve > 0 ? formatNumber(pigeonReserve / 1e6) : "0"}</span>
              <span>vol</span>
            </div>
            <div className="flex items-center gap-1 text-crimson">
              <Flame className="h-3 w-3" />
              <span className="font-mono">{formatNumber((pigeonReserve * 0.01) / 1e6)}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

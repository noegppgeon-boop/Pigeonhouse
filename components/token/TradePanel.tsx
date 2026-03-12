"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Flame, Settings, ArrowDown, ArrowUpRight, ArrowDownRight, Wallet, Loader2 } from "lucide-react";
import BN from "bn.js";
import dynamic from "next/dynamic";
import {
  type BondingCurveData,
  type GlobalConfigData,
  getQuoteBuy,
  getQuoteSell,
  executeBuy,
  executeSell,
  formatPigeon,
  formatToken,
} from "@/lib/pigeon_house";
import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync, getAccount } from "@solana/spl-token";
import { DEFAULT_SLIPPAGE_BPS, PIGEON_DECIMALS, PIGEON_MINT, TOKEN_DECIMALS, getQuoteKeyByMint, getQuoteAssetByMint, QUOTE_ASSETS, type QuoteAssetKey } from "@/lib/constants";
import { executeRouterSwap } from "@/lib/trade_router";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const PIGEON_MINT_STR = "4fSWEw2wbYEUCcMtitzmeGUfqinoafXxkhqZrA9Gpump";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

interface Props {
  mintAddress: string;
  curve: BondingCurveData;
  config: GlobalConfigData;
  onSuccess?: () => void;
  referrer?: string | null;
}

type Tab = "buy" | "sell";

function safeBnToFloat(bn: BN, decimals: number): number {
  const s = bn.toString();
  if (s.length <= decimals) return parseFloat("0." + s.padStart(decimals, "0"));
  const whole = s.slice(0, s.length - decimals);
  const frac = s.slice(s.length - decimals);
  return parseFloat(whole + "." + frac);
}

function formatBalance(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(2)}K`;
  return val.toFixed(2);
}

export default function TradePanel({ mintAddress, curve, config, onSuccess, referrer }: Props) {
  const { publicKey, wallet, signTransaction, signAllTransactions, connected } = useWallet();
  const { connection } = useConnection();
  const [tab, setTab] = useState<Tab>("buy");
  const [amount, setAmount] = useState("");

  // Quote asset info
  const quoteMintStr = curve.quoteMint?.toBase58?.() ?? PIGEON_MINT.toBase58();
  const quoteKey = getQuoteKeyByMint(quoteMintStr) ?? "pigeon";
  const quoteAsset = QUOTE_ASSETS[quoteKey];
  const quoteSymbol = quoteAsset.symbol;
  const quoteDecimals = quoteAsset.decimals;
  const [slippageBps, setSlippageBps] = useState(DEFAULT_SLIPPAGE_BPS);
  const [showSlippage, setShowSlippage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payWithSol, setPayWithSol] = useState(false);
  const [jupQuote, setJupQuote] = useState<any>(null);

  // Wallet balances
  const [quoteBalance, setQuoteBalance] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Fetch wallet balances (quote-aware)
  const fetchBalances = useCallback(async () => {
    if (!publicKey || !connection) {
      setQuoteBalance(null);
      setTokenBalance(null);
      setSolBalance(null);
      return;
    }
    setBalanceLoading(true);
    try {
      const sol = await connection.getBalance(publicKey);
      setSolBalance(sol / 1e9);

      // Quote asset balance (PIGEON/SOL/SKR)
      try {
        const quoteMintPubkey = new PublicKey(quoteMintStr);
        if (quoteKey === "sol") {
          // For SOL quote, use native SOL balance (will be wrapped on trade)
          setQuoteBalance(sol / 1e9);
        } else {
          const quoteAta = getAssociatedTokenAddressSync(quoteMintPubkey, publicKey, false, quoteAsset.tokenProgram);
          const quoteAcc = await getAccount(connection, quoteAta, "confirmed", quoteAsset.tokenProgram);
          setQuoteBalance(Number(quoteAcc.amount) / 10 ** quoteDecimals);
        }
      } catch {
        setQuoteBalance(0);
      }

      try {
        const tokenMint = new PublicKey(mintAddress);
        const tokenAta = getAssociatedTokenAddressSync(tokenMint, publicKey, false, TOKEN_2022_PROGRAM_ID);
        const tokenAcc = await getAccount(connection, tokenAta, "confirmed", TOKEN_2022_PROGRAM_ID);
        setTokenBalance(Number(tokenAcc.amount) / 10 ** TOKEN_DECIMALS);
      } catch {
        setTokenBalance(0);
      }
    } catch {} finally {
      setBalanceLoading(false);
    }
  }, [publicKey, connection, mintAddress, quoteMintStr, quoteKey, quoteAsset, quoteDecimals]);

  useEffect(() => { fetchBalances(); }, [fetchBalances]);

  // Refresh balances after successful trade
  useEffect(() => {
    if (txSig) {
      const t = setTimeout(fetchBalances, 2500);
      return () => clearTimeout(t);
    }
  }, [txSig, fetchBalances]);

  const amountNum = useMemo(() => {
    const n = parseFloat(amount);
    return isNaN(n) || n <= 0 ? 0 : n;
  }, [amount]);

  const amountBN = useMemo(() => {
    if (amountNum <= 0) return null;
    const decimals = tab === "buy" ? quoteDecimals : TOKEN_DECIMALS;
    return new BN(Math.floor(amountNum * 10 ** decimals));
  }, [amountNum, tab]);

  const exceedsBalance = useMemo(() => {
    if (amountNum <= 0) return false;
    if (tab === "buy") return quoteBalance !== null && amountNum > quoteBalance;
    return tokenBalance !== null && amountNum > tokenBalance;
  }, [amountNum, tab, quoteBalance, tokenBalance]);

  const quote = useMemo(() => {
    if (!amountBN) return null;
    if (curve.complete) return null; // Post-graduation: no bonding curve quote
    if (tab === "buy") return getQuoteBuy(curve, amountBN, config.platformFeeBps);
    return getQuoteSell(curve, amountBN, config.platformFeeBps);
  }, [amountBN, curve, config, tab]);

  const burnEstimate = useMemo(() => quote?.fee ?? null, [quote]);

  // Price impact
  const priceImpact = useMemo(() => {
    if (!amountBN || !quote || amountNum <= 0) return null;
    const vp = safeBnToFloat(curve.virtualPigeonReserves, quoteDecimals);
    const vt = safeBnToFloat(curve.virtualTokenReserves, TOKEN_DECIMALS);
    if (vt === 0 || vp === 0) return null;
    const priceBefore = vp / vt;
    let priceAfter: number;
    if (tab === "buy") {
      const net = safeBnToFloat((quote as any).netPigeon, quoteDecimals);
      const out = safeBnToFloat((quote as any).tokensOut, TOKEN_DECIMALS);
      priceAfter = (vp + net) / (vt - out);
    } else {
      const pigOut = safeBnToFloat((quote as any).pigeonOut, quoteDecimals);
      priceAfter = (vp - pigOut) / (vt + amountNum);
    }
    return Math.abs((priceAfter - priceBefore) / priceBefore) * 100;
  }, [amountBN, quote, curve, tab, amountNum]);

  const handleMax = useCallback(() => {
    if (tab === "buy" && quoteBalance !== null && quoteBalance > 0) {
      const max = Math.max(0, quoteBalance - 0.01);
      setAmount(max > 0 ? max.toFixed(quoteDecimals) : "");
    } else if (tab === "sell" && tokenBalance !== null && tokenBalance > 0) {
      setAmount(tokenBalance.toFixed(TOKEN_DECIMALS));
    }
  }, [tab, quoteBalance, tokenBalance]);

  const handlePreset = useCallback((pct: number) => {
    const bal = tab === "buy" ? quoteBalance : tokenBalance;
    if (!bal || bal <= 0) return;
    const decimals = tab === "buy" ? quoteDecimals : TOKEN_DECIMALS;
    setAmount((bal * pct).toFixed(decimals));
  }, [tab, quoteBalance, tokenBalance]);

  const handleTrade = useCallback(async () => {
    if (!publicKey || !amountBN || !wallet || exceedsBalance) return;

    const walletAdapter = {
      publicKey,
      signTransaction: signTransaction!,
      signAllTransactions: signAllTransactions!,
    } as any;

    setLoading(true);
    setError(null);
    setTxSig(null);

    try {
      const mint = new PublicKey(mintAddress);
      let sig: string;

      if (curve.complete) {
        // Post-graduation: route through Trade Router → Raydium CPMM
        const decimals = tab === "buy" ? quoteDecimals : TOKEN_DECIMALS;
        const rawAmount = BigInt(Math.floor(amountNum * 10 ** decimals));
        // Slippage: for now 0 min out (user-facing slippage handled by CPMM)
        const minOut = BigInt(0);

        sig = await executeRouterSwap({
          wallet: walletAdapter,
          connection,
          tokenMint: mint,
          quoteMint: new PublicKey(quoteMintStr),
          isBuy: tab === "buy",
          amountIn: rawAmount,
          minimumAmountOut: minOut,
        });
      } else if (tab === "buy" && payWithSol && jupQuote && !jupQuote.error) {
        // SOL → quote asset swap via Jupiter, then buy on bonding curve
        // Step 1: Get Jupiter swap TX
        const swapRes = await fetch("/api/jupiter-swap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quoteResponse: jupQuote, userPublicKey: publicKey.toBase58() }),
        });
        const swapData = await swapRes.json();
        if (swapData.error) throw new Error("Jupiter swap failed: " + swapData.error);

        // Step 2: Sign and send Jupiter swap
        const txBuf = Buffer.from(swapData.swapTransaction, "base64");
        const swapTx = VersionedTransaction.deserialize(txBuf);
        const signedSwap = await signTransaction!(swapTx as any);
        const swapSig = await connection.sendRawTransaction(signedSwap.serialize(), { skipPreflight: true });
        await connection.confirmTransaction(swapSig, "confirmed");

        // Step 3: Now buy with the received quote asset
        // Use 95% of Jupiter output to account for rounding
        const quoteOut = new BN(jupQuote.outAmount).mul(new BN(95)).div(new BN(100));
        sig = await executeBuy(walletAdapter, mint, quoteOut, slippageBps, referrer || undefined);
      } else if (tab === "buy") {
        sig = await executeBuy(walletAdapter, mint, amountBN, slippageBps, referrer || undefined);
      } else {
        sig = await executeSell(walletAdapter, mint, amountBN, slippageBps, referrer || undefined);
      }
      setTxSig(sig);
      setAmount("");
      onSuccess?.();
    } catch (err: any) {
      const msg = err.message || "Transaction failed";
      if (msg.includes("User rejected")) setError("Unsigned — wallet rejected the transaction");
      else if (msg.includes("insufficient")) setError("Empty Nest — not enough to complete this offering");
      else if (msg.includes("Slippage")) setError("Signal Lost — price moved beyond your tolerance");
      else setError(msg.length > 120 ? msg.slice(0, 120) + "..." : msg);
    } finally {
      setLoading(false);
    }
  }, [publicKey, amountBN, wallet, tab, mintAddress, slippageBps, signTransaction, signAllTransactions, onSuccess, exceedsBalance, referrer]);

  // Jupiter SOL→QuoteAsset quote when payWithSol is enabled
  useEffect(() => {
    if (!payWithSol || tab !== "buy" || !amountNum || amountNum <= 0) {
      setJupQuote(null);
      return;
    }
    const ctrl = new AbortController();
    const solLamports = Math.floor(amountNum * 1e9);
    fetch(`/api/jupiter-quote?inputMint=${SOL_MINT}&outputMint=${quoteMintStr}&amount=${solLamports}&slippageBps=${slippageBps}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => { if (!ctrl.signal.aborted) setJupQuote(data); })
      .catch(() => {});
    return () => ctrl.abort();
  }, [payWithSol, tab, amountNum, slippageBps, quoteMintStr]);

  const isDisabled = !connected || !amountBN || loading || exceedsBalance || (payWithSol && tab === "buy" && !jupQuote);
  const currentBalance = tab === "buy" ? (payWithSol ? solBalance : quoteBalance) : tokenBalance;
  const balanceLabel = tab === "buy" ? (payWithSol ? "SOL" : quoteSymbol) : curve.symbol;

  return (
    <div className="card p-5">
      {/* Tabs */}
      <div className="flex rounded-lg bg-bg-elevated p-[3px] mb-5">
        {(["buy", "sell"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setAmount(""); setError(null); setTxSig(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2.5 text-body-sm font-semibold transition-colors ${
              tab === t
                ? t === "buy"
                  ? "bg-teal text-[#F5F0E8]"
                  : "bg-crimson/15 text-crimson"
                : "text-txt-muted hover:text-txt-secondary"
            }`}
          >
            {t === "buy" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {t === "buy" ? "Buy" : "Sell"}
          </button>
        ))}
      </div>

      {/* Wallet balance bar */}
      {connected && (
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5 text-caption text-txt-muted">
            <Wallet className="h-3.5 w-3.5" />
            <span>Balance:</span>
            {balanceLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <span className="text-txt-secondary font-mono">
                {currentBalance !== null ? formatBalance(currentBalance) : "—"}
              </span>
            )}
            <span>{balanceLabel}</span>
          </div>
          {solBalance !== null && (
            <span className="text-micro text-txt-muted font-mono">
              {solBalance.toFixed(3)} SOL
            </span>
          )}
        </div>
      )}

      {/* Pay with SOL toggle (buy only, non-SOL quotes, pre-graduation) */}
      {tab === "buy" && quoteKey !== "sol" && !curve.complete && (
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-caption text-txt-muted">Pay with</span>
          <div className="flex rounded-lg bg-bg-elevated p-[2px]">
            <button
              onClick={() => { setPayWithSol(false); setAmount(""); setError(null); }}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                !payWithSol ? `${quoteAsset.colorClass} ${quoteAsset.textClass}` : "text-txt-muted hover:text-txt-secondary"
              }`}
            >
              {quoteAsset.icon} {quoteSymbol}
            </button>
            <button
              onClick={() => { setPayWithSol(true); setAmount(""); setError(null); }}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                payWithSol ? "bg-purple-500/15 text-purple-400" : "text-txt-muted hover:text-txt-secondary"
              }`}
            >
              ◎ SOL
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className={`rounded-xl bg-bg-elevated p-4 mb-2 border transition-colors ${
        exceedsBalance ? "border-burn/50" : "border-transparent"
      }`}>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(null); }}
            className="flex-1 bg-transparent text-xl font-mono text-txt outline-none placeholder:text-txt-muted [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-body-sm font-semibold text-txt-secondary px-3 py-1.5 bg-border rounded-lg">
            {tab === "buy" ? (payWithSol ? "SOL" : quoteSymbol) : curve.symbol}
          </span>
        </div>
        {exceedsBalance && (
          <p className="text-caption text-crimson mt-1.5">Insufficient {balanceLabel} balance</p>
        )}
      </div>

      {/* Quick amount presets */}
      {tab === "buy" && (
        <div className="flex gap-1.5 mb-2">
          {(payWithSol ? [0.05, 0.1, 0.5, 1] : [10, 50, 100, 500]).map((val) => (
            <button key={val} onClick={() => { setAmount(String(val)); setError(null); }}
              className="flex-1 rounded-lg bg-bg-elevated py-1.5 text-caption font-mono text-txt-muted hover:text-teal hover:bg-teal/8 border border-transparent hover:border-teal/20 transition-all">
              {payWithSol ? `${val} ◎` : val}
            </button>
          ))}
        </div>
      )}

      {/* Percent presets + MAX */}
      {connected && currentBalance !== null && currentBalance > 0 && (
        <div className="flex gap-1.5 mb-3">
          {[0.25, 0.5, 0.75].map((pct) => (
            <button
              key={pct}
              onClick={() => handlePreset(pct)}
              className="flex-1 rounded-lg bg-bg-elevated py-1.5 text-caption font-mono text-txt-muted hover:text-txt hover:bg-border transition-colors"
            >
              {pct * 100}%
            </button>
          ))}
          <button
            onClick={handleMax}
            className="flex-1 rounded-lg py-1.5 text-caption font-bold text-teal hover:opacity-80 transition-colors"
            style={{ background: "var(--teal-dim)" }}
          >
            MAX
          </button>
        </div>
      )}

      {/* Slippage */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setShowSlippage(!showSlippage)}
          className="flex items-center gap-1 text-caption text-txt-muted hover:text-txt-secondary"
        >
          <Settings className="h-3 w-3" />
          Slippage {slippageBps / 100}%
        </button>
      </div>

      {showSlippage && (
        <div className="flex gap-2 mb-3">
          {[100, 300, 500, 1000].map((bps) => (
            <button
              key={bps}
              onClick={() => { setSlippageBps(bps); setShowSlippage(false); }}
              className={`rounded-lg px-3 py-1.5 text-caption font-mono ${
                slippageBps === bps
                  ? "bg-teal/15 text-teal border border-teal/30"
                  : "bg-bg-elevated text-txt-muted hover:text-txt border border-transparent"
              }`}
            >
              {bps / 100}%
            </button>
          ))}
        </div>
      )}

      {/* Arrow */}
      <div className="flex justify-center my-2">
        <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center">
          <ArrowDown className="h-4 w-4 text-txt-muted" />
        </div>
      </div>

      {/* Output */}
      <div className="rounded-xl bg-bg-elevated p-4 mb-4">
        <div className="text-caption text-txt-muted mb-1">You receive</div>
        <div className="flex items-center gap-2">
          <span className="flex-1 text-xl font-mono text-txt">
            {curve.complete
              ? amountNum > 0 ? "~market rate" : "0.00"
              : quote
                ? tab === "buy"
                  ? formatToken((quote as { tokensOut: BN }).tokensOut)
                  : formatPigeon((quote as { netPigeonOut: BN }).netPigeonOut)
                : "0.00"}
          </span>
          <span className="text-body-sm font-semibold text-txt-secondary px-3 py-1.5 bg-border rounded-lg">
            {tab === "buy" ? curve.symbol : quoteSymbol}
          </span>
        </div>
        {curve.complete && amountNum > 0 && (
          <div className="text-micro text-txt-muted mt-1">Routed via Raydium CPMM · 1% platform fee (0.5% burn 🔥)</div>
        )}
        {payWithSol && tab === "buy" && jupQuote && !jupQuote.error && amountNum > 0 && (
          <div className="text-micro text-txt-muted mt-1.5">
            ◎ {amountNum} SOL → ~{(Number(jupQuote.outAmount) / 10 ** quoteDecimals).toLocaleString()} {quoteSymbol} via Jupiter → Token
          </div>
        )}
      </div>

      {/* Trade details */}
      {((quote && amountNum > 0) || (curve.complete && amountNum > 0)) && (
        <div className="space-y-2 mb-4">
          {/* Burn — bonding curve or router */}
          {curve.complete && tab === "buy" && amountNum > 0 ? (
            <div className="flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-caption"
                 style={{ background: "var(--burn-dim)", borderColor: "rgba(255,92,58,0.12)" }}>
              <Flame className="h-3.5 w-3.5 text-crimson shrink-0" />
              <span className="text-crimson">
                <span className="font-mono font-semibold">{(amountNum * 0.005).toFixed(quoteDecimals)}</span>
                {" "}{quoteSymbol} burned instantly 🔥
              </span>
            </div>
          ) : quoteKey === "pigeon" && burnEstimate && !burnEstimate.isZero() ? (
            <div className="flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-caption"
                 style={{ background: "var(--burn-dim)", borderColor: "rgba(255,92,58,0.12)" }}>
              <Flame className="h-3.5 w-3.5 text-crimson shrink-0" />
              <span className="text-crimson">
                <span className="font-mono font-semibold">{formatPigeon(burnEstimate)}</span>
                {" "}PIGEON burned 🔥
              </span>
            </div>
          ) : null}

          {/* Price impact & fee */}
          <div className="rounded-xl bg-bg-elevated px-3 py-2 space-y-1">
            {priceImpact !== null && priceImpact > 0.01 && (
              <div className="flex justify-between text-caption">
                <span className="text-txt-muted">Price impact</span>
                <span className={priceImpact > 5 ? "text-crimson" : priceImpact > 2 ? "text-yellow-400" : "text-txt-muted"}>
                  {priceImpact.toFixed(2)}%
                </span>
              </div>
            )}
            <div className="flex justify-between text-caption">
              <span className="text-txt-muted">Trade fee</span>
              <span className="text-txt-muted">
                {curve.complete
                  ? "1% · 0.5% burn + 0.5% treasury"
                  : `2% · ${quoteKey === "pigeon" ? "burns PIGEON" : `${quoteSymbol} strategic reserve`}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action button */}
      {!connected ? (
        <WalletMultiButton className="!w-full !justify-center" />
      ) : (
        <button
          onClick={handleTrade}
          disabled={isDisabled}
          className={`w-full rounded-xl py-3.5 text-body-sm font-bold transition-all ${
            isDisabled
              ? "bg-border text-txt-muted cursor-not-allowed"
              : tab === "buy"
              ? `bg-teal text-[#F5F0E8] shadow-glow hover:opacity-90 ${amountNum > 0 ? "btn-glow-active" : ""}`
              : "bg-crimson/15 text-crimson hover:bg-burn/30"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Confirming...
            </span>
          ) : exceedsBalance ? (
            `Insufficient ${balanceLabel}`
          ) : !amountBN ? (
            "Enter amount"
          ) : tab === "buy" ? (
            `Buy ${curve.symbol}`
          ) : (
            `Sell ${curve.symbol}`
          )}
        </button>
      )}

      {/* Feedback */}
      {error && <p className="mt-3 text-caption text-crimson text-center">{error}</p>}
      {txSig && (
        <div className="mt-3 text-center animate-success-flash rounded-lg p-2">
          <p className="text-caption text-success">
            Mark Sealed —{" "}
            <a
              href={`https://solscan.io/tx/${txSig}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
            >
              View on Solscan →
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

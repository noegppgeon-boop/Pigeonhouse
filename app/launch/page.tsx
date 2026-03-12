"use client";

import { useState, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Image as ImageIcon, Rocket, Check,
  Wallet, FileText, Eye, Twitter, Send, Globe, ChevronRight,
  AlertTriangle, Shield, ArrowLeft, ExternalLink, Target,
  Lock, Zap, Copy, Award, Info, ChevronDown, TrendingUp
} from "lucide-react";
import dynamic from "next/dynamic";
import BN from "bn.js";
import Link from "next/link";
import { executeCreateToken } from "@/lib/pigeon_house";
import { uploadTokenAssets } from "@/lib/upload";
import { Keypair } from "@solana/web3.js";
import { PIGEON_DECIMALS, BURN_FEE_BPS, TREASURY_FEE_BPS, type QuoteAssetKey, QUOTE_ASSETS } from "@/lib/constants";
import { shortenAddress } from "@/lib/utils";
import { SECTION_HEADERS, LAUNCH_COPY, RESULT_COPY, HOW_IT_WORKS, QUOTE_LORE } from "@/lib/lore";
import { QuoteSelector } from "@/components/launch/QuoteSelector";
import { FeeBreakdown } from "@/components/token/FeeBreakdown";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

type Step = "connect" | "details" | "review" | "success";

const STEPS: { key: Step; label: string; lore: string; icon: typeof Wallet }[] = [
  { key: "connect", label: "Wallet", lore: "Identify", icon: Wallet },
  { key: "details", label: "Details", lore: "Inscribe", icon: FileText },
  { key: "review", label: "Seal & Launch", lore: "Commit", icon: Shield },
];

export default function LaunchPage() {
  const { publicKey, connected, wallet, signTransaction, signAllTransactions } = useWallet();
  const [step, setStep] = useState<Step>(connected ? "details" : "connect");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");
  const [initialBuy, setInitialBuy] = useState("");
  const [doInitialBuy, setDoInitialBuy] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuoteAssetKey>("pigeon");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ txSig: string; mint: string } | null>(null);
  const [riskAccepted, setRiskAccepted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mintCopied, setMintCopied] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB"); return; }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageUrl("");
      setError(null);
    }
  };

  const canSubmit = connected && name.trim() && symbol.trim() && !loading && riskAccepted;

  const handleLaunch = useCallback(async () => {
    if (!canSubmit || !publicKey) return;
    setLoading(true);
    setError(null);

    try {
      const walletAdapter = { publicKey, signTransaction: signTransaction!, signAllTransactions: signAllTransactions! } as any;

      setStatus("Uploading metadata to Arweave...");
      let uri: string;
      try {
        uri = await uploadTokenAssets(
          { provider: wallet?.adapter },
          { name: name.trim(), symbol: symbol.trim(), description: description.trim(), image: imageUrl.trim() || undefined, website: website.trim() || undefined, twitter: twitter.trim() || undefined, telegram: telegram.trim() || undefined },
          imageFile || undefined
        );
      } catch {
        const metadata = { name: name.trim(), symbol: symbol.trim(), description: description.trim(), image: imageUrl.trim() || "" };
        uri = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
      }

      // Fetch pre-ground vanity keypair ending with "burn"
      setStatus("Preparing vanity mint address...");
      let vanityKeypair: Keypair | undefined;
      try {
        const res = await fetch("/api/vanity-mint");
        if (res.ok) {
          const data = await res.json();
          vanityKeypair = Keypair.fromSecretKey(Uint8Array.from(data.secretKey));
          setStatus(`Vanity mint: ...${data.address.slice(-8)}`);
        }
      } catch {
        // Pool empty or unavailable — fall back to random keypair
      }

      setStatus("Creating token on-chain...");
      let initialBuyBN: BN | undefined;
      if (doInitialBuy) {
        const buyAmount = parseFloat(initialBuy);
        if (!isNaN(buyAmount) && buyAmount > 0) {
          initialBuyBN = new BN(Math.floor(buyAmount * 10 ** PIGEON_DECIMALS));
        }
      }

      const quoteMintPubkey = QUOTE_ASSETS[selectedQuote].mint;
      const { txSig, tokenMint } = await executeCreateToken(walletAdapter, name.trim(), symbol.trim(), uri, initialBuyBN, quoteMintPubkey, vanityKeypair ?? undefined);
      setSuccessData({ txSig, mint: tokenMint.toBase58() });
      setStep("success");
    } catch (err: any) {
      setError(err.message || "Launch failed");
    } finally {
      setLoading(false);
      setStatus(null);
    }
  }, [canSubmit, publicKey, name, symbol, description, imageUrl, imageFile, initialBuy, doInitialBuy, wallet, signTransaction, signAllTransactions, twitter, telegram, website]);

  if (connected && step === "connect") setStep("details");

  const stepIdx = STEPS.findIndex((s) => s.key === step);
  const resolvedImage = imagePreview || imageUrl;
  const hasSocials = twitter.trim() || telegram.trim() || website.trim();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-[960px] mx-auto">

      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-txt tracking-tight">{SECTION_HEADERS.launch.title}</h1>
        <p className="lore-subtitle">{SECTION_HEADERS.launch.lore}</p>
      </div>

      {/* ══════════════════════════════════
          STEPPER
         ══════════════════════════════════ */}
      {step !== "success" && (
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((s, i) => {
            const active = s.key === step;
            const done = i < stepIdx;
            return (
              <div key={s.key} className="flex items-center">
                <button
                  onClick={() => done && setStep(s.key)}
                  disabled={!done}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-semibold transition-all border
                    ${active
                      ? "bg-crimson text-[#F5F0E8] border-crimson shadow-glow"
                      : done
                      ? "bg-teal/8 text-teal border-teal/20 cursor-pointer hover:bg-teal/12"
                      : "bg-bg-card text-txt-muted border-[var(--border)]"
                    }
                  `}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    active ? "bg-[#F5F0E8]/20" : done ? "bg-teal/15" : "bg-bg-elevated"
                  }`}>
                    {done ? <Check className="h-3 w-3" /> : i + 1}
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="block leading-tight">{s.label}</span>
                    <span className={`block text-[9px] font-lore italic leading-tight ${active ? "text-[#F5F0E8]/70" : "text-current opacity-50"}`}>{s.lore}</span>
                  </div>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-px mx-1 ${i < stepIdx ? "bg-teal/30" : "bg-[var(--border)]"}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════
          MAIN GRID
         ══════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── LEFT: Form ── */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            <AnimatePresence mode="wait">

              {/* ── CONNECT ── */}
              {step === "connect" && (
                <StepContent key="connect" title={LAUNCH_COPY.connectTitle} lore={LAUNCH_COPY.connectLore}>
                  <div className="text-center py-10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-crimson/8 flex items-center justify-center">
                      <Wallet className="h-7 w-7 text-crimson" />
                    </div>
                    <p className="text-[13px] text-txt-secondary mb-4">Connect your Solana wallet to begin</p>
                    <WalletMultiButton />
                  </div>
                </StepContent>
              )}

              {/* ── DETAILS ── */}
              {step === "details" && (
                <StepContent key="details" title={LAUNCH_COPY.detailsTitle} lore={LAUNCH_COPY.detailsLore}>
                  <div className="space-y-4">
                    {/* Quote Asset Selection */}
                    <QuoteSelector selected={selectedQuote} onSelect={setSelectedQuote} />

                    {/* Fee Preview */}
                    <FeeBreakdown quote={selectedQuote} className="p-3 rounded-lg bg-bg-elevated border border-border" />

                    {/* Name + Symbol */}
                    <div className="grid grid-cols-5 gap-3">
                      <div className="col-span-3">
                        <Field label="Name" value={name} onChange={setName} placeholder="My Token" maxLength={32} required />
                      </div>
                      <div className="col-span-2">
                        <Field label="Symbol" value={symbol} onChange={(v) => setSymbol(v.toUpperCase())} placeholder="TKN" maxLength={10} mono required />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-[11px] text-txt-muted font-semibold uppercase tracking-wider mb-1.5">Description</label>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="What makes your token special?" rows={3}
                        className="input resize-none text-[13px]" maxLength={280} />
                      <div className="flex justify-end mt-1">
                        <span className="text-[10px] text-txt-muted">{description.length}/280</span>
                      </div>
                    </div>

                    {/* Image */}
                    <div>
                      <label className="block text-[11px] text-txt-muted font-semibold uppercase tracking-wider mb-1.5">Logo</label>
                      <div className="flex items-center gap-3">
                        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleImageSelect} className="hidden" />
                        {resolvedImage ? (
                          <div className="relative group">
                            <img src={resolvedImage} alt="logo" className="w-16 h-16 rounded-lg object-cover border border-[var(--border)] shadow-sm" />
                            <button onClick={() => { setImageFile(null); setImagePreview(null); setImageUrl(""); }}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-crimson text-[#F5F0E8] text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => fileInputRef.current?.click()}
                            className="w-16 h-16 rounded-lg border-2 border-dashed border-[var(--border-2)] flex flex-col items-center justify-center text-txt-muted hover:border-crimson/30 hover:text-crimson transition-colors">
                            <ImageIcon className="h-5 w-5 mb-0.5" />
                            <span className="text-[9px] font-medium">Upload</span>
                          </button>
                        )}
                        <div className="flex-1">
                          <input type="url" value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); setImageFile(null); setImagePreview(null); }}
                            placeholder="Or paste image URL..." className="input text-[12px]" />
                          <p className="text-[10px] text-txt-muted mt-1">PNG, JPG, WebP, GIF · max 5MB</p>
                        </div>
                      </div>
                    </div>

                    {/* Socials */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <Field label="Twitter" value={twitter} onChange={setTwitter} placeholder="@handle" icon={Twitter} small />
                      <Field label="Telegram" value={telegram} onChange={setTelegram} placeholder="t.me/group" icon={Send} small />
                      <Field label="Website" value={website} onChange={setWebsite} placeholder="https://" icon={Globe} small />
                    </div>

                    {/* Advanced Settings */}
                    <div className="border border-[var(--border)] rounded-lg">
                      <button onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full flex items-center justify-between px-4 py-3 text-[12px] font-medium text-txt-secondary hover:text-txt transition-colors">
                        <span>Advanced Settings</span>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                      </button>
                      {showAdvanced && (
                        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-[var(--border)]">
                          {/* Initial Buy */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[12px] font-medium text-txt">Initial Buy</p>
                              <p className="text-[10px] text-txt-muted">Buy tokens immediately after creation</p>
                            </div>
                            <Toggle checked={doInitialBuy} onChange={setDoInitialBuy} />
                          </div>
                          {doInitialBuy && (
                            <div className="flex items-center gap-2">
                              <input type="number" value={initialBuy} onChange={(e) => setInitialBuy(e.target.value)}
                                placeholder="0" className="input flex-1 font-mono text-[13px]" />
                              <span className="text-[12px] text-txt-secondary font-medium">PIGEON</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Continue */}
                    <button onClick={() => setStep("review")} disabled={!name.trim() || !symbol.trim()}
                      className={`w-full py-3 rounded-lg text-[13px] font-bold transition-all ${
                        name.trim() && symbol.trim()
                          ? "bg-crimson text-[#F5F0E8] hover:opacity-90 shadow-sm"
                          : "bg-border text-txt-muted cursor-not-allowed"
                      }`}>
                      Continue to Review
                    </button>
                  </div>
                </StepContent>
              )}

              {/* ── REVIEW ── */}
              {step === "review" && (
                <StepContent key="review" title={LAUNCH_COPY.reviewTitle} lore={LAUNCH_COPY.reviewLore}>
                  <div className="space-y-4">

                    {/* Simulated Card Preview */}
                    <div className="card-obsidian p-4 rounded-lg">
                      <p className="text-[9px] uppercase tracking-widest font-semibold mb-3 text-txt-muted">How it will appear</p>
                      <div className="flex items-center gap-3 mb-3">
                        {resolvedImage ? (
                          <img src={resolvedImage} alt={symbol} className="w-10 h-10 rounded-md object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-crimson/20 flex items-center justify-center text-crimson font-bold font-lore text-[15px]">
                            {symbol ? symbol.charAt(0) : "?"}
                          </div>
                        )}
                        <div>
                          <p className="text-[14px] font-semibold leading-tight text-txt">{name || "Token Name"}</p>
                          <p className="text-[11px] font-mono text-txt-muted">${symbol || "TKN"}</p>
                        </div>
                        <div className="ml-auto">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-semibold bg-crimson/15 text-crimson border border-crimson/20">
                            Kindled
                          </span>
                        </div>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                        <div className="h-full w-0 rounded-full bg-gradient-to-r from-[#A67C52] to-[#8B2500]" />
                      </div>
                      <p className="text-[10px] mt-1.5 text-txt-muted">0% to ascension</p>
                    </div>

                    {/* Summary rows */}
                    <div className="space-y-2 border border-[var(--border)] rounded-lg p-3.5">
                      <ReviewRow label="Name" value={name} />
                      <ReviewRow label="Symbol" value={`$${symbol}`} mono />
                      {description && <ReviewRow label="Description" value={description.length > 60 ? description.slice(0, 60) + "..." : description} />}
                      {hasSocials && <ReviewRow label="Socials" value={[twitter, telegram, website].filter(Boolean).length + " linked"} />}
                      {doInitialBuy && initialBuy && <ReviewRow label="Initial Buy" value={`${initialBuy} PIGEON`} mono />}
                      <ReviewRow label="Creator" value={publicKey ? shortenAddress(publicKey.toBase58(), 4) : "—"} mono />
                    </div>

                    {/* Fee Breakdown */}
                    <div className="border border-[var(--border)] rounded-lg p-3.5">
                      <h4 className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider mb-2.5">Protocol Economics</h4>
                      <div className="space-y-2">
                        <FeeRow icon={Flame} label="Burn (per trade)" value={`${BURN_FEE_BPS / 100}%`} color="text-crimson" desc="PIGEON permanently destroyed" />
                        <FeeRow icon={Shield} label="Treasury" value={`${TREASURY_FEE_BPS / 100}%`} color="text-txt-secondary" desc="Protocol sustainability" />
                        <FeeRow icon={Zap} label="Referral" value="0.5%" color="text-teal" desc="Shared with referrer" />
                        <FeeRow icon={Target} label="Graduation" value="~2.36M PIGEON" color="text-bronze" desc="Threshold for ascension" />
                        <FeeRow icon={Lock} label="LP Lock" value="Permanent" color="text-green" desc="Dead wallet — forever sealed" />
                      </div>
                    </div>

                    {/* Risk Checklist */}
                    <div className="rounded-lg border p-3.5" style={{ background: "var(--amber-dim)", borderColor: "rgba(198,139,44,0.15)" }}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <AlertTriangle className="h-4 w-4 text-amber" />
                        <span className="text-[12px] font-semibold text-txt">Before you launch</span>
                      </div>
                      <div className="space-y-1.5">
                        {LAUNCH_COPY.risks.map((text, i) => (
                          <div key={i} className="flex items-start gap-2 text-[11px] text-txt-secondary">
                            <span className="text-amber mt-0.5">•</span>
                            <span>{text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Acceptance */}
                    <label className={`flex items-center gap-3 cursor-pointer p-3.5 rounded-lg border transition-all ${
                      riskAccepted
                        ? "bg-teal/5 border-teal/20"
                        : "bg-bg border-[var(--border)] hover:border-[var(--border-3)]"
                    }`}>
                      <input type="checkbox" checked={riskAccepted} onChange={(e) => setRiskAccepted(e.target.checked)}
                        className="w-4 h-4 rounded accent-teal" />
                      <span className="text-[12px] text-txt font-medium">I understand the risks and want to proceed</span>
                    </label>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button onClick={() => setStep("details")} className="flex-1 py-3 rounded-lg text-[13px] font-semibold text-txt-secondary bg-bg-elevated border border-[var(--border)] hover:border-[var(--border-3)] transition-colors">
                        Back
                      </button>
                      <button onClick={handleLaunch} disabled={!canSubmit}
                        className={`flex-[2] py-3.5 rounded-lg text-[13px] font-bold flex items-center justify-center gap-2 transition-all ${
                          canSubmit
                            ? "bg-crimson text-[#F5F0E8] hover:opacity-90 shadow-glow"
                            : "bg-border text-txt-muted cursor-not-allowed"
                        }`}>
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-[#F5F0E8]/30 border-t-[#F5F0E8] rounded-full animate-spin" />
                            {status || LAUNCH_COPY.submitting}
                          </>
                        ) : (
                          <>
                            <Rocket className="h-4 w-4" />
                            {LAUNCH_COPY.submitButton}
                          </>
                        )}
                      </button>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="rounded-lg p-3 bg-red/5 border border-red/15 text-[12px] text-crimson flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {error}
                      </div>
                    )}
                  </div>
                </StepContent>
              )}

              {/* ── SUCCESS ── */}
              {step === "success" && successData && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="py-8">
                  {/* Celebration */}
                  <div className="text-center mb-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                      className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal/10 flex items-center justify-center animate-bounce-subtle"
                    >
                      <Check className="h-8 w-8 text-teal" />
                    </motion.div>
                    <h2 className="text-[20px] font-bold text-txt mb-1">{LAUNCH_COPY.successTitle}</h2>
                    <p className="text-[13px] text-txt-secondary">{LAUNCH_COPY.successLore}</p>
                    <p className="text-[11px] text-txt-muted font-lore italic mt-1">{LAUNCH_COPY.successArchive}</p>
                  </div>

                  {/* Token Card (obsidian) */}
                  <div className="card-obsidian p-5 rounded-lg mb-6">
                    <div className="flex items-center gap-3.5 mb-4">
                      {resolvedImage ? (
                        <img src={resolvedImage} alt={symbol} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-crimson/20 flex items-center justify-center text-crimson font-bold font-lore text-lg">
                          {symbol.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-[16px] font-bold leading-tight text-txt">{name}</p>
                        <p className="text-[12px] font-mono text-txt-muted">${symbol}</p>
                      </div>
                      <div className="ml-auto">
                        <span className="badge badge-obsidian">
                          <Award className="h-2.5 w-2.5" /> Kindled
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-[12px]">
                      <div className="flex justify-between">
                        <span className="text-txt-muted">Mint</span>
                        <button onClick={() => { navigator.clipboard.writeText(successData.mint); setMintCopied(true); setTimeout(() => setMintCopied(false), 1500); }}
                          className="flex items-center gap-1.5 font-mono hover:text-teal transition-colors text-txt">
                          {shortenAddress(successData.mint, 6)}
                          {mintCopied ? <Check className="h-3 w-3 text-teal" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-txt-muted">Status</span>
                        <span className="text-crimson font-medium">Live on bonding curve</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-txt-muted">Creator</span>
                        <span className="font-mono text-txt">{publicKey ? shortenAddress(publicKey.toBase58(), 4) : "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Link href={`/token/${successData.mint}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[13px] font-bold bg-crimson text-[#F5F0E8] hover:opacity-90 transition-opacity">
                      View Token
                      <ArrowLeft className="h-4 w-4 rotate-180" />
                    </Link>
                    <a href={`https://solscan.io/tx/${successData.txSig}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-[13px] font-semibold text-txt-secondary bg-bg-elevated border border-[var(--border)] hover:border-[var(--border-3)] transition-colors">
                      <ExternalLink className="h-4 w-4" />
                      Explorer
                    </a>
                  </div>

                  {/* Share hint */}
                  <div className="mt-4 text-center">
                    <p className="text-[11px] text-txt-muted">Share your token link to start earning 0.5% referral rewards</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── RIGHT: Live Preview + How It Works ── */}
        {step !== "success" && (
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-4 space-y-4">

              {/* Live Preview */}
              <div className="card p-4">
                <h3 className="text-[10px] text-txt-muted uppercase tracking-widest font-semibold mb-3">Live Preview</h3>

                {/* Simulated Board Card */}
                <div className="card p-3.5 bg-bg">
                  <div className="flex items-start gap-3 mb-3">
                    {resolvedImage ? (
                      <img src={resolvedImage} alt="preview" className="w-10 h-10 rounded-md object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-crimson/15 flex items-center justify-center text-crimson font-bold font-lore">
                        {symbol ? symbol.charAt(0) : "?"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[13px] font-semibold text-txt truncate">{name || "Token Name"}</p>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-crimson/8 text-crimson border border-crimson/15">
                          Kindled
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="font-mono text-txt-muted">${symbol || "TKN"}</span>
                        <span className="text-txt-disabled">·</span>
                        <span className="text-txt-muted">just now</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-2.5">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-txt-muted font-lore italic">Ascension</span>
                      <span className="text-[10px] text-txt-secondary font-mono">0.0%</span>
                    </div>
                    <div className="h-[3px] rounded-full bg-border overflow-hidden">
                      <div className="h-full w-0 rounded-full bg-gradient-to-r from-bronze to-crimson" />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 text-txt-muted">
                      <TrendingUp className="h-2.5 w-2.5" />
                      <span className="font-mono">0</span>
                      <span>vol</span>
                    </div>
                    <div className="flex items-center gap-1 text-crimson">
                      <Flame className="h-2.5 w-2.5" />
                      <span className="font-mono">0</span>
                    </div>
                  </div>
                </div>

                {/* Social validation */}
                {hasSocials && (
                  <div className="mt-3 flex items-center gap-2">
                    {twitter && <span className="badge badge-muted"><Twitter className="h-2.5 w-2.5" /> Twitter</span>}
                    {telegram && <span className="badge badge-muted"><Send className="h-2.5 w-2.5" /> Telegram</span>}
                    {website && <span className="badge badge-muted"><Globe className="h-2.5 w-2.5" /> Website</span>}
                  </div>
                )}

                {description && (
                  <p className="mt-3 text-[11px] text-txt-secondary line-clamp-3">{description}</p>
                )}
              </div>

              {/* How It Works */}
              <div className="card-obsidian p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-3.5 w-3.5 text-bronze" />
                  <span className="text-[11px] font-semibold tracking-wide text-txt">How It Works</span>
                </div>
                <div className="space-y-3">
                  {HOW_IT_WORKS.map((item, i) => {
                    const icons = [Rocket, Flame, Target, Shield];
                    const IconComp = icons[i] || Rocket;
                    return { icon: IconComp, ...item };
                  }).map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ background: "var(--border)" }}>
                        <item.icon className="h-3 w-3 text-crimson" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold leading-tight text-txt">{item.label}</p>
                        <p className="text-[10px] leading-tight mt-0.5 text-txt-muted">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════ */

function StepContent({ children, title, lore }: { children: React.ReactNode; title: string; lore: string }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
      <h2 className="text-[16px] font-bold text-txt mb-0.5">{title}</h2>
      <p className="text-[11px] font-lore italic text-txt-muted mb-5">{lore}</p>
      {children}
    </motion.div>
  );
}

function Field({ label, value, onChange, placeholder, maxLength, mono, icon: Icon, required, small }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
  maxLength?: number; mono?: boolean; icon?: typeof Twitter; required?: boolean; small?: boolean;
}) {
  return (
    <div>
      <label className="flex items-center gap-1 text-[11px] text-txt-muted font-semibold uppercase tracking-wider mb-1.5">
        {Icon && <Icon className="h-3 w-3" />} {label} {required && <span className="text-crimson">*</span>}
      </label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength}
        className={`input ${mono ? "font-mono" : ""} ${small ? "text-[12px] py-2" : "text-[13px]"}`} />
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`w-10 h-5 rounded-full transition-colors relative ${checked ? "bg-teal" : "bg-border-strong"}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

function ReviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between text-[12px]">
      <span className="text-txt-muted">{label}</span>
      <span className={`text-txt ${mono ? "font-mono" : "font-semibold"}`}>{value}</span>
    </div>
  );
}

function FeeRow({ icon: Icon, label, value, color, desc }: {
  icon: typeof Flame; label: string; value: string; color: string; desc: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className={`h-3 w-3 ${color} shrink-0`} />
      <div className="flex-1 min-w-0">
        <span className="text-[12px] text-txt">{label}</span>
        <span className="text-[10px] text-txt-muted ml-1.5 hidden sm:inline">· {desc}</span>
      </div>
      <span className={`text-[12px] font-mono font-semibold ${color}`}>{value}</span>
    </div>
  );
}

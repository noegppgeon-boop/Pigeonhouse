"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FireParticles from "./FireParticles";
import {
  FlameIcon, TrendingUpIcon, GraduationCapIcon,
  ShieldCheckIcon, ZapIcon, LayersIcon,
  PenToolIcon, RepeatIcon, RocketIcon,
} from "./LaunchIcons";

const LAUNCH_UTC = "2026-03-14T21:00:00Z"; // LIVE

interface TimeLeft { hours: number; minutes: number; seconds: number; total: number; }

function getTimeLeft(): TimeLeft {
  const diff = new Date(LAUNCH_UTC).getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    hours: Math.floor(diff / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    total: diff,
  };
}

function CountdownDigit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div className="countdown-digit-bg">
        <AnimatePresence mode="popLayout">
          <motion.span key={display} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="countdown-digit">{display}</motion.span>
        </AnimatePresence>
      </div>
      <span className="countdown-label">{label}</span>
    </div>
  );
}

function Separator() {
  return (
    <div className="flex flex-col justify-center pb-5">
      <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-[28px] sm:text-[36px] font-lore text-crimson font-bold leading-none">:</motion.span>
    </div>
  );
}

/* ═══ Screenshot in browser frame ═══ */
function PlatformPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
      className="w-full max-w-[880px] mx-auto px-5"
    >
      <div className="screenshot-frame">
        <div className="screenshot-chrome">
          <div className="flex items-center gap-[6px]">
            <span className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
            <span className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
            <span className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
          </div>
          <div className="screenshot-url-bar">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-txt-muted opacity-50"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span className="text-[11px] text-txt-muted">941pigeon.fun</span>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-b-xl">
          <img src="/screenshots/board.jpg" alt="PigeonHouse — The Archive" className="w-full block" loading="lazy" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -skew-x-12"
            animate={{ x: ["-150%", "250%"] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 6, ease: "easeInOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ═══ Feature grid ═══ */
function Features() {
  const items = [
    { icon: <FlameIcon className="text-crimson" />, title: "Deflationary Burns", desc: "Every buy and sell burns PIGEON. Usage drives permanent supply reduction." },
    { icon: <TrendingUpIcon className="text-crimson" />, title: "Bonding Curves", desc: "Fair price discovery. No presales, no insider allocation. The curve treats everyone equally." },
    { icon: <GraduationCapIcon className="text-crimson" />, title: "Auto-Graduation", desc: "Tokens hitting their target auto-migrate to Raydium CPMM with permanently locked liquidity." },
    { icon: <ShieldCheckIcon className="text-crimson" />, title: "Verified & Open Source", desc: "OtterSec verified build. Full source on GitHub. Every line auditable." },
    { icon: <ZapIcon className="text-crimson" />, title: "Token-2022 Native", desc: "Built on Solana's latest token standard. Mint authority revoked at creation." },
    { icon: <LayersIcon className="text-crimson" />, title: "Multi-Quote Assets", desc: "Launch tokens paired with PIGEON, SOL, or SKR. Pay with SOL on any pair via Jupiter." },
  ];

  return (
    <div className="max-w-[800px] mx-auto px-5 mt-20">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-lore text-[22px] sm:text-[26px] font-bold text-txt text-center mb-10"
      >
        Built for a new standard
      </motion.h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="feature-card group"
          >
            <div className="mb-3 opacity-80 group-hover:opacity-100 transition-opacity">{item.icon}</div>
            <h3 className="font-lore text-[14px] font-bold text-txt mb-1.5">{item.title}</h3>
            <p className="text-[12px] text-txt-secondary leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══ How it works ═══ */
function Process() {
  const steps = [
    { icon: <PenToolIcon className="text-crimson" />, title: "Inscribe", desc: "Create your token — name, image, quote asset. Launches instantly on a bonding curve." },
    { icon: <RepeatIcon className="text-crimson" />, title: "Trade", desc: "Buy and sell on the curve. Price moves with demand. Every trade burns PIGEON." },
    { icon: <RocketIcon className="text-crimson" />, title: "Graduate", desc: "Curve fills → token auto-migrates to Raydium. Liquidity locked permanently." },
  ];

  return (
    <div className="max-w-[680px] mx-auto px-5 mt-20">
      <motion.h2
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="font-lore text-[22px] sm:text-[26px] font-bold text-txt text-center mb-10"
      >
        How it works
      </motion.h2>
      <div className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, duration: 0.4 }}
            className="flex gap-4 items-start p-4 sm:p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl"
          >
            <div className="flex-shrink-0 mt-0.5 opacity-80">{step.icon}</div>
            <div>
              <h4 className="font-lore text-[14px] font-bold text-txt mb-1">{step.title}</h4>
              <p className="text-[12px] text-txt-secondary leading-relaxed">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}



/* ═══ Trust badges ═══ */
function Trust() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="flex flex-wrap justify-center gap-3 mt-16 px-5"
    >
      {[
        { label: "OtterSec Verified", href: "https://verify.osec.io/status/BV1RxkAaD5DjXMsnofkVikFUUYdrDg1v8YgsQ3iyDNoL" },
        { label: "Open Source", href: "https://github.com/noegppgeon-boop/Pigeonhouse" },
        { label: "Mint Authority Revoked" },
        { label: "IDL On-Chain" },
        { label: "Security.txt On-Chain" },
      ].map((badge) => (
        <span key={badge.label} className="trust-pill">
          {badge.href ? (
            <a href={badge.href} target="_blank" rel="noopener noreferrer" className="hover:text-crimson transition-colors">{badge.label}</a>
          ) : badge.label}
        </span>
      ))}
    </motion.div>
  );
}

function isExemptPage() {
  if (typeof window === "undefined") return false;
  const p = window.location.pathname;
  return p === "/terms" || p === "/privacy" || p === "/predictions";
}

export default function LaunchGate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0, total: 1 });
  const [launched, setLaunched] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const tl = getTimeLeft();
    setTimeLeft(tl);
    if (tl.total <= 0) { setLaunched(true); return; }
    const interval = setInterval(() => {
      const tl = getTimeLeft();
      setTimeLeft(tl);
      if (tl.total <= 0) { setLaunched(true); clearInterval(interval); }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalDuration = 38 * 3600 * 1000;
  const progress = useMemo(() => Math.min(100, Math.max(0, ((totalDuration - timeLeft.total) / totalDuration) * 100)), [timeLeft.total]);

  if (!mounted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center launch-gate-bg">
        <div className="flex flex-col items-center">
          <img src="/tokens/pigeon.png" alt="PigeonHouse" className="w-20 h-20 rounded-2xl shadow-lg mb-6" />
          <h1 className="font-lore text-[32px] font-bold text-txt">PigeonHouse</h1>
        </div>
      </div>
    );
  }

  if (launched || isExemptPage()) return <>{children}</>;

  return (
    <div ref={scrollRef} className="launch-gate-wrapper launch-gate-bg">

      {/* ═══ HERO ═══ */}
      <section className="min-h-screen flex items-center justify-center relative">
        <div className="absolute inset-0 pointer-events-none opacity-20"><FireParticles count={10} /></div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="relative flex flex-col items-center text-center px-6 max-w-lg">

          <motion.img src="/tokens/pigeon.png" alt="PigeonHouse" className="w-20 h-20 rounded-2xl shadow-lg mb-8"
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} />

          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="font-lore text-[32px] sm:text-[40px] font-bold text-txt leading-tight mb-2">PigeonHouse</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="font-lore italic text-[14px] sm:text-[15px] text-txt-muted mb-10">The Ritual Launch Terminal</motion.p>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }}
            className="flex items-center gap-3 sm:gap-4 mb-8">
            <CountdownDigit value={timeLeft.hours} label="hours" />
            <Separator />
            <CountdownDigit value={timeLeft.minutes} label="minutes" />
            <Separator />
            <CountdownDigit value={timeLeft.seconds} label="seconds" />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} className="w-full max-w-[320px] mb-8">
            <div className="h-[3px] bg-border-2 rounded-full overflow-hidden">
              <motion.div className="h-full bg-crimson rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }} />
            </div>
            <p className="text-[11px] text-txt-muted mt-2 font-mono">{progress.toFixed(1)}% until ignition</p>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            className="text-[11px] text-txt-muted italic mb-4">
            Launch postponed to Sunday for maximum attendance.
          </motion.p>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
            className="text-[13px] text-txt-secondary max-w-[300px] mb-6">
            The archive opens soon.<br /><span className="text-crimson font-medium">Everyone enters at the same time.</span>
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
            className="flex items-center gap-2 text-[11px] text-txt-muted">
            <span className="inline-block w-2 h-2 rounded-full bg-green-600 animate-pulse" />
            <span>Verified on OtterSec · Open Source</span>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1] }} transition={{ delay: 2.5, duration: 1 }} className="mt-12">
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center text-txt-muted cursor-pointer opacity-40"
              onClick={() => scrollRef.current?.scrollTo({ top: window.innerHeight * 0.85, behavior: "smooth" })}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ CONTENT ═══ */}
      <section className="pb-20">
        <PlatformPreview />
        <Features />
        <Process />
        <Trust />

        <div className="flex flex-col items-center gap-4 mt-16 pb-4">
          <div className="flex items-center gap-5">
            <a href="https://x.com/941pigeondotfun" target="_blank" rel="noopener noreferrer" className="text-txt-muted hover:text-crimson transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://github.com/noegppgeon-boop/Pigeonhouse" target="_blank" rel="noopener noreferrer" className="text-txt-muted hover:text-crimson transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
          <p className="text-[11px] text-txt-muted italic font-lore mb-2">Inscribe with trust, burn with proof.</p>
          <div className="flex items-center gap-3 text-[10px] text-txt-muted">
            <a href="/terms" onClick={() => window.location.href = "/terms"} className="hover:text-crimson transition-colors">Terms</a>
            <span>·</span>
            <a href="/privacy" onClick={() => window.location.href = "/privacy"} className="hover:text-crimson transition-colors">Privacy</a>
          </div>
        </div>
      </section>
    </div>
  );
}

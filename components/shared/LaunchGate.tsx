"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FireParticles from "./FireParticles";

// ═══════════════════════════════════════════════
// LAUNCH TIME — set this to your exact launch moment
// 38 hours from ~2026-03-13 02:40 GMT+3 = 2026-03-14 16:40 GMT+3 = 2026-03-14 13:40 UTC
// ═══════════════════════════════════════════════
const LAUNCH_UTC = "2026-03-14T13:40:00Z";

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

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
      <div className="relative">
        <div className="countdown-digit-bg">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={display}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="countdown-digit"
            >
              {display}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
      <span className="countdown-label">{label}</span>
    </div>
  );
}

function Separator() {
  return (
    <div className="flex flex-col justify-center pb-5">
      <motion.span
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-[28px] sm:text-[36px] font-lore text-crimson font-bold leading-none"
      >
        :
      </motion.span>
    </div>
  );
}

export default function LaunchGate({ children }: { children: React.ReactNode }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft);
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    // Check immediately
    const tl = getTimeLeft();
    if (tl.total <= 0) {
      setLaunched(true);
      return;
    }

    const interval = setInterval(() => {
      const tl = getTimeLeft();
      setTimeLeft(tl);
      if (tl.total <= 0) {
        setLaunched(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Progress bar (0-100)
  const totalDuration = 38 * 3600 * 1000; // 38 hours
  const progress = useMemo(() => {
    const elapsed = totalDuration - timeLeft.total;
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }, [timeLeft.total]);

  if (launched) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center launch-gate-bg overflow-hidden">
      {/* Subtle background particles */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <FireParticles count={12} />
      </div>

      {/* Radial glow behind content */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-crimson/[0.04] blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative flex flex-col items-center text-center px-6 max-w-lg"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative mb-8"
        >
          <img
            src="/tokens/pigeon.png"
            alt="PigeonHouse"
            className="w-20 h-20 rounded-2xl shadow-lg"
          />
          <div className="absolute -inset-2">
            <div className="w-full h-full rounded-2xl animate-pulse-glow" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="font-lore text-[32px] sm:text-[40px] font-bold text-txt leading-tight mb-2"
        >
          PigeonHouse
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="font-lore italic text-[14px] sm:text-[15px] text-txt-muted mb-10"
        >
          The Ritual Launch Terminal
        </motion.p>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex items-center gap-3 sm:gap-4 mb-8"
        >
          <CountdownDigit value={timeLeft.hours} label="hours" />
          <Separator />
          <CountdownDigit value={timeLeft.minutes} label="minutes" />
          <Separator />
          <CountdownDigit value={timeLeft.seconds} label="seconds" />
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "100%" }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="w-full max-w-[320px] mb-8"
        >
          <div className="h-[3px] bg-border-2 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-crimson rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-[11px] text-txt-muted mt-2 font-mono">
            {progress.toFixed(1)}% until ignition
          </p>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="launch-tagline"
        >
          <p className="text-[13px] text-txt-secondary leading-relaxed max-w-[300px]">
            The archive opens soon.<br />
            <span className="text-crimson font-medium">Everyone enters at the same time.</span>
          </p>
        </motion.div>

        {/* Verified badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-8 flex items-center gap-2 text-[11px] text-txt-muted"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-green-600 animate-pulse" />
          <span>Verified on OtterSec · Open Source</span>
        </motion.div>

        {/* Social links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7 }}
          className="mt-4 flex items-center gap-4"
        >
          <a
            href="https://x.com/941pigeondotfun"
            target="_blank"
            rel="noopener noreferrer"
            className="text-txt-muted hover:text-crimson transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a
            href="https://github.com/noegppgeon-boop/Pigeonhouse"
            target="_blank"
            rel="noopener noreferrer"
            className="text-txt-muted hover:text-crimson transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}

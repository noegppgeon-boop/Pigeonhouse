"use client";

import { useState, useEffect } from "react";

export default function DisclaimerBanner() {
  const [accepted, setAccepted] = useState(true); // default true to avoid flash

  useEffect(() => {
    setAccepted(localStorage.getItem("ph_disclaimer_accepted") === "true");
  }, []);

  if (accepted) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-[var(--bg-card)] border-t border-[var(--border)] px-4 py-3 md:pl-sidebar">
      <div className="max-w-[900px] mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-[11px] text-txt-secondary leading-relaxed flex-1">
          PigeonHouse is a decentralized protocol. Trading digital assets involves significant risk including total loss of funds. Tokens listed are created by third parties and are not endorsed by PigeonHouse. This is not financial advice.{" "}
          <a href="/terms" className="text-crimson underline">Terms</a> ·{" "}
          <a href="/privacy" className="text-crimson underline">Privacy</a>
        </p>
        <button
          onClick={() => {
            localStorage.setItem("ph_disclaimer_accepted", "true");
            setAccepted(true);
          }}
          className="shrink-0 px-4 py-1.5 bg-crimson text-white text-[11px] font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          I understand the risks
        </button>
      </div>
    </div>
  );
}

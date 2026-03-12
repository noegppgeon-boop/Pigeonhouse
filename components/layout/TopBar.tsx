"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { User, Wallet, ChevronDown, LogOut, Copy, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { shortenAddress } from "@/lib/utils";

export default function TopBar() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  function copyAddress() {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey.toBase58());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!connected) {
    return (
      <div className="hidden md:flex fixed top-0 right-0 z-40 p-4">
        <button
          onClick={() => setVisible(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-crimson text-[#F5F0E8] text-[13px] font-semibold hover:opacity-90 transition-opacity shadow-sm"
        >
          <Wallet className="h-3.5 w-3.5" />
          Connect Wallet
        </button>
      </div>
    );
  }

  const addr = publicKey!.toBase58();
  const short = shortenAddress(addr, 4);

  return (
    <div className="hidden md:flex fixed top-0 right-0 z-40 p-4" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-bg-card border border-[var(--border)] hover:border-[var(--border-3)] transition-all shadow-sm"
      >
        <div className="w-7 h-7 rounded-full bg-crimson/10 border border-crimson/20 flex items-center justify-center">
          <User className="h-3.5 w-3.5 text-crimson" />
        </div>
        <span className="text-[13px] font-mono text-txt-secondary font-medium">{short}</span>
        <ChevronDown className={`h-3 w-3 text-txt-muted transition-transform ${menuOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {menuOpen && (
        <div className="absolute top-full right-0 mt-1 w-56 rounded-lg bg-bg-card border border-[var(--border)] shadow-md overflow-hidden animate-fade-in">
          {/* Address */}
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="text-[10px] text-txt-muted uppercase tracking-wider mb-1">Wallet</p>
            <button onClick={copyAddress} className="flex items-center gap-2 text-[12px] font-mono text-txt-secondary hover:text-txt transition-colors">
              {addr.slice(0, 8)}...{addr.slice(-6)}
              {copied ? <Check className="h-3 w-3 text-teal" /> : <Copy className="h-3 w-3 text-txt-muted" />}
            </button>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href={`/profile/${addr}`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-txt-secondary hover:bg-bg-elevated hover:text-txt transition-colors"
            >
              <User className="h-3.5 w-3.5" />
              Profile
            </Link>
            <Link
              href="/portfolio"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-txt-secondary hover:bg-bg-elevated hover:text-txt transition-colors"
            >
              <Wallet className="h-3.5 w-3.5" />
              Portfolio
            </Link>
          </div>

          {/* Disconnect */}
          <div className="border-t border-[var(--border)] py-1">
            <button
              onClick={() => { disconnect(); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red hover:bg-red/5 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

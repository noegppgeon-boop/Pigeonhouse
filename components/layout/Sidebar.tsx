"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Rocket, Trophy, Eye, Search,
  BarChart3, Shield, Wallet, Flame, Zap, Users,
  ChevronDown, ExternalLink
} from "lucide-react";
import dynamic from "next/dynamic";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { formatNumber } from "@/lib/utils";
import { LORE_NAMES, ABOUT } from "@/lib/lore";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

interface NavItem {
  label: string;
  lore: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const primaryNav: NavItem[] = [
  { label: "Board", lore: LORE_NAMES.board, href: "/", icon: LayoutDashboard },
  { label: "Launch", lore: LORE_NAMES.launch, href: "/launch", icon: Rocket },
  { label: "Leaderboard", lore: LORE_NAMES.leaderboard, href: "/leaderboard", icon: Trophy },
  { label: "Transparency", lore: LORE_NAMES.transparency, href: "/transparency", icon: Eye },
];

const secondaryNav: NavItem[] = [
  { label: "Stats", lore: LORE_NAMES.stats, href: "/stats", icon: BarChart3 },
  { label: "Status", lore: LORE_NAMES.status, href: "/status", icon: Shield },
  { label: "Portfolio", lore: LORE_NAMES.portfolio, href: "/portfolio", icon: Wallet },
];

/* ═══════════════════════════════════════
   DESKTOP SIDEBAR
   ═══════════════════════════════════════ */

export function Sidebar() {
  const pathname = usePathname();
  const { stats } = usePlatformStats();
  const [secondaryOpen, setSecondaryOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const burnedDisplay = stats?.totalPigeonBurned
    ? formatNumber(stats.totalPigeonBurned.toNumber() / 1e6)
    : "—";

  const tokensLaunched = stats?.totalTokensLaunched ?? 0;
  const feeBps = stats?.feeBps ?? 200;

  return (
    <aside className="sidebar hidden md:flex" aria-label="Main navigation">

      {/* ── 1. Logotype ── */}
      <Link href="/" className="group flex items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
        <img src="/tokens/pigeon.png" alt="PigeonHouse" className="w-8 h-8 rounded-md shadow-sm transition-transform group-hover:scale-110 group-hover:animate-bounce-subtle" />
        <div className="min-w-0">
          <span className="block text-[14px] font-bold text-txt leading-tight tracking-tight">PigeonHouse</span>
          <span className="block text-[10px] font-lore italic text-txt-muted leading-tight">{ABOUT.tagline}</span>
        </div>
      </Link>

      {/* ── 2. Search Entry ── */}
      <div className="px-3 pt-3 pb-1">
        <button
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md bg-bg border border-[var(--border)] text-txt-muted text-[12px] hover:border-[var(--border-3)] transition-colors"
          onClick={() => {
            // Trigger command modal via keyboard shortcut
            const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
            document.dispatchEvent(e);
          }}
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Search the archive...</span>
          <kbd className="text-[10px] bg-bg-elevated px-1.5 py-0.5 rounded text-txt-disabled font-mono">⌘K</kbd>
        </button>
      </div>

      {/* ── 3. Primary Nav ── */}
      <nav className="px-2 pt-2 pb-1 space-y-0.5">
        {primaryNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium relative
                transition-all duration-150 ease-out
                ${active
                  ? "bg-bg-elevated text-txt shadow-sm"
                  : "text-txt-muted hover:text-txt-secondary hover:bg-bg hover:pl-4"
                }
              `}
            >
              {/* Active indicator bar */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-crimson animate-glow-pulse" />
              )}
              <item.icon className={`h-[18px] w-[18px] shrink-0 transition-all duration-150 ${active ? "text-crimson" : "text-txt-muted group-hover:text-txt-secondary group-hover:scale-110"}`} />
              <div className="min-w-0 flex-1">
                <span className="block leading-tight">{item.label}</span>
                {active && (
                  <span className="block text-[10px] font-lore italic text-txt-muted leading-tight mt-0.5">{item.lore}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ── Divider ── */}
      <div className="mx-4 my-1">
        <div className="border-t border-[var(--border)]" />
      </div>

      {/* ── 4. Protocol Signals ── */}
      <div className="px-3 py-2">
        <div className="rounded-md bg-bg p-3 space-y-2.5 border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-3 w-3 text-bronze" />
            <span className="text-[10px] font-semibold text-txt-secondary uppercase tracking-widest">Protocol</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SignalItem label="Burned" value={burnedDisplay} icon={Flame} color="text-crimson" glow />
            <SignalItem label="Tokens" value={String(tokensLaunched)} icon={Users} color="text-teal" />
          </div>
          <div className="flex items-center justify-between text-[10px] text-txt-muted pt-1 border-t border-[var(--border)]">
            <span>Fee: <span className="font-mono text-txt-secondary">{feeBps / 100}%</span></span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
              Live
            </span>
          </div>
        </div>
      </div>

      {/* ── 5. Secondary Nav (collapsible) ── */}
      <div className="px-2">
        <button
          onClick={() => setSecondaryOpen(!secondaryOpen)}
          className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-txt-muted uppercase tracking-wider hover:text-txt-secondary transition-colors"
        >
          <ChevronDown className={`h-3 w-3 transition-transform ${secondaryOpen ? "rotate-0" : "-rotate-90"}`} />
          More
        </button>
        {secondaryOpen && (
          <div className="space-y-0.5 pb-2">
            {secondaryNav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md text-[12px] font-medium transition-all
                    ${active
                      ? "bg-bg-elevated text-txt"
                      : "text-txt-muted hover:text-txt-secondary hover:bg-bg"
                    }
                  `}
                >
                  <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-crimson" : ""}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── 6. Burn Archive Card ── */}
      <div className="px-3 pb-4">
        <div className="card rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Flame className="h-3.5 w-3.5 text-crimson" />
              <span className="text-[11px] font-semibold tracking-wide text-txt-secondary">Offerings Burned</span>
            </div>
          </div>
          <p className="text-[22px] font-mono font-bold text-crimson leading-none">{burnedDisplay}</p>
          <p className="text-[10px] font-lore italic mt-1.5 text-txt-muted">PIGEON returned to ashes</p>
          <div className="mt-2.5 pt-2 border-t border-[var(--border)]">
            <Link
              href="/transparency"
              className="flex items-center gap-1.5 text-[10px] font-medium text-txt-muted hover:text-txt-secondary hover:underline transition-colors"
            >
              View Proof Ledger
              <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── 7. Social Links ── */}
      <div className="px-3 pb-2 flex items-center justify-center gap-4">
        <a href="https://x.com/941pigeondotfun" target="_blank" rel="noopener noreferrer"
          className="text-txt-muted hover:text-txt-secondary transition-colors" title="Twitter/X">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <a href="https://x.com/i/communities/2026114124686434659" target="_blank" rel="noopener noreferrer"
          className="text-txt-muted hover:text-txt-secondary transition-colors" title="X Community">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
        </a>
      </div>

      {/* ── 8. Legal Links ── */}
      <div className="px-3 pb-4 flex items-center justify-center gap-3">
        <a href="/terms" className="text-[10px] text-txt-muted hover:text-txt-secondary transition-colors">Terms</a>
        <span className="text-[10px] text-txt-muted">·</span>
        <a href="/privacy" className="text-[10px] text-txt-muted hover:text-txt-secondary transition-colors">Privacy</a>
      </div>
    </aside>
  );
}

function SignalItem({ label, value, icon: Icon, color, glow }: {
  label: string; value: string; icon: typeof Flame; color: string; glow?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-3 w-3 ${color} shrink-0 ${glow ? "animate-glow-pulse" : ""}`} />
      <div className="min-w-0">
        <p className="text-[10px] text-txt-muted leading-none">{label}</p>
        <p className={`text-[13px] font-mono font-semibold leading-tight ${color}`}>{value}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MOBILE BOTTOM NAV
   ═══════════════════════════════════════ */

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const items = [
    { label: "Board", href: "/", icon: LayoutDashboard },
    { label: "Launch", href: "/launch", icon: Rocket },
    { label: "Leaders", href: "/leaderboard", icon: Trophy },
    { label: "Proof", href: "/transparency", icon: Eye },
    { label: "More", href: "/stats", icon: BarChart3 },
  ];

  return (
    <nav className="bottom-nav md:hidden" aria-label="Mobile navigation">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${active ? "active" : ""}`}
          >
            <div className="relative">
              <item.icon className="h-5 w-5" />
              {active && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-crimson" />
              )}
            </div>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/* ═══════════════════════════════════════
   MOBILE TOP BAR
   ═══════════════════════════════════════ */

export function MobileTopBar() {
  const { stats } = usePlatformStats();
  const burnedDisplay = stats?.totalPigeonBurned
    ? formatNumber(stats.totalPigeonBurned.toNumber() / 1e6)
    : "—";

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-12 bg-bg-card/95 backdrop-blur-sm border-b border-[var(--border)] z-50 flex items-center px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <img src="/tokens/pigeon.png" alt="PigeonHouse" className="w-6 h-6 rounded" />
        <span className="text-[13px] font-bold text-txt">PigeonHouse</span>
      </Link>

      <div className="flex-1" />

      {/* Burn ticker */}
      <div className="flex items-center gap-1.5 mr-3">
        <Flame className="h-3 w-3 text-crimson" />
        <span className="text-[11px] font-mono font-semibold text-crimson">{burnedDisplay}</span>
        <span className="text-[10px] text-txt-muted hidden sm:inline">burned</span>
      </div>

      {/* Wallet */}
      <WalletMultiButton />
    </header>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Rocket, TrendingUp, Flame, Trophy, BarChart3, Shield, Wallet, ArrowRight, Clock, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { SEARCH_COPY, LORE_NAMES } from "@/lib/lore";

interface CommandItem {
  id: string;
  label: string;
  desc?: string;
  icon: typeof Search;
  href?: string;
  action?: () => void;
  category: "nav" | "token" | "recent";
}

export default function CommandModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { stats } = usePlatformStats();

  // ⌘K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const navItems: CommandItem[] = [
    { id: "board", label: "Board", desc: LORE_NAMES.board, icon: TrendingUp, href: "/", category: "nav" },
    { id: "launch", label: "Launch Token", desc: LORE_NAMES.launch, icon: Rocket, href: "/launch", category: "nav" },
    { id: "portfolio", label: "Portfolio", desc: LORE_NAMES.portfolio, icon: Wallet, href: "/portfolio", category: "nav" },
    { id: "leaderboard", label: "Leaderboard", desc: LORE_NAMES.leaderboard, icon: Trophy, href: "/leaderboard", category: "nav" },
    { id: "stats", label: "Stats", desc: LORE_NAMES.stats, icon: BarChart3, href: "/stats", category: "nav" },
    { id: "transparency", label: "Transparency", desc: LORE_NAMES.transparency, icon: Eye, href: "/transparency", category: "nav" },
    { id: "status", label: "Status", desc: LORE_NAMES.status, icon: Shield, href: "/status", category: "nav" },
  ];

  // Recently viewed from localStorage
  const recentItems: CommandItem[] = (() => {
    if (query) return [];
    try {
      const stored = localStorage.getItem("ph_recently_viewed");
      if (!stored) return [];
      const items = JSON.parse(stored) as { mint: string; name: string; symbol: string }[];
      return items.slice(0, 4).map((t) => ({
        id: `recent-${t.mint}`,
        label: t.name,
        desc: `$${t.symbol}`,
        icon: Clock,
        href: `/token/${t.mint}`,
        category: "recent" as const,
      }));
    } catch { return []; }
  })();

  // Token search from stats
  const tokenItems: CommandItem[] = (stats?.recentTokens || [])
    .filter((t: any) => {
      if (!query) return false;
      const q = query.toLowerCase();
      return t.account.name?.toLowerCase().includes(q) ||
             t.account.symbol?.toLowerCase().includes(q) ||
             t.account.tokenMint?.toBase58().toLowerCase().includes(q);
    })
    .slice(0, 6)
    .map((t: any) => ({
      id: t.account.tokenMint.toBase58(),
      label: t.account.name || "Unknown",
      desc: `$${t.account.symbol}`,
      icon: Flame,
      href: `/token/${t.account.tokenMint.toBase58()}`,
      category: "token" as const,
    }));

  const filteredNav = navItems.filter((item) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return item.label.toLowerCase().includes(q) || item.desc?.toLowerCase().includes(q);
  });

  const allItems = [...recentItems, ...tokenItems, ...filteredNav];

  const execute = useCallback((item: CommandItem) => {
    setOpen(false);
    if (item.href) router.push(item.href);
    if (item.action) item.action();
  }, [router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, allItems.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && allItems[selected]) { execute(allItems[selected]); }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[200]"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-[18%] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg z-[201] bg-bg-card rounded-lg border border-[var(--border)] shadow-xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]">
              <Search className="h-4 w-4 text-txt-muted shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={handleKeyDown}
                placeholder={SEARCH_COPY.placeholder}
                aria-label="Search tokens and pages"
                className="flex-1 bg-transparent text-[14px] text-txt outline-none placeholder:text-txt-muted"
              />
              <kbd className="text-[9px] font-mono bg-bg-elevated text-txt-muted px-1.5 py-0.5 rounded border border-[var(--border)]">ESC</kbd>
            </div>

            {/* Hint */}
            <div className="px-4 py-1.5 bg-bg-elevated border-b border-[var(--border)]">
              <p className="text-[10px] text-txt-muted font-lore italic">{SEARCH_COPY.hint}</p>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-1.5" role="listbox" aria-label="Search results">
              {allItems.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-[13px] text-txt-secondary font-medium">{SEARCH_COPY.noResults}</p>
                  <p className="text-[11px] text-txt-muted font-lore italic mt-1">{SEARCH_COPY.noResultsLore}</p>
                </div>
              ) : (
                <>
                  {recentItems.length > 0 && (
                    <p className="px-4 py-1.5 text-[9px] font-mono text-txt-muted uppercase tracking-widest">{SEARCH_COPY.recentHeader}</p>
                  )}
                  {recentItems.map((item, i) => (
                    <CommandRow key={item.id} item={item} active={i === selected} onClick={() => execute(item)} />
                  ))}

                  {tokenItems.length > 0 && (
                    <p className="px-4 py-1.5 text-[9px] font-mono text-txt-muted uppercase tracking-widest mt-0.5">Tokens</p>
                  )}
                  {tokenItems.map((item, i) => {
                    const idx = recentItems.length + i;
                    return <CommandRow key={item.id} item={item} active={idx === selected} onClick={() => execute(item)} />;
                  })}

                  {filteredNav.length > 0 && (
                    <p className="px-4 py-1.5 text-[9px] font-mono text-txt-muted uppercase tracking-widest mt-0.5">Pages</p>
                  )}
                  {filteredNav.map((item, i) => {
                    const idx = recentItems.length + tokenItems.length + i;
                    return <CommandRow key={item.id} item={item} active={idx === selected} onClick={() => execute(item)} />;
                  })}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border)] bg-bg-elevated">
              <span className="text-[9px] text-txt-muted font-mono">↑↓ navigate</span>
              <span className="text-[9px] text-txt-muted font-mono">↵ open</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CommandRow({ item, active, onClick }: { item: CommandItem; active: boolean; onClick: () => void }) {
  return (
    <button
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
        active ? "bg-crimson/8 text-txt" : "text-txt-secondary hover:bg-bg-elevated"
      }`}
    >
      <item.icon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-crimson" : "text-txt-muted"}`} />
      <div className="flex-1 min-w-0">
        <span className="text-[13px] font-medium">{item.label}</span>
        {item.desc && <span className="text-[11px] text-txt-muted ml-2">{item.desc}</span>}
      </div>
      <ArrowRight className={`h-3 w-3 ${active ? "text-crimson" : "text-txt-disabled"}`} />
    </button>
  );
}

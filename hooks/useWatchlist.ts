"use client";
import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "ph_watchlist";
const MAX_ITEMS = 50;

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setWatchlist(JSON.parse(stored));
    } catch {}
  }, []);

  const persist = useCallback((list: string[]) => {
    setWatchlist(list);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
  }, []);

  const toggle = useCallback((mint: string) => {
    setWatchlist((prev) => {
      const next = prev.includes(mint)
        ? prev.filter((m) => m !== mint)
        : [mint, ...prev].slice(0, MAX_ITEMS);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const isWatched = useCallback((mint: string) => watchlist.includes(mint), [watchlist]);

  return { watchlist, toggle, isWatched };
}

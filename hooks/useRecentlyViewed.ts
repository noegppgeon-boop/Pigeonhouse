"use client";
import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "ph_recently_viewed";
const MAX_ITEMS = 10;

export interface RecentItem {
  mint: string;
  name: string;
  symbol: string;
  ts: number;
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  const add = useCallback((mint: string, name: string, symbol: string) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.mint !== mint);
      const next = [{ mint, name, symbol, ts: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return { items, add };
}

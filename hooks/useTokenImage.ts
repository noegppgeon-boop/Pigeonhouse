"use client";

import { useState, useEffect } from "react";

const cache = new Map<string, string | null>();

export function useTokenImage(uri: string | null | undefined): string | null {
  const [image, setImage] = useState<string | null>(uri && cache.has(uri) ? cache.get(uri)! : null);

  useEffect(() => {
    if (!uri || uri.length < 8) return;
    if (cache.has(uri)) { setImage(cache.get(uri)!); return; }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(uri, { signal: AbortSignal.timeout(5000) });
        if (!res.ok || cancelled) return;
        const json = await res.json();
        const img = json.image || json.imageUrl || null;
        cache.set(uri, img);
        if (!cancelled) setImage(img);
      } catch {
        cache.set(uri, null);
      }
    })();
    return () => { cancelled = true; };
  }, [uri]);

  return image;
}

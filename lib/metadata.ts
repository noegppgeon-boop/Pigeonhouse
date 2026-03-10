// Metadata image cache — fetches token URI JSON and extracts image
const imageCache = new Map<string, string | null>();
const pendingFetches = new Map<string, Promise<string | null>>();

export async function getTokenImage(uri: string | null | undefined): Promise<string | null> {
  if (!uri || uri.length < 8) return null;

  if (imageCache.has(uri)) return imageCache.get(uri) ?? null;
  if (pendingFetches.has(uri)) return pendingFetches.get(uri)!;

  const fetchPromise = (async () => {
    try {
      const res = await fetch(uri, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const json = await res.json();
      const image = json.image || json.imageUrl || null;
      imageCache.set(uri, image);
      return image;
    } catch {
      imageCache.set(uri, null);
      return null;
    } finally {
      pendingFetches.delete(uri);
    }
  })();

  pendingFetches.set(uri, fetchPromise);
  return fetchPromise;
}

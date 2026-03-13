/**
 * In-memory trade store fed by Helius webhooks.
 * Falls back to polling if webhook data is stale.
 *
 * Trades are stored per-mint with a max buffer and auto-expiry.
 */

export interface Trade {
  type: "buy" | "sell";
  signature: string;
  timestamp: number;
  tokenAmount: number;
  quoteAmount: number;
  pigeonAmount: number; // alias for quoteAmount (chart compat)
  quoteSymbol: string;
  price: number;
  trader: string;
  source: "webhook" | "poll";
}

const MAX_TRADES_PER_MINT = 200;
const STORE_EXPIRY = 60 * 60 * 1000; // 1 hour — prune old mints

class TradeStore {
  private trades = new Map<string, Trade[]>();
  private lastWebhook = 0;

  /** Add trades from webhook (deduplicates by signature) */
  addTrades(mint: string, newTrades: Trade[]) {
    const existing = this.trades.get(mint) || [];
    const sigs = new Set(existing.map((t) => t.signature));

    for (const t of newTrades) {
      if (!sigs.has(t.signature)) {
        existing.unshift(t); // newest first
        sigs.add(t.signature);
      }
    }

    // Keep only latest N
    if (existing.length > MAX_TRADES_PER_MINT) {
      existing.length = MAX_TRADES_PER_MINT;
    }

    this.trades.set(mint, existing);
    this.lastWebhook = Date.now();
  }

  /** Get trades for a mint */
  getTrades(mint: string, limit = 30): Trade[] {
    return (this.trades.get(mint) || []).slice(0, limit);
  }

  /** Check if we have recent webhook data */
  hasRecentData(mint: string, maxAgeMs = 30_000): boolean {
    const trades = this.trades.get(mint);
    if (!trades || trades.length === 0) return false;
    const newest = trades[0];
    return Date.now() - newest.timestamp * 1000 < maxAgeMs * 10; // generous window
  }

  /** Last webhook received timestamp */
  get lastWebhookTime() {
    return this.lastWebhook;
  }

  /** Is webhook feed alive? (received data in last 5 min) */
  get isWebhookAlive(): boolean {
    return Date.now() - this.lastWebhook < 5 * 60 * 1000;
  }

  /** Get all known mints */
  get mints(): string[] {
    return Array.from(this.trades.keys());
  }

  /** Stats for debugging */
  get stats() {
    return {
      mints: this.trades.size,
      totalTrades: Array.from(this.trades.values()).reduce((s, t) => s + t.length, 0),
      lastWebhook: this.lastWebhook,
      isAlive: this.isWebhookAlive,
    };
  }
}

// Singleton
export const tradeStore = new TradeStore();

/**
 * Helius Webhook Receiver
 *
 * Receives enhanced transaction data from Helius webhooks for PigeonHouse trades.
 * Parses buy/sell events and stores them in the in-memory trade store.
 *
 * Webhook auth: Bearer token via HELIUS_WEBHOOK_SECRET env var.
 */

import { NextResponse, NextRequest } from "next/server";
import { tradeStore, type Trade } from "@/lib/tradeStore";
import { QUOTE_ASSETS, PIGEON_HOUSE_PROGRAM_ID } from "@/lib/constants";
import { PublicKey } from "@solana/web3.js";

export const dynamic = "force-dynamic";

const WEBHOOK_SECRET = process.env.HELIUS_WEBHOOK_SECRET || "";

const QUOTE_MINTS = new Map(
  Object.entries(QUOTE_ASSETS).map(([_, v]) => [v.mint.toBase58(), v.symbol])
);

export async function POST(req: NextRequest) {
  // Auth check — Helius sends authHeader value in the Authorization header
  if (WEBHOOK_SECRET) {
    const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    // Support both "Bearer <secret>" and raw "<secret>" formats
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
    if (token !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await req.json();

    // Helius sends an array of enhanced transactions
    const txs: any[] = Array.isArray(body) ? body : [body];

    let processed = 0;

    for (const tx of txs) {
      if (!tx.tokenTransfers || tx.tokenTransfers.length === 0) continue;

      // Find which token mint this trade is for
      // Look for transfers involving a bonding curve PDA
      const tokenMints = new Set<string>();
      const transfers = tx.tokenTransfers;

      for (const t of transfers) {
        if (!t.mint) continue;
        if (QUOTE_MINTS.has(t.mint)) continue; // skip quote mints

        // Check if this token has a bonding curve PDA
        try {
          const mintPk = new PublicKey(t.mint);
          const [bcPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("bonding_curve"), mintPk.toBuffer()],
            PIGEON_HOUSE_PROGRAM_ID
          );
          const bcAddr = bcPDA.toBase58();

          // If transfer involves the bonding curve, this is our token
          if (t.toUserAccount === bcAddr || t.fromUserAccount === bcAddr) {
            tokenMints.add(t.mint);
          }
        } catch {
          // Invalid pubkey, skip
        }
      }

      if (tokenMints.size === 0) continue;

      // For each token mint found, parse the trade
      for (const mint of tokenMints) {
        const [bcPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("bonding_curve"), new PublicKey(mint).toBuffer()],
          PIGEON_HOUSE_PROGRAM_ID
        );
        const bcAddr = bcPDA.toBase58();

        let type: "buy" | "sell" | null = null;
        let quoteAmount = 0;
        let tokenAmount = 0;
        let trader = "";
        let quoteMint = "";
        let quoteSymbol = "";

        for (const t of transfers) {
          const amt = Math.abs(t.tokenAmount || 0);
          if (amt === 0) continue;

          const isQuote = QUOTE_MINTS.has(t.mint);
          const isToken = t.mint === mint;
          const toBC = t.toUserAccount === bcAddr;
          const fromBC = t.fromUserAccount === bcAddr;

          if (isQuote && (toBC || fromBC)) {
            if (toBC && !type) {
              type = "buy";
              quoteAmount = amt;
              trader = t.fromUserAccount || "";
              quoteMint = t.mint;
            } else if (fromBC && !type) {
              type = "sell";
              quoteAmount = amt;
              trader = t.toUserAccount || "";
              quoteMint = t.mint;
            }
          }

          if (isToken && (toBC || fromBC)) {
            if (amt > tokenAmount) tokenAmount = amt;
            if (fromBC && !type) {
              type = "buy";
              trader = t.toUserAccount || "";
            } else if (toBC && !type) {
              type = "sell";
              trader = t.fromUserAccount || "";
            }
          }
        }

        if (!type || tokenAmount === 0) continue;

        quoteSymbol = QUOTE_MINTS.get(quoteMint) || "PIGEON";
        const price = tokenAmount > 0 ? quoteAmount / tokenAmount : 0;

        const trade: Trade = {
          type,
          signature: tx.signature,
          timestamp: tx.timestamp || Math.floor(Date.now() / 1000),
          tokenAmount,
          quoteAmount,
          pigeonAmount: quoteAmount,
          quoteSymbol,
          price,
          trader,
          source: "webhook",
        };

        tradeStore.addTrades(mint, [trade]);
        processed++;
      }
    }

    return NextResponse.json({
      ok: true,
      processed,
      stats: tradeStore.stats,
    });
  } catch (err: any) {
    console.error("[webhook/helius]", err.message?.slice(0, 200));
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    stats: tradeStore.stats,
  });
}

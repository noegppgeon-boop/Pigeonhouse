import { rateLimit, getClientIP } from "@/lib/rateLimit";
import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { RPC_URL, PIGEON_HOUSE_PROGRAM_ID, PIGEON_MINT } from "@/lib/constants";

export const dynamic = "force-dynamic";

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 30_000;

export async function GET(
  _req: Request,
  { params }: { params: { mint: string } }
) {
  const { ok: rl } = rateLimit(getClientIP(_req));
  if (!rl) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const mint = params.mint;
  const now = Date.now();

  const cached = cache.get(mint);
  if (cached && now - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const conn = new Connection(RPC_URL, "confirmed");
    const pigeonMintStr = PIGEON_MINT.toBase58();

    const [bondingCurvePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding_curve"), new PublicKey(mint).toBuffer()],
      PIGEON_HOUSE_PROGRAM_ID
    );

    // Get signatures (lightweight, one RPC call)
    const sigs = await conn.getSignaturesForAddress(bondingCurvePDA, { limit: 50 });

    const trades: any[] = [];

    // Parse transactions ONE AT A TIME with delay to avoid 429
    for (const sig of sigs) {
      try {
        const tx = await conn.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });
        if (!tx?.meta?.logMessages) continue;

        const logs = tx.meta.logMessages;
        let type: "buy" | "sell" | null = null;
        for (const log of logs) {
          if (log.includes("Instruction: Buy")) type = "buy";
          if (log.includes("Instruction: Sell")) type = "sell";
        }
        if (!type) continue;

        // Extract amounts from token balance changes
        const pre = tx.meta.preTokenBalances || [];
        const post = tx.meta.postTokenBalances || [];

        let pigeonAmount = 0;
        let tokenAmount = 0;

        for (const p of post) {
          const pr = pre.find(
            (x) => x.accountIndex === p.accountIndex && x.mint === p.mint
          );
          if (!pr?.uiTokenAmount || !p.uiTokenAmount) continue;

          const diff = Math.abs(
            (p.uiTokenAmount.uiAmount || 0) - (pr.uiTokenAmount.uiAmount || 0)
          );
          if (diff < 0.0001) continue;

          if (p.mint === pigeonMintStr) {
            pigeonAmount = Math.max(pigeonAmount, diff);
          } else if (p.mint === mint) {
            tokenAmount = Math.max(tokenAmount, diff);
          }
        }

        const price = tokenAmount > 0 ? pigeonAmount / tokenAmount : 0;

        trades.push({
          type,
          signature: sig.signature,
          timestamp: sig.blockTime || 0,
          tokenAmount,
          pigeonAmount,
          price,
        });
      } catch {
        // Skip failed parses (rate limit etc)
        continue;
      }

      // Small delay between fetches (avoid 429)
      await new Promise((r) => setTimeout(r, 200));
    }

    const result = { trades, lastUpdated: now };
    cache.set(mint, { data: result, ts: now });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[trades]", err.message?.slice(0, 200));
    return NextResponse.json({ error: err.message, trades: [] }, { status: 500 });
  }
}

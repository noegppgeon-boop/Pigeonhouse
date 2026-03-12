import { rateLimit, getClientIP } from "@/lib/rateLimit";
import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { PIGEON_HOUSE_PROGRAM_ID, PIGEON_MINT } from "@/lib/constants";

export const dynamic = "force-dynamic";

const HELIUS_KEY = process.env.NEXT_PUBLIC_RPC_URL?.match(/api-key=([^&]+)/)?.[1]
  || process.env.HELIUS_API_KEY
  || "eb49a51b-3242-4758-8de7-db8d9f629e57";

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 15_000; // 15s

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
    const pigeonMint = "4fSWEw2wbYEUCcMtitzmeGUfqinoafXxkhqZrA9Gpump";

    const programId = new PublicKey("BV1RxkAaD5DjXMsnofkVikFUUYdrDg1v8YgsQ3iyDNoL");
    const [bondingCurvePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding_curve"), new PublicKey(mint).toBuffer()],
      programId
    );
    const bcAddr = bondingCurvePDA.toBase58();
    // Bonding curve's vault ATAs (Token-2022 PDAs)
    let bcPigeonVault: string;
    let bcTokenVault: string;
    try {
      bcPigeonVault = getAssociatedTokenAddressSync(
        PIGEON_MINT, bondingCurvePDA, true, TOKEN_2022_PROGRAM_ID
      ).toBase58();
      bcTokenVault = getAssociatedTokenAddressSync(
        new PublicKey(mint), bondingCurvePDA, true, TOKEN_2022_PROGRAM_ID
      ).toBase58();
    } catch {
      // Fallback: derive from userAccount instead of tokenAccount
      bcPigeonVault = "";
      bcTokenVault = "";
    }

    // Single Helius Enhanced Transactions call — returns tokenTransfers parsed
    const url = `https://api-mainnet.helius-rpc.com/v0/addresses/${mint}/transactions?api-key=${HELIUS_KEY}&limit=50`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Helius ${res.status}`);
    const txs: any[] = await res.json();

    const trades: any[] = [];

    for (const tx of txs) {
      if (!tx.tokenTransfers || tx.tokenTransfers.length === 0) continue;

      // Find PIGEON and token transfers involving the bonding curve
      let pigeonAmount = 0;
      let tokenAmount = 0;
      let type: "buy" | "sell" | null = null;
      let trader = "";

      for (const t of tx.tokenTransfers) {
        const isPigeon = t.mint === pigeonMint;
        const isToken = t.mint === mint;
        const amt = Math.abs(t.tokenAmount || 0);

        if (isPigeon) {
          // Match by token account OR user account (BC PDA)
          const toVault = t.toTokenAccount === bcPigeonVault || t.toUserAccount === bcAddr;
          const fromVault = t.fromTokenAccount === bcPigeonVault || t.fromUserAccount === bcAddr;

          if (toVault && !type) {
            // PIGEON going TO bonding curve = BUY
            pigeonAmount = amt;
            type = "buy";
            trader = t.fromUserAccount || "";
          } else if (fromVault && !type) {
            // PIGEON coming FROM bonding curve = SELL
            pigeonAmount = amt;
            type = "sell";
            trader = t.toUserAccount || "";
          }
        }

        if (isToken) {
          const toVault = t.toTokenAccount === bcTokenVault || t.toUserAccount === bcAddr;
          const fromVault = t.fromTokenAccount === bcTokenVault || t.fromUserAccount === bcAddr;
          if (toVault || fromVault) {
            if (amt > tokenAmount) tokenAmount = amt;
          }
        }
      }

      if (!type || tokenAmount === 0) continue;

      // Exclude fee/treasury transfers from amount
      // Use the largest PIGEON transfer as the trade amount
      const price = tokenAmount > 0 ? pigeonAmount / tokenAmount : 0;

      trades.push({
        type,
        signature: tx.signature,
        timestamp: tx.timestamp || 0,
        tokenAmount,
        pigeonAmount,
        price,
        trader,
      });
    }

    const result = { trades, lastUpdated: now };
    cache.set(mint, { data: result, ts: now });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[trades]", err.message?.slice(0, 200));
    return NextResponse.json({ error: err.message, trades: [] }, { status: 500 });
  }
}

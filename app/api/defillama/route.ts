import { NextResponse, NextRequest } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import idl from "@/public/idl/pigeon_house.json";
import { PIGEON_HOUSE_PROGRAM_ID, QUOTE_ASSETS } from "@/lib/constants";
import { rateLimit, getClientIP } from "@/lib/rateLimit";

const DISCRIMINATOR_SIZE = 8;
const PUBKEY_SIZE = 32;
const U64_SIZE = 8;

/**
 * GET /api/defillama
 * Returns TVL (total value locked in bonding curves) and volume stats.
 * Public endpoint — no auth required, 60s cache.
 */
export async function GET(req: NextRequest) {
  const { ok } = rateLimit(`defillama:${getClientIP(req)}`, 60_000, 10);
  if (!ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com";
    const conn = new Connection(rpcUrl, "confirmed");
    const pid = PIGEON_HOUSE_PROGRAM_ID;

    // Get all BondingCurve accounts
    const crypto = await import("crypto");
    const hash = crypto.createHash("sha256").update("account:BondingCurve").digest();
    const discriminator = hash.subarray(0, 8);

    const accounts = await conn.getProgramAccounts(pid, {
      filters: [{ memcmp: { offset: 0, bytes: anchor.utils.bytes.bs58.encode(discriminator) } }],
    });

    // Quote mint → symbol + decimals mapping
    const quoteInfo: Record<string, { symbol: string; decimals: number; priceUsd?: number }> = {};
    for (const qa of Object.values(QUOTE_ASSETS)) {
      quoteInfo[qa.mint.toBase58()] = { symbol: qa.symbol, decimals: qa.decimals };
    }

    // Fetch USD prices from DexScreener
    try {
      const pigeonRes = await fetch("https://api.dexscreener.com/latest/dex/tokens/4fSWEw2wbYEUCcMtitzmeGUfqinoafXxkhqZrA9Gpump");
      const pigeonData = await pigeonRes.json();
      const pigeonPair = pigeonData?.pairs?.[0];
      if (pigeonPair) {
        quoteInfo["4fSWEw2wbYEUCcMtitzmeGUfqinoafXxkhqZrA9Gpump"] = {
          ...quoteInfo["4fSWEw2wbYEUCcMtitzmeGUfqinoafXxkhqZrA9Gpump"],
          priceUsd: parseFloat(pigeonPair.priceUsd),
        };
      }

      const solRes = await fetch("https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112");
      const solData = await solRes.json();
      const solPair = solData?.pairs?.[0];
      if (solPair) {
        quoteInfo["So11111111111111111111111111111111111111112"] = {
          ...quoteInfo["So11111111111111111111111111111111111111112"],
          priceUsd: parseFloat(solPair.priceUsd),
        };
      }
    } catch {}

    let totalTvlUsd = 0;
    let activeTokens = 0;
    let graduatedTokens = 0;
    const tvlByQuote: Record<string, number> = {};

    for (const item of accounts) {
      try {
        const data = item.account.data as Buffer;
        let offset = DISCRIMINATOR_SIZE;

        // tokenMint
        offset += PUBKEY_SIZE;
        // creator
        offset += PUBKEY_SIZE;

        // Detect layout — check data length
        const hasQuoteMint = data.length >= 408;
        let quoteMintStr = "4fSWEw2wbYEUCcMtitzmeGUfqinoafXxkhqZrA9Gpump"; // default PIGEON

        if (hasQuoteMint) {
          quoteMintStr = new PublicKey(data.subarray(offset, offset + PUBKEY_SIZE)).toBase58();
          offset += PUBKEY_SIZE;
        }

        const virtualQuoteReserves = Number(data.readBigUInt64LE(offset)) / Math.pow(10, quoteInfo[quoteMintStr]?.decimals || 6);
        offset += U64_SIZE;
        offset += U64_SIZE; // virtualTokenReserves
        offset += U64_SIZE; // realTokenReserves
        const realQuoteReserves = Number(data.readBigUInt64LE(offset)) / Math.pow(10, quoteInfo[quoteMintStr]?.decimals || 6);
        offset += U64_SIZE;
        offset += U64_SIZE; // totalSupply
        const isGraduated = data[offset] === 1;

        if (isGraduated) {
          graduatedTokens++;
          continue; // Graduated tokens' liquidity is on Raydium, not in bonding curves
        }

        activeTokens++;
        const quoteSymbol = quoteInfo[quoteMintStr]?.symbol || "UNKNOWN";
        const priceUsd = quoteInfo[quoteMintStr]?.priceUsd || 0;
        const tvlQuote = realQuoteReserves;
        const tvlUsd = tvlQuote * priceUsd;

        tvlByQuote[quoteSymbol] = (tvlByQuote[quoteSymbol] || 0) + tvlUsd;
        totalTvlUsd += tvlUsd;
      } catch {}
    }

    // GlobalConfig for total stats
    const [globalConfigPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("pigeon_house_config")], pid
    );
    const dummyWallet = { publicKey: PublicKey.default, signTransaction: async (tx: any) => tx, signAllTransactions: async (txs: any) => txs } as anchor.Wallet;
    const provider = new anchor.AnchorProvider(conn, dummyWallet, { commitment: "confirmed" });
    const program = new anchor.Program(idl as any, provider);
    const config = await (program.account as any).globalConfig.fetch(globalConfigPDA);

    const response = {
      // TVL for DefiLlama
      tvl: totalTvlUsd,
      tvlByQuote,
      // Protocol stats
      totalTokensLaunched: parseInt(config.totalTokensLaunched.toString()),
      totalPigeonBurned: parseInt(config.totalPigeonBurned.toString()) / 1e6,
      activeTokens,
      graduatedTokens,
      // Metadata
      programId: pid.toBase58(),
      chain: "solana",
      timestamp: Math.floor(Date.now() / 1000),
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

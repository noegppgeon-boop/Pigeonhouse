import { NextResponse } from "next/server";
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { RPC_URL, PIGEON_HOUSE_PROGRAM_ID, SOL_MINT, SKR_MINT, PIGEON_MINT } from "@/lib/constants";
import { rateLimit, getClientIP } from "@/lib/rateLimit";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function getProgram() {
  const conn = new Connection(RPC_URL, "confirmed");
  const idlPath = path.join(process.cwd(), "public/idl/pigeon_house.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any) => txs,
  } as anchor.Wallet;
  const provider = new anchor.AnchorProvider(conn, dummyWallet, { commitment: "confirmed" });
  return new anchor.Program(idl, provider);
}

export async function GET(req: Request) {
  const { ok } = rateLimit(getClientIP(req));
  if (!ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  try {
    const program = getProgram();
    const pid = program.programId;

    const results: any = { quoteAssets: {}, reserves: {}, burnAccruals: {} };

    // Quote asset configs
    for (const [key, mint] of [["pigeon", PIGEON_MINT], ["sol", SOL_MINT], ["skr", SKR_MINT]] as const) {
      const [pda] = PublicKey.findProgramAddressSync([Buffer.from("quote_asset"), mint.toBuffer()], pid);
      try {
        const c = await (program.account as any).quoteAssetConfig.fetch(pda);
        results.quoteAssets[key] = {
          symbol: c.symbol,
          decimals: c.decimals,
          platformFeeBps: c.platformFeeBps,
          pigeonBurnBps: c.pigeonBurnBps,
          reserveBps: c.reserveBps,
          treasuryBps: c.treasuryBps,
          referralBps: c.referralBps,
          enabledForLaunch: c.enabledForLaunch,
          enabledForTrade: c.enabledForTrade,
          reserveEnabled: c.reserveEnabled,
          reserveCap: c.reserveCap?.toString() ?? "0",
        };
      } catch {
        results.quoteAssets[key] = null;
      }
    }

    // Strategic reserve vaults
    for (const [key, mint] of [["sol", SOL_MINT], ["skr", SKR_MINT]] as const) {
      const [pda] = PublicKey.findProgramAddressSync([Buffer.from("strategic_reserve"), mint.toBuffer()], pid);
      try {
        const v = await (program.account as any).strategicReserveVault.fetch(pda);
        results.reserves[key] = {
          totalAccrued: v.totalAccrued.toString(),
          totalWithdrawn: v.totalWithdrawn.toString(),
          balance: v.totalAccrued.sub(v.totalWithdrawn).toString(),
        };
      } catch {
        results.reserves[key] = null;
      }
    }

    // Burn accrual vaults
    for (const [key, mint] of [["sol", SOL_MINT], ["skr", SKR_MINT]] as const) {
      const [pda] = PublicKey.findProgramAddressSync([Buffer.from("burn_accrual"), mint.toBuffer()], pid);
      try {
        const v = await (program.account as any).burnAccrualVault.fetch(pda);
        results.burnAccruals[key] = {
          totalAccrued: v.totalAccrued.toString(),
          totalSwept: v.totalSwept.toString(),
          balance: v.totalAccrued.sub(v.totalSwept).toString(),
        };
      } catch {
        results.burnAccruals[key] = null;
      }
    }

    return NextResponse.json(results);
  } catch (err: any) {
    console.error("[API /reserves] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { rateLimit, getClientIP } from "@/lib/rateLimit";
import { NextResponse } from "next/server";
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { RPC_URL } from "@/lib/constants";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { ok: rl } = rateLimit(getClientIP(req));
  if (!rl) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  try {
    const conn = new Connection(RPC_URL, "confirmed");
    const idlPath = path.join(process.cwd(), "public/idl/pigeon_house.json");
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
    const dummyWallet = {
      publicKey: PublicKey.default,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any) => txs,
    } as anchor.Wallet;
    const provider = new anchor.AnchorProvider(conn, dummyWallet, { commitment: "confirmed" });
    const program = new anchor.Program(idl, provider);
    const pid = program.programId;

    const [globalConfigPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("pigeon_house_config")], pid
    );
    
    let globalStats = { launched: 0, burned: 0 };
    try {
      const config = await (program.account as any).globalConfig.fetch(globalConfigPDA);
      globalStats = {
        launched: parseInt(config.totalTokensLaunched.toString()),
        burned: parseFloat(config.totalPigeonBurned.toString()) / 1e6,
      };
    } catch {}

    const allCurves = await (program.account as any).bondingCurve.all();
    const tokens = allCurves
      .map((a: any) => ({
        mint: a.account.tokenMint.toBase58(),
        symbol: a.account.symbol,
        name: a.account.name,
        creator: a.account.creator.toBase58(),
        realPigeonReserves: parseFloat(a.account.realPigeonReserves.toString()) / 1e6,
        complete: a.account.complete,
        createdAt: parseInt(a.account.createdAt.toString()),
      }))
      .sort((a: any, b: any) => b.realPigeonReserves - a.realPigeonReserves);

    // Creator rankings
    const creatorMap: Record<string, { tokens: number; totalPigeon: number }> = {};
    for (const t of tokens) {
      if (!creatorMap[t.creator]) creatorMap[t.creator] = { tokens: 0, totalPigeon: 0 };
      creatorMap[t.creator].tokens++;
      creatorMap[t.creator].totalPigeon += t.realPigeonReserves;
    }
    const creators = Object.entries(creatorMap)
      .map(([addr, data]) => ({ address: addr, ...data }))
      .sort((a, b) => b.totalPigeon - a.totalPigeon);

    return NextResponse.json({ globalStats, tokens, creators });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

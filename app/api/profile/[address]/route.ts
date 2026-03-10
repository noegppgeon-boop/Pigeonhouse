import { rateLimit, getClientIP } from "@/lib/rateLimit";
import { NextResponse } from "next/server";
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { RPC_URL, PIGEON_MINT } from "@/lib/constants";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { address: string } }
) {
  const { ok: rl } = rateLimit(getClientIP(_req));
  if (!rl) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  try {
    const conn = new Connection(RPC_URL, "confirmed");
    const pubkey = new PublicKey(params.address);

    // SOL balance
    const sol = await conn.getBalance(pubkey);

    // PIGEON balance
    let pigeonBalance = 0;
    try {
      const pigeonAta = getAssociatedTokenAddressSync(PIGEON_MINT, pubkey, false, TOKEN_2022_PROGRAM_ID);
      const ataInfo = await conn.getAccountInfo(pigeonAta);
      if (ataInfo && ataInfo.data.length >= 72) {
        pigeonBalance = Number(ataInfo.data.readBigUInt64LE(64));
      }
    } catch {}

    // Anchor program
    const idlPath = path.join(process.cwd(), "public/idl/pigeon_house.json");
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
    const dummyWallet = {
      publicKey: PublicKey.default,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any) => txs,
    } as anchor.Wallet;
    const provider = new anchor.AnchorProvider(conn, dummyWallet, { commitment: "confirmed" });
    const program = new anchor.Program(idl, provider);

    const allCurves = await (program.account as any).bondingCurve.all();
    const created = allCurves
      .filter((a: any) => a.account.creator.toBase58() === params.address)
      .map((a: any) => ({
        mint: a.account.tokenMint.toBase58(),
        symbol: a.account.symbol,
        name: a.account.name,
        realPigeonReserves: a.account.realPigeonReserves.toString(),
        complete: a.account.complete,
        createdAt: a.account.createdAt.toString(),
      }))
      .sort((a: any, b: any) => parseInt(b.createdAt) - parseInt(a.createdAt));

    return NextResponse.json({
      solBalance: sol / 1e9,
      pigeonBalance: pigeonBalance / 1e6,
      createdTokens: created,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

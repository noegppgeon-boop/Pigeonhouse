import { NextResponse } from "next/server";
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { RPC_URL, PIGEON_HOUSE_PROGRAM_ID } from "@/lib/constants";
import { rateLimit, getClientIP } from "@/lib/rateLimit";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function getProgram() {
  console.log("[API] RPC_URL:", RPC_URL);
  const conn = new Connection(RPC_URL, "confirmed");
  const idlPath = path.join(process.cwd(), "public/idl/pigeon_house.json");
  console.log("[API] IDL path:", idlPath);
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  console.log("[API] IDL address:", idl.address);
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any) => txs,
  } as anchor.Wallet;
  const provider = new anchor.AnchorProvider(conn, dummyWallet, {
    commitment: "confirmed",
  });
  return new anchor.Program(idl, provider);
}

export async function GET(req: Request) {
  const { ok } = rateLimit(getClientIP(req));
  if (!ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  try {
    const program = getProgram();
    const pid = program.programId;

    const [globalConfigPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("pigeon_house_config")],
      pid
    );

    const config = await (program.account as any).globalConfig.fetch(
      globalConfigPDA
    );
    const allCurves = await (program.account as any).bondingCurve.all();

    // Serialize BigNumbers to strings
    const serializeCurve = (c: any) => ({
      tokenMint: c.tokenMint.toBase58(),
      creator: c.creator.toBase58(),
      virtualPigeonReserves: c.virtualPigeonReserves.toString(),
      virtualTokenReserves: c.virtualTokenReserves.toString(),
      realPigeonReserves: c.realPigeonReserves.toString(),
      realTokenReserves: c.realTokenReserves.toString(),
      tokenTotalSupply: c.tokenTotalSupply.toString(),
      complete: c.complete,
      createdAt: c.createdAt.toString(),
      name: c.name,
      symbol: c.symbol,
      uri: c.uri,
      bump: c.bump,
    });

    const curves = allCurves.map((item: any) => ({
      publicKey: item.publicKey.toBase58(),
      account: serializeCurve(item.account),
    }));

    return NextResponse.json({
      config: {
        authority: config.authority.toBase58(),
        pigeonMint: config.pigeonMint.toBase58(),
        treasury: config.treasury.toBase58(),
        platformFeeBps: config.platformFeeBps,
        graduationPigeonAmount: config.graduationPigeonAmount.toString(),
        totalTokensLaunched: config.totalTokensLaunched.toString(),
        totalPigeonBurned: config.totalPigeonBurned.toString(),
      },
      curves,
    });
  } catch (err: any) {
    console.error("[API /platform] Error:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to fetch" },
      { status: 500 }
    );
  }
}

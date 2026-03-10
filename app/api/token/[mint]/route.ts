import { rateLimit, getClientIP } from "@/lib/rateLimit";
import { NextResponse } from "next/server";
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { RPC_URL } from "@/lib/constants";
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
  const provider = new anchor.AnchorProvider(conn, dummyWallet, {
    commitment: "confirmed",
  });
  return new anchor.Program(idl, provider);
}

export async function GET(
  _req: Request,
  { params }: { params: { mint: string } }
) {
  const { ok: rl } = rateLimit(getClientIP(_req));
  if (!rl) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  try {
    const program = getProgram();
    const pid = program.programId;
    const mint = new PublicKey(params.mint);

    const [bondingCurvePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding_curve"), mint.toBuffer()],
      pid
    );
    const [globalConfigPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("pigeon_house_config")],
      pid
    );

    const [curve, config] = await Promise.all([
      (program.account as any).bondingCurve.fetch(bondingCurvePDA),
      (program.account as any).globalConfig.fetch(globalConfigPDA),
    ]);

    return NextResponse.json({
      curve: {
        tokenMint: curve.tokenMint.toBase58(),
        creator: curve.creator.toBase58(),
        virtualPigeonReserves: curve.virtualPigeonReserves.toString(),
        virtualTokenReserves: curve.virtualTokenReserves.toString(),
        realPigeonReserves: curve.realPigeonReserves.toString(),
        realTokenReserves: curve.realTokenReserves.toString(),
        tokenTotalSupply: curve.tokenTotalSupply.toString(),
        complete: curve.complete,
        createdAt: curve.createdAt.toString(),
        name: curve.name,
        symbol: curve.symbol,
        uri: curve.uri,
        bump: curve.bump,
      },
      config: {
        authority: config.authority.toBase58(),
        pigeonMint: config.pigeonMint.toBase58(),
        treasury: config.treasury.toBase58(),
        platformFeeBps: config.platformFeeBps,
        graduationPigeonAmount: config.graduationPigeonAmount.toString(),
        totalTokensLaunched: config.totalTokensLaunched.toString(),
        totalPigeonBurned: config.totalPigeonBurned.toString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch" },
      { status: 500 }
    );
  }
}

import { rateLimit, getClientIP } from "@/lib/rateLimit";
import { NextResponse } from "next/server";
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { RPC_URL, PIGEON_MINT } from "@/lib/constants";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const DISCRIMINATOR_SIZE = 8;
const PUBKEY_SIZE = 32;
const U64_SIZE = 8;
const I64_SIZE = 8;
const BOOL_SIZE = 1;

function deserializeBondingCurveRaw(data: Buffer) {
  let offset = DISCRIMINATOR_SIZE;

  const tokenMint = new PublicKey(data.subarray(offset, offset + PUBKEY_SIZE));
  offset += PUBKEY_SIZE;
  const creator = new PublicKey(data.subarray(offset, offset + PUBKEY_SIZE));
  offset += PUBKEY_SIZE;

  // Detect old vs new layout
  const oldCompleteOffset = DISCRIMINATOR_SIZE + 2 * PUBKEY_SIZE + 5 * U64_SIZE;
  const newCompleteOffset = DISCRIMINATOR_SIZE + 3 * PUBKEY_SIZE + 5 * U64_SIZE;

  let quoteMint: PublicKey;
  let isNewLayout = false;

  if (data.length > newCompleteOffset && (data[newCompleteOffset] === 0 || data[newCompleteOffset] === 1)) {
    if (data[oldCompleteOffset] === 0 || data[oldCompleteOffset] === 1) {
      const newNameLenOffset = newCompleteOffset + BOOL_SIZE + I64_SIZE;
      if (data.length > newNameLenOffset + 4) {
        const nameLen = data.readUInt32LE(newNameLenOffset);
        isNewLayout = nameLen > 0 && nameLen <= 32;
      }
    } else {
      isNewLayout = true;
    }
  }

  if (isNewLayout) {
    quoteMint = new PublicKey(data.subarray(offset, offset + PUBKEY_SIZE));
    offset += PUBKEY_SIZE;
  } else {
    quoteMint = PIGEON_MINT;
  }

  const virtualPigeonReserves = new anchor.BN(data.subarray(offset, offset + U64_SIZE), "le");
  offset += U64_SIZE;
  const virtualTokenReserves = new anchor.BN(data.subarray(offset, offset + U64_SIZE), "le");
  offset += U64_SIZE;
  const realPigeonReserves = new anchor.BN(data.subarray(offset, offset + U64_SIZE), "le");
  offset += U64_SIZE;
  const realTokenReserves = new anchor.BN(data.subarray(offset, offset + U64_SIZE), "le");
  offset += U64_SIZE;
  const tokenTotalSupply = new anchor.BN(data.subarray(offset, offset + U64_SIZE), "le");
  offset += U64_SIZE;
  const complete = data[offset] === 1;
  offset += BOOL_SIZE;
  const createdAt = new anchor.BN(data.subarray(offset, offset + I64_SIZE), "le");
  offset += I64_SIZE;

  const nameLen = data.readUInt32LE(offset); offset += 4;
  const name = data.subarray(offset, offset + nameLen).toString("utf8"); offset += nameLen;
  const symbolLen = data.readUInt32LE(offset); offset += 4;
  const symbol = data.subarray(offset, offset + symbolLen).toString("utf8"); offset += symbolLen;
  const uriLen = data.readUInt32LE(offset); offset += 4;
  const uri = data.subarray(offset, offset + uriLen).toString("utf8"); offset += uriLen;
  const bump = data[offset];

  return {
    tokenMint: tokenMint.toBase58(),
    creator: creator.toBase58(),
    quoteMint: quoteMint.toBase58(),
    virtualPigeonReserves: virtualPigeonReserves.toString(),
    virtualTokenReserves: virtualTokenReserves.toString(),
    realPigeonReserves: realPigeonReserves.toString(),
    realTokenReserves: realTokenReserves.toString(),
    tokenTotalSupply: tokenTotalSupply.toString(),
    complete,
    createdAt: createdAt.toString(),
    name,
    symbol,
    uri,
    bump,
  };
}

function getConnAndProgram() {
  const conn = new Connection(RPC_URL, "confirmed");
  const idlPath = path.join(process.cwd(), "public/idl/pigeon_house.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any) => txs,
  } as anchor.Wallet;
  const provider = new anchor.AnchorProvider(conn, dummyWallet, { commitment: "confirmed" });
  return { conn, program: new anchor.Program(idl, provider) };
}

export async function GET(
  _req: Request,
  { params }: { params: { mint: string } }
) {
  const { ok: rl } = rateLimit(getClientIP(_req));
  if (!rl) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  try {
    const { conn, program } = getConnAndProgram();
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

    const [curveAcct, config] = await Promise.all([
      conn.getAccountInfo(bondingCurvePDA),
      (program.account as any).globalConfig.fetch(globalConfigPDA),
    ]);

    if (!curveAcct) {
      return NextResponse.json({ error: "Bonding curve not found" }, { status: 404 });
    }

    const curve = deserializeBondingCurveRaw(curveAcct.data as Buffer);

    return NextResponse.json({
      curve,
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

import { NextResponse } from "next/server";
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { RPC_URL, PIGEON_HOUSE_PROGRAM_ID, PIGEON_MINT } from "@/lib/constants";
import { rateLimit, getClientIP } from "@/lib/rateLimit";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// Tokens created before graduation threshold fix (2026-03-12)
// Hidden from board but stats still count
const HIDDEN_BEFORE_EPOCH = 1773336100; // Show only LOWIQ (created 1773336129) and later real tokens

// Explicit blocklist — test tokens created after LOWIQ that should be hidden
const HIDDEN_MINTS = new Set([
  "A3JaQrE8GX2KNop5io5i9mHiWdn6dfMsoUKi7pXLvQsE", // VTEST
  "8H6Gi5PysPanBHJ3tyQDU3TMghjbiZqp8AYRyaifRKxB", // VLAUNCH
]);

// Old BondingCurve layout (pre-multi-quote): no quote_mint field
// New BondingCurve layout: has quote_mint (Pubkey, 32 bytes) after creator
// Discriminator: 8 bytes

const DISCRIMINATOR_SIZE = 8;
const PUBKEY_SIZE = 32;
const U64_SIZE = 8;
const I64_SIZE = 8;
const BOOL_SIZE = 1;

// Old layout total fixed = 8 + 32 + 32 + 8*5 + 1 + 8 + 4+32 + 4+10 + 4+200 + 1 = 8+32+32+40+1+8+36+14+204+1 = 376
// New layout total fixed = 8 + 32 + 32 + 32 + 8*5 + 1 + 8 + 4+32 + 4+10 + 4+200 + 1 = 376+32 = 408

function deserializeBondingCurveRaw(data: Buffer) {
  let offset = DISCRIMINATOR_SIZE;

  const tokenMint = new PublicKey(data.subarray(offset, offset + PUBKEY_SIZE));
  offset += PUBKEY_SIZE;

  const creator = new PublicKey(data.subarray(offset, offset + PUBKEY_SIZE));
  offset += PUBKEY_SIZE;

  // Detect old vs new layout:
  // In new layout, next 32 bytes are quote_mint (a valid pubkey)
  // In old layout, next 8 bytes are virtual_pigeon_reserves (a u64)
  // Heuristic: try to read bytes 72-104 as a potential quote_mint
  // If the rest of the fields (starting at offset+32) parse correctly as u64s, it's new layout
  // Simpler: check data length — old accounts are shorter

  // Actually, the program upgraded but didn't change existing account data.
  // Old accounts have data.length based on old struct size.
  // New accounts will have the new struct size.
  // But Anchor doesn't change account size on upgrade — accounts keep their original size.

  // Better approach: check if reading at old offset produces valid `complete` bool (0 or 1)
  // Old layout: complete is at offset 72 + 5*8 = offset 112 (from disc start = 120)
  // New layout: complete is at offset 72 + 32 + 5*8 = offset 144 (from disc start = 152)

  const oldCompleteOffset = DISCRIMINATOR_SIZE + 2 * PUBKEY_SIZE + 5 * U64_SIZE;
  const newCompleteOffset = DISCRIMINATOR_SIZE + 3 * PUBKEY_SIZE + 5 * U64_SIZE;

  let quoteMint: PublicKey;
  let isNewLayout: boolean;

  // Check new layout first: complete should be 0 or 1
  if (data.length > newCompleteOffset && (data[newCompleteOffset] === 0 || data[newCompleteOffset] === 1)) {
    // Check old layout too
    if (data[oldCompleteOffset] === 0 || data[oldCompleteOffset] === 1) {
      // Ambiguous — use data length heuristic
      // Old accounts were created with old struct, new ones with new
      // Try new layout and see if name string length is reasonable
      const newNameLenOffset = newCompleteOffset + BOOL_SIZE + I64_SIZE;
      if (data.length > newNameLenOffset + 4) {
        const nameLen = data.readUInt32LE(newNameLenOffset);
        if (nameLen > 0 && nameLen <= 32) {
          isNewLayout = true;
        } else {
          isNewLayout = false;
        }
      } else {
        isNewLayout = false;
      }
    } else {
      isNewLayout = true;
    }
  } else {
    isNewLayout = false;
  }

  if (isNewLayout) {
    quoteMint = new PublicKey(data.subarray(offset, offset + PUBKEY_SIZE));
    offset += PUBKEY_SIZE;
  } else {
    quoteMint = PIGEON_MINT; // Default for old tokens
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

  // Borsh string: 4-byte length prefix + UTF-8 bytes
  const nameLen = data.readUInt32LE(offset);
  offset += 4;
  const name = data.subarray(offset, offset + nameLen).toString("utf8");
  offset += nameLen;

  const symbolLen = data.readUInt32LE(offset);
  offset += 4;
  const symbol = data.subarray(offset, offset + symbolLen).toString("utf8");
  offset += symbolLen;

  const uriLen = data.readUInt32LE(offset);
  offset += 4;
  const uri = data.subarray(offset, offset + uriLen).toString("utf8");
  offset += uriLen;

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
  return { program: new anchor.Program(idl, provider), conn };
}

export async function GET(req: Request) {
  const { ok } = rateLimit(getClientIP(req));
  if (!ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  try {
    const { program, conn } = getProgram();
    const pid = program.programId;

    const [globalConfigPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("pigeon_house_config")],
      pid
    );

    const config = await (program.account as any).globalConfig.fetch(globalConfigPDA);

    // Fetch all BondingCurve accounts raw (to handle old+new layout)
    // Compute discriminator: sha256("account:BondingCurve")[0..8]
    const crypto = await import("crypto");
    const hash = crypto.createHash("sha256").update("account:BondingCurve").digest();
    const discriminator = hash.subarray(0, 8);
    const accounts = await conn.getProgramAccounts(pid, {
      filters: [{ memcmp: { offset: 0, bytes: anchor.utils.bytes.bs58.encode(discriminator) } }],
    });

    const curves = accounts.map((item) => {
      try {
        return {
          publicKey: item.pubkey.toBase58(),
          account: deserializeBondingCurveRaw(item.account.data as Buffer),
        };
      } catch (e: any) {
        console.warn(`[API] Failed to deserialize curve ${item.pubkey.toBase58()}: ${e.message}`);
        return null;
      }
    }).filter(Boolean);

    // Fetch quote-specific graduation thresholds for all unique quote mints
    const quoteMints = new Set<string>();
    for (const c of curves) {
      if (c && (c as any).account?.quoteMint) quoteMints.add((c as any).account.quoteMint);
    }
    const quoteGradMap: Record<string, string> = {};
    for (const qm of quoteMints) {
      try {
        const qmPk = new PublicKey(qm);
        const [qcPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("quote_asset"), qmPk.toBuffer()], pid
        );
        const qc = await (program.account as any).quoteAssetConfig.fetch(qcPDA);
        quoteGradMap[qm] = qc.graduationThreshold.toString();
      } catch { /* skip */ }
    }

    // Filter out old test tokens (created before graduation threshold fix)
    const visibleCurves = curves.filter((c: any) => {
      if (!c?.account) return false;
      const ts = parseInt(c.account.createdAt || "0", 10);
      if (ts < HIDDEN_BEFORE_EPOCH) return false;
      if (HIDDEN_MINTS.has(c.account.tokenMint)) return false;
      return true;
    });

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
      quoteGradMap,
      curves: visibleCurves,
    });
  } catch (err: any) {
    console.error("[API /platform] Error:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to fetch" },
      { status: 500 }
    );
  }
}

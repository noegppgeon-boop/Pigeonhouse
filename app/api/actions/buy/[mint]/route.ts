import { NextResponse, NextRequest } from "next/server";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { PIGEON_HOUSE_PROGRAM_ID, QUOTE_ASSETS } from "@/lib/constants";
import { rateLimit, getClientIP } from "@/lib/rateLimit";
import {
  ACTIONS_CORS_HEADERS,
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
} from "@solana/actions";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com";
const PIGEON_MINT = new PublicKey("4fSWEw2wbYEUCcMtitzmeGUfqinoafXxkhqZrA9Gpump");
const MAX_AMOUNT = 1_000_000; // Max 1M PIGEON per blink buy
const MIN_AMOUNT = 1; // Min 1 PIGEON

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept-Encoding",
    "Content-Type": "application/json",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders() });
}

/**
 * GET /api/actions/buy/:mint
 * Returns Solana Action metadata for buying a token on PigeonHouse
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { mint: string } }
) {
  const { mint } = params;
  const { ok } = rateLimit(`actions-get:${getClientIP(req)}`, 60_000, 30);
  if (!ok) return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: corsHeaders() });

  try {
    // Fetch token info from our API
    const baseUrl = req.nextUrl.origin;
    const tokenRes = await fetch(`${baseUrl}/api/token/${mint}`);
    const tokenData = await tokenRes.json();

    const curve = tokenData?.curve || tokenData;
    const tokenName = curve?.name || tokenData?.name || "Token";
    const tokenSymbol = curve?.symbol || tokenData?.symbol || "???";
    const tokenImage = curve?.image || tokenData?.image || `${baseUrl}/tokens/pigeon.png`;

    const response: ActionGetResponse = {
      type: "action",
      icon: tokenImage,
      title: `Buy ${tokenName} ($${tokenSymbol})`,
      description: `Buy ${tokenSymbol} on PigeonHouse — every trade burns PIGEON. Verified build, open source.`,
      label: "Buy",
      links: {
        actions: [
          {
            label: "Buy 100 PIGEON worth",
            href: `/api/actions/buy/${mint}?amount=100`,
            type: "transaction",
          },
          {
            label: "Buy 500 PIGEON worth",
            href: `/api/actions/buy/${mint}?amount=500`,
            type: "transaction",
          },
          {
            label: "Buy 1000 PIGEON worth",
            href: `/api/actions/buy/${mint}?amount=1000`,
            type: "transaction",
          },
          {
            label: "Custom amount",
            href: `/api/actions/buy/${mint}?amount={amount}`,
            type: "transaction",
            parameters: [
              {
                name: "amount",
                label: "PIGEON amount",
                required: true,
                type: "number",
              },
            ],
          },
        ],
      },
    };

    return NextResponse.json(response, { headers: corsHeaders() });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch token" },
      { status: 500, headers: corsHeaders() }
    );
  }
}

/**
 * POST /api/actions/buy/:mint
 * Returns a signable transaction for buying a token on PigeonHouse bonding curve
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { mint: string } }
) {
  const { ok } = rateLimit(`actions-post:${getClientIP(req)}`, 60_000, 10);
  if (!ok) return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: corsHeaders() });

  try {
    const { mint } = params;
    const rawAmount = parseInt(req.nextUrl.searchParams.get("amount") || "100");
    const amount = Math.min(MAX_AMOUNT, Math.max(MIN_AMOUNT, isNaN(rawAmount) ? 100 : rawAmount));
    const body: ActionPostRequest = await req.json();

    // Validate account is a valid pubkey
    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch {
      return NextResponse.json({ error: "Invalid account address" }, { status: 400, headers: corsHeaders() });
    }

    const connection = new Connection(RPC_URL, "confirmed");
    const tokenMint = new PublicKey(mint);
    const pid = PIGEON_HOUSE_PROGRAM_ID;

    // Get bonding curve PDA
    const [bondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding_curve"), tokenMint.toBuffer()],
      pid
    );

    // This token uses PIGEON as quote (most PigeonHouse tokens do)
    const quoteMint = PIGEON_MINT;
    const amountLamports = BigInt(amount * 1e6); // PIGEON has 6 decimals
    const minTokensOut = BigInt(1); // Minimum 1 token out — user sees full preview before signing

    // Build buy instruction
    // Discriminator for "buy": first 8 bytes of sha256("global:buy")
    const crypto = await import("crypto");
    const disc = crypto.createHash("sha256").update("global:buy").digest().subarray(0, 8);

    const data = Buffer.alloc(8 + 8 + 8);
    disc.copy(data, 0);
    data.writeBigUInt64LE(amountLamports, 8);
    data.writeBigUInt64LE(minTokensOut, 16);

    // ATAs
    const userQuoteAta = getAssociatedTokenAddressSync(quoteMint, account, false, TOKEN_2022_PROGRAM_ID);
    const userTokenAta = getAssociatedTokenAddressSync(tokenMint, account, false, TOKEN_2022_PROGRAM_ID);
    const curveQuoteAta = getAssociatedTokenAddressSync(quoteMint, bondingCurve, true, TOKEN_2022_PROGRAM_ID);
    const curveTokenAta = getAssociatedTokenAddressSync(tokenMint, bondingCurve, true, TOKEN_2022_PROGRAM_ID);

    // GlobalConfig PDA
    const [globalConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("pigeon_house_config")], pid
    );

    // Fee vault PDA
    const [feeVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("fee_vault")], pid
    );
    const feeVaultAta = getAssociatedTokenAddressSync(quoteMint, feeVault, true, TOKEN_2022_PROGRAM_ID);

    // Quote asset config
    const [quoteAssetConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("quote_asset"), quoteMint.toBuffer()], pid
    );

    const tx = new Transaction();

    // Compute budget
    tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }));
    tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 }));

    // Create user token ATA if needed
    tx.add(
      createAssociatedTokenAccountInstruction(
        account, userTokenAta, account, tokenMint, TOKEN_2022_PROGRAM_ID
      )
    );

    // Buy instruction
    const buyIx = new TransactionInstruction({
      programId: pid,
      keys: [
        { pubkey: account, isSigner: true, isWritable: true },
        { pubkey: globalConfig, isSigner: false, isWritable: false },
        { pubkey: bondingCurve, isSigner: false, isWritable: true },
        { pubkey: tokenMint, isSigner: false, isWritable: true },
        { pubkey: quoteMint, isSigner: false, isWritable: true },
        { pubkey: curveTokenAta, isSigner: false, isWritable: true },
        { pubkey: curveQuoteAta, isSigner: false, isWritable: true },
        { pubkey: userTokenAta, isSigner: false, isWritable: true },
        { pubkey: userQuoteAta, isSigner: false, isWritable: true },
        { pubkey: feeVault, isSigner: false, isWritable: false },
        { pubkey: feeVaultAta, isSigner: false, isWritable: true },
        { pubkey: quoteAssetConfig, isSigner: false, isWritable: false },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });
    tx.add(buyIx);

    tx.feePayer = account;
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;

    const serialized = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    const response: ActionPostResponse = {
      type: "transaction",
      transaction: serialized.toString("base64"),
      message: `Buying ${tokenMint.toBase58().slice(0, 8)}... with ${amount} PIGEON on PigeonHouse`,
    };

    return NextResponse.json(response, { headers: corsHeaders() });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to build transaction" },
      { status: 500, headers: corsHeaders() }
    );
  }
}

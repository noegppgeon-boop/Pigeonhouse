import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const POOL_DIR = "/tmp/vanity-pool";

/**
 * GET /api/vanity-mint
 * Returns a pre-ground keypair ending with "burn" from the pool.
 * Response: { address: string, secretKey: number[] }
 * 
 * The keypair is used as mint signer for token creation.
 * After serving, the keypair file is deleted from the pool.
 */
export async function GET() {
  try {
    if (!fs.existsSync(POOL_DIR)) {
      return NextResponse.json({ error: "no_pool", message: "Vanity pool not initialized" }, { status: 503 });
    }

    const files = fs.readdirSync(POOL_DIR).filter(f => f.endsWith("burn.json"));

    if (files.length === 0) {
      return NextResponse.json({ error: "pool_empty", message: "No vanity keypairs available, try again shortly" }, { status: 503 });
    }

    // Pick first available
    const file = files[0];
    const filePath = path.join(POOL_DIR, file);
    const secretKey: number[] = JSON.parse(fs.readFileSync(filePath, "utf8"));

    // Remove from pool (consumed)
    fs.unlinkSync(filePath);

    // Derive address from filename (remove .json)
    const address = file.replace(".json", "");

    return NextResponse.json({
      address,
      secretKey,
      poolRemaining: files.length - 1,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "internal", message: err.message }, { status: 500 });
  }
}

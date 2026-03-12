import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIP } from "@/lib/rateLimit";

const JUP_KEY = process.env.JUPITER_API_KEY || "";
const JUP_HOST = JUP_KEY ? "https://api.jup.ag" : "https://lite-api.jup.ag";
const JUP_API = `${JUP_HOST}/swap/v1`;

/**
 * Returns Jupiter swap instructions (not a full TX) so we can
 * compose them with bonding curve buy in a single transaction.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const rl = rateLimit(`jup-ix:${ip}`, 60_000, 15);
  if (!rl.ok) return NextResponse.json({ error: "rate limited" }, { status: 429 });
  const body = await req.json();

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (JUP_KEY) headers["x-api-key"] = JUP_KEY;

  const res = await fetch(`${JUP_API}/swap-instructions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      quoteResponse: body.quoteResponse,
      userPublicKey: body.userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
      // Don't wrap output — we want PIGEON in ATA for bonding curve buy
      destinationTokenAccount: body.destinationTokenAccount,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json({ error: "Jupiter swap-instructions error", detail: text }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

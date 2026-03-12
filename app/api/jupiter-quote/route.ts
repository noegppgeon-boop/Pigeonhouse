import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIP } from "@/lib/rateLimit";

const JUP_KEY = process.env.JUPITER_API_KEY || "";
const JUP_HOST = JUP_KEY ? "https://api.jup.ag" : "https://lite-api.jup.ag";
const JUP_API = `${JUP_HOST}/swap/v1`;

export async function GET(req: NextRequest) {
  const ip = getClientIP(req);
  const rl = rateLimit(`jup-quote:${ip}`, 60_000, 30);
  if (!rl.ok) return NextResponse.json({ error: "rate limited" }, { status: 429 });
  const { searchParams } = new URL(req.url);
  const inputMint = searchParams.get("inputMint");
  const outputMint = searchParams.get("outputMint");
  const amount = searchParams.get("amount");
  const slippageBps = searchParams.get("slippageBps") || "300";

  if (!inputMint || !outputMint || !amount) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const headers: Record<string, string> = { "Accept": "application/json" };
  if (JUP_KEY) headers["x-api-key"] = JUP_KEY;

  const res = await fetch(
    `${JUP_API}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}&onlyDirectRoutes=false`,
    { headers }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json({ error: "Jupiter API error", detail: text }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

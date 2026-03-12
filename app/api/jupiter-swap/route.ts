import { NextRequest, NextResponse } from "next/server";

const JUP_KEY = process.env.JUPITER_API_KEY || "";
const JUP_HOST = JUP_KEY ? "https://api.jup.ag" : "https://lite-api.jup.ag";
const JUP_API = `${JUP_HOST}/swap/v1`;

export async function POST(req: NextRequest) {
  const body = await req.json();

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (JUP_KEY) headers["x-api-key"] = JUP_KEY;

  const res = await fetch(`${JUP_API}/swap`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      quoteResponse: body.quoteResponse,
      userPublicKey: body.userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json({ error: "Jupiter swap error", detail: text }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

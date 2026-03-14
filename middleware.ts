import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LAUNCH_UTC = "2026-03-14T22:50:00Z";
const ALLOWED_HOST = "941pigeon.fun";

function isLaunched(): boolean {
  return Date.now() >= new Date(LAUNCH_UTC).getTime();
}

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const pathname = req.nextUrl.pathname;

  // Allow Next.js internals and static assets always
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/tokens/") ||
    pathname.startsWith("/screenshots/") ||
    pathname.startsWith("/manifest.json") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml") ||
    pathname.startsWith("/og-image") ||
    pathname.startsWith("/icon-") ||
    pathname.startsWith("/apple-touch-icon")
  ) {
    return NextResponse.next();
  }

  // Block ALL non-primary domains (Vercel subdomains, preview URLs, etc.)
  // Allow www subdomain redirect
  if (host !== ALLOWED_HOST && host !== `www.${ALLOWED_HOST}` && host !== "localhost:4000" && host !== "localhost:3000") {
    // Redirect Vercel subdomains to primary domain
    if (host.includes("vercel.app") || host.includes("vercel-dns.com")) {
      return NextResponse.redirect(`https://${ALLOWED_HOST}${pathname}`, 301);
    }
    // Block anything else
    // Allow all localhost ports for local dev
    if (!host.startsWith("localhost")) {
      return new NextResponse("Not found", { status: 404 });
    }
  }

  // www → naked domain redirect
  if (host === `www.${ALLOWED_HOST}`) {
    return NextResponse.redirect(`https://${ALLOWED_HOST}${pathname}`, 301);
  }

  // Pre-launch: block API routes on production only (allow localhost + defillama endpoint)
  const isLocal = host.startsWith("localhost");
  const isPublicApi = pathname.startsWith("/api/defillama") || pathname.startsWith("/api/actions") || pathname.startsWith("/api/token") || pathname.startsWith("/api/webhook") || pathname.startsWith("/api/predictions");
  if (!isLaunched() && !isLocal && !isPublicApi && pathname.startsWith("/api")) {
    return NextResponse.json(
      {
        error: "Platform not yet launched",
        launchAt: LAUNCH_UTC,
        secondsLeft: Math.max(0, Math.floor((new Date(LAUNCH_UTC).getTime() - Date.now()) / 1000)),
      },
      { status: 503 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image).*)",
  ],
};

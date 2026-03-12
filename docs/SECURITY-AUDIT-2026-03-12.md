# PigeonHouse Security Audit — 2026-03-12
**Auditor:** Pigeon (AI)  
**Scope:** Frontend (Next.js), API routes, client-side security, smart contract interactions  
**Score:** 8.5/10 (post-fix)

---

## 🔴 CRITICAL (Fixed)

### C1: Hardcoded Helius API Key — FIXED
- **File:** `app/api/trades/[mint]/route.ts:11`
- **Issue:** Helius API key `eb49a51b-...` was hardcoded as fallback
- **Risk:** Anyone reading source code gets free API access
- **Fix:** Removed hardcoded fallback, now uses env vars only

### C2: 5 API Routes Without Rate Limiting — FIXED
- `/api/prices` — now 60 req/min
- `/api/jupiter-quote` — now 30 req/min
- `/api/jupiter-swap` — now 15 req/min
- `/api/jupiter-swap-instructions` — now 15 req/min
- `/api/vanity-mint` — now 5 req/min
- **Risk:** Unlimited requests could abuse Jupiter API key quota or DoS the platform
- **Fix:** Rate limiting added to all routes

### C3: No Security Headers — FIXED
- **Fix:** Added via `next.config.mjs`:
  - `X-Frame-Options: DENY` (prevent clickjacking)
  - `X-Content-Type-Options: nosniff` (prevent MIME sniffing)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 🟡 MEDIUM (Accepted Risks)

### M1: NEXT_PUBLIC_RPC_URL Exposes Helius API Key to Client
- **File:** `.env.local` / `lib/constants.ts`
- **Issue:** `NEXT_PUBLIC_*` env vars are bundled into client-side JavaScript
- **Risk:** Users can extract Helius API key from browser dev tools
- **Mitigation:** Helius free tier has built-in rate limiting (25 req/s). Key is read-only (no write access). This is standard practice for Solana dApps — wallet adapter needs RPC access.
- **Future:** Could add RPC proxy route to hide key completely

### M2: localStorage Chat — No Sanitization
- **File:** `components/token/TokenChat.tsx`
- **Issue:** Chat messages stored/displayed from localStorage without HTML sanitization
- **Risk:** Low — React auto-escapes by default (no `dangerouslySetInnerHTML`). Self-XSS only (user can only inject into their own browser).
- **Mitigation:** React's JSX rendering handles escaping

### M3: npm Audit — Known Vulnerabilities in Dependencies
- `bigint-buffer` — Buffer Overflow (high severity) — in `@solana/spl-token` dependency chain
- `elliptic` — Risky crypto implementation — in wallet adapter dependency chain
- **Risk:** Low — these are deep transitive dependencies in Solana ecosystem packages, not directly exploitable in our context
- **Mitigation:** Ecosystem-wide issue, no fix available without breaking changes

---

## ✅ PASSED CHECKS

| Check | Status | Notes |
|-------|--------|-------|
| XSS (dangerouslySetInnerHTML) | ✅ PASS | Not used anywhere |
| eval() / code injection | ✅ PASS | Not used |
| Unvalidated redirects | ✅ PASS | No dynamic redirects |
| Secret keys in git | ✅ PASS | `.env*.local` in `.gitignore` |
| API key in client code | ✅ PASS | Jupiter/Helius keys server-side only (except RPC_URL) |
| Jupiter API key proxy | ✅ PASS | Keys used server-side in API routes, never sent to client |
| Input validation | ✅ PASS | All API routes validate inputs, use try/catch |
| Mint address validation | ✅ PASS | PublicKey constructor validates base58 |
| Slippage protection | ✅ PASS | `minTokensOut` calculated from `slippageBps` |
| Transaction signing | ✅ PASS | User signs all TXs via wallet adapter — no server-side signing |
| CORS | ✅ PASS | No custom CORS headers (Next.js default: same-origin) |
| External URLs | ✅ PASS | Only static links to Solscan/Solana explorer |
| Rate limiting | ✅ PASS | All 11 API routes now rate limited |
| .env in git | ✅ PASS | Only `next-env.d.ts` (type declarations, no secrets) |

---

## API Rate Limits Summary

| Route | Limit | Window |
|-------|-------|--------|
| `/api/platform` | 30/min | 60s |
| `/api/token/[mint]` | 30/min | 60s |
| `/api/trades/[mint]` | 30/min | 60s |
| `/api/prices` | 60/min | 60s |
| `/api/leaderboard` | 30/min | 60s |
| `/api/profile/[address]` | 30/min | 60s |
| `/api/reserves` | 30/min | 60s |
| `/api/jupiter-quote` | 30/min | 60s |
| `/api/jupiter-swap` | 15/min | 60s |
| `/api/jupiter-swap-instructions` | 15/min | 60s |
| `/api/vanity-mint` | 5/min | 60s |

---

## Recommendations (Future)

1. **RPC Proxy** — Add `/api/rpc` proxy to hide Helius key from client bundle
2. **CSP Header** — Add Content-Security-Policy (complex with wallet adapters)
3. **Multisig** — Upgrade program authority to multisig (already planned)
4. **Backend Chat** — Move TokenChat from localStorage to server with proper auth
5. **Dependency Updates** — Monitor `@solana/spl-token` for bigint-buffer fix
6. **Custom Domain** — Add HTTPS with custom domain for brand trust

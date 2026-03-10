# UX Friction Report

## Critical Friction (conversion blockers)

### F1. No token metadata images
**Where:** Board token cards, token detail header
**Impact:** Every token shows a single-letter avatar. Looks like a test environment.
**Cause:** `TokenCard` has `const imageUri = curve.uri ? null : null` — dead code. URI exists in on-chain data but metadata JSON isn't fetched.
**Fix:** Fetch `curve.uri` → parse JSON → extract `image` field. Cache in API route. Show placeholder on error.
**Effort:** 2h (API cache + component update)
**Priority:** P0

### F2. Board shows "trending" but all tokens are near 0%
**Where:** Board default tab
**Impact:** "Trending" implies activity but 9/10 tokens show 0.0% progress and identical volume. No signal.
**Cause:** Sort is by `realPigeonReserves` descending — valid, but when most are near-zero, there's no differentiation.
**Fix:** Show "New" as default tab instead. Or: show time-since-launch, unique trade count. Add "Hot" indicator for tokens with recent activity.
**Effort:** 1h (sort change + UI indicator)
**Priority:** P1

### F3. No price in token card
**Where:** Board token cards
**Impact:** Trader's #1 question is "what's the price?" — not visible until clicking through.
**Cause:** Price calculation exists (`getCurrentPrice`) but TokenCard doesn't use it.
**Fix:** Add price display to TokenCard. Even "0.00000X" is useful signal.
**Effort:** 30min
**Priority:** P0

### F4. Chart empty for low-trade tokens
**Where:** Token detail chart area
**Impact:** Most tokens show "No trade data yet" — looks broken.
**Cause:** Chart requires trade history from `/api/trades/[mint]`, which parses tx logs. Low-activity tokens have 0 trades.
**Fix:** Show price-implied chart from bonding curve formula (calculated, not traded). Or: show "First trade pending" with current implied price.
**Effort:** 2h
**Priority:** P1

### F5. No referral link visibility
**Where:** Token detail page
**Impact:** Referral is a core growth mechanic (0.5% per trade) but there's no prominent "Share & Earn" UI.
**Cause:** Referral is passed via `?ref=` URL param. No copy button, no explanation.
**Fix:** Add "Share & Earn 0.5%" button. Connected wallet → auto-generate `?ref={address}`. Copy-to-clipboard.
**Effort:** 1h
**Priority:** P0

---

## High Friction (engagement reducers)

### F6. Portfolio is empty shell
**Where:** `/portfolio`
**Impact:** Wallet-connected users see "No positions found" — dead end.
**Cause:** No indexed position data. Would need to scan user's token accounts.
**Fix short-term:** Hide from primary nav. Show only if user has at least 1 position.
**Fix long-term:** Query user's Token-2022 accounts → match against known bonding curves.
**Effort:** Short: 10min. Long: 4h.
**Priority:** P2

### F7. Sweep/Accrual tabs are empty
**Where:** Transparency page, Sweeps + Accruals tabs
**Impact:** Tabs exist but show "No sweeps" / "No accruals" — reduces trust instead of building it.
**Cause:** No indexer for events. Hook not yet on mainnet.
**Fix short-term:** Remove empty tabs. Keep "Overview" with invariants + programs. Add "Coming soon" note.
**Fix long-term:** Build event indexer → populate tabs.
**Effort:** Short: 20min. Long: 8h+.
**Priority:** P1

### F8. Recent Trades loading state
**Where:** Token detail → Recent Trades
**Impact:** Shows spinner indefinitely for tokens with no trades. Users wait for something that won't come.
**Cause:** Loading state doesn't distinguish "still loading" from "no data."
**Fix:** After fetch completes with 0 trades → show "No trades yet — be the first buyer" with Buy CTA.
**Effort:** 20min
**Priority:** P0

### F9. No wallet balance pre-check on launch
**Where:** Launch wizard
**Impact:** Creator fills entire form, clicks Launch, then fails because no SOL for tx fee.
**Fix:** Show estimated cost at top of form. Check balance before enabling "Launch Token" button.
**Effort:** 1h
**Priority:** P1

### F10. ⌘K search doesn't search by symbol prefix
**Where:** Command modal
**Impact:** Typing "$ST" doesn't match token symbols starting with "ST".
**Cause:** Search filters on `name`, `symbol`, `tokenMint` — but doesn't strip `$` prefix.
**Fix:** Strip leading `$` from query, also add fuzzy matching.
**Effort:** 20min
**Priority:** P2

---

## Low Friction (polish)

### F11. No keyboard navigation between tabs
Tab groups don't support arrow-key navigation. Power users expect ←/→ to switch tabs.

### F12. Mobile trade panel not sticky
On mobile, user scrolls past chart then has to scroll back up to trade. Consider sticky bottom bar with collapsed Buy/Sell.

### F13. No "sort" affordance on Board
Tabs switch between pre-sorted lists but there's no explicit "sort by" dropdown. Users may not realize tabs ARE the sort.

### F14. Graduated tokens mixed with active
Board shows graduated tokens with "Grad" badge but they're not tradeable. Should be visually distinct or filterable.

### F15. No toast on wallet connect/disconnect
Wallet state changes silently. A subtle toast ("Wallet connected" / "Disconnected") helps orientation.

---

## Friction Heat Map

```
BOARD (/):
  ╔═══════════════════════════════════════╗
  ║ [Stat Strip]              ← OK       ║
  ║ [Tabs]                    ← F2,F13   ║
  ║ [Token Card] [Card] [Card]← F1,F3   ║
  ║ [Card]       [Card] [Card]           ║
  ╚═══════════════════════════════════════╝

TOKEN DETAIL (/token/[mint]):
  ╔═══════════════════════════════════════╗
  ║ [Header]                  ← F5       ║
  ║ [Metrics]                 ← OK       ║
  ║ [Progress]                ← OK       ║
  ║ [Chart]                   ← F4       ║
  ║ [Trade Panel]             ← F12      ║
  ║ [Recent Trades]           ← F8       ║
  ╚═══════════════════════════════════════╝

LAUNCH (/launch):
  ╔═══════════════════════════════════════╗
  ║ [Step 1: Details]         ← OK       ║
  ║ [Step 2: Review]          ← F9       ║
  ║ [CTA: Launch]             ← OK       ║
  ╚═══════════════════════════════════════╝
```

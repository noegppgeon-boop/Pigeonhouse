# UI/UX Information Architecture

## 1. Product Model

PigeonHouse is a **Solana-native bonding curve token launchpad** with built-in deflationary burn mechanics.

### Core Loop
```
Creator → create_token → Bonding Curve goes live
  ↓
Trader → buy/sell on curve → Price discovery
  ↓
Every trade → 2% fee → 1% burn + 0.5% treasury + 0.5% referrer
  ↓
Every transfer → Token-2022 hook → fee accrual in FeeAccrualVault
  ↓
Anyone → sweep_fee_accrual → Jupiter CPI → buy PIGEON → burn in same tx
  ↓
Graduation threshold → PumpSwap CPI → LP to dead address
```

### Semantic Distinction (UI MUST respect)
| Event | When | What happens | Who triggers |
|---|---|---|---|
| **Fee Accrual** | Every transfer | Fee counter increments in PDA | Automatic (hook) |
| **Burn** | Sweep execution | Accrued fees → Jupiter → PIGEON → burn | Anyone (permissionless) |

These are **different events, different transactions, different timestamps.** The UI must never conflate them.

---

## 2. User Segments

### A. Trader (Primary — 80% of traffic)
- **Goal:** Find new tokens early, buy low, sell high
- **Mental model:** "What's hot? How much? Can I buy now?"
- **Session:** Browse → Click → Buy → Monitor → Sell
- **Frequency:** Daily, multiple sessions
- **Needs:** Speed, price, progress, chart, one-click trade

### B. Creator (Secondary — 10%)
- **Goal:** Launch a token and build community
- **Mental model:** "How do I launch? What does it cost? Where's my link?"
- **Session:** Details → Review → Launch → Share
- **Frequency:** 1-5 launches, then switches to Trader mode
- **Needs:** Simple wizard, referral link, creator page

### C. Sweeper (Power user — 2%)
- **Goal:** Trigger sweep to earn MEV or contribute to burn
- **Mental model:** "Is there enough accrued? Can I sweep now?"
- **Session:** Check vault → Trigger sweep → Verify burn
- **Frequency:** Periodic, bot-like
- **Needs:** Vault balance, sweep button, tx confirmation

### D. Observer (Trust-seeker — 5%)
- **Goal:** Verify the protocol is honest
- **Mental model:** "Is the burn real? Can I check on-chain?"
- **Session:** Transparency → Invariants → Solscan links
- **Frequency:** Once, then becomes Trader or Creator
- **Needs:** On-chain proof, tx links, protocol parameters

### E. Operator (Admin — <1%)
- **Goal:** Monitor system health, configure parameters
- **Mental model:** "Is everything running? Any errors?"
- **Session:** Status → Parameters → Logs
- **Frequency:** Daily monitoring
- **Needs:** Program status, config values, event schema

---

## 3. Information Architecture

### Tier 1 — Revenue Screens (always visible in nav)
```
/                       Board (token discovery)
/token/[mint]           Token Detail + Trade
/launch                 Launch Wizard
```

### Tier 2 — Growth Screens (visible in nav)
```
/transparency           Burn Proof + Protocol Dashboard
/leaderboard            Creator Ranking
```

### Tier 3 — Utility Screens (nav overflow / profile dropdown)
```
/profile/[address]      Creator Profile
/portfolio              User Positions (wallet-gated)
/stats                  Platform Analytics
/status                 System Health
```

### Navigation Model
```
TOP BAR:
  [Logo] [Board] [Launch] [Leaderboard] [Transparency] ... [Search ⌘K] [Wallet]

Mobile:
  [Logo] [Hamburger]
  → Full nav in dropdown
```

### URL Structure
| Route | Dynamic | Auth | Data Source |
|---|---|---|---|
| `/` | No | No | `usePlatformStats` → `/api/platform` |
| `/token/[mint]` | `mint` | No | `useBondingCurve` → `/api/token/[mint]` |
| `/launch` | No | Wallet | `executeCreateToken` (on-chain) |
| `/transparency` | No | No | `usePlatformStats` + future sweep API |
| `/leaderboard` | No | No | `/api/leaderboard` |
| `/profile/[address]` | `address` | No | `/api/profile/[address]` |
| `/portfolio` | No | Wallet | Future: indexed user positions |
| `/stats` | No | No | `usePlatformStats` |
| `/status` | No | No | Static + future RPC health |

---

## 4. Data Flow

### Client-Side State
```
usePlatformStats()     → Global: token count, volume, burned, curves[]
  ↳ 30s poll via /api/platform
  ↳ Shared across: Board, Stats, Transparency, Sidebar burn counter

useBondingCurve(mint)  → Per-token: curve data, config, price, mcap, progress
  ↳ 15s poll via /api/token/[mint]
  ↳ Used in: Token Detail page

usePigeonPrice()       → PIGEON/USD price
  ↳ On-demand via /api/pigeon-price
```

### Server-Side (API Routes)
All API routes are thin wrappers over RPC calls to Helius:
- `getAllBondingCurves()` → program account scan
- `getBondingCurve(mint)` → single account fetch
- `getGlobalConfig()` → PDA fetch
- No indexer, no database — all on-chain reads

### Missing Data (requires future work)
| Data | Why missing | Impact |
|---|---|---|
| Sweep history | No indexer, no event log API | Transparency page shows "no sweeps" |
| User positions | No token balance aggregation | Portfolio page is skeleton |
| Trade history per user | No indexed tx history | Profile shows creator-only view |
| Token metadata images | URI fetch not implemented | All tokens show initial-letter avatars |
| Real-time price feed | No WebSocket, 15s poll only | Chart updates lag |

---

## 5. Component Dependency Map

```
layout.tsx
  ├── TopBar (nav, search trigger, wallet, burn counter)
  ├── CommandModal (⌘K search)
  └── ToastProvider (global notifications)

Board (/)
  ├── StatStrip (inline stats)
  ├── TabGroup (filter tabs)
  └── TokenGrid → TokenCard[]

Token Detail (/token/[mint])
  ├── MetricCards (price, mcap, progress, burned)
  ├── ProgressBar (graduation)
  ├── ChartArea (candlestick SVG)
  ├── TradePanel (buy/sell, quotes, execution)
  ├── RecentTrades (trade feed)
  └── TokenInfo (reserves, creator, mint)

Launch (/launch)
  ├── StepProgress (3-step)
  ├── Form fields
  ├── LivePreview
  └── RiskConfirmation

Shared:
  ├── StatCard (reusable stat display)
  ├── Skeleton / SkeletonCard (loading states)
  ├── EmptyState (no-data states)
  └── Toast (notifications)
```

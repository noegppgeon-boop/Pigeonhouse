# Navigation Model

## Architecture

```
PERSISTENT: Top Bar (48px, sticky top, all viewports)
MODAL:      Command Palette (⌘K)
OVERLAY:    Mobile nav dropdown
```

## Top Bar Layout

### Desktop (≥768px)
```
┌──────────────────────────────────────────────────────────────────┐
│ [P] PigeonHouse │ Board │ Launch │ Leaderboard │ Transparency │ │ 🔥 2.24 burned │ [Search ⌘K] │ [Select Wallet] │
└──────────────────────────────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌──────────────────────────────────┐
│ [P]                         [☰] │
└──────────────────────────────────┘
         ↓ (hamburger tap)
┌──────────────────────────────────┐
│ Board                            │
│ Launch                           │
│ Leaderboard                      │
│ Transparency                     │
│ ─────────────────────────────    │
│ Stats                            │
│ Status                           │
│ Portfolio                        │
│ ─────────────────────────────    │
│ [Select Wallet]                  │
└──────────────────────────────────┘
```

## Navigation Hierarchy

### Level 0 — Always visible (top bar)
| Item | Route | Icon | Condition |
|---|---|---|---|
| Board | `/` | LayoutDashboard | Always |
| Launch | `/launch` | Rocket | Always |
| Leaderboard | `/leaderboard` | Trophy | Always |
| Transparency | `/transparency` | Flame | Always |

### Level 1 — Mobile overflow / secondary
| Item | Route | Icon | Condition |
|---|---|---|---|
| Stats | `/stats` | BarChart3 | Always |
| Status | `/status` | Shield | Always |
| Portfolio | `/portfolio` | Wallet | Always |

### Level 2 — Contextual (no nav item)
| Item | Route | Access |
|---|---|---|
| Token Detail | `/token/[mint]` | Card click from Board |
| Creator Profile | `/profile/[address]` | Link from leaderboard / token page |

### Level 3 — System (modal)
| Item | Trigger | Content |
|---|---|---|
| Command Palette | ⌘K or search icon | Pages + token search |
| Wallet Modal | "Select Wallet" button | Wallet adapter UI |

## Active State

Top bar nav items show active state:
- **Active:** `text-primary`, `bg-elevated`, icon `text-lime`
- **Inactive:** `text-muted`
- No `aria-current="page"` on Level 2 pages (token detail, profile)

## Back Navigation

| From | Back to | Method |
|---|---|---|
| Token Detail | Board | "← Back" link (top-left) |
| Creator Profile | Previous page | Browser back |
| Launch (step 2→1) | Previous step | "Back" button |
| Launch (success) | Token page | "View Token" CTA |

## Deep Linking

All routes are deep-linkable:
- `/token/EPPHz...` → Direct token page (fetch on mount)
- `/profile/7sB81...` → Direct profile (fetch on mount)
- `/launch` → Wizard step 1 (or wallet connect)
- `/?tab=new` → Board with specific tab (future: URL sync)

## Command Palette (⌘K)

### Sections
1. **Tokens** — search by name/symbol/mint address (from `usePlatformStats` cache)
2. **Pages** — all routes with icons

### Keyboard
- `↑↓` — Navigate results
- `Enter` — Open selected
- `Esc` — Close
- Type to filter

### Data Source
- Token search: `stats.recentTokens` (cached, no extra API call)
- Page search: hardcoded nav items

## URL State

Currently NO URL state sync for:
- Active tab on Board (always resets to "trending")
- Trade panel tab (buy/sell)
- Slippage setting

**Recommended (P2):**
- `/?tab=new` → Board tab persistence
- `/token/[mint]?action=sell` → Pre-select sell tab
- Slippage → localStorage (not URL)

## Wallet State & Route Guards

| Route | Wallet Required | Behavior |
|---|---|---|
| `/` | No | Full access |
| `/token/[mint]` | No (view) / Yes (trade) | Trade panel shows "Select Wallet" |
| `/launch` | Yes | Step 1 = "Connect Wallet" if not connected |
| `/portfolio` | Yes | Full page "Connect wallet" prompt |
| `/transparency` | No | Full access |
| `/profile/[addr]` | No | Full access |
| `/leaderboard` | No | Full access |
| `/stats` | No | Full access |
| `/status` | No | Full access |

No hard redirects for wallet. Always show the page with a connect prompt inline.

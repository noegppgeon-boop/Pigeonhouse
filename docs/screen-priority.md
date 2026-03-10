# Screen Priority & Specification

## MVP (P0) — Ship Now

### 1. Board (`/`)
| Field | Value |
|---|---|
| **Purpose** | Token discovery — browse, filter, click |
| **Primary user** | Trader |
| **Primary CTA** | Click token card → token detail |
| **Secondary CTA** | Launch button, tab filter |
| **Must show** | Token name, symbol, progress %, volume, burn estimate, status badge |
| **Hide (advanced)** | Creator address, reserves, virtual amounts |
| **Mobile** | 1-col cards, horizontal tab scroll, stat strip wraps |
| **Empty state** | "No tokens yet — be the first to launch" + Launch CTA |
| **Error state** | "Failed to load tokens" + Retry button |
| **Loading** | 9x skeleton cards in grid, stat strip skeleton |

### 2. Token Detail (`/token/[mint]`)
| Field | Value |
|---|---|
| **Purpose** | Price action view + trade execution |
| **Primary user** | Trader |
| **Primary CTA** | Buy/Sell button in trade panel |
| **Secondary CTA** | Share (copy referral link), Explorer link |
| **Must show** | Price, mcap, progress %, burned amount, chart, trade panel, recent trades |
| **Hide (advanced)** | Virtual reserves, PDA addresses, curve math. Show in expandable "Token Info" |
| **Mobile** | Stacked: metrics → progress → chart → trade panel → trades → info |
| **Empty state** | N/A (404 if invalid mint) |
| **Error state** | "Token not found" or "Failed to load" + Back to Board |
| **Loading** | Metric skeletons + chart spinner + trade panel disabled |

### 3. Trade Panel (component in Token Detail)
| Field | Value |
|---|---|
| **Purpose** | Buy/Sell execution |
| **Primary user** | Trader |
| **Primary CTA** | "Buy TOKEN" (lime) or "Sell TOKEN" (red tint) |
| **Must show** | Balance, input, output quote, burn estimate, price impact |
| **Hide** | Slippage (collapsed behind ⚙️), referrer info |
| **Mobile** | Full width, consider sticky bottom CTA bar |
| **Empty state** | "Enter amount" (disabled CTA) |
| **Error state** | Inline error below CTA ("Insufficient balance", "Slippage exceeded") |
| **Loading** | CTA shows "Confirming..." with spinner |

### 4. Launch Wizard (`/launch`)
| Field | Value |
|---|---|
| **Purpose** | Token creation |
| **Primary user** | Creator |
| **Primary CTA** | "Launch Token" (final step) |
| **Secondary CTA** | Back, preview |
| **Must show** | Name, symbol, description, image, fee breakdown, risk warning |
| **Hide** | Bonding curve math, PDA seeds, program internals |
| **Mobile** | Single column, preview below form, steps in compact bar |
| **Empty state** | N/A (form starts empty) |
| **Error state** | Inline error below CTA + retry without data loss |
| **Loading** | Step progress: "Uploading..." → "Creating..." |

---

## P1 — Ship Next (trust + growth)

### 5. Transparency (`/transparency`)
| Field | Value |
|---|---|
| **Purpose** | Prove burn is real |
| **Primary user** | Observer, Trader (trust-building) |
| **Primary CTA** | Solscan proof links |
| **Must show** | Total burned, how burn works (4 steps), protocol invariants, program links |
| **Hide** | Raw event data, PDA seeds, discriminators |
| **Mobile** | Stacked sections, tabs scroll |
| **Empty state** | Sweep/accrual tabs: "Will appear after mainnet launch" |
| **Loading** | Stat skeletons |

### 6. Leaderboard (`/leaderboard`)
| Field | Value |
|---|---|
| **Purpose** | Social proof, creator ranking |
| **Primary user** | Creator, Trader |
| **Primary CTA** | Click creator → profile |
| **Must show** | Rank, address, launches, volume, score |
| **Mobile** | Horizontal scroll table or card-list transform |
| **Empty state** | "No creators yet" |
| **Loading** | Table skeleton rows |

### 7. Creator Profile (`/profile/[address]`)
| Field | Value |
|---|---|
| **Purpose** | Creator reputation and history |
| **Primary user** | Trader (evaluating creator), Creator (own page) |
| **Primary CTA** | Click token → token detail |
| **Must show** | Rep score, tier badge, launch count, graduated count, launch history |
| **Hide** | Score formula, raw calculation |
| **Mobile** | Stacked: header → stats → badges → history |
| **Empty state** | "No launches yet" |
| **Loading** | Skeleton cards |

---

## P2 — Ship Later (utility)

### 8. Stats (`/stats`)
| Field | Value |
|---|---|
| **Purpose** | Protocol metrics |
| **Primary user** | Observer, Operator |
| **Must show** | Totals, distribution bars, trending table, fee breakdown |
| **Priority** | Low — data already visible in board stat strip |

### 9. Portfolio (`/portfolio`)
| Field | Value |
|---|---|
| **Purpose** | User's positions and PnL |
| **Primary user** | Trader |
| **Blocker** | Requires indexed user positions (not available from current RPC) |
| **Current state** | Skeleton/placeholder page |
| **Ship when** | Indexer or Helius DAS integration available |

### 10. Status (`/status`)
| Field | Value |
|---|---|
| **Purpose** | System health monitoring |
| **Primary user** | Operator |
| **Current state** | Hardcoded data (acceptable pre-mainnet) |
| **Ship when** | After mainnet, with live health checks |

---

## P3 — Future

### 11. Sweep Dashboard (new)
- Per-mint vault table with accrued amounts
- Sweep trigger button
- Sweep history (requires indexer)
- **Blocked by:** Sweep UI instruction builder, Jupiter route API integration

### 12. Landing Page (new, separate from `/`)
- Marketing page for first-time visitors
- Protocol explainer, stats, trust narrative
- CTA: "Enter App" → `/`
- **Ship when:** Product-market fit confirmed

### 13. Referral Dashboard (new)
- Referral link management
- Earnings tracking
- **Ship when:** Referral volume is significant

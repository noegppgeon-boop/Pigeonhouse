# Final Screen Inventory

**Date:** 2026-03-09

## App Routes

| Route | Page | Status | Layout | Key Components |
|---|---|---|---|---|
| `/` | Dashboard | ✅ Complete | Sidebar + Content | StatCard×4, Hero, TabGroup, TokenGrid, HighlightCard×3 |
| `/token/[mint]` | Token Detail | ✅ Complete | Sidebar + Content | MetricCard×4, ProgressBar, ChartArea, TradePanel, RecentTrades, InfoRow |
| `/launch` | Launch Wizard | ✅ Complete | Sidebar + Content (3+2 grid) | 5-step stepper, StepContent, Field, Toggle, ReviewRow, LivePreview |
| `/portfolio` | Portfolio | ✅ Complete | Sidebar + Content | StatCard×4 (wallet-gated), positions list, activity list |
| `/profile/[address]` | Creator Profile | ✅ Complete | Sidebar + Content | RepScore circle, TrustBadge×4, StatCard×4, LaunchHistory |
| `/leaderboard` | Leaderboard | ✅ Complete | Sidebar + Content | TabGroup (3 tabs), data-table, Crown icons, score bars |
| `/stats` | Platform Stats | ✅ Complete | Sidebar + Content | StatCard×4, DistBar, InfoRow, TrendingTokens table |
| `/transparency` | Burn Transparency | ✅ Complete | Sidebar + Content | StatCard×4, 4-step flow, TabGroup, Invariants, ProofRow |
| `/status` | System Status | ✅ Complete | Sidebar + Content | StatusCard×3, Programs list, Params table, EventCard×3 |

## API Routes

| Route | Method | Status |
|---|---|---|
| `/api/platform` | GET | ✅ Active (mainnet RPC) |
| `/api/token/[mint]` | GET | ✅ Active |
| `/api/trades/[mint]` | GET | ✅ Active |
| `/api/profile/[address]` | GET | ✅ Active |
| `/api/leaderboard` | GET | ✅ Active |
| `/api/pigeon-price` | GET | ✅ Active |

## Shared Components

| Component | Location | Used By |
|---|---|---|
| `Sidebar` | `components/layout/` | Layout (global) |
| `CommandModal` | `components/shared/` | Layout (global, ⌘K) |
| `ToastProvider` | `components/shared/Toast` | Layout (global) |
| `StatCard` | `components/shared/` | Dashboard, Token, Portfolio, Profile, Stats, Transparency |
| `Skeleton` / `SkeletonCard` | `components/shared/` | Dashboard, Token, Profile |
| `EmptyState` | `components/shared/` | Available (not actively used — inline empties preferred) |
| `TokenCard` | `components/token/` | TokenGrid → Dashboard |
| `TokenGrid` | `components/home/` | Dashboard |
| `TradePanel` | `components/token/` | Token Detail |
| `ChartArea` | `components/token/` | Token Detail |
| `RecentTrades` | `components/token/` | Token Detail |
| `WalletProvider` | `components/` | Layout (global) |

## Legacy Components (Unused)

| File | Status |
|---|---|
| `components/layout/Header.tsx` | ⚠️ Dead — replaced by Sidebar |
| `components/layout/Nav.tsx` | ⚠️ Dead — replaced by Sidebar |
| `components/layout/BurnTicker.tsx` | ⚠️ Dead — sidebar burn counter |
| `components/home/BurnTicker.tsx` | ⚠️ Dead — duplicate |
| `components/home/StatsBar.tsx` | ⚠️ Dead — replaced by StatCard grid |
| `components/home/LiveFeed.tsx` | ⚠️ Dead — replaced by TokenGrid |
| `components/launch/LaunchForm.tsx` | ⚠️ Dead — replaced by wizard |
| `components/token/BuySellWidget.tsx` | ⚠️ Dead — replaced by TradePanel |
| `components/token/InfoCards.tsx` | ⚠️ Dead — inline in token page |
| `components/token/BondingCurveProgress.tsx` | ⚠️ Dead — inline progress bar |
| `components/common/FireParticles.tsx` | ⚠️ Dead — not imported |

**Recommendation:** Remove legacy components in a cleanup PR to reduce codebase.

## Design System Files

| File | Status |
|---|---|
| `app/globals.css` | ✅ Core tokens, glass, components, animations |
| `tailwind.config.ts` | ✅ Extended colors, typography, spacing, shadows |
| `lib/utils.ts` | ✅ cn(), shortenAddress(), formatNumber(), timeAgo() |

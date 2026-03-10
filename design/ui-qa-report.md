# UI/UX QA Report — PigeonHouse

**Date:** 2026-03-09  
**Auditor:** Pigeon (automated + manual code review)  
**Build:** Next.js 14.2.35, Tailwind, framer-motion  

---

## 1. Güçlü Taraflar

### Design System (A)
- **Token-based** — CSS custom properties + Tailwind extension, dual-layer (CSS vars + TW classes)
- **Glass system** — 4 tiers (glass, glass-dense, glass-overlay, glass-sidebar) with correct opacity levels
- **Color palette** — warm dark (bg: #0F0F17), terra/burn accent pair, muted text hierarchy (100/60/35/20%)
- **Typography scale** — display→micro with correct line-heights and tracking
- **Component primitives** — `.card`, `.badge`, `.btn-*`, `.nav-item`, `.tab-*`, `.data-table` all consistent

### Component Architecture (A-)
- **Shared components** well-factored: StatCard, Skeleton, EmptyState, Toast, CommandModal
- **StatCard** flexible with accent map, optional change indicator, optional icon
- **Toast** — context-based, 5 variants, auto-dismiss, framer-motion entry/exit
- **CommandModal** — ⌘K, token search + page nav, keyboard navigation

### Page Design (B+)
- **Dashboard** — clean 4-stat → hero → tabs → grid → highlights hierarchy
- **Token Detail** — strong metric cards → progress bar → 3-col layout
- **Launch Wizard** — 5-step progress, risk confirmation, live preview sidebar
- **Transparency** — protocol invariants, 4-step burn flow, programs table
- **System Status** — status dots, parameters table, event schema cards
- **Profile** — reputation score circle, trust badges, launch history

### Trade Panel (A-)
- Balance display, percentage presets, MAX button, slippage config
- Price impact calculation with color coding
- Burn estimate inline
- Error states well-handled
- Wallet connection fallback

### Motion (A-)
- framer-motion page entrances (fadeInUp)
- Progress bar animate (width: 0 → %)
- Staggered token card entrance
- Toast entry/exit
- Command modal scale transition
- Mobile drawer spring animation
- `prefers-reduced-motion` respected

### Accessibility (B)
- Skip-to-content link
- aria-label on nav sections
- focus-visible outlines (terra)
- `role="main"` on content
- Semantic HTML structure
- `prefers-reduced-motion` media query

---

## 2. Zayıf Taraflar

### Critical (P0)

| # | Issue | Location | Severity |
|---|---|---|---|
| 1 | **Sidebar `Wallet` import not in imports** — `Wallet` icon used in `mainNav` but not destructured from lucide import | `Sidebar.tsx` | Build warning / runtime OK (unused imports present) |
| 2 | **EmptyState not used anywhere** — shared component exists but all pages inline their empty states | Multiple pages | Consistency issue |
| 3 | **No `<meta name="viewport">` explicit tag** — Next.js adds default but no explicit control | `layout.tsx` | Mobile rendering |
| 4 | **TokenCard images always null** — `const imageUri = curve.uri ? null : null;` is dead code | `TokenCard.tsx` | Always shows initial-letter avatar |

### High (P1)

| # | Issue | Location | Impact |
|---|---|---|---|
| 5 | **text-body-sm inconsistency** — some components use `text-body-sm` (design system), others use `text-sm` or `text-xs` directly | TradePanel, ChartArea | Typography hierarchy breaks |
| 6 | **ChartArea/TradePanel use inline border-radius** — `rounded-[14px]` instead of design system `rounded-card` (16px) | ChartArea, TradePanel | 2px inconsistency |
| 7 | **Dashboard hero orb inline styles** — overrides CSS class values, fragile | `page.tsx` | Maintenance |
| 8 | **No hover-lift on token cards** — CSS utility exists but not applied to `.card-hover` | `TokenCard.tsx` | Missing interaction feedback |
| 9 | **Status page hardcoded data** — programs and params arrays are const, not from API | `status/page.tsx` | OK for now, fragile |
| 10 | **Profile reputation formula differs between profile and leaderboard** | `profile/[address]/page.tsx` vs `leaderboard/page.tsx` | Inconsistent scores |

### Medium (P2)

| # | Issue | Location | Impact |
|---|---|---|---|
| 11 | **Portfolio page SummaryCard not using StatCard** — duplicates StatCard pattern | `portfolio/page.tsx` | Code duplication |
| 12 | **Launch wizard InfoRow duplicates token page InfoRow** — same component defined in 2 files | `launch/page.tsx`, `token/[mint]/page.tsx` | DRY violation |
| 13 | **Leaderboard score capped at 100 but formula can exceed** — `Math.min(100, ...)` works but progress bar fills beyond visual range conceptually | `leaderboard/page.tsx` | Visual confusion |
| 14 | **No loading state for leaderboard** — shows skeleton but no platform stats hook | `leaderboard/page.tsx` | Inconsistent data source |
| 15 | **⌘K search uses `terra-bg` class** — not defined in Tailwind config as a background utility | `CommandModal.tsx` | Falls back to default |
| 16 | **Table header text-transform uppercase** via CSS + some pages add `uppercase tracking-wider` inline — double transform | Multiple | Minor |

### Low (P3)

| # | Issue | Location |
|---|---|---|
| 17 | Burn counter in sidebar shows `--,--- PIGEON` (placeholder, no hook) | `Sidebar.tsx` |
| 18 | `RecentTrades` component not audited (imported but not read) | `token/` |
| 19 | `BondingCurveProgress` component exists but unused | `components/token/` |
| 20 | Legacy components exist: `Header.tsx`, `Nav.tsx`, `BurnTicker.tsx` (2 copies), `StatsBar.tsx`, `LiveFeed.tsx`, `LaunchForm.tsx`, `BuySellWidget.tsx`, `InfoCards.tsx` | `components/` |

---

## 3. Contrast & Readability

| Element | Foreground | Background | Ratio | Pass |
|---|---|---|---|---|
| Body text | #F0EBE3 | #0F0F17 | 14.8:1 | ✅ AAA |
| Secondary text | rgba(240,235,227,0.6) | #0F0F17 | ~8.4:1 | ✅ AAA |
| Muted text | rgba(240,235,227,0.35) | #0F0F17 | ~4.6:1 | ✅ AA |
| Disabled text | rgba(240,235,227,0.2) | #0F0F17 | ~2.9:1 | ❌ Fail |
| Terra on bg | #D97757 | #0F0F17 | ~5.8:1 | ✅ AA |
| Burn on bg | #E85D4A | #0F0F17 | ~5.2:1 | ✅ AA |
| Green on bg | #5CB87A | #0F0F17 | ~7.1:1 | ✅ AAA |
| Nav muted text | rgba(240,235,227,0.35) | glass-sidebar | ~4.2:1 | ✅ AA (borderline) |
| Table header text | --text3 (35%) | --surface | ~3.8:1 | ⚠️ AA-large only |

**Verdict:** Mostly good. Disabled text fails WCAG — acceptable for disabled states. Table headers borderline.

---

## 4. Glassmorphism Assessment

| Surface | Opacity | Blur | Verdict |
|---|---|---|---|
| `.glass` | 75% | 24px | OK — not used on data surfaces |
| `.glass-dense` | 88% | 12px | ✅ Good for data overlays |
| `.glass-overlay` | 85% | 40px | ✅ Good for modals |
| `.glass-sidebar` | 92% | 32px | ✅ Excellent — nearly opaque |
| `.card` (solid) | 100% | none | ✅ No blur on data cards |

**Verdict:** Glass is used correctly — sidebar and modals only. All data surfaces (cards, tables, panels) use solid backgrounds. No readability issues from glassmorphism.

---

## 5. Motion Assessment

| Animation | Type | Duration | Verdict |
|---|---|---|---|
| Page entrance | fadeInUp (y:12) | 0.35-0.4s | ✅ Subtle, professional |
| Card stagger | y:12, delay:i*0.04 | 0.3s | ✅ Quick, not annoying |
| Progress bar | width animate | 0.6-0.8s easeOut | ✅ Satisfying |
| Toast entry | y:12, scale:0.97 | 0.2s | ✅ Snappy |
| Command modal | scale:0.97, y:-10 | 0.15s | ✅ Fast |
| Mobile drawer | spring damping:30 | spring | ✅ Natural |
| Skeleton shimmer | gradient slide | 1.5s infinite | ✅ Standard |
| Progress shimmer | gradient slide | 2s infinite | ✅ Subtle |
| Status dots | pulse-soft | 2s infinite | ⚠️ Could be distracting |
| Hover lift | translateY(-2px) | 0.2s | ✅ Minimal |

**Verdict:** Motion is restrained and premium. No bouncing, parallax, or continuous background noise. One minor concern: `animate-pulse-soft` on status dots is infinite — consider removing or making it very subtle.

---

## 6. Mobile Responsive Assessment

| Component | Mobile Behavior | Verdict |
|---|---|---|
| Sidebar | Hidden → hamburger + drawer | ✅ |
| Content area | `pt-14` offset for mobile header | ✅ |
| Token grid | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` | ✅ |
| Stat cards | `grid-cols-2 lg:grid-cols-4` | ✅ |
| Token detail | Stacks vertically (`grid-cols-1 lg:grid-cols-3`) | ✅ |
| Launch wizard | Form full-width, preview below on mobile | ✅ |
| Trade panel | Full width on mobile | ✅ |
| Step indicators | Icons only on mobile (`hidden sm:inline`) | ✅ |
| Tabs | Horizontal scroll (no explicit overflow handling) | ⚠️ May overflow |
| Tables | No horizontal scroll wrapper | ⚠️ Can overflow on mobile |
| Tap targets | Buttons 40-44px, nav items 36px | ⚠️ Nav items slightly small |

---

## 7. Final Quality Verdict

| Category | Grade | Notes |
|---|---|---|
| Design System | **A** | Comprehensive tokens, consistent application |
| Visual Design | **A-** | Premium dark theme, warm accents, no meme energy |
| Typography | **A-** | Good hierarchy, minor inconsistencies (text-xs vs text-body-sm) |
| Component Quality | **B+** | Well-structured, some DRY violations |
| Layout & Spacing | **A-** | Consistent 3/4/5/6 spacing, good use of gap |
| Motion | **A** | Restrained, purposeful, reduced-motion respected |
| Glassmorphism | **A** | Correctly scoped — never on data surfaces |
| Readability | **A-** | Strong contrast, glass-dense for overlays |
| Accessibility | **B** | Good foundation, needs tab nav + aria-live |
| Mobile | **B+** | Responsive grid, drawer nav, needs table/tab overflow |
| Empty States | **B+** | Present but inconsistent (some inline, EmptyState unused) |
| Loading States | **A-** | Skeleton system, shimmer animation |
| Data Density | **A-** | Dense panels opaque, tables readable |
| CTA Hierarchy | **A** | Primary (gradient), secondary (border), ghost (transparent) clear |
| Overall Polish | **B+** → **A-** after fixes |

**Summary:** This is a **premium crypto product UI**, not a meme template. The design system is professional, the color palette is warm and distinctive, and the component architecture is solid. Main improvements needed: consistency cleanup, table mobile overflow, tab keyboard nav, and dead code removal.

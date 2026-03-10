# Polish Pass — Changes Made

**Date:** 2026-03-09

## Fixes Applied

### Typography Consistency (P1)
- `ChartArea.tsx`: `text-sm` → `text-body-sm`, `text-[10px]` → `text-micro`
- `TradePanel.tsx`: All `text-xs` → `text-caption` (12px/500), `text-sm` → `text-body-sm`, `text-[10px]` → `text-micro`
- All data-dense components now use design system scale: `text-micro` (11px) / `text-caption` (12px) / `text-body-sm` (13px)

### Border Radius Consistency (P1)
- `ChartArea.tsx`: `rounded-[14px]` → `.card` class (16px system token)
- `TradePanel.tsx`: `rounded-[14px]` → `.card` class

### Component Reuse (P2)
- `portfolio/page.tsx`: Removed duplicate `SummaryCard`, now uses shared `StatCard`
- Removed dead `SummaryCard` function

### CSS Fixes
- `CommandModal.tsx`: `bg-terra-bg` → `bg-terra-dim` (actually defined in Tailwind)

### Sidebar Live Data
- Burn counter now reads from `usePlatformStats()` instead of showing `--,---`
- Displays actual `totalPigeonBurned` formatted via `formatNumber()`

### Sidebar Cleanup
- Removed unused imports: `TrendingUp`, `User`, `ChevronLeft`, `Eye`

### Mobile Responsive Fixes
- **Tab overflow**: Added `overflow-x: auto`, `scrollbar-width: none`, `flex-shrink: 0` to `.tab-group` and `.tab-item`
- **Table overflow**: Added `.table-scroll` utility class for horizontal scroll
- **Nav item tap targets**: Increased from 36px → 44px (`min-height: 44px`, `padding: 10px 12px`)
- **Tab item sizing**: Added `min-height: 36px`, `white-space: nowrap`

### Accessibility Fixes
- Toast container: Added `role="status"` and `aria-live="polite"`
- Command modal search input: Added `aria-label="Search tokens and pages"`

## Not Changed (By Design)
- Status page hardcoded data — acceptable for pre-mainnet state
- TokenCard `imageUri = null` — needs metadata fetch infrastructure, deferred
- Legacy components in `/components/` — not imported, no runtime impact
- `EmptyState` component unused — pages have contextual inline empties that are better

## Build Status
✅ `next build` passing (bigint binding warning only — cosmetic)

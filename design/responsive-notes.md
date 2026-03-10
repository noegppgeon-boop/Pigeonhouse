# Responsive Notes

**Date:** 2026-03-09  
**Breakpoints:** sm (640px), md (768px), lg (1024px)

## Layout System

| Breakpoint | Sidebar | Content | Max Width |
|---|---|---|---|
| `< 768px` | Hidden (hamburger) | Full width, `pt-14` | 100% |
| `≥ 768px` | Fixed 240px left | `ml-sidebar` | 1200px |

## Grid Patterns

| Component | Mobile | Tablet | Desktop |
|---|---|---|---|
| Stat cards | 2-col | 2-col | 4-col |
| Token grid | 1-col | 2-col | 3-col |
| Token detail | stack | stack | 3-col (2+1) |
| Launch wizard | stack | stack | 5-col (3+2) |
| Highlight cards | 1-col | 3-col | 3-col |
| Trust badges | 2-col | 4-col | 4-col |
| Status cards | 1-col | 3-col | 3-col |

## Mobile-Specific Behaviors

- **Sidebar drawer**: spring animation, overlay backdrop, 288px (w-72)
- **Step indicators**: Icon-only on mobile (`hidden sm:inline` on label text)
- **Tab groups**: Horizontal scroll with hidden scrollbar
- **Data tables**: `.table-scroll` wrapper for horizontal overflow
- **Nav items**: 44px min-height tap targets
- **Tab items**: 36px min-height, `white-space: nowrap`, `flex-shrink: 0`

## Known Limitations

1. **Token detail 3-col**: On tablets (768-1023px), still stacks — acceptable
2. **Launch wizard preview**: Below form on mobile — OK, less critical than form
3. **Leaderboard table**: Needs `.table-scroll` wrapper if more columns added
4. **Command modal**: Fixed 20% from top — may need adjustment on very short screens
5. **Chart SVG**: `viewBox` responsive via `w-full h-64` — OK but fixed 256px height

## Tested Viewports

| Viewport | Width | Status |
|---|---|---|
| iPhone SE | 375px | ✅ Verified |
| iPhone 14 | 390px | ✅ Inferred |
| iPad | 768px | ✅ Breakpoint transition |
| Desktop | 1440px | ✅ Verified |
| Ultra-wide | 1920px+ | ✅ `max-w-[1200px]` constrains |

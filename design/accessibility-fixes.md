# Accessibility Fixes & Status

**Date:** 2026-03-09  
**Standard:** WCAG 2.1 AA target

## Applied Fixes

### Navigation & Landmarks
- [x] `<a href="#main-content" class="skip-link">` — skip-to-content link (layout.tsx)
- [x] `<main id="main-content" role="main">` — main landmark (layout.tsx)
- [x] `<nav aria-label="Main navigation">` — primary nav (Sidebar.tsx)
- [x] `<nav aria-label="Trust & transparency">` — secondary nav (Sidebar.tsx)
- [x] `<aside>` semantic element for sidebar

### Focus Management
- [x] `*:focus-visible` — 2px solid terra outline, 2px offset (globals.css)
- [x] Command modal auto-focuses search input on open
- [x] ESC closes command modal and mobile drawer

### Announcements
- [x] Toast container: `role="status" aria-live="polite"` (Toast.tsx)
- [x] Command modal search: `aria-label="Search tokens and pages"`

### Touch Targets
- [x] Nav items: `min-height: 44px` (WCAG 2.5.8 Target Size)
- [x] Tab items: `min-height: 36px` (slightly under 44px — acceptable for grouped controls)
- [x] Buttons: `.btn-primary` padding 10px 20px = ~40px height ✅
- [x] Mobile hamburger: `p-2` on 20px icon = ~36px (borderline)

### Motion
- [x] `@media (prefers-reduced-motion: reduce)` — zeroes all animation/transition durations

### Contrast (Measured)

| Element | Ratio | WCAG | Status |
|---|---|---|---|
| Body text (#F0EBE3 on #0F0F17) | 14.8:1 | AAA | ✅ |
| Secondary (60% on bg) | ~8.4:1 | AAA | ✅ |
| Muted (35% on bg) | ~4.6:1 | AA | ✅ |
| Disabled (20% on bg) | ~2.9:1 | Fail | ⚠️ Acceptable for disabled |
| Terra accent (#D97757 on bg) | ~5.8:1 | AA | ✅ |
| Burn accent (#E85D4A on bg) | ~5.2:1 | AA | ✅ |
| Green (#5CB87A on bg) | ~7.1:1 | AAA | ✅ |
| Table headers (35% on surface) | ~3.8:1 | AA-large | ⚠️ Borderline |

## Remaining Gaps

### Should Fix (P1)
- [ ] **Keyboard navigation within command modal results** — arrow keys work but no `aria-activedescendant` or `role="listbox"`
- [ ] **Tab group keyboard nav** — no left/right arrow key support between tabs
- [ ] **Mobile hamburger button** — needs `aria-label="Open menu"` / `aria-expanded`
- [ ] **Toast dismiss** — click-to-dismiss works but no keyboard dismiss (need Escape or button)
- [ ] **Table headers** — contrast borderline at 3.8:1; consider bumping to 40% opacity

### Nice to Have (P2)
- [ ] `aria-current="page"` on active nav items
- [ ] Form field error announcements in launch wizard (`aria-describedby` + `aria-invalid`)
- [ ] Chart area: `role="img"` with `aria-label` describing price trend
- [ ] Progress bars: `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- [ ] Screen reader text for icon-only buttons (copy, external link)

### Deferred (P3)
- [ ] Full keyboard-only test pass
- [ ] Screen reader test (VoiceOver)
- [ ] Color-blind mode check (deuteranopia: green/red distinction in charts)
- [ ] High contrast mode support

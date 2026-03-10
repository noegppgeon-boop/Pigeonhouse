# PigeonHouse Design System v2
## "Cult-Grade Launch Machine"

---

## 1. Mevcut Ürün Anlayışı

PigeonHouse **Solana üzerinde PIGEON-native bir bonding curve token launchpad.**

**Temel mekanik:**
1. Creator → `create_token` → bonding curve canlı
2. Trader → `buy/sell` → constant product AMM, fiyat keşfi
3. Her trade → %2 fee (%1 burn, %0.5 treasury, %0.5 referrer)
4. Transfer → Token-2022 TransferFee hook → fee accrual (PDA'da birikir)
5. Herkes → `sweep_fee_accrual` → Jupiter CPI → PIGEON alım → aynı tx'de burn
6. Graduation threshold → PumpSwap CPI → LP dead address'e

**Kritik ayrım (UI'ın doğru göstermesi gereken):**
- **Accrual** = transfer sırasında (hook), fee birikir
- **Burn** = sweep sırasında, birikenler yakılır
- İkisi farklı event'ler, farklı zamanlamalar, farklı tx'ler

**Mevcut canlı data:**
- 138 token launched (mainnet)
- 20 active, 10 graduating soon
- 2.24 PIGEON burned (erken aşama)
- 7.15K PIGEON total volume
- 6 API endpoint çalışıyor

---

## 2. Kullanıcı Segmentleri

### A. Launcher (Creator)
**Amaç:** Token launch'layıp traction almak
**Akış:** Connect → Name/Symbol/Logo → Review → Launch → Share referral link
**İhtiyaç:** Hız, basitlik, "how much will it cost", referral link
**Frekans:** 1-5x, sonra tracker

### B. Trader (Degen)
**Amaç:** Yeni token'larda erken girmek, kâr almak
**Akış:** Browse → Filter → Token page → Buy → Monitor → Sell
**İhtiyaç:** Fiyat, progress, chart, slippage, hız
**Frekans:** Günlük, çok sayıda trade

### C. Observer (Proof-Seeker)
**Amaç:** Burn'ün gerçek olduğunu doğrulamak
**Akış:** Transparency → Invariants → Solscan links
**İhtiyaç:** On-chain proof, tx links, protocol parameters
**Frekans:** 1-2x, güven inşası

### D. Referrer
**Amaç:** Link paylaşıp %0.5 kazanmak
**Akış:** Token page → Copy referral → Share → Track earnings
**İhtiyaç:** Link copy, earnings visibility
**Frekans:** Ongoing

**Birincil segment: Trader (Degen).** Her tasarım kararı önce bu kullanıcıya hizmet etmeli.

---

## 3. Bilgi Mimarisi

```
/ (Board)
├── Token discovery (ana grid)
├── Filter tabs: trending / new / graduating / volume
├── Platform stats bar (compact)
└── CTA: Launch

/token/[mint]
├── Price + progress + status
├── Chart (candlestick)
├── Trade panel (buy/sell)
├── Recent trades feed
├── Token info (reserves, creator, mint)
└── Referral CTA

/launch
├── 3-step wizard (details → review → confirm)
├── Live preview
└── Cost summary

/profile/[address]
├── Reputation score + tier
├── Launch history
└── Trust badges

/transparency
├── Burn proof invariants
├── On-chain program links
├── Sweep/accrual distinction
└── Protocol parameters

/leaderboard    (secondary)
/stats          (secondary)
/status         (secondary)
/portfolio      (wallet-gated)
```

**Navigasyon hiyerarşisi:**
- **Primary:** Board (/) → Token Detail → Trade
- **Secondary:** Launch, Profile, Transparency
- **Tertiary:** Leaderboard, Stats, Status, Portfolio

---

## 4. Ekran Envanteri

### Tier 1 — Revenue Critical
| Screen | Purpose | KPI |
|---|---|---|
| **Board** (`/`) | Token discovery, browse, enter | Time to first click |
| **Token Detail** (`/token/[mint]`) | Price action, trade execution | Trade conversion rate |
| **Trade Panel** (component) | Buy/sell execution | Tx success rate |

### Tier 2 — Growth
| Screen | Purpose | KPI |
|---|---|---|
| **Launch Wizard** (`/launch`) | Token creation | Launch completion rate |
| **Referral UI** (in token page) | Link sharing | Referral copy rate |

### Tier 3 — Trust & Retention
| Screen | Purpose | KPI |
|---|---|---|
| **Transparency** (`/transparency`) | Burn verification | Time on page |
| **Profile** (`/profile/[address]`) | Creator reputation | Profile visits |
| **Leaderboard** (`/leaderboard`) | Social proof | Return visits |

### Tier 4 — Utility
| Screen | Purpose |
|---|---|
| **Stats** (`/stats`) | Protocol metrics |
| **Status** (`/status`) | System health |
| **Portfolio** (`/portfolio`) | User positions |

---

## 5. Wireframe Mantığı

### Board (`/`) — "The Arena"
```
┌─────────────────────────────────────────────────┐
│ [🐦 PigeonHouse]  [Search ⌘K]  [Launch] [🔗 Wallet] │  ← top bar, not sidebar
├─────────────────────────────────────────────────┤
│  138 tokens │ 7.15K vol │ 2.24 burned │ 2% fee  │  ← compact stat strip
├─────────────────────────────────────────────────┤
│ [Trending] [New] [Graduating] [Volume]           │  ← filter tabs
├─────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ TOKEN A  │ │ TOKEN B  │ │ TOKEN C  │          │  ← token cards
│ │ $SYM     │ │ $SYM     │ │ $SYM     │          │     3-col desktop
│ │ ████░ 65%│ │ ██░░ 23% │ │ █░░░ 8%  │          │     2-col tablet
│ │ 1.2K vol │ │ 340 vol  │ │ 96 vol   │          │     1-col mobile
│ └──────────┘ └──────────┘ └──────────┘          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ ...      │ │ ...      │ │ ...      │          │
│ └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────┘
```

**Karar: Sidebar → Top bar.**
- pump.fun, gmgn, dexscreener hepsi top bar kullanır
- Sidebar 240px alan çalıyor — token grid'e zarar veriyor
- Mobile'da sidebar gereksiz complexity
- Top bar = daha geniş content area = daha çok token gösterimi = daha yüksek click rate

### Token Detail (`/token/[mint]`)
```
┌─────────────────────────────────────────────────┐
│ ← Back   TOKEN NAME $SYM   [Pre-Grad] [Share]   │
├──────────────────────┬──────────────────────────┤
│                      │                          │
│   PRICE CHART        │   TRADE PANEL            │
│   ████████████       │   [Buy] [Sell]           │
│   ████████████       │   Amount: [____] PIGEON  │
│   ████████████       │   You receive: XXX TKN   │
│                      │   🔥 12.5 burned         │
│                      │   [BUY TOKEN]            │
├──────────────────────┤                          │
│   RECENT TRADES      │   Token Info             │
│   buy  12.5  0.003   │   Supply: 1B             │
│   sell  5.2  0.003   │   Creator: Abc...xyz     │
│   buy  89.1  0.002   │   Progress: 23.5%        │
│                      │   ████████░░░            │
└──────────────────────┴──────────────────────────┘
```

### Launch Wizard — 3 adım (5 değil)
```
Step 1: Token Details    →  Step 2: Review + Risk  →  Step 3: Confirm (tx)
[Name] [Symbol]             Summary                    Loading state
[Description]               Fee breakdown              Success + link
[Image upload]              Risk checkbox
[Socials]
```

**Karar: 5 step → 3 step.**
- "Connect wallet" adım değil, precondition
- "Parameters" tamamen otomatik (bonding curve sabit), göstermek gereksiz friction
- Tek sayfa: Details → Review (risk checkbox dahil) → TX confirm
- Daha az step = daha yüksek completion rate

---

## 6. Görsel Sistem

### Renk Paleti

```
BACKGROUNDS
  --bg:             #0C0C0F     saf siyah değil, hafif sıcak kömür
  --bg-card:        #141417     kart yüzeyi
  --bg-elevated:    #1A1A1F     elevated panel

BORDERS
  --border:         #1E1E24     subtle
  --border-2:       #2A2A32     medium
  --border-3:       #3A3A44     strong / interactive

TEXT
  --text-primary:   #E8E4DC     warm off-white (%92 beyaz)
  --text-secondary: #8A8A96     pigeon slate (%55)
  --text-tertiary:  #55555F     muted (%35)

ACCENT — PRIMARY
  --lime:           #BFFF0A     acid lime (ana vurgu)
  --lime-dim:       #BFFF0A14   %8 opacity (badge/hover bg)
  --lime-muted:     #8AB800     koyu lime (secondary actions)

ACCENT — BURN
  --burn:           #FF5C3A     sıcak kırmızı-turuncu
  --burn-dim:       #FF5C3A12   %7 opacity

ACCENT — SUCCESS
  --green:          #34D058     net yeşil (tx success, graduated)
  --green-dim:      #34D05810

ACCENT — WARNING
  --amber:          #FFB020     amber (price impact, risk)
  --amber-dim:      #FFB02010

ACCENT — ERROR
  --red:            #FF4444     hata
  --red-dim:        #FF444410

SPECIAL
  --pigeon:         #6B7280     pigeon gray (logo, muted icons)
  --gold:           #FFD700     leaderboard crown

CHART
  --chart-green:    #34D058     buy candle
  --chart-red:      #FF5C3A     sell candle
  --chart-grid:     #1E1E24     grid lines
```

**Önceki ile fark:** Terra/warm → acid lime. "Premium institutional" → "cult-grade launch machine". Daha sert, daha signal-heavy, daha conversion-oriented.

### Glassmorphism Kuralları
```
KULLANILACAK YERLER:
  - Command modal overlay
  - Mobile nav overlay
  - Tooltip background (çok küçük alanlarda)

KULLANILMAYACAK YERLER:
  - Kartlar → flat, solid bg
  - Sidebar/top bar → solid
  - Trade panel → solid
  - Tablolar → solid
  - Modal body → solid with overlay

PARAMETRELER (kullanıldığında):
  background: rgba(12, 12, 15, 0.80)
  backdrop-filter: blur(12px)        ← düşük, 24-40px değil
  border: 1px solid var(--border-2)
```

### Tipografi

```
Font: Inter (mevcut, doğru seçim)
Mono: GeistMono (mevcut, doğru seçim)

SCALE:
  --text-xl:    24px / 700 / -0.02em    sayfa başlıkları
  --text-lg:    18px / 600 / -0.01em    section başlıkları
  --text-md:    14px / 500 / normal     body text
  --text-sm:    13px / 400 / normal     secondary text
  --text-xs:    11px / 500 / 0.02em     labels, badges, table headers

MONO KULLANIMI:
  - Fiyatlar → mono, --text-primary
  - Adresler → mono, --text-secondary
  - Badge içerikleri → mono, --text-xs
  - Progress yüzdeleri → mono
```

### Spacing

```
BASE: 4px

  --sp-1:   4px     icon gap, badge padding-y
  --sp-2:   8px     compact gap
  --sp-3:  12px     card padding-sm, button padding-x
  --sp-4:  16px     card padding
  --sp-5:  20px     section gap
  --sp-6:  24px     page section gap
  --sp-8:  32px     major section gap
```

### Radius

```
  --r-sm:    6px     badges, tags, small buttons
  --r-md:    8px     cards, panels, inputs
  --r-lg:   12px     modals, large cards
  --r-full: 9999px   pills, toggles
```

**Önceki ile fark:** 16-20px card radius → 8px. Daha sert, daha flat, daha trading-app. "Yumuşak kurumsal" yerine "keskin araç".

### Shadows

```
  --shadow-sm:   0 1px 2px rgba(0,0,0,0.4)
  --shadow-md:   0 2px 8px rgba(0,0,0,0.5)
  --shadow-glow: 0 0 20px rgba(191,255,10,0.08)    ← lime glow, sadece CTA'larda

  Genel kural: shadow az kullan. Kartları border ile ayır, shadow ile değil.
```

---

## 7. Component Sistemi

### Token Card (Board grid)
```
┌─────────────────────────────┐
│ [S] StressT24  $ST24   LIVE │  ← avatar + name + symbol + status badge
│                              │
│ ████████░░░░░░ 65.2%        │  ← progress bar + percentage
│                              │
│ 5.21K vol   ·   12.5 burned │  ← stats row (muted)
└─────────────────────────────┘

States: default, hover (border-2 + subtle lime glow), graduated (green badge)
Size: min 280px, max 1fr
Height: compact — ~100px
```

### Stat Strip (Board top)
```
┌─────────────────────────────────────────────────┐
│ 138 tokens  │  7.15K PIGEON vol  │  2.24 🔥  │  2% fee │
└─────────────────────────────────────────────────┘

Background: --bg (aynı sayfa bg)
Text: mono, --text-secondary
Separator: vertical 1px --border
İkon yok. Sadece rakam + label. Dense.
```

### Trade Panel
```
┌─────────────────────────┐
│ [■ Buy]  [□ Sell]       │  ← toggle tabs
│                         │
│ Balance: 1,234.56 PIGEON│
│ ┌─────────────────────┐ │
│ │ 0.00        PIGEON  │ │  ← input
│ └─────────────────────┘ │
│ [25%] [50%] [75%] [MAX] │  ← presets
│                         │
│        ↓                │
│                         │
│ You receive             │
│ ┌─────────────────────┐ │
│ │ 0.00          TKN   │ │
│ └─────────────────────┘ │
│                         │
│ 🔥 12.5 PIGEON burned  │  ← burn estimate (lime text)
│ Price impact: 0.3%      │
│                         │
│ ┌─────────────────────┐ │
│ │    BUY TOKEN        │ │  ← CTA (lime bg, black text)
│ └─────────────────────┘ │
└─────────────────────────┘

Buy tab active: lime gradient CTA
Sell tab active: red tinted CTA
```

### Button Hierarchy
```
PRIMARY:    bg: --lime, text: #000, font: 600    ← "Buy", "Launch", "Connect Wallet"
SECONDARY:  bg: --bg-elevated, border: --border-2, text: --text-primary
GHOST:      bg: transparent, text: --text-secondary, hover: --bg-card
DANGER:     bg: --red-dim, text: --red, border: --red/20

Sizes:
  sm:  h-32px, px-12, text-xs
  md:  h-40px, px-16, text-sm     ← default
  lg:  h-48px, px-24, text-md     ← CTA (trade, launch)
```

### Badge
```
  LIVE:       bg: --lime-dim,  text: --lime,   border: --lime/20
  GRADUATED:  bg: --green-dim, text: --green,  border: --green/20
  NEW:        bg: --amber-dim, text: --amber,  border: --amber/20
  INACTIVE:   bg: --border,    text: --text-tertiary
```

### Progress Bar
```
  Track:  h-2px (board), h-3px (detail), bg: --border-2, radius: --r-full
  Fill:   bg: linear-gradient(90deg, --lime, --lime-muted)
          graduated: solid --green
  Animation: width transition 0.6s ease-out (sayfa yüklenince)
  Shimmer: yok. Sade. Net.
```

### Tab Group
```
  Container: gap-0, border-bottom: 1px --border
  Item:      py-8, px-16, text-sm, text: --text-tertiary
  Active:    text: --text-primary, border-bottom: 2px --lime
  Hover:     text: --text-secondary

  Yok: bg-switch tab. Yok: rounded pill tab.
  Sadece underline tab. En net, en hızlı scan.
```

---

## 8. Responsive Yaklaşım

### Breakpoints
```
  sm:  640px    (mobile → tablet)
  md:  768px    (tablet → small desktop)
  lg:  1024px   (small desktop → full)
  xl:  1280px   (full desktop)
```

### Layout

**Desktop (≥1024px):**
```
Top bar (full width, h-48px, sticky)
Content (max-w-1280px, centered, px-24)
  Board: 3-col grid
  Token: 2-col (chart+trades | trade panel)
```

**Tablet (768-1023px):**
```
Top bar (full width)
Content (px-16)
  Board: 2-col grid
  Token: stacked (chart → trade → trades)
```

**Mobile (<768px):**
```
Top bar (compact, h-48px)
  Logo + hamburger + wallet
Content (px-12)
  Board: 1-col, card height reduced
  Token: stacked, trade panel sticky bottom? (pump.fun tarzı)
```

### Mobile-First Kararlar
- **Top bar, sidebar değil** — mobile'da hamburger menü açtığında tüm nav visible
- **Trade panel mobile:** Token detail'de sticky bottom bar ile "Buy/Sell" CTA
- **Tab scroll:** Horizontal scroll, hidden scrollbar
- **Table → card:** Mobile'da data-table'lar card-list'e dönüşür

---

## 9. Implementasyon Önceliği

### Sprint 1 — Palette + Shell (2-3 saat)
1. CSS token'ları yeni palette'e geçir (`globals.css`)
2. Tailwind config güncelle
3. Sidebar → Top bar geçişi (`layout.tsx` + yeni `TopBar.tsx`)
4. `.card` radius 16 → 8, shadow'ları kaldır
5. `.btn-primary` terra gradient → solid lime
6. `.badge` renklerini güncelle
7. `.tab-group` pill → underline
8. `.progress-fill` terra → lime gradient

### Sprint 2 — Board Redesign (2-3 saat)
1. Hero banner kaldır (gereksiz, alan çalıyor)
2. Stat strip (compact, border-separated, no cards)
3. Token card redesign (daha compact, daha dense)
4. Filter tabs (underline style)
5. Grid layout optimize (gap azalt, card sayısı artır)

### Sprint 3 — Token Detail + Trade (2-3 saat)
1. Token header simplify
2. Trade panel restyle (lime CTA, cleaner layout)
3. Chart area card borders
4. Recent trades compact

### Sprint 4 — Launch Wizard Simplify (1-2 saat)
1. 5-step → 3-step
2. Preview sidebar → inline preview
3. Risk checkbox + fee summary aynı adımda

### Sprint 5 — Secondary Screens (1-2 saat)
1. Transparency, Status, Profile, Leaderboard, Stats restyle
2. Palette swap yeterli olacak, layout değişikliği minimal

### Sprint 6 — Polish (1 saat)
1. Motion audit (mevcut framer-motion korunur, sadece duration tune)
2. Accessibility check
3. Dead component cleanup

**Toplam: ~12-15 saat**

---

## 10. Front-End'e En Düşük Riskli Geçiş Planı

### Korunacaklar (DOKUNMA)
- `hooks/usePlatformStats.ts` — veri katmanı çalışıyor, dokunma
- `hooks/useBondingCurve.ts` — çalışıyor, dokunma
- `lib/pigeon_house.ts` — on-chain interaction, dokunma
- `lib/constants.ts` — dokunma
- `lib/pda.ts` — dokunma
- `lib/rateLimit.ts` — dokunma
- `lib/upload.ts` — dokunma
- `components/WalletProvider.tsx` — dokunma
- `components/token/TradePanel.tsx` — sadece CSS class değişiklikleri
- `components/token/ChartArea.tsx` — sadece CSS class değişiklikleri
- `components/token/RecentTrades.tsx` — sadece CSS class değişiklikleri
- Tüm API route'lar (`app/api/`) — dokunma

### Değiştirilecekler (CSS + JSX)
| File | Change Type | Risk |
|---|---|---|
| `globals.css` | Token replace + new classes | **Low** — find/replace |
| `tailwind.config.ts` | Color/radius/shadow update | **Low** |
| `lib/utils.ts` | Yeni utility ekle (mevcut koru) | **Low** |
| `app/layout.tsx` | Sidebar → TopBar import swap | **Medium** |
| `components/layout/TopBar.tsx` | **Yeni dosya** | **Low** |
| `app/page.tsx` | Hero kaldır, stat strip ekle, grid güncelle | **Medium** |
| `components/token/TokenCard.tsx` | Class swap + compact layout | **Medium** |
| `components/home/TokenGrid.tsx` | Grid gap/cols güncelle | **Low** |
| `app/launch/page.tsx` | 5-step → 3-step simplify | **Medium** |
| Tüm page.tsx dosyaları | Class name updates (palette) | **Low** |
| `components/shared/StatCard.tsx` | Accent map güncelle | **Low** |
| `components/shared/Skeleton.tsx` | Color güncelle | **Low** |
| `components/shared/CommandModal.tsx` | Glass + color güncelle | **Low** |
| `components/shared/Toast.tsx` | Color güncelle | **Low** |

### Silinecekler
```
components/layout/Sidebar.tsx      → TopBar ile replace
components/layout/Header.tsx       → zaten dead
components/layout/Nav.tsx          → zaten dead
components/layout/BurnTicker.tsx   → zaten dead
components/home/BurnTicker.tsx     → zaten dead
components/home/StatsBar.tsx       → zaten dead
components/home/LiveFeed.tsx       → zaten dead
components/launch/LaunchForm.tsx   → zaten dead
components/token/BuySellWidget.tsx → zaten dead
components/token/InfoCards.tsx     → zaten dead
components/token/BondingCurveProgress.tsx → zaten dead
components/common/FireParticles.tsx → zaten dead
```

### Geçiş Sırası (Atomic commits)
1. **globals.css + tailwind.config.ts** — token swap (build test)
2. **TopBar.tsx + layout.tsx** — shell swap (visual test)
3. **Board page** — grid + stat strip (visual test)
4. **Token detail** — class swap (visual test)
5. **Trade panel + chart** — class swap (functional test)
6. **Launch wizard** — step reduction (functional test)
7. **Secondary screens** — batch class swap (visual test)
8. **Dead code cleanup** — delete (build test)

Her adım ayrı commit. Her adım sonrası `next build` + visual check.

---

## Özet: Neden Bu Karar Doğru

| Önceki (v1) | Yeni (v2) | Neden |
|---|---|---|
| Sidebar (240px) | Top bar | Token grid'e %20 daha alan, pump.fun pattern |
| Terra/warm (#D97757) | Acid lime (#BFFF0A) | Daha signal-heavy, daha "launch", daha underground |
| 16px card radius | 8px | Trading app sertliği, daha profesyonel |
| Glass-dense on cards | Flat + border only | Daha net, daha hızlı render, daha az blur noise |
| 5-step wizard | 3-step wizard | Daha yüksek completion rate |
| Hero banner | Yok | Alan israfı, conversion'a katkısı yok |
| Stat cards (padded) | Stat strip (inline) | Daha dense, daha hızlı scan |
| Pill tabs | Underline tabs | Daha standart, daha hızlı recognition |
| Shadows on cards | Borders only | Daha flat, daha clean |
| "Premium institutional" | "Cult-grade launch machine" | Hedef kitle degen, ürün memecoin launchpad |

**Bu ürün "güzel" olmalı ama "güzellik" fonksiyona hizmet etmeli.**
En güzel launch ekranı, en çok launch yapılan ekrandır.
En güzel trade ekranı, en çok trade yapılan ekrandır.

# User Flow Map

## Flow 1: First-Time Trader

```
[Landing / Board]
  │
  ├── Sees token grid sorted by trending
  ├── Scans: name, symbol, progress %, volume, burn amount
  │
  ▼
[Click token card]
  │
  ▼
[Token Detail]
  │
  ├── Sees: price, mcap, progress bar, chart
  ├── Sees: "Select Wallet" button in trade panel
  │
  ▼
[Connect Wallet]    ← in-place, not a redirect
  │
  ├── Wallet adapter modal opens
  ├── User selects wallet (Phantom, Backpack, etc.)
  │
  ▼
[Trade Panel unlocked]
  │
  ├── Sees: PIGEON balance, token balance
  ├── Enters amount or uses preset (25/50/75/MAX)
  ├── Sees: output quote, burn estimate, price impact
  │
  ▼
[Click "Buy TOKEN"]
  │
  ├── Wallet confirmation popup
  ├── Loading: "Confirming..."
  │
  ├── SUCCESS: ✅ toast + Solscan link
  │   └── Balance updates, chart refreshes
  │
  └── ERROR: ❌ toast with reason
      ├── "Insufficient balance"
      ├── "Slippage exceeded"
      └── "Transaction cancelled"
```

**Critical UX points:**
- Wallet connect must NOT redirect away from token page
- Trade panel shows "Enter amount" (disabled) until amount entered
- Burn estimate visible BEFORE confirmation → builds trust
- After success, user stays on same page (not redirected)

---

## Flow 2: First-Time Creator

```
[Board or direct link]
  │
  ▼
[Click "Launch" in nav or tab CTA]
  │
  ▼
[Launch Wizard — Step 1: Details]
  │
  ├── NOT CONNECTED: Shows "Connect Wallet" step first
  ├── CONNECTED: Jumps to Details
  │
  ├── Fills: Name*, Symbol*, Description
  ├── Uploads logo (file or URL)
  ├── Optionally: Twitter, Telegram, Website
  ├── Optionally: Initial Buy toggle + amount
  │
  ├── Live Preview updates in real-time (right panel)
  │
  ▼
[Click "Continue to Review"]   ← disabled until Name + Symbol filled
  │
  ▼
[Step 2: Review & Launch]
  │
  ├── Summary: name, symbol, description, initial buy
  ├── Fee structure: 1% burn, 0.5% treasury, 0.5% referral
  ├── Risk warning (amber box)
  ├── Checkbox: "I understand the risks" ← required
  │
  ▼
[Click "Launch Token"]   ← disabled until checkbox checked
  │
  ├── Status: "Uploading metadata to Arweave..."
  ├── Status: "Creating token on-chain..."
  │
  ├── SUCCESS:
  │   ├── Success screen with name, symbol, mint address
  │   ├── "View Token" → /token/[mint]
  │   ├── "Explorer" → Solscan
  │   └── (Future: "Copy Referral Link")
  │
  └── ERROR:
      ├── Error message in red box
      ├── User can retry without losing form data
      └── Back button available to edit
```

**Critical UX points:**
- Form state persists across step navigation (useState, not URL)
- Arweave upload can fail → graceful fallback to base64 data URI
- After success, "View Token" is primary CTA (lime button)
- Creator should immediately see their token live on the bonding curve

---

## Flow 3: Buy/Sell on Token Detail

```
[Token Detail Page]
  │
  ├── Tab: [Buy] [Sell]  (toggle, visual distinction)
  │
  ▼
[Buy Flow]
  │
  ├── Input: amount in PIGEON
  ├── Presets: [25%] [50%] [75%] [MAX] of PIGEON balance
  ├── Output: calculated token amount (getQuoteBuy)
  ├── Info: burn estimate, price impact %, slippage setting
  │
  ├── Validation:
  │   ├── Amount > 0
  │   ├── Amount ≤ PIGEON balance
  │   ├── Wallet connected
  │   ├── Curve not graduated
  │
  ▼
[Click "Buy TOKEN"]
  │
  ├── executeBuy(wallet, mint, amount, slippage, referrer?)
  ├── On-chain: build tx → sign → send → confirm
  │
  ├── SUCCESS: toast, balance refresh (2.5s delay), amount reset
  └── ERROR: contextual message (insufficient, slippage, cancelled)

[Sell Flow]   ← mirror of buy with:
  ├── Input: amount in TOKEN
  ├── Presets: % of TOKEN balance
  ├── Output: PIGEON received (getQuoteSell)
  ├── CTA: "Sell TOKEN" (red-tinted button)
  └── executeSell(wallet, mint, amount, slippage, referrer?)
```

**State flow:**
```
amount (string) → amountNum (float) → amountBN (BN) → quote → output display
                                                      → burnEstimate
                                                      → priceImpact
```

---

## Flow 4: Burn Proof / Accrual Visibility

```
[Transparency Page]
  │
  ├── Stat cards: Total Burned, Total Swept, Sweep Count, Fee Rate
  │
  ├── "How On-Chain Burn Works" — 4-step diagram:
  │   1. Fee Accrual (hook)
  │   2. Sweep Trigger (permissionless)
  │   3. Jupiter Swap (CPI)
  │   4. On-Chain Burn (same tx)
  │
  ├── Tabs: [Overview] [Sweeps] [Accruals]
  │
  │   Overview:
  │   ├── Protocol Invariants (6 checkmarks)
  │   └── On-Chain Programs (Solscan links)
  │
  │   Sweeps:                    ← EMPTY STATE (pre-mainnet)
  │   └── "No sweeps recorded yet"
  │
  │   Accruals:                  ← EMPTY STATE (pre-mainnet)
  │   └── "No accruals yet"
  │
  └── FUTURE: Real sweep/accrual data from indexer

[Per-Token Burn Visibility]   ← in token detail page
  │
  ├── "Burned" metric card (1% of volume estimate)
  ├── Burn estimate in trade panel ("🔥 12.5 PIGEON burned")
  └── Fee structure in review panels
```

**Trust UX principle:**
- Every burn claim has a Solscan link
- Invariants are boolean checks ("does" or "doesn't"), not marketing claims
- Accrual ≠ Burn — separate sections, separate timestamps, separate events

---

## Flow 5: Permissionless Sweep

```
[Future: Sweep UI — not yet implemented]

[Transparency Page → Sweep Tab]
  │
  ├── Per-mint vault table:
  │   ├── Token, Accrued Amount, Last Sweep, Status
  │   └── [Sweep] button per row
  │
  ▼
[Click "Sweep" on a vault]
  │
  ├── Preconditions:
  │   ├── Wallet connected
  │   ├── Vault above min_sweep_threshold (10M = 10 tokens)
  │   ├── Jupiter route available
  │
  ├── Preview: "Sweep ~X tokens → est. Y PIGEON burned"
  │
  ▼
[Confirm Sweep]
  │
  ├── sweep_fee_accrual instruction:
  │   ├── Withdraw withheld tokens from mint
  │   ├── Jupiter CPI (route data from frontend)
  │   ├── burn_checked on received PIGEON
  │   └── SweepExecuted event emitted
  │
  ├── SUCCESS: toast + tx link + vault stats refresh
  └── ERROR: "Below threshold" / "Route unavailable" / "Burn mismatch"
```

**NOT YET IMPLEMENTED.** Requires:
1. Frontend Jupiter route fetching
2. Sweep instruction builder
3. Vault balance display (per-mint query)
4. Indexer for sweep history

---

## Flow 6: Operator / Config Access

```
[Status Page]   ← read-only, no auth
  │
  ├── Program Status: 3 cards (Programs, Hook, Sweep Bot)
  ├── On-Chain Programs: name, status dot, address, network
  ├── Protocol Parameters: fee rates, thresholds, program IDs
  ├── Event Schema: HookFeeAccrued, HookSwapSkipped, SweepExecuted
  │
  └── No configuration UI — all config is on-chain via CLI

[Operator Actions — CLI only, not in UI]
  ├── initialize_hook (authority, burn_bps, min_transfer, pigeon_mint)
  ├── update_hook_config (authority only)
  ├── update_config (PigeonHouse authority only)
  └── upgrade_program (multisig, deploy keypair)
```

**Design decision:** No governance/config UI in the frontend. Operator actions are CLI-only for security. Status page is read-only monitoring.

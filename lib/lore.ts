/**
 * LORE DICTIONARY — The Ancient Bird Language
 * 
 * Rules:
 * 1. Primary labels stay plain English — always readable
 * 2. Lore lives in subtitles, empty states, micro-labels, archive cards
 * 3. Short, atmospheric, never cringe
 * 4. Keywords: signal / silence / seal / vow / feather / ash / wing / hatch / flock / proof
 */

/* ═══════════════════════════════════════
   SECTION HEADERS — plain + lore pair
   ═══════════════════════════════════════ */

export const SECTION_HEADERS = {
  board:        { title: "The Archive",           lore: "Tokens inscribed by the flock — each a spark, witnessed on-chain" },
  launch:       { title: "Inscribe a New Token",  lore: "Kindle a spark upon the chain — let it find its flock" },
  leaderboard:  { title: "The Order of Flame",    lore: "Those who kindle, those who burn — ranked by on-chain devotion" },
  transparency: { title: "The Proof Ledger",      lore: "Every offering witnessed, every burn sealed on-chain — trust nothing, verify all" },
  stats:        { title: "Protocol Observatory",  lore: "The living metrics of the flock — every signal drawn from the chain" },
  status:       { title: "System Status",         lore: "Protocol health, deployed seals, and immutable parameters" },
  portfolio:    { title: "Portfolio",             lore: "Your positions, burns, and on-chain footprint" },
  profile:      { title: "Creator Profile",       lore: "On-chain devotion measured in fire and flight" },
  tokenDetail:  { title: "Token Detail",          lore: "One spark in the archive — every trade, every burn, witnessed" },
} as const;

/* ═══════════════════════════════════════
   LORE NAMES — ritual aliases
   ═══════════════════════════════════════ */

export const LORE_NAMES = {
  // Navigation
  board:        "The Archive",
  launch:       "The Hatch",
  leaderboard:  "Order of Flame",
  transparency: "The Proof",
  stats:        "The Signal",
  status:       "The Pulse",
  portfolio:    "The Nest",
  profile:      "The Feather",

  // Actions
  createToken:  "Inscribe",
  buy:          "Gather",
  sell:         "Release",
  review:       "The Seal",
  confirm:      "Commit",
  graduate:     "Ascension",
  sweep:        "The Reaping",
  burn:         "The Offering",

  // States
  success:      "The Wing Opens",
  failure:      "The Silence",
  pending:      "Awaiting Fire",
  loading:      "Decoding...",

  // Events
  sweepExecuted:  "Mark Sealed",
  burnExecuted:   "Ash Confirmed",
  tokenCreated:   "Spark Kindled",
  graduated:      "Wing Opened",
  feeAccrued:     "Silent Offering",
} as const;

/* ═══════════════════════════════════════
   STATUS BADGES
   ═══════════════════════════════════════ */

export const STATUS_BADGES = {
  new:         { label: "Kindled",     lore: "newly hatched" },
  preGrad:     { label: "Pre-Grad",    lore: "gathering flight" },
  heating:     { label: "Heating",     lore: "the flock gathers" },
  graduating:  { label: "Graduating",  lore: "approaching ascension" },
  ascended:    { label: "Ascended",    lore: "wing opened" },
} as const;

/* ═══════════════════════════════════════
   CREATOR ARCHETYPES
   ═══════════════════════════════════════ */

export const CREATOR_ARCHETYPES = {
  archon:   { title: "Archon",   lore: "First to kindle — the origin spark",    minScore: 80 },
  elder:    { title: "Elder",    lore: "Volume speaks — loudest signal",         minScore: 50 },
  keeper:   { title: "Keeper",   lore: "Burn devotion — steady flame",           minScore: 20 },
  initiate: { title: "Initiate", lore: "A feather yet unweighed",               minScore: 0 },
} as const;

/* ═══════════════════════════════════════
   ARCHIVE CARDS — the seven fragments
   ═══════════════════════════════════════ */

export const ARCHIVE_CARDS = {
  theHatch:       { title: "The Hatch",       tag: "ORIGIN",    desc: "Every token begins as a spark — one inscription, one bonding curve, one chance." },
  theNoise:       { title: "The Noise",       tag: "SIGNAL",    desc: "Volume is the flock in motion. Trade activity that cannot be faked." },
  theCounterfeit: { title: "The Counterfeit", tag: "CONVERTED", desc: "Fees transmuted to PIGEON via Jupiter. Alchemy, on-chain." },
  theVow:         { title: "The Vow",         tag: "SEALED",    desc: "Every burn is committed in the same transaction. No delayed promises." },
  theTrial:       { title: "The Trial",       tag: "VERIFIED",  desc: "Sweep is permissionless. Anyone can trigger the burn path." },
  theSeal:        { title: "The Seal",        tag: "PERMANENT", desc: "No authority wallet touches the burn path. PDA signs all CPIs." },
  theQuietMove:   { title: "The Quiet Move",  tag: "SILENT",    desc: "Fees accumulate on every transfer. Invisible. Automatic. Relentless." },
} as const;

/* ═══════════════════════════════════════
   EMPTY STATES
   ═══════════════════════════════════════ */

export const EMPTY_STATES = {
  noTokens:     { text: "The archive awaits",           lore: "No tokens have been inscribed yet. Be the first to kindle the flame." },
  noTrades:     { text: "No trades yet",                lore: "The first trade shall be inscribed here" },
  noSweeps:     { text: "No sweeps witnessed yet",      lore: "The Quiet Move — the first sweep shall be recorded when fees accumulate" },
  noAccruals:   { text: "No accruals witnessed",        lore: "The Noise — offerings accumulate silently with each transfer" },
  noPositions:  { text: "No positions found",           lore: "The Noise — trade tokens on the bonding curve to see your positions here" },
  noActivity:   { text: "No activity yet",              lore: "The Quiet Move — your trades will appear here" },
  noLaunches:   { text: "No inscriptions yet",          lore: "The Hatch — every creator begins with a single spark" },
  noLeaders:    { text: "The order awaits its first members", lore: "Inscribe a token to enter the ranks of flame" },
  noFeeVaults:  { text: "No fee vaults yet",            lore: "Vaults appear when tokens are inscribed" },
  searchEmpty:  { text: "No signals found",             lore: "The archive holds no match for this query" },
} as const;

/* ═══════════════════════════════════════
   LOADING STATES
   ═══════════════════════════════════════ */

export const LOADING_STATES = {
  default:      "Decoding the archive...",
  trades:       "Reading the ledger...",
  tokens:       "Scanning inscriptions...",
  profile:      "Weighing the feather...",
  chart:        "Drawing the signal...",
  launch:       "Inscribing on-chain...",
  metadata:     "Uploading to Arweave...",
  sweep:        "Executing the reaping...",
  transaction:  "Sealing the mark...",
} as const;

/* ═══════════════════════════════════════
   SUCCESS / ERROR / WARNING COPY
   ═══════════════════════════════════════ */

export const RESULT_COPY = {
  // Success
  tokenCreated:    { title: "Token Inscribed",     lore: "A new flame has been kindled in the archive" },
  buySuccess:      { title: "Gathered",            lore: "Your offering has been received" },
  sellSuccess:     { title: "Released",            lore: "Tokens returned to the curve" },
  sweepSuccess:    { title: "Mark Sealed",         lore: "Fees reaped and burned in one breath" },
  graduationDone:  { title: "Ascension Complete",  lore: "The wing has opened — liquidity sealed forever" },
  copied:          { title: "Sealed to clipboard", lore: "" },

  // Errors
  txFailed:        { title: "The Silence",         lore: "Transaction failed — the chain did not accept this offering" },
  walletRejected:  { title: "Unsigned",            lore: "The seal was not given — wallet rejected the transaction" },
  insufficientBal: { title: "Empty Nest",          lore: "Not enough PIGEON to complete this offering" },
  slippage:        { title: "Signal Lost",         lore: "Price moved beyond your slippage tolerance" },
  networkError:    { title: "Chain Unreachable",   lore: "The archive cannot be read — check your connection" },
  uploadFailed:    { title: "Inscription Failed",  lore: "Metadata could not be sealed to Arweave" },
  genericError:    { title: "Something Broke",     lore: "An unexpected silence — try again" },

  // Warnings
  lowBalance:      { title: "Low Reserves",        lore: "Your nest is running thin" },
  highSlippage:    { title: "Wide Signal",          lore: "Slippage is high — your offering may shift" },
  priceImpact:     { title: "Heavy Wing",           lore: "This trade moves the curve significantly" },
  graduationSoon:  { title: "Ascension Near",       lore: "This token approaches the threshold — tread with intent" },
} as const;

/* ═══════════════════════════════════════
   LAUNCH WIZARD COPY
   ═══════════════════════════════════════ */

export const LAUNCH_COPY = {
  steps: [
    { key: "connect", label: "Wallet",       lore: "Identify" },
    { key: "details", label: "Details",      lore: "Inscribe" },
    { key: "review",  label: "Seal & Launch", lore: "Commit" },
  ],
  connectTitle:    "Connect Wallet",
  connectLore:     "Reveal your identity to the flock",
  detailsTitle:    "Token Details",
  detailsLore:     "Name the spark, give it form",
  reviewTitle:     "Seal & Launch",
  reviewLore:      "Commit your inscription to the chain",
  successTitle:    "Token Inscribed",
  successLore:     "Your spark is live on the bonding curve",
  successArchive:  "A new flame has been kindled in the archive",
  previewHeader:   "How it will appear",
  riskHeader:      "Before you launch",
  risks: [
    "Bonding curve goes live immediately — irreversible",
    "Token metadata is permanently inscribed on-chain",
    "LP will be locked forever at graduation",
    "Creator reward: 0.5% of reserves at graduation",
  ],
  submitButton:    "Seal & Launch",
  submitting:      "Inscribing...",
} as const;

/* ═══════════════════════════════════════
   BURN RITUAL STEPS
   ═══════════════════════════════════════ */

export const BURN_RITUAL = [
  { step: "I",   title: "The Quiet Move",  tag: "accrual",     desc: "Token-2022 TransferFee withholds 0.25% on every transfer. Silent. Automatic." },
  { step: "II",  title: "The Trial",       tag: "trigger",     desc: "Anyone calls sweep — permissionless. No gatekeeper, no authority." },
  { step: "III", title: "The Counterfeit", tag: "conversion",  desc: "Accrued fees swapped to PIGEON via Jupiter CPI. On-chain, atomic." },
  { step: "IV",  title: "The Hatch",       tag: "destruction", desc: "PIGEON burned in the same transaction. Irrevocable. Verifiable." },
] as const;

/* ═══════════════════════════════════════
   PROTOCOL INVARIANTS
   ═══════════════════════════════════════ */

export const INVARIANTS = [
  "Transfer hook NEVER reverts — your transfers always succeed",
  "All received PIGEON is burned in the SAME transaction",
  "No authority wallet in the burn path — vault PDA signs all CPIs",
  "Jupiter program ID is hardcoded — no arbitrary DEX calls",
  "Sweep is permissionless — anyone can trigger it",
  "State counters are monotonic — they only go up",
] as const;

/* ═══════════════════════════════════════
   HOW IT WORKS — short form
   ═══════════════════════════════════════ */

export const HOW_IT_WORKS = [
  { label: "Create",   desc: "Token launches on bonding curve instantly" },
  { label: "Burn",     desc: "1% of every trade burned permanently" },
  { label: "Graduate", desc: "At threshold → Meteora pool + LP locked" },
  { label: "Hook",     desc: "Post-graduation: transfer fees → sweep → burn" },
] as const;

/* ═══════════════════════════════════════
   SCORING METHODOLOGY
   ═══════════════════════════════════════ */

export const SCORING = {
  formula: "Score = (graduated × 30) + (launches × 5) + burn contribution bonus",
  disclaimer: "All signals derived from on-chain state — no social metrics, no off-chain trust. Pure chain truth.",
  tag: "ON-CHAIN ONLY",
} as const;

/* ═══════════════════════════════════════
   COMMAND PALETTE / SEARCH
   ═══════════════════════════════════════ */

export const SEARCH_COPY = {
  placeholder:  "Search the archive...",
  shortcut:     "⌘K",
  noResults:    "No signals found",
  noResultsLore: "The archive holds no match — try a different query",
  recentHeader: "Recent Signals",
  hint:         "Search by name, symbol, or mint address",
} as const;

/* ═══════════════════════════════════════
   PSEUDO-SCRIPT — decorative ancient bird glyphs
   Only for display headings / decorative micro-labels.
   Never in core UX.
   ═══════════════════════════════════════ */

export const GLYPHS = {
  // These are decorative labels using a "decoded" aesthetic
  archive:      "◈ ARCHIVE",
  proof:        "◈ PROOF",
  signal:       "◇ SIGNAL",
  sealed:       "◆ SEALED",
  decoded:      "▣ DECODED",
  encrypted:    "▢ ENCRYPTED",
  partial:      "◧ PARTIAL",
  active:       "◉ ACTIVE",
  dormant:      "○ DORMANT",
  separator:    "·",
  divider:      "—",
  arrow:        "→",
} as const;

/* ═══════════════════════════════════════
   FOOTER / ABOUT
   ═══════════════════════════════════════ */

export const ABOUT = {
  tagline:     "ritual launch terminal",
  description: "Where tokens are inscribed, burned, and witnessed. A deflation engine for the flock.",
  mission:     "Every trade burns. Every sweep seals. The archive remembers.",
} as const;

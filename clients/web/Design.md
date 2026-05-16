# Artic Web Client — Design Document

## Design System

### Color Palette

All colors are defined as CSS custom properties in `globals.css`.

#### Surfaces (elevation by background, not border)

| Token | Hex | Purpose |
|---|---|---|
| `--surface` | `#0E141A` | Base page background |
| `--surface-elevated` | `#171D25` | Main content cards |
| `--surface-raised` | `#1F2731` | Floating cards, popovers |
| `--surface-sunken` | `#0A0E12` | Charts, code wells, log streams |

#### Foreground

| Token | Hex | Purpose |
|---|---|---|
| `--foreground` | `#F2F0EB` | Primary text (light cream) |
| `--foreground-muted` | `#8B94A1` | Secondary / helper text |

#### Accent Colors

| Color | Hex | Use |
|---|---|---|
| Primary (warm cream) | `#F3E4D1` | CTAs, active states, primary highlights |
| Primary hover | `#E5D2B8` | Button hover state |
| Primary soft bg | `rgba(243,228,209,0.14)` | Soft badge backgrounds |
| Primary border | `rgba(243,228,209,0.38)` | Accent borders |
| Teal | `#6FCAA0` | Positive PnL, long positions, success |
| Teal light | `#8FDCB7` | Lighter teal variant |
| Red | `#E85F5F` | Losses, short positions, errors |
| Red light | `#F07A6D` | Softer loss/negative indicator |
| Blue | `#8FB1E8` | Info, LLM logs |
| Blue light | `#B3C9EE` | Lighter blue variant |
| Amber | `#F0C561` | Warnings, halted state |
| CTA button | `#34424D` | Secondary CTA background |
| CTA border | `#C4CCD3` | CTA border / neutral |
| Gray | `#C4CCD3` | Neutral borders, secondary states |

#### Chart Colors

| Token | Hex |
|---|---|
| `--chart-1` | `#F3E4D1` |
| `--chart-2` | `#6FCAA0` |
| `--chart-3` | `#F07A6D` |
| `--chart-4` | `#8FB1E8` |
| `--chart-5` | `#F0C561` |

### Color Semantics

- **Teal** = good / positive / long
- **Red** = bad / negative / short / error
- **Amber** = warning / caution / halted
- **Orange/warm** = primary action / brand
- **Blue** = informational / LLM
- **Gray** = neutral / secondary

---

### Typography

| Scale token | Size | Weight | Transform | Tracking | Notes |
|---|---|---|---|---|---|
| `h-page` | 1.875rem (30px) | 600 | — | -0.025em | Page titles |
| `h-section` | 0.75rem (12px) | 600 | Uppercase | 0.14em | Section headers |
| `label-xs` | 0.625rem (10px) | — | Uppercase | 0.12em | Micro labels |
| `num-tabular` | — | — | — | — | Monospace + tabular-nums for all financial data |

**Font families:**
- Body / UI: `Inter`
- Code / numbers: `Geist Mono`

**Key rule:** All financial values, addresses, percentages, and numeric data use `font-mono` with tabular number spacing for alignment.

---

### Elevation System

Hierarchy is expressed exclusively through background tone — no primary cards use visible borders.

```
Lowest  ← surface-sunken (#0A0E12) — charts, log wells, code blocks
         ← surface         (#0E141A) — page background
         ← surface-elevated (#171D25) — main cards (inset shadow)
Highest ← surface-raised   (#1F2731) — floating cards (stronger shadow)
```

Utility classes: `.surface`, `.surface-raised`, `.surface-sunken`, `.surface-accent`

---

### Spacing & Shape

- **Base border radius:** `0.625rem` (10px), scaled via Tailwind
- **Spacing scale:** Standard Tailwind (2, 3, 4, 6, 8 most common)
- **Card padding:** typically `p-4` or `p-6`
- **Gap in grids:** `gap-3` or `gap-4`

---

### Shadows

- Elevated cards: subtle inset shadow
- Raised cards: stronger drop shadow
- Hover (`.hover-lift`): adds translateY(-2px) + shadow increase

---

### Animations

**Framer Motion spring presets:**

```
springSnappy = { stiffness: 400, damping: 28 }
springBouncy = { stiffness: 350, damping: 20, mass: 0.7 }
```

**Patterns in use:**
- Fade + scale on mount/exit
- Stagger for list items
- `layoutId` for active indicator transitions
- `.hover-lift` transform on cards

**Ticker animation:** `translateX(0) → translateX(-50%)` over 30s linear infinite

**Reduced motion:** All animations disabled via `prefers-reduced-motion: reduce` media query.

---

### Interactive States

| Element | Default | Hover | Focus | Disabled |
|---|---|---|---|---|
| Buttons | Solid background | bg/opacity shift | ring-3 with ring-ring/50 | opacity-50, cursor-not-allowed |
| Links | — | text-color change | focus-ring | — |
| Cards | surface-raised bg | hover-lift transform | — | — |
| Table rows | transparent | bg-white/[0.02] | — | — |
| Nav links | foreground/70 | foreground | orange bottom border | — |

**Focus ring class (`.focus-ring`):** 2px outline in `--ring` color, 2px offset — applied to all interactive elements.

---

### Responsive Breakpoints

Tailwind v4, mobile-first:

| Breakpoint | Width | Changes |
|---|---|---|
| base | < 768px | Single column, hamburger menu, no sidebar |
| `md:` | 768px+ | 2-col grids, tablet layout |
| `lg:` | 1024px+ | 3-col grids, desktop nav, sticky sidebars |

**Common patterns:**
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- `hidden lg:flex` / `flex lg:hidden`
- `flex-col md:flex-row`

---

## Pages

### Landing: `/`

**Components:** `Navbar` → `Hero` → `Ticker` → `FeaturesGrid` → `HowItWorks` → `CtaBanner` → `Footer`

#### Navbar

Fixed, z-50. Backdrop blur + `bg-black/90` + `border-white/10` border bottom.

- **Left:** Artic wordmark / logo
- **Center (desktop):** Navigation links with dropdowns
  - _Resources_ dropdown: Blog, Docs, Litepaper — each item has a colored accent panel
  - _Join Us_ dropdown: Careers, GitHub
- **Right:** "Launch App" CTA button (orange/primary)
- **Mobile:** Hamburger icon replaces center links; slide-down mobile menu

Dropdown items render a `PanelVisual` — a mini decorative panel with the item's brand color on the right side of the dropdown card.

#### Hero

`min-h-[88vh]`, flex column centered, relative positioning.

- **Background:** Sky PNG image + animated layered overlays (radial gradient: warm terracotta + blue tones), animated via Framer Motion
- **Badge:** Pill label — "Now in early access"
- **Heading:** `clamp(40px, 7vw, 80px)`, bold, -2px tracking
- **Subtitle:** `max-w-180`, relaxed line-height, muted foreground
- **CTAs:**
  - Primary: "Launch app" (orange)
  - Secondary: "Read docs" (outline)

#### Ticker

Full-width horizontal scrolling strip. Content loops continuously at 30s/cycle. Contains trading/market data snippets.

#### FeaturesGrid

Two-column layout:

- **Left column:** Vertical list of 6 feature names. Clicking highlights one; active item shows orange indicator
- **Right column:** Displays selected feature's description + an animated `IconPanel`
  - `IconPanel`: Three concentric gradient circles + centered Lucide icon, animated entry with spring physics
  - Features: Strategy Selection (Zap), LLM Brain (Brain), Analytics (BarChart3), Risk Controls (ShieldCheck), Cross-chain (Globe), Real-time (Radio)
  - Each feature has two accent colors (foreground pair)

#### HowItWorks

Multi-step process visualization showing how the platform works end-to-end.

#### CtaBanner

Full-screen section (`h-[80vh]`):

- Background image: `footer-night.png` with dark overlay
- Large heading: "Spin up your first agent"
- Subtitle text
- Buttons: "Launch app" (primary) + "View on GitHub" (outline)

#### Footer

Light background (`#CCD2D6`):

- **Top:** Large gradient wordmark — "Let your Pack Trade for You"
- **Link columns:** Product, Resources, Community
- **Bottom bar:** Status pill ("All systems operational" + pulsing green dot) + social icons (GitHub, Twitter, Telegram, Discord)

---

### Blog: `/blog`

**Components:** Navbar + post grid + Footer

- Post cards: bordered (`border-white/8`), hover to `border-white/15`
- Post metadata: calendar icon + date, clock icon + read time
- Category tags: orange/15 background + orange text, rounded pills
- Grid: 3 columns on desktop

---

### Blog Post: `/blog/[slug]`

MDX-rendered article with standard article typography. Uses docs-style layout.

---

### Docs: `/docs`

**Layout:** Fixed Navbar + sticky left `DocsSidebar` + centered content area (max-w-5xl) + Footer

#### DocsSidebar (desktop, `lg:` only)

- Sticky, full-height, scrollable
- Collapsible section groups — `ChevronRight` rotates on expand
- Section headers: uppercase, small, `text-white/40`
- Active link: `bg-orange/15`, orange text
- Inactive: foreground/60
- Smooth expand/collapse transitions

#### Mobile Docs Nav

Replaces sidebar on < lg. Expandable dropdown at top of content area.

#### Callout Component

Info/warning/tip boxes with colored left border + matching background tint.

#### CodeTabs

Tab-based switcher for multi-language code blocks with syntax highlighting.

---

### Litepaper: `/litepaper`

Same layout as `/docs` with document-style article content.

---

### Wallet Connect: `/(auth)/connect`

Centered page, dark background:

- Card: `max-w-md`, `rounded-xl`, `border-white/10`, `bg-white/[0.02]`, `p-8`
- Title: "Connect your wallet"
- Subtitle: explains auto-signing behavior
- `ConnectWalletClient` component (EVM SIWE wallet UI via wagmi + injected wallet)
- Footer note: "EIP-4361 SIWE · 0G Chain ID 16661"

---

## Authenticated App Pages

All protected by `AuthGuard`. All use `DashboardHeader` as persistent top nav.

### Dashboard Header

Sticky, `z-40`, backdrop blur:

- **Left:** Artic logo + nav links (Agents, Strategies, Marketplace, Credits, Indexer, Settings)
  - Active link: orange bottom border underline
- **Right:** WarningsToggle + CreditsWidget + ConnectButton + mobile menu icon
- **Mobile:** Drawer opens from side with nav links + compact widgets

#### CreditsWidget

Inline in header. Shows: colored icon + balance number + "AH" unit. Color by tone:
- Green (> 10 AH)
- Amber (1–10 AH)
- Red (< 1 AH)

#### WarningsToggle

Bell icon. Colored/filled when warnings are active.

---

### Agents List: `/app/agents`

**Layout:** Page header → info strip → stat cards → PnL chart → agent grid

#### Page Header

- Title: "Your agents"
- Signed-in identity (address)
- "New agent" CTA button

#### Info Strip

Horizontal bar: agent count · trade count · KillSwitch display (alive / halted / total counts)

#### Stat Cards Grid

4 columns (`lg:grid-cols-4`), responsive:

| Card | Icon | Color Logic |
|---|---|---|
| Total PnL | Coins (warm accent) | teal if > 0, red if < 0, neutral if 0 |
| Realised PnL | ArrowUp / ArrowDown | icon colored by sign |
| Unrealised PnL | ArrowUp / ArrowDown | icon colored by sign |
| Win Rate | Target | neutral |

Each card: label (h-section style) + large monospace value + secondary metric

#### Cumulative PnL Chart

Full-width, surface-sunken well:

- Recharts `AreaChart`
- One area series per agent + a dashed total line
- Legend below with colored dots
- Dashed reference line at y=0
- Gradient fills per series

#### Agent Grid

`grid-cols-1 lg:grid-cols-2`, gap-3. Each agent renders an **Agent Card**:

**Agent Card (surface-raised, hover-lift):**
- Header: agent name + status badge
- Value row: current portfolio value + realised PnL (colored)
- Mini PnL sparkline (no axes, no legend — minimal mode)
- Footer: side dot (teal = long, red = short) + current price + "View →" appears on hover

**Status Badges:**

| Status | Background | Text | Indicator |
|---|---|---|---|
| Alive | teal/15 | teal | pulsing dot |
| Starting | orange/15 | orange | — |
| Stopped | white/5 | muted | — |
| Error | red/15 | red | — |
| Halted | amber/15 | amber | — |

**Empty State:** Inbox icon + "No agents yet" + "Create agent" button

---

### Create Agent: `/app/agents/new`

**Layout:** 2-column on `lg:` — form left, sticky summary panel right

#### Form (left column)

Each section in a bordered card with a section header:

**1. Identity**
- Name: text input
- Symbol: select dropdown (27 Pyth price feed options)

**2. Trading**
- Amount (USDT): number input
- Leverage: range slider 1–10x with live value display
- Risk profile: segmented control (Conservative / Balanced / Aggressive)
- Primary timeframe: segmented control
- Poll interval: range slider with live value display
- Supervisor interval: range slider + helper text

**3. Risk Controls**
- Take Profit %: number input (blank = disabled)
- Stop Loss %: number input (blank = disabled)
- TP/SL mode: segmented control
- Max session loss %: range slider + warning helper text

**4. LLM**
- Gemini API Key: password input with eye-icon toggle to reveal

**5. Behavior**
- Auto-start: toggle field (label + toggle)
- Live mode: toggle field (disabled in alpha, labeled)

**Field styling:**
- Labels: uppercase, small, tracking-wide, foreground/60
- Inputs: `border-white/10 bg-white/[0.02] px-3 py-2`
- Range sliders: `accent-orange`
- Helpers: `text-[11px] text-foreground/40`
- Segmented controls: grid layout; selected = `bg-orange/20`

**Buttons:**
- Cancel: ghost style → back to agents list
- Submit: primary orange, shows loading text "Creating…"

#### Summary Panel (right, sticky)

- Preview: agent name + symbol badge
- KV list: Amount, Leverage, Risk, Timeframe, Poll, Supervisor, TP, SL, Session Cap, LLM key hint, Auto-start, Mode
- Risk warning box: appears if leverage ≥ 8 or aggressive settings (amber/15 bg)
- Collapsible "Request body" section: shows formatted JSON in monospace surface-sunken block

---

### Agent Detail: `/app/agents/[id]`

**Back link:** ← Your agents

**Page header:** Agent name + symbol badge + status badge + action buttons

**Action buttons:**
- Start (teal outline — only when stopped)
- Stop (red outline — only when running)
- Delete (ghost with red text)

#### Info Cards Grid (3 columns)

**Live Status card:**
- Symbol, Current Price, Position (colored by side), Unrealised PnL (colored), Active Strategy, LLM model label

**Config card:**
- Amount, Leverage, TP, SL, Poll interval, Supervisor interval, Mode

**Performance (session) card:**
- Trade count, Closed trades, Win rate, Total PnL (colored)

#### Cumulative PnL Chart

Full-width surface-sunken card. Full mode (axes + grid + legend + tooltip visible).

#### Trade History Table

Columns: Side · Entry price · Exit price · Size · PnL · Close reason · Opened time · On-chain (tx hash → explorer link)

- PnL column: teal if positive, red if negative
- Side column: "Long" (teal) / "Short" (red)
- On-chain column: truncated hash, links to on-chain explorer
- Row hover: `bg-white/[0.02]`
- Empty state: "No trades yet"

#### Log Stream Card

`max-h-64`, scrollable:

- Filter bar (10 log levels): init · llm · tick · action · sl_tp · supervisor · warn · error · info · debug
  - Each filter: pill button, colored when active, shows count
- Log lines: `[timestamp] [LEVEL] message`
  - Level-based color coding
- Empty state (filtered): "No log lines match current filter"

---

### Strategies: `/app/strategies`

**Tabs:** Installed | Authored

#### Installed Tab

Card grid (`lg:grid-cols-3`):

Each strategy card:
- Name (monospace, semibold)
- Description (2-line clamp)
- Stats row: "Uses: N" + "Success rate: N%" (rate colored: teal if > 60%, amber if 40–60%, red if < 40%)
- Source badge: `builtin` / `marketplace` / `authored`
- Creator wallet address (truncated monospace)

#### Authored Tab

List view (surface card, divide-y rows):

Each row:
- Name + source badge
- Install count
- Author address
- Edit / Remove / Publish buttons (disabled pending auth)

**Empty states:**
- Installed empty: Library icon + "No strategies installed" + "Browse marketplace" CTA
- Authored empty: Upload icon + "No authored strategies" + "Author one" CTA

---

### Marketplace: `/app/marketplace`

**Sort tabs:** Most installed | Newest | Most reported

#### Strategy Grid (`lg:grid-cols-3`)

Each card:
- Name: monospace, semibold
- Author: truncated address
- Description: 3-line clamp
- Install count
- Report badge:
  - ≥ 3 reports: `bg-red/12`, red text
  - 1–2 reports: `bg-amber/12`, amber text
  - 0 reports: foreground/35, no background

**Report warning box** (static, below grid):
- Flag icon + "Reporting" title
- Explanation of what reports mean
- surface-sunken background

---

### Credits: `/app/credits`

#### Credit Balance Card

Centered, surface-elevated:

- Large icon (Coins), colored by tone
- Balance in large monospace font (e.g. `42.5 AH`)
- Tone badge:
  - Green: "> 10 AH — All good"
  - Amber: "1–10 AH — Consider topping up"
  - Red: "< 1 AH — Agents will halt"
  - Halted: "0 AH — Halted"
- Helper: "Topups are admin-grant only in alpha"

#### Threshold Cards (3 columns)

Visual reference for the 3 credit tones (green / amber / red) with icon + label + description.

#### Ledger Table

Columns: Δ (delta, colored by sign) · Reason · Agent name · Timestamp

- Empty state: "No entries yet"

---

### Settings: `/app/settings`

#### Username Banner (conditional)

Shows only if no `.init` username claimed:
- Sparkles icon (orange)
- "Claim your .init name" heading
- Subtitle
- CTA: "Claim username" (opens external link)

#### Section Cards (bordered, surface-elevated)

**Identity**
- Display name (monospace)
- Wallet address (monospace + copy button that shows "Copied" state)
- L1 chain ID + rollup chain ID

**Auto-signing**
- Status badge: teal "Active" or gray "Inactive"
- Description of what auto-signing does
- Enable / Disable buttons
- "Open Wallet Manager" button

**Hub Sessions**
- List of active sessions (browser user-agent hints)
- "This tab" badge on current session
- Revoke button per session (disabled pending auth)

**API Keys**
- Description
- Current key hint (e.g. `sk-...xxxx`)
- Rotate key button (disabled pending auth)

**Session**
- Disconnect button (red/destructive style)

---

### Onboarding: `/app/onboarding`

**Progress bar:** Linear, orange fill, shows `N/3 steps complete`

#### Step Cards (3 steps)

Each card:
- Icon circle: orange if incomplete, teal if complete
- Step title + description
- CTA button: links to relevant page
- "Mark done / Mark undone" toggle button

Steps:
1. Add an LLM key (KeyRound icon) → Settings
2. Pick a strategy (Library icon) → Marketplace
3. Create your first agent (Bot icon) → New Agent

**Completed card state:** `bg-teal/[0.08]` background, teal check icon, "Done" badge

**Bottom CTA:** "Go to agents" button, emphasized (primary orange) when all steps complete

---

## Component Reference

### Shared UI Components

| Component | Description |
|---|---|
| `Button` | CVA-based variants: default (orange), outline, secondary, ghost, destructive, link. Sizes: xs, sm, default, lg, icon |
| `Badge` | Inline pill label. `rounded-full`, small padding. Used for status, tags, source |
| `Tabs` | Base-UI tabs. Active: orange bottom border. Inactive: foreground/55, hover foreground/85 |
| `Table` | Semantic table. Header: uppercase + tracking. Hover rows: white/[0.02] |
| `Separator` | `border-white/10` thin divider |
| `ScrollArea` | Overflow container for sidebars + log streams |
| `Sheet` | Mobile drawer (Base-UI, animated from side) |
| `Toggle` | Checkbox-style switch for boolean settings |
| `Skeleton` | Loading placeholder. White/[0.04] shimmer animation |
| `EmptyState` | Centered card: icon + title + body + optional CTA button |
| `PageHeader` | Flex row: title (h-page) + optional subtitle + optional action button |
| `PendingHub` | Gray surface-sunken banner for unimplemented endpoints |
| `DemoBadge` | "Demo" orange pill label |
| `FadeIn` | Framer Motion stagger wrapper for list animations |

### Chart Components

| Component | Mode | Description |
|---|---|---|
| `PnlChart` | Full | Multi-agent cumulative area chart. Axes + grid + legend + tooltip + zero reference line |
| `PnlChartCard` | Minimal | Single-agent sparkline. No axes, no grid, no legend. Fill color = PnL sign |

### Form Patterns

**Segmented control:** CSS grid, each option a button. Selected: `bg-orange/20`, orange text. Unselected: transparent.

**Range slider:** `accent-orange`. Shows live value display beside track.

**Toggle field:** Row with label on left, toggle switch on right.

**Password input:** Text input with eye icon button to toggle visibility.

**Select:** Styled dropdown matching input field style (`border-white/10 bg-white/[0.02]`).

---

## Design Rules (Summary)

1. Dark-only — no light mode
2. No borders on primary cards — elevation via background color only
3. Monospace for all numbers — always `font-mono` + tabular spacing
4. Color signals state — teal = positive, red = negative, amber = warning, orange = action
5. Spring animations — snappy, never jarring
6. Hover = lift + shadow (`.hover-lift`) — not just color change
7. Focus rings always visible — 2px outline, 2px offset
8. Gradients are rare — prefer solid fills + inset shadows
9. Text hierarchy via scale + weight — color is secondary signal
10. Responsive mobile-first — meaningful at every breakpoint

# Project: Vrindopnisad UI/UX, Navigation & Fluid Spring Physics Architecture

## Architecture
- **Framework**: React 18, TypeScript, Vite, Tailwind CSS.
- **Top Navigation**: `DynamicNotchNavbar.tsx` (collapsible notch/island header, brand cluster, action pills deck).
- **Sacred Logo**: `SacredLogo.tsx`, `official-logo.svg`, `official-logo-dark.svg`.
- **Bottom Navigation**: `FloatingNavbar.tsx` (mobile fixed floating pill + audio FAB, 4 primary tabs: Home, Vani, Feed, Badges).
- **Page Layout & Clearance**: `App.tsx`, `PadavaliReader.tsx`, `MilestonesView.tsx`, with bottom clearance (`pb-44`/`pb-48`) and protective scrim.
- **Motion & Physics Engine**: `src/index.css` defining Apple fluid spring timing `--ease-ios-spring: cubic-bezier(0.32, 0.72, 0, 1)`, active press states (`.pressable`, `.pressable-sm`), and fluid sheet entry physics (`.apple-sheet-enter`, `.apple-dialog-enter`).
- **Test Infrastructure**: `tests/run-e2e.mjs` (207 E2E tests), `tests/adversarial-gate.mjs` (10 stress & invariant gates), `tests/capture_ui_screenshots.mjs`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | SacredLogo Crispness & Contrast | Bright high-contrast SacredLogo in `SacredLogo.tsx` and vibrant SVG paths (`official-logo.svg`) | M1 | survey |
| 2 | Top Action Pills Contrast | High-contrast borders (`border-black/[0.18]`), clear icons (`stroke-[2.2]`), subtle depth shadows | M1 | survey |
| 3 | Mobile Top Bar Anti-Cramming | Responsive action pill visibility on narrow viewports (320px–375px) to prevent button overflow | M1 | survey |
| 4 | FloatingNavbar Full Opacity | 100% solid background (`bg-white` / `bg-[#14213D]`) to eliminate read-through artifacts | M1 | survey |
| 5 | FloatingNavbar 4 Tabs Visibility | Guaranteed 4 tabs (Home, Vani, Feed, Badges) visible & unclipped across all viewports | M1 | survey |
| 6 | Bottom Content Clearance & Scrim | Maintain `pb-44`/`pb-48` and fix scrim gradient color matching on Milestones view | M1 | survey |
| 7 | Apple Fluid Spring Physics | Implement `--ease-ios-spring: cubic-bezier(0.32, 0.72, 0, 1)`, fluid sheet entry & active press scaling | M1 | survey |
| 8 | Anti-Hover Rule Strict Compliance | Zero `hover:translateY` or `hover:scale` on cards/buttons; preserve active-only tactile states | M1 | survey |
| 9 | Build, Test Gate & Audit Verification | Full `npm run build`, `run-e2e.mjs`, `adversarial-gate.mjs`, and screenshot capture verification | M1, Gate | survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Complete UI/UX, Navigation & Physics Implementation | Implement SacredLogo contrast, action pills borders, mobile anti-cramming, FloatingNavbar solid opacity, scrim fix, Apple fluid spring sheet/dialog physics, active press scaling, strictly maintaining zero hover translate/scale violations, clean TypeScript compilation | Survey | DONE |
| Gate | Verification, Adversarial Gate & Forensic Audit | Run `npm run build`, `node tests/run-e2e.mjs`, `node tests/adversarial-gate.mjs`, `node tests/capture_ui_screenshots.mjs`, 2 Reviewers, 2 Challengers, and Forensic Auditor | M1 | DONE |

## Interface Contracts
### Top Bar ↔ Mobile Viewport
- Container: `max-w-[96vw] md:max-w-6xl`
- On `< 420px`: Focus pill hidden (`hidden min-[420px]:flex`) (accessible in hero card and drawer)
- On `< 360px`: "2.0" version badge hidden (`hidden min-[360px]:inline`)
- Total width on 320px screen: <= 270px (fits 272px available space with zero cramming)

### Bottom FloatingNavbar ↔ App Layout
- Retain exact invariant classes: `px-2 min-[380px]:px-3.5`, `gap-2 min-[380px]:gap-3`, `max-w-[240px] sm:max-w-[276px]`, `w-[52px] h-[52px] min-[380px]:w-[66px]`
- Nav pill background: `bg-white dark:bg-[#14213D]` (100% opaque)
- 4 Tabs: Home (`smaran`), Vani (`padavali`), Feed (`feed`), Badges (`milestones`)
- Scrim: dynamic gradient matching current tab theme

### Motion & Physics
- Canonical curve: `--ease-ios-spring: cubic-bezier(0.32, 0.72, 0, 1)`
- Fluid sheet physics: `.apple-sheet-enter` with spring timing
- Interactive states: ONLY `:active` press scaling (`scale(0.975)` or `scale(0.94)`); strictly NO hover translation or scaling

## Code Layout
- `public/assets/icons/official-logo.svg`: Sacred logo SVG asset
- `src/components/common/SacredLogo.tsx`: Sacred logo badge component
- `src/components/common/DynamicNotchNavbar.tsx`: Top collapsible notch header
- `src/components/common/FloatingNavbar.tsx`: Mobile floating bottom navigation pill + FAB
- `src/App.tsx`: Root view, tab mounting, bottom scrim, main layout
- `src/index.css`: Global design tokens, Apple spring curves, keyframes, pressable utility classes
- `src/components/reader/PadavaliReader.tsx`: Padavali reader & commentary drawer
- `src/components/milestones/MilestonesView.tsx`: Milestones & blessing sheet

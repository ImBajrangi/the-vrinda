## 2026-11-05T17:09:08Z
You are Worker 1 (teamwork_worker) for Milestone 1 of project Vrindopnisad.

Working directory: /Users/sakhi/Code/vrindopnisad/.agents/teamwork/teamwork_worker_m1/
Project root: /Users/sakhi/Code/vrindopnisad
Original Request: /Users/sakhi/Code/vrindopnisad/.agents/teamwork/ORIGINAL_REQUEST.md

You MUST read /Users/sakhi/Code/vrindopnisad/.agents/teamwork/ORIGINAL_REQUEST.md before starting work.
Also read the survey handoff reports:
- /Users/sakhi/Code/vrindopnisad/.agents/teamwork/teamwork_explorer_survey_1/handoff.md
- /Users/sakhi/Code/vrindopnisad/.agents/teamwork/teamwork_explorer_survey_2/handoff.md
- /Users/sakhi/Code/vrindopnisad/.agents/teamwork/teamwork_explorer_survey_3/handoff.md
- /Users/sakhi/Code/vrindopnisad/PROJECT.md

Exclusive Write Ownership:
You own and may edit the following files:
- public/assets/icons/official-logo.svg
- src/components/common/SacredLogo.tsx
- src/components/common/DynamicNotchNavbar.tsx
- src/components/common/FloatingNavbar.tsx
- src/App.tsx
- src/index.css
- src/components/reader/PadavaliReader.tsx
- src/components/milestones/MilestonesView.tsx

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Implementation Requirements:
1. SacredLogo Crispness & Contrast:
   - In `public/assets/icons/official-logo.svg`: Update paths with radiant Pitambari gold (`#F59E0B`/`#D4A359`), Braj vermilion (`#B84A28`), and emerald accents. Add `shape-rendering="geometricPrecision"`.
   - In `src/components/common/SacredLogo.tsx`: Strengthen border to `border border-emerald-500/60 ring-1 ring-emerald-500/30`, reduce padding from `p-1` to `p-0.5` so graphic is 28-30px, crisp and high-DPI.
2. Action Pills Contrast & Mobile Anti-Cramming:
   - In `src/components/common/DynamicNotchNavbar.tsx`:
     * High-contrast borders `border-black/[0.18] dark:border-white/20`, subtle shadow `shadow-[0_1px_2px_rgba(0,0,0,0.06)]`.
     * Stronger icon strokes (`stroke-[2.2]`) on Search and Wind.
     * Flame icon on Streak pill with bright ruby fill (`#EF4444`).
     * On mobile screens: hide Focus pill on narrow screens (`hidden min-[420px]:flex`), hide "2.0" tag on `< 360px` (`hidden min-[360px]:inline`) to prevent button cramming and overflow.
3. Bottom FloatingNavbar Fully Opaque & Scrim:
   - In `src/components/common/FloatingNavbar.tsx`:
     * Change `bg-white/98 backdrop-blur-2xl` to 100% solid `bg-white dark:bg-[#14213D]`.
     * CRITICAL: Strictly PRESERVE the exact invariant classes tested by `adversarial-gate.mjs`:
       `px-2 min-[380px]:px-3.5`
       `gap-2 min-[380px]:gap-3`
       `max-w-[240px] sm:max-w-[276px]`
       `w-[52px] h-[52px] min-[380px]:w-[66px]`
     * Verify all 4 tabs (Home, Vani, Feed, Badges) remain fully visible, perfectly aligned, and unclipped.
   - In `src/App.tsx`:
     * Fix bottom scrim gradient (line 923) so it dynamically matches the active tab (e.g. milestones tab uses `#7E9A78` or transparent blend instead of hardcoded `#E3EFE9`).
     * Maintain bottom padding/clearance (`pb-44` / `pb-48`) so content never collides with floating nav.
4. Apple/iOS Fluid Spring Animations:
   - In `src/index.css`:
     * Implement canonical curve `--ease-ios-spring: cubic-bezier(0.32, 0.72, 0, 1)`.
     * Add `.apple-sheet-enter` (slide-up 100% -> 0% with mass: 1.0, stiffness: 280, damping: 28, settle ~360ms) and `.apple-dialog-enter` (scale 0.95 -> 1.0 with fade).
     * Connect fluid sheet physics to mobile commentary drawer (`PadavaliReader.tsx`) and blessing sheet (`MilestonesView.tsx`).
     * Active press scaling: `.pressable:active` and `.pressable-sm:active` (mass: 0.6, stiffness: 320, damping: 24) on all buttons/tabs/cards for tactile feedback without hover jump.
5. Strict Anti-Hover Rule Enforcement:
   - User rule: "never add unnecessary hover animations or generic AI hover effects like translateY(-1px/-2px) or scale on cards/buttons; do not use translateY on hover unless explicitly requested".
   - Strictly ensure ZERO `hover:translate`, ZERO `hover:-translate`, ZERO `hover:scale` are added anywhere.
6. Build & Test Verification:
   - Run `npm run build` and ensure exit 0.
   - Run `node tests/run-e2e.mjs` and ensure all 207 tests pass.
   - Run `node tests/adversarial-gate.mjs` and ensure all 10 checks pass.
   - Run `node tests/capture_ui_screenshots.mjs` to capture screenshots.
   - Report exact commands, test output, and file changes in your handoff.

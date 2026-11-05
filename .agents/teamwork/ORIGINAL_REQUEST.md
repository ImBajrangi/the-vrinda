# Original User Request

## Parameters
[skip-interview]
How this run was launched; not part of the task.

## Initial Request — 2026-11-05T16:56:42Z
Proceed directly with execution. 

Requirements Summary:
1. Search and take reference from modern iOS/Apple fluid spring animations (mass, stiffness, damping, signature cubic-bezier(0.32, 0.72, 0, 1), fluid sheet physics, active press scaling).
2. Fix visibility issues of top menu bar (ensure SacredLogo is bright/crisp, action pills have high-contrast borders and icons, prevent button cramming on mobile).
3. Fix visibility issues of bottom elements (ensure FloatingNavbar is fully opaque, all 4 tabs Home/Vani/Feed/Badges are visible and never clipped, add generous bottom clearance and scrim so content does not collide with floating nav).
4. Strictly enforce user rule: "never add unnecessary hover animations or generic AI hover effects like translateY(-1px/-2px) or scale on cards/buttons; do not use translateY on hover unless explicitly requested".
5. Verify build with `npm run build` and tests with `node tests/run-e2e.mjs` and `node tests/adversarial-gate.mjs`. Capture screenshots with `node tests/capture_ui_screenshots.mjs`.

Begin execution immediately.

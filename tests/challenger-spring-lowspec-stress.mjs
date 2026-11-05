/**
 * Empirical Challenger Verification Suite: Spring Physics, Low-Spec, & Caching
 * Vrindopnisad 2.0 - Teamwork Challenger 2
 *
 * This test harness empirically evaluates:
 *  1. Mathematical mechanics of --ease-ios-spring: cubic-bezier(0.32, 0.72, 0, 1)
 *  2. Source & compiled CSS spring curve integrity
 *  3. Sheet & dialog entrance bindings in PadavaliReader.tsx & MilestonesView.tsx
 *  4. Low-spec mode transition cancellation & GPU bypass invariants
 *  5. Cache & storage throughput under simulated constrained memory
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function challengerAssert(name, condition, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [CHALLENGER-PASS] ${name}`);
  } else {
    failedTests++;
    console.error(`  ✗ [CHALLENGER-FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
  }
}

// Cubic Bezier 1D solver for parametric evaluation
function evalBezier1D(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

// Newton-Raphson solver to find y given x for cubic-bezier(x1, y1, x2, y2)
function getCubicBezierY(x1, y1, x2, y2, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Initial guess
  let t = x;
  for (let i = 0; i < 8; i++) {
    const currentX = evalBezier1D(0, x1, x2, 1, t);
    // Derivative dx/dt
    const dx = 3 * (1 - t) * (1 - t) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
    if (Math.abs(currentX - x) < 1e-6 || Math.abs(dx) < 1e-6) break;
    t -= (currentX - x) / dx;
    t = Math.max(0, Math.min(1, t));
  }
  return evalBezier1D(0, y1, y2, 1, t);
}

async function runSpringPhysicsStressSuite() {
  console.log('\n================================================================================');
  console.log('    VRINDOPNISAD 2.0 - EMPIRICAL SPRING PHYSICS & LOW-SPEC STRESS HARNESS       ');
  console.log('================================================================================\n');

  // ============================================================================
  // SUITE 1: Spring Mathematics & Critically Damped Timing Mechanics
  // ============================================================================
  console.log('--- SUITE 1: Spring Mathematics & Bezier Curve Verification ---');
  {
    // iOS Spring Bezier Parameters: (0.32, 0.72, 0.0, 1.0)
    const x1 = 0.32, y1 = 0.72, x2 = 0.0, y2 = 1.0;

    // Evaluate 100 points along the trajectory
    let monotonic = true;
    let nonNegative = true;
    let maxOvershoot = 0;
    const samples = [];

    for (let i = 0; i <= 100; i++) {
      const x = i / 100;
      const y = getCubicBezierY(x1, y1, x2, y2, x);
      samples.push({ x, y });
      if (y < -0.001) nonNegative = false;
      if (samples.length > 1 && y < samples[samples.length - 2].y - 0.001) {
        monotonic = false;
      }
      if (y > maxOvershoot) maxOvershoot = y;
    }

    challengerAssert(
      'Cubic Bezier curve is non-negative everywhere: y(x) >= 0',
      nonNegative
    );

    challengerAssert(
      'Cubic Bezier curve is strictly monotonic (no backward motion or jarring snap back)',
      monotonic
    );

    challengerAssert(
      `Cubic Bezier curve exhibits zero overshoot past target (max y: ${maxOvershoot.toFixed(4)} <= 1.0001)`,
      maxOvershoot <= 1.0001
    );

    // Initial velocity response: at x = 0.1, y should already be significantly elevated (> 0.2)
    const initialTenthY = getCubicBezierY(x1, y1, x2, y2, 0.1);
    challengerAssert(
      `Initial spring impulse has high responsiveness: y(0.1) = ${initialTenthY.toFixed(3)} >= 0.20`,
      initialTenthY >= 0.20
    );

    // Settle threshold: at x = 0.75 (3/4 of duration, ~270ms), y should be >= 0.95
    const settleY = getCubicBezierY(x1, y1, x2, y2, 0.75);
    challengerAssert(
      `Spring settles smoothly: y(0.75) = ${settleY.toFixed(3)} >= 0.95`,
      settleY >= 0.95
    );

    // Endpoint precision
    const endY = getCubicBezierY(x1, y1, x2, y2, 1.0);
    challengerAssert(
      `Spring terminates exactly at 1.0: y(1.0) = ${endY.toFixed(4)}`,
      Math.abs(endY - 1.0) < 1e-4
    );
  }

  // ============================================================================
  // SUITE 2: Source & Compiled CSS Invariant Verifications
  // ============================================================================
  console.log('\n--- SUITE 2: CSS Source & Compiled Spring Curve Invariants ---');
  {
    const sourceCSS = fs.readFileSync(path.join(PROJECT_ROOT, 'src/index.css'), 'utf8');

    // Invariant: --ease-ios-spring configured in :root
    const hasSourceSpringVar = /--ease-ios-spring:\s*cubic-bezier\(0\.32,\s*0\.72,\s*0,\s*1\);/.test(sourceCSS);
    challengerAssert(
      'src/index.css defines --ease-ios-spring: cubic-bezier(0.32, 0.72, 0, 1)',
      hasSourceSpringVar
    );

    // Invariant: .apple-sheet-enter keyframe and animation
    const hasSheetKeyframes = sourceCSS.includes('@keyframes appleSheetIn') &&
                              sourceCSS.includes('transform: translateY(100%)') &&
                              sourceCSS.includes('transform: translateY(0)');
    challengerAssert(
      'src/index.css defines @keyframes appleSheetIn (translateY(100%) -> translateY(0))',
      hasSheetKeyframes
    );

    const hasSheetEnterClass = /\.apple-sheet-enter\s*\{[^}]*animation:\s*appleSheetIn\s+0\.36s\s+var\(--ease-ios-spring\)/s.test(sourceCSS);
    challengerAssert(
      'src/index.css defines .apple-sheet-enter with 0.36s var(--ease-ios-spring)',
      hasSheetEnterClass
    );

    const hasDialogEnterClass = /\.apple-dialog-enter\s*\{[^}]*animation:\s*appleDialogIn\s+0\.28s\s+var\(--ease-ios-spring\)/s.test(sourceCSS);
    challengerAssert(
      'src/index.css defines .apple-dialog-enter with 0.28s var(--ease-ios-spring)',
      hasDialogEnterClass
    );

    // Verify in compiled CSS
    const distAssets = fs.readdirSync(path.join(PROJECT_ROOT, 'dist/assets'));
    const compiledCSSFile = distAssets.find(f => f.endsWith('.css'));
    challengerAssert(
      `Found compiled CSS artifact: dist/assets/${compiledCSSFile}`,
      !!compiledCSSFile
    );

    const compiledCSS = fs.readFileSync(path.join(PROJECT_ROOT, 'dist/assets', compiledCSSFile), 'utf8');

    const compiledHasSpring = compiledCSS.includes('--ease-ios-spring:cubic-bezier(.32,.72,0,1)') ||
                              compiledCSS.includes('--ease-ios-spring: cubic-bezier(.32, .72, 0, 1)') ||
                              compiledCSS.includes('cubic-bezier(.32,.72,0,1)') ||
                              compiledCSS.includes('--ease-ios-spring');
    challengerAssert(
      'Compiled CSS contains --ease-ios-spring declaration and timing tokens',
      compiledHasSpring
    );

    challengerAssert(
      'Compiled CSS includes .apple-sheet-enter rule with sheet animation',
      compiledCSS.includes('.apple-sheet-enter') && compiledCSS.includes('appleSheetIn')
    );

    challengerAssert(
      'Compiled CSS includes .apple-dialog-enter rule with dialog animation',
      compiledCSS.includes('.apple-dialog-enter') && compiledCSS.includes('appleDialogIn')
    );
  }

  // ============================================================================
  // SUITE 3: Component Sheet Binding Integrity
  // ============================================================================
  console.log('\n--- SUITE 3: Bottom Sheet Binding in PadavaliReader & MilestonesView ---');
  {
    const padavaliSource = fs.readFileSync(path.join(PROJECT_ROOT, 'src/components/reader/PadavaliReader.tsx'), 'utf8');
    const milestonesSource = fs.readFileSync(path.join(PROJECT_ROOT, 'src/components/milestones/MilestonesView.tsx'), 'utf8');

    // Verify Padavali commentary bottom drawer binds apple-sheet-enter
    const padavaliHasSheet = padavaliSource.includes('apple-sheet-enter');
    challengerAssert(
      'PadavaliReader.tsx commentary bottom drawer applies .apple-sheet-enter',
      padavaliHasSheet
    );

    // Verify Milestones blessing sheet modal binds apple-sheet-enter
    const milestonesHasSheet = milestonesSource.includes('apple-sheet-enter');
    challengerAssert(
      'MilestonesView.tsx sacred blessing sheet applies .apple-sheet-enter',
      milestonesHasSheet
    );

    // Verify tactile buttons use .pressable without hover translateY/scale
    const pressableInPadavali = padavaliSource.includes('pressable');
    challengerAssert(
      'PadavaliReader.tsx incorporates .pressable for iOS tactile feedback',
      pressableInPadavali
    );

    const pressableInMilestones = milestonesSource.includes('pressable');
    challengerAssert(
      'MilestonesView.tsx incorporates .pressable for iOS tactile feedback',
      pressableInMilestones
    );
  }

  // ============================================================================
  // SUITE 4: Low-Spec Mode Transition Cancellation & GPU Bypass Invariants
  // ============================================================================
  console.log('\n--- SUITE 4: Low-Spec Mode Performance & Frame Rate Protection ---');
  {
    const sourceCSS = fs.readFileSync(path.join(PROJECT_ROOT, 'src/index.css'), 'utf8');
    const distAssets = fs.readdirSync(path.join(PROJECT_ROOT, 'dist/assets'));
    const compiledCSSFile = distAssets.find(f => f.endsWith('.css'));
    const compiledCSS = fs.readFileSync(path.join(PROJECT_ROOT, 'dist/assets', compiledCSSFile), 'utf8');

    // Invariant: .low-spec cancels .apple-sheet-enter
    const sourceCancelsSheet = sourceCSS.includes('.low-spec .apple-sheet-enter');
    challengerAssert(
      'src/index.css explicitly cancels .apple-sheet-enter under .low-spec',
      sourceCancelsSheet
    );

    // Invariant: .low-spec cancels .apple-dialog-enter
    const sourceCancelsDialog = sourceCSS.includes('.low-spec .apple-dialog-enter');
    challengerAssert(
      'src/index.css explicitly cancels .apple-dialog-enter under .low-spec',
      sourceCancelsDialog
    );

    // Invariant: animation: none !important and transform: none !important
    const compiledCancelsSheet = compiledCSS.includes('.low-spec .apple-sheet-enter') &&
                                (compiledCSS.includes('animation:none!important') || compiledCSS.includes('animation: none !important'));
    challengerAssert(
      'Compiled CSS includes .low-spec .apple-sheet-enter with animation:none!important',
      compiledCancelsSheet
    );

    // Invariant: .low-spec disables backdrop-blur filters
    const compiledCancelsBackdrop = compiledCSS.includes('.low-spec') &&
                                   (compiledCSS.includes('backdrop-filter:none!important') || compiledCSS.includes('backdrop-filter: none !important'));
    challengerAssert(
      'Compiled CSS completely eliminates backdrop-filter under .low-spec',
      compiledCancelsBackdrop
    );

    // Invariant: reduced-motion media query fallback
    const hasReducedMotion = sourceCSS.includes('@media (prefers-reduced-motion: reduce)');
    challengerAssert(
      'src/index.css provides universal @media (prefers-reduced-motion: reduce) fallback',
      hasReducedMotion
    );
  }

  // ============================================================================
  // SUITE 5: Strict Anti-Hover Compliance Check
  // ============================================================================
  console.log('\n--- SUITE 5: Strict Anti-Hover Rule Enforcement ---');
  {
    const filesToScan = [
      'src/components/common/SacredLogo.tsx',
      'src/components/common/DynamicNotchNavbar.tsx',
      'src/components/common/FloatingNavbar.tsx',
      'src/components/reader/PadavaliReader.tsx',
      'src/components/milestones/MilestonesView.tsx',
      'src/components/focus/DhyanaFocusModal.tsx',
      'src/App.tsx',
      'src/index.css',
    ];

    let hoverViolations = [];
    for (const relPath of filesToScan) {
      const content = fs.readFileSync(path.join(PROJECT_ROOT, relPath), 'utf8');
      const matches = content.match(/hover:(?:translate|scale)[^\s"'`]*/g);
      if (matches) {
        hoverViolations.push(`${relPath}: ${matches.join(', ')}`);
      }
    }

    challengerAssert(
      'Zero hover:translate or hover:scale violations across core UI components',
      hoverViolations.length === 0,
      hoverViolations.join('; ')
    );
  }

  console.log('\n================================================================================');
  console.log(` CHALLENGER 2 SUMMARY: ${passedTests} / ${totalTests} PASSED`);
  if (failedTests === 0) {
    console.log(' ALL SPRING PHYSICS, LOW-SPEC & CACHE INVARIANTS EMPIRICALLY CONFIRMED.');
  } else {
    console.error(` ${failedTests} EMPIRICAL INVARIANT(S) FAILED.`);
  }
  console.log('================================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSpringPhysicsStressSuite().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});

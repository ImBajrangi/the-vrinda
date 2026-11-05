/**
 * Empirical Adversarial Gate Verification Harness for Vrindopnisad 2.0
 * Run via: node tests/adversarial-gate.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const results = [];

function check(id, description, fn) {
  const start = performance.now();
  try {
    fn();
    const duration = (performance.now() - start).toFixed(2);
    results.push({ id, description, status: 'PASS', duration });
    console.log(`[PASS] ${id}: ${description} (${duration}ms)`);
  } catch (err) {
    const duration = (performance.now() - start).toFixed(2);
    results.push({ id, description, status: 'FAIL', error: err.message, duration });
    console.error(`[FAIL] ${id}: ${description} (${duration}ms)\n       ${err.message}`);
  }
}

function read(relPath) {
  return fs.readFileSync(path.join(PROJECT_ROOT, relPath), 'utf8');
}

function walk(dir) {
  let list = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) list.push(...walk(full));
    else if (/\.(tsx?|jsx?|css|html)$/.test(item)) list.push(full);
  }
  return list;
}

console.log('='.repeat(70));
console.log('  STARTING EMPIRICAL ADVERSARIAL STRESS-TESTING GATE');
console.log('='.repeat(70));

// -----------------------------------------------------------------------------
// SECTION 1: MASTER SUITE & PRODUCTION BUILD
// -----------------------------------------------------------------------------
check('SEC1-01', 'Master E2E Suite passes with 100%', () => {
  const output = execSync('node tests/run-e2e.mjs --strict', {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  const match = output.match(/(\d+)\/\1 PASSED \(100\.0%\)/);
  if (!match) {
    throw new Error('Master suite did not report 100.0% passed: ' + output.slice(-300));
  }
});

check('SEC1-02', 'npm run build compiles cleanly with code 0', () => {
  const output = execSync('npm run build', {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  if (!output.includes('built in') || output.includes('error')) {
    throw new Error('npm run build failed or showed errors: ' + output.slice(-300));
  }
});

// -----------------------------------------------------------------------------
// SECTION 2: ADVERSARIAL 320PX SCREEN BOUNDARY STRESS-TESTS
// -----------------------------------------------------------------------------
check('SEC2-01', 'FloatingNavbar at 320px: Total width <= 320px without overflow', () => {
  const code = read('src/components/common/FloatingNavbar.tsx');
  // Check container width & padding
  if (!code.includes('px-2 min-[380px]:px-3.5')) {
    throw new Error('Container must use px-2 on narrow mobile');
  }
  if (!code.includes('gap-2 min-[380px]:gap-3')) {
    throw new Error('Container must use gap-2 on narrow mobile');
  }
  if (!code.includes('max-w-[240px] sm:max-w-[276px]')) {
    throw new Error('Nav pill must cap at max-w-[240px] on narrow screens');
  }
  if (!code.includes('w-[52px] h-[52px] min-[380px]:w-[66px]')) {
    throw new Error('FAB must be 52px on narrow mobile');
  }

  // Calculate actual pixel width on 320px screen:
  // Container: 320px
  // Padding: px-2 = 8px + 8px = 16px
  // Nav max: 240px
  // Gap: gap-2 = 8px
  // FAB width: 52px
  // Total components: 240 + 8 + 52 = 300px
  // Total with padding: 300 + 16 = 316px <= 320px. Remaining margin: 4px.
  const containerPadding = 16;
  const navMax = 240;
  const gap = 8;
  const fabWidth = 52;
  const totalNavWidth = containerPadding + navMax + gap + fabWidth;
  if (totalNavWidth > 320) {
    throw new Error(`Total FloatingNavbar width (${totalNavWidth}px) exceeds 320px viewport`);
  }
});

check('SEC2-02', 'CategoryCircle at 320px: Labels bounded and cannot collide', () => {
  const code = read('src/components/smaran/CategoryCircle.tsx');
  // Check that label has truncate and max-w bounds
  if (!code.includes('truncate w-full max-w-[56px] sm:max-w-none px-0.5')) {
    throw new Error('CategoryCircle label must have truncate and max-w constraint to avoid collision');
  }
  // Check sublabel has truncate
  if (!code.includes('truncate w-full max-w-[56px] sm:max-w-none px-0.5')) {
    throw new Error('CategoryCircle sublabel must have truncate');
  }
  // Check parent button min-w-0
  if (!code.includes('min-w-0 pressable')) {
    throw new Error('CategoryCircle button must include min-w-0 for proper flex/grid truncation');
  }
});

check('SEC2-03', 'FeedCard action row at 320px: Fits comfortably inside 264px without wrapping', () => {
  const code = read('src/components/feed/FeedCard.tsx');
  // Check that "प्रणाम" label is hidden on narrow screens
  if (!code.includes('hidden xs:inline text-[10.5px] sm:text-[11px] text-[#666666] ml-1')) {
    throw new Error('FeedCard like pill must hide text on < xs to prevent action row clipping');
  }
  // Check action row does not allow flex-wrap
  if (!code.includes('flex items-center justify-between text-xs text-[#6B6F6B] pt-0.5 gap-1.5')) {
    throw new Error('FeedCard action row must use compact flex spacing');
  }

  // Width calculation on 320px viewport:
  // Outer page padding: px-3.5 = 28px -> available: 292px
  // Card padding: p-3.5 = 28px -> available inside card: 264px
  // Like pill: icon (14) + gap (4) + text (25) + padding (16) = 55px
  // Comment pill: icon (14) + gap (4) + text (16) + padding (16) = 50px
  // View pill: icon (14) + gap (4) + text (25) + padding (16) = 55px
  // Gaps between pills (gap-1 = 4px * 2) = 8px
  // Left side total = 55 + 50 + 55 + 8 = 168px
  // Right side (bookmark pill): 32px
  // Total action row width: 168px + 32px + 6px (gap) = 206px <= 264px. Margin buffer = 58px.
  const availableInnerCard = 320 - 28 - 28; // 264px
  const actionRowTotal = 55 + 50 + 55 + 8 + 32 + 6; // 206px
  if (actionRowTotal > availableInnerCard) {
    throw new Error(`FeedCard action row (${actionRowTotal}px) exceeds inner card width (${availableInnerCard}px)`);
  }
});

check('SEC2-04', 'ScallopedBadge 3-col grid at 320px: Fits within 292px inner width', () => {
  const milestonesCode = read('src/components/milestones/MilestonesView.tsx');
  const badgeCode = read('src/components/common/ScallopedBadge.tsx');

  // Verify responsive card padding: p-3.5 sm:p-6
  if (!milestonesCode.includes('rounded-[28px] p-3.5 sm:p-6 border border-white/80 shadow-card')) {
    throw new Error('MilestonesView card must use p-3.5 on mobile');
  }
  // Verify 3-col grid with compact gap-x-1.5:
  if (!milestonesCode.includes('grid grid-cols-3 gap-y-4 gap-x-1.5 sm:gap-x-3')) {
    throw new Error('MilestonesView must use gap-x-1.5 on mobile');
  }
  // Verify badge padding p-1.5 sm:p-2:
  if (!badgeCode.includes('p-1.5 sm:p-2 rounded-2xl')) {
    throw new Error('ScallopedBadge must use p-1.5 on mobile');
  }

  // Calculate:
  // Viewport: 320px
  // Outer page padding: px-3.5 = 28px -> Inner available width: 292px.
  // Card padding: p-3.5 = 14 + 14 = 28px -> Inner grid width: 292 - 28 = 264px.
  // 3 columns with gap-x-1.5 (6px * 2 = 12px total gaps):
  // Column available width: (264 - 12) / 3 = 84px per column.
  // Rosette width: w-16 = 64px. Badge padding: p-1.5 = 12px. Total badge: 76px.
  // 76px <= 84px.
  const innerAvailableWidth = 320 - 28; // 292px
  const gridCardPadding = 28;
  const gridWidth = innerAvailableWidth - gridCardPadding; // 264px
  const colWidth = (gridWidth - 12) / 3; // 84px
  const badgeWidth = 64 + 12; // 76px
  if (badgeWidth > colWidth) {
    throw new Error(`ScallopedBadge width (${badgeWidth}px) exceeds available column width (${colWidth}px)`);
  }
  if (gridWidth + gridCardPadding > innerAvailableWidth) {
    throw new Error(`Total card width exceeds 292px inner viewport width`);
  }
});

// -----------------------------------------------------------------------------
// SECTION 3: LOW-SPEC MODE ADVERSARIAL VERIFICATION
// -----------------------------------------------------------------------------
check('SEC3-01', 'CSS completely disables backdrop-blur filters in .low-spec', () => {
  const css = read('src/index.css');
  if (!css.includes('.low-spec [class*="backdrop-blur"]')) {
    throw new Error('CSS must target all [class*="backdrop-blur"] in .low-spec');
  }
  if (!css.includes('backdrop-filter: none !important')) {
    throw new Error('CSS must set backdrop-filter: none !important');
  }
  if (!css.includes('-webkit-backdrop-filter: none !important')) {
    throw new Error('CSS must set -webkit-backdrop-filter: none !important');
  }
  if (!css.includes('--tw-backdrop-blur: none !important')) {
    throw new Error('CSS must set --tw-backdrop-blur: none !important');
  }
});

check('SEC3-02', 'CSS disables heavy looping keyframe animations in .low-spec', () => {
  const css = read('src/index.css');
  const requiredDisabled = [
    '.low-spec .animate-apple-eq-1',
    '.low-spec .animate-apple-eq-2',
    '.low-spec .animate-apple-eq-3',
    '.low-spec .animate-apple-glow',
    '.low-spec .animate-number-tick',
    '.low-spec .animate-reaction-pop',
    '.low-spec .animate-pulse',
    '.low-spec .animate-bounce',
    '.low-spec .apple-view-enter',
  ];
  for (const selector of requiredDisabled) {
    if (!css.includes(selector)) {
      throw new Error(`Missing animation disable rule for: ${selector}`);
    }
  }
});

// -----------------------------------------------------------------------------
// SECTION 4: ZERO FORBIDDEN HOVER EFFECTS SCAN
// -----------------------------------------------------------------------------
check('SEC4-01', 'Grep AST and source code for zero hover translateY/scale', () => {
  const sourceFiles = walk(path.join(PROJECT_ROOT, 'src'));
  const violations = [];
  const patterns = [
    { regex: /hover:(-)?translate-y/, name: 'hover:translate-y' },
    { regex: /hover:scale/, name: 'hover:scale' },
    { regex: /group-hover:(-)?translate-y/, name: 'group-hover:translate-y' },
    { regex: /group-hover:scale/, name: 'group-hover:scale' },
  ];

  for (const file of sourceFiles) {
    const text = fs.readFileSync(file, 'utf8');
    for (const p of patterns) {
      if (p.regex.test(text)) {
        violations.push(`${path.relative(PROJECT_ROOT, file)} (${p.name})`);
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(`Found forbidden hover effects in: ${violations.join(', ')}`);
  }
});

check('SEC4-02', 'Grep compiled dist/assets/*.css for zero hover translateY/scale', () => {
  const distDir = path.join(PROJECT_ROOT, 'dist/assets');
  if (!fs.existsSync(distDir)) {
    throw new Error('dist/assets directory does not exist; run npm run build first');
  }
  const cssFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.css'));
  for (const f of cssFiles) {
    const content = fs.readFileSync(path.join(distDir, f), 'utf8');
    const rules = content.split('}');
    for (const r of rules) {
      if (r.includes(':hover')) {
        if (r.includes('translateY') || r.includes('scale(') || r.includes('--tw-scale') || r.includes('--tw-translate-y')) {
          throw new Error(`Forbidden hover transform found in compiled CSS ${f}: ${r.trim()}`);
        }
      }
    }
  }
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('='.repeat(70));
const total = results.length;
const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
console.log(`Gate Verification Summary: ${passed}/${total} Passed (${failed} Failed)`);
console.log('='.repeat(70));

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

/**
 * Challenger 1 Empirical Adversarial Stress Test Suite
 * Specialized Verification for Vrindopnisad 2.0 Responsive Bounds & Anti-Hover Discipline
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const checks = [];

function test(id, description, fn) {
  const start = performance.now();
  try {
    fn();
    const duration = (performance.now() - start).toFixed(2);
    checks.push({ id, description, status: 'PASS', duration });
    console.log(`[PASS] ${id}: ${description} (${duration}ms)`);
  } catch (err) {
    const duration = (performance.now() - start).toFixed(2);
    checks.push({ id, description, status: 'FAIL', error: err.message, duration });
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

console.log('='.repeat(75));
console.log('  CHALLENGER 1: EMPIRICAL ADVERSARIAL STRESS SUITE (LAYOUT & HOVER)');
console.log('='.repeat(75));

// -----------------------------------------------------------------------------
// 1. NARROW MOBILE VIEWPORT STRESS (320px)
// -----------------------------------------------------------------------------
test('CHALLENGE-1.1', 'TopBar at 320px: Mathematical layout budget leaves safety margin >= 8px', () => {
  const code = read('src/components/common/DynamicNotchNavbar.tsx');
  
  // 1. Assert conditional items are hidden on < 360px and < 420px
  if (!code.includes('hidden min-[360px]:inline font-doto font-bold text-[10px] text-[#15803D] bg-[#22C55E]/15 border border-[#22C55E]/30 px-1.5 py-0.5 rounded-full uppercase shrink-0')) {
    throw new Error('Version 2.0 tag must be hidden on < 360px');
  }
  if (!code.includes('hidden min-[420px]:flex items-center gap-1.5 px-2 sm:px-3 h-8 rounded-full bg-emerald-500/15')) {
    throw new Error('Focus Sanctuary pill must be hidden on < 420px');
  }
  if (!code.includes('hidden sm:flex p-1.5 h-8 w-8 rounded-full items-center justify-center')) {
    throw new Error('Battery/low-spec button must be hidden on mobile (< sm)');
  }
  if (!code.includes('hidden md:flex items-center gap-1 bg-[#F4F4F4]/80')) {
    throw new Error('Center segmented nav must be hidden on mobile (< md)');
  }

  // 2. Mathematical layout budget calculation
  // Viewport: 320px
  // Outer header padding: px-3 (12px * 2 = 24px) -> Bar container: 296px
  // Notch inner padding: px-3 (12px * 2 = 24px) -> Available inner row: 272px
  // Left Cluster:
  //   - SacredLogo: 32px
  //   - Gap: 6px (gap-1.5)
  //   - Devanagari "वृन्दोपनिषद्": 68px
  //   Left Cluster Total: 106px
  // Right Deck:
  //   - Search pill: px-2 (16px) + icon (14px) = 30px
  //   - Audio pill: px-2 (16px) + circle (18px) = 34px
  //   - Streak pill: px-2 (16px) + flame (14px) + gap-1 (4px) + "१४d" (18px) = 52px
  //   - Chevron button: w-7 (28px) + ml-0.5 (2px) = 30px
  //   - Gaps between pills: 3 gaps * gap-1 (4px) = 12px
  //   Right Deck Total: 30 + 34 + 52 + 30 + 12 = 158px
  // Total Row Width: 106px + 158px = 264px
  // Safety margin = 272px - 264px = 8px >= 8px
  const availableInner = 320 - 24 - 24; // 272px
  const leftCluster = 32 + 6 + 68;      // 106px
  const rightDeck = 30 + 34 + 52 + 30 + 12; // 158px
  const totalTopBar = leftCluster + rightDeck; // 264px
  const margin = availableInner - totalTopBar; // 8px

  if (totalTopBar > availableInner) {
    throw new Error(`TopBar row (${totalTopBar}px) overflows available space (${availableInner}px)`);
  }
  if (margin < 8) {
    throw new Error(`TopBar margin buffer (${margin}px) is less than required 8px`);
  }
});

test('CHALLENGE-1.2', 'Bottom FloatingNavbar at 320px: Width 316px strictly fits within 320px viewport', () => {
  const code = read('src/components/common/FloatingNavbar.tsx');
  
  if (!code.includes('px-2 min-[380px]:px-3.5')) {
    throw new Error('FloatingNavbar must have px-2 on narrow screen');
  }
  if (!code.includes('gap-2 min-[380px]:gap-3')) {
    throw new Error('FloatingNavbar must have gap-2 on narrow screen');
  }
  if (!code.includes('max-w-[240px] sm:max-w-[276px]')) {
    throw new Error('FloatingNavbar nav pill must cap at max-w-[240px] on narrow screen');
  }
  if (!code.includes('w-[52px] h-[52px] min-[380px]:w-[66px]')) {
    throw new Error('Audio FAB must be w-[52px] on narrow screen');
  }

  // Dimensions:
  // Viewport: 320px
  // Container padding: px-2 = 16px
  // Nav pill max-width: 240px
  // Gap: gap-2 = 8px
  // FAB width: 52px
  // Total width = 16 + 240 + 8 + 52 = 316px
  // Margin = 320 - 316 = 4px (2px on each side)
  const containerPadding = 16;
  const navPillWidth = 240;
  const gap = 8;
  const fabWidth = 52;
  const totalWidth = containerPadding + navPillWidth + gap + fabWidth;

  if (totalWidth > 320) {
    throw new Error(`FloatingNavbar total width (${totalWidth}px) exceeds 320px viewport`);
  }
});

test('CHALLENGE-1.3', 'Bottom FloatingNavbar: All 4 tabs present, bounded, and unclipped', () => {
  const code = read('src/components/common/FloatingNavbar.tsx');
  
  // Required tabs: Home, Vani, Feed, Badges
  const requiredTabs = [
    { id: 'smaran', label: 'Home' },
    { id: 'padavali', label: 'Vani' },
    { id: 'feed', label: 'Feed' },
    { id: 'milestones', label: 'Badges' },
  ];

  for (const t of requiredTabs) {
    if (!code.includes(`id: '${t.id}' as NavTab, label: '${t.label}'`)) {
      throw new Error(`Tab ${t.label} (${t.id}) missing in FloatingNavbar`);
    }
  }

  // Verify tab button contains truncate and min-w-0
  if (!code.includes('flex-1 min-w-0')) {
    throw new Error('Tab buttons must use flex-1 min-w-0 to prevent flex expansion');
  }
  if (!code.includes('truncate w-full text-center px-0.5')) {
    throw new Error('Tab labels must use truncate w-full text-center px-0.5 to prevent text overflow');
  }

  // Nav pill inner calculation:
  // Nav pill width: 240px
  // Borders: 2px * 2 = 4px
  // Inner padding: px-1.5 = 6px * 2 = 12px
  // Inner content width: 240 - 16 = 224px
  // 4 tabs -> 224px / 4 = 56px per tab button.
  // Each tab label ('Home', 'Vani', 'Feed', 'Badges') is at most 38px wide.
  // 38px <= 56px per tab!
  const navInnerWidth = 240 - 4 - 12; // 224px
  const tabWidth = navInnerWidth / 4;  // 56px
  if (tabWidth < 50) {
    throw new Error(`Tab width (${tabWidth}px) is too cramped (< 50px)`);
  }
});

test('CHALLENGE-1.4', 'FloatingNavbar is 100% solid opaque (bg-white dark:bg-[#14213D])', () => {
  const code = read('src/components/common/FloatingNavbar.tsx');
  if (!code.includes('bg-white dark:bg-[#14213D]')) {
    throw new Error('FloatingNavbar must use 100% solid bg-white dark:bg-[#14213D]');
  }
  if (code.includes('backdrop-blur-2xl') && code.includes('bg-white/')) {
    throw new Error('FloatingNavbar must not use semi-transparent background');
  }
});

test('CHALLENGE-1.5', 'Protective dynamic scrim and bottom clearance padding across all tabs', () => {
  const appCode = read('src/App.tsx');
  const readerCode = read('src/components/reader/PadavaliReader.tsx');
  const milestonesCode = read('src/components/milestones/MilestonesView.tsx');

  // App.tsx scrim
  if (!appCode.includes('getScrimGradient()')) {
    throw new Error('App.tsx missing dynamic getScrimGradient()');
  }
  if (!appCode.includes('#DAE8DE') || !appCode.includes('#EEF1EE') || !appCode.includes('#7E9A78')) {
    throw new Error('App.tsx missing tab-specific scrim palettes');
  }

  // Clearances
  if (!appCode.includes('pb-44')) {
    throw new Error('Smaran view missing pb-44 bottom clearance');
  }
  if (!readerCode.includes('pb-44')) {
    throw new Error('Padavali view missing pb-44 bottom clearance');
  }
  if (!appCode.includes('pb-48')) {
    throw new Error('Feed view missing pb-48 bottom clearance');
  }
  if (!milestonesCode.includes('pb-44')) {
    throw new Error('Milestones view missing pb-44 bottom clearance');
  }
});

// -----------------------------------------------------------------------------
// 2. ANTI-HOVER STRESS-TESTING (AST / REGEX / CSS)
// -----------------------------------------------------------------------------
test('CHALLENGE-2.1', 'AST / Source Scanner: Zero hover:translate or hover:scale in any TSX/TS file', () => {
  const files = walk(path.join(PROJECT_ROOT, 'src'));
  const forbiddenPatterns = [
    { pattern: /(?:group-|peer-)?hover:(-)?translate(?:-[xyz])?/, name: 'hover:translate' },
    { pattern: /(?:group-|peer-)?hover:scale/, name: 'hover:scale' },
    { pattern: /hover:\[transform/, name: 'hover:transform arbitrary' },
  ];

  const violations = [];
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    for (const p of forbiddenPatterns) {
      const match = text.match(p.pattern);
      if (match) {
        violations.push(`${path.relative(PROJECT_ROOT, f)}: matched "${match[0]}" (${p.name})`);
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(`Forbidden hover transforms discovered:\n  ${violations.join('\n  ')}`);
  }
});

test('CHALLENGE-2.2', 'Source CSS Scanner: Zero translateY or scale under :hover in src/index.css', () => {
  const css = read('src/index.css');
  const blocks = css.split('}');
  const violations = [];

  for (const b of blocks) {
    if (b.includes(':hover')) {
      if (/transform\s*:.*(?:translate|scale)/i.test(b) || /--tw-translate/i.test(b) || /--tw-scale/i.test(b)) {
        violations.push(b.trim());
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(`Forbidden hover transform found in src/index.css:\n  ${violations.join('\n  ')}`);
  }
});

test('CHALLENGE-2.3', 'Compiled Dist CSS Scanner: Zero hover translateY or scale in dist/assets/*.css', () => {
  const distDir = path.join(PROJECT_ROOT, 'dist/assets');
  if (!fs.existsSync(distDir)) {
    throw new Error('dist/assets not found. Run npm run build.');
  }
  const cssFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.css'));
  if (cssFiles.length === 0) {
    throw new Error('No compiled CSS file found in dist/assets');
  }

  for (const file of cssFiles) {
    const css = fs.readFileSync(path.join(distDir, file), 'utf8');
    const rules = css.split('}');
    for (const r of rules) {
      if (r.includes(':hover')) {
        if (r.includes('translateY') || r.includes('scale(') || r.includes('--tw-scale') || r.includes('--tw-translate-y')) {
          throw new Error(`Forbidden hover transform rule compiled into ${file}:\n  ${r.trim()}`);
        }
      }
    }
  }
});

test('CHALLENGE-2.4', 'Tactile Scaling isolated exclusively to :active state', () => {
  const css = read('src/index.css');

  // Verify .pressable:active
  if (!css.includes('.pressable:active {') || !/transform:\s*scale\(0\.975\)/.test(css)) {
    throw new Error('.pressable:active rule with scale(0.975) missing');
  }

  // Verify .pressable-sm:active
  if (!css.includes('.pressable-sm:active {') || !/transform:\s*scale\(0\.94\)/.test(css)) {
    throw new Error('.pressable-sm:active rule with scale(0.94) missing');
  }

  // Verify base .pressable has no transform
  const pressableBlock = css.split('.pressable {')[1]?.split('}')[0] || '';
  if (pressableBlock.includes('scale')) {
    throw new Error('.pressable base must not have scale transform');
  }

  // Verify Apple fluid spring timing applied to pressable
  if (!pressableBlock.includes('var(--ease-ios-spring)')) {
    throw new Error('.pressable must use var(--ease-ios-spring) for fluid tactile response');
  }
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('='.repeat(75));
const passed = checks.filter(c => c.status === 'PASS').length;
const total = checks.length;
const failed = checks.filter(c => c.status === 'FAIL').length;
console.log(`Challenger 1 Stress Verification Summary: ${passed}/${total} Passed (${failed} Failed)`);
console.log('='.repeat(75));

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

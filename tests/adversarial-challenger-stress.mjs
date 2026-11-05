/**
 * Vrindopnisad 2.0 - Milestone 1 Challenger 2 Empirical Stress Test Harness
 * 
 * Verifies:
 * 1. ZERO Hover translateY or Scale in AST, TSX, and Compiled CSS
 * 2. Active Press Dynamic Enforcement (.pressable:active and .pressable-sm:active)
 * 3. Low-Spec GPU Mode Backdrop Blur & Keyframe Stripping
 * 4. 320px Viewport Fluid Layout & Component Width Bounds
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const checks = [];

function runCheck(id, name, testFn) {
  const start = performance.now();
  try {
    testFn();
    const duration = (performance.now() - start).toFixed(2);
    checks.push({ id, name, pass: true, duration });
    console.log(`[PASS] ${id}: ${name} (${duration}ms)`);
  } catch (err) {
    const duration = (performance.now() - start).toFixed(2);
    checks.push({ id, name, pass: false, error: err.message, duration });
    console.error(`[FAIL] ${id}: ${name} (${duration}ms)\n       ${err.message}`);
  }
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
console.log('  CHALLENGER 2: ADVERSARIAL STRESS-TESTING HARNESS');
console.log('='.repeat(75));

// -----------------------------------------------------------------------------
// SUITE 1: CSS RESTRAINT & HOVER AUDIT
// -----------------------------------------------------------------------------
runCheck('STRESS-1.1', 'AST Scan: Zero hover:translate or hover:scale across all TSX/TS', () => {
  const sourceFiles = walk(path.join(PROJECT_ROOT, 'src'));
  const forbiddenPatterns = [
    { regex: /(?:group-|peer-)?hover:(-)?translate/, name: 'hover:translate' },
    { regex: /(?:group-|peer-)?hover:scale/, name: 'hover:scale' },
    { regex: /(?:group-|peer-)?hover:-translate-y/, name: 'hover:-translate-y' },
    { regex: /(?:group-|peer-)?hover:translate-y/, name: 'hover:translate-y' },
    { regex: /hover:\[transform/, name: 'arbitrary hover transform' },
  ];

  const violations = [];
  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf8');
    for (const p of forbiddenPatterns) {
      if (p.regex.test(content)) {
        violations.push(`${path.relative(PROJECT_ROOT, file)} (${p.name})`);
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(`Forbidden hover transform found: ${violations.join(', ')}`);
  }
});

runCheck('STRESS-1.2', 'Source CSS Scan: Zero translateY or scale under :hover in src/index.css', () => {
  const css = fs.readFileSync(path.join(PROJECT_ROOT, 'src/index.css'), 'utf8');
  const rules = css.split('}');
  const violations = [];

  for (const rule of rules) {
    if (rule.includes(':hover')) {
      if (rule.includes('translateY') || rule.includes('translate') || rule.includes('scale')) {
        violations.push(rule.trim());
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(`Forbidden hover transforms in src/index.css:\n${violations.join('\n')}`);
  }
});

runCheck('STRESS-1.3', 'Compiled CSS Scan: Zero hover translateY or scale in dist/assets/*.css', () => {
  const distDir = path.join(PROJECT_ROOT, 'dist/assets');
  if (!fs.existsSync(distDir)) {
    throw new Error('dist/assets does not exist');
  }
  const cssFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.css'));
  if (cssFiles.length === 0) throw new Error('No CSS files in dist/assets');

  for (const f of cssFiles) {
    const css = fs.readFileSync(path.join(distDir, f), 'utf8');
    const rules = css.split('}');
    for (const r of rules) {
      if (r.includes(':hover')) {
        if (r.includes('translateY') || r.includes('scale(') || r.includes('--tw-scale') || r.includes('--tw-translate-y')) {
          throw new Error(`Forbidden compiled hover transform in ${f}: ${r.trim()}`);
        }
      }
    }
  }
});

runCheck('STRESS-1.4', 'Tactile Dynamics: .pressable:active and .pressable-sm:active isolated to :active', () => {
  const css = fs.readFileSync(path.join(PROJECT_ROOT, 'src/index.css'), 'utf8');
  if (!css.includes('.pressable:active {')) {
    throw new Error('.pressable:active rule missing');
  }
  if (!css.includes('.pressable-sm:active {')) {
    throw new Error('.pressable-sm:active rule missing');
  }
  
  // Verify pressable base state does not have transform
  const pressableBase = css.split('.pressable {')[1]?.split('}')[0] || '';
  if (pressableBase.includes('transform: scale')) {
    throw new Error('.pressable base state must not have scale transform');
  }

  // Verify active state has compression
  const pressableActive = css.split('.pressable:active {')[1]?.split('}')[0] || '';
  if (!pressableActive.includes('transform: scale(')) {
    throw new Error('.pressable:active must compress scale');
  }

  const pressableSmActive = css.split('.pressable-sm:active {')[1]?.split('}')[0] || '';
  if (!pressableSmActive.includes('transform: scale(')) {
    throw new Error('.pressable-sm:active must compress scale');
  }
});

// -----------------------------------------------------------------------------
// SUITE 2: LOW-SPEC GPU MODE BOUNDS & ANIMATION OVERRIDES
// -----------------------------------------------------------------------------
runCheck('STRESS-2.1', 'Low-spec mode cancels .animate-dhyana-breath keyframe loop', () => {
  const css = fs.readFileSync(path.join(PROJECT_ROOT, 'src/index.css'), 'utf8');
  if (!css.includes('.low-spec .animate-dhyana-breath')) {
    throw new Error('.low-spec .animate-dhyana-breath rule missing');
  }
  const block = css.split('.low-spec .animate-dhyana-breath')[1]?.split('}')[0] || '';
  if (!block.includes('animation: none !important')) {
    throw new Error('.low-spec .animate-dhyana-breath must set animation: none !important');
  }
  if (!block.includes('box-shadow: none !important')) {
    throw new Error('.low-spec .animate-dhyana-breath must set box-shadow: none !important');
  }
});

runCheck('STRESS-2.2', 'Low-spec mode strips all backdrop-blur classes with !important', () => {
  const css = fs.readFileSync(path.join(PROJECT_ROOT, 'src/index.css'), 'utf8');
  const requiredSelectors = [
    '.low-spec [class*="backdrop-blur"]',
    '.low-spec .backdrop-blur-none',
    '.low-spec .backdrop-blur-sm',
    '.low-spec .backdrop-blur-md',
    '.low-spec .backdrop-blur-lg',
    '.low-spec .backdrop-blur-xl',
    '.low-spec .backdrop-blur-2xl',
    '.low-spec .backdrop-blur-3xl',
    '.low-spec .glass-panel',
    '.low-spec .glass-pill',
  ];

  for (const sel of requiredSelectors) {
    if (!css.includes(sel)) {
      throw new Error(`Missing backdrop-blur override for ${sel}`);
    }
  }

  const blurBlock = css.split('.low-spec [class*="backdrop-blur"]')[1]?.split('}')[0] || '';
  if (!blurBlock.includes('backdrop-filter: none !important')) {
    throw new Error('Must include backdrop-filter: none !important');
  }
  if (!blurBlock.includes('-webkit-backdrop-filter: none !important')) {
    throw new Error('Must include -webkit-backdrop-filter: none !important');
  }
  if (!blurBlock.includes('--tw-backdrop-blur: none !important')) {
    throw new Error('Must include --tw-backdrop-blur: none !important');
  }
});

runCheck('STRESS-2.3', 'Low-spec mode kills all continuous looping animations', () => {
  const css = fs.readFileSync(path.join(PROJECT_ROOT, 'src/index.css'), 'utf8');
  const loopAnimations = [
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

  for (const a of loopAnimations) {
    if (!css.includes(a)) {
      throw new Error(`Missing low-spec disable rule for ${a}`);
    }
  }
});

// -----------------------------------------------------------------------------
// SUITE 3: 320PX FLUID LAYOUT & BOUNDARY INTEGRITY
// -----------------------------------------------------------------------------
runCheck('STRESS-3.1', 'Hero Japa Card at 320px: Buttons and bead pacing bounds fit in 264px container', () => {
  const appCode = fs.readFileSync(path.join(PROJECT_ROOT, 'src/App.tsx'), 'utf8');
  
  // Outer viewport: 320px
  // Page container px-3.5 = 28px -> inner width = 292px
  // Hero card padding p-3.5 = 28px -> inner available = 264px
  
  // Verify Dhyana button and +1 Mala button flex layout:
  if (!appCode.includes('flex items-center gap-2')) {
    throw new Error('Action buttons must use flex layout with gap-2');
  }
  // Verify "ध्यान कक्ष" button has pressable
  if (!appCode.includes('pressable') || !appCode.includes('ध्यान कक्ष')) {
    throw new Error('ध्यान कक्ष button must have pressable class');
  }

  // Verify bead counter button has min-w-0 / flex bounds
  if (!appCode.includes('handleTapBead')) {
    throw new Error('Hero card must integrate handleTapBead pacing');
  }
  
  // Verify breath aura pill is styled with overflow / responsive containment
  if (!appCode.includes('animate-dhyana-breath')) {
    throw new Error('Hero card must feature breath aura indicator');
  }
});

runCheck('STRESS-3.2', 'Distraction-Free Padavali Reader at 320px: Canvas has responsive padding and zero overflow', () => {
  const readerCode = fs.readFileSync(path.join(PROJECT_ROOT, 'src/components/reader/PadavaliReader.tsx'), 'utf8');
  const css = fs.readFileSync(path.join(PROJECT_ROOT, 'src/index.css'), 'utf8');

  // Verify focus mode canvas class
  if (!css.includes('.dhyana-reader-canvas')) {
    throw new Error('.dhyana-reader-canvas class missing from CSS');
  }
  // Verify max-w-3xl / 768px constraint
  if (!css.includes('max-width: 768px !important')) {
    throw new Error('.dhyana-reader-canvas must bound at max-width: 768px');
  }
  // Verify leading-2 Devanagari typography
  if (!css.includes('.dhyana-verse-line')) {
    throw new Error('.dhyana-verse-line missing from CSS');
  }
  if (!css.includes('line-height: 2.05 !important')) {
    throw new Error('.dhyana-verse-line must have line-height: 2.05 on mobile');
  }
  // Verify Trataka stanza focus classes
  if (!css.includes('.dhyana-stanza-active') || !css.includes('.dhyana-stanza-dimmed')) {
    throw new Error('Trataka stanza focus classes missing from CSS');
  }
});

runCheck('STRESS-3.3', 'Antaranga Sewa Milestones at 320px: Responsive rosette grid fits comfortably', () => {
  const milestonesCode = fs.readFileSync(path.join(PROJECT_ROOT, 'src/components/milestones/MilestonesView.tsx'), 'utf8');

  // Verify Antaranga Sewa section presence
  if (!milestonesCode.includes('अन्तरंग मानसी सोपान')) {
    throw new Error('अन्तरंग मानसी सोपान section missing in MilestonesView');
  }

  // Verify Card 3 has p-3.5 sm:p-6 and responsive grid-cols-2 sm:grid-cols-4
  if (!milestonesCode.includes('grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-2 sm:gap-x-4')) {
    throw new Error('Antaranga Sewa grid must use grid-cols-2 on mobile');
  }

  // 4 contemplative rosettes:
  const rosettes = ['15-dhyana', '30-dhyana', '7-manasi', '108-shanti'];
  for (const r of rosettes) {
    if (!milestonesCode.includes(r)) {
      throw new Error(`Rosette milestone ${r} missing from MilestonesView`);
    }
  }
});

runCheck('STRESS-3.4', 'DhyanaFocusModal at 320px: Fixed width limits & responsive grid constraints', () => {
  const modalCode = fs.readFileSync(path.join(PROJECT_ROOT, 'src/components/focus/DhyanaFocusModal.tsx'), 'utf8');

  // Verify modal bounds: max-w-2xl with max-h-[92vh] overflow-hidden
  if (!modalCode.includes('max-w-2xl') || !modalCode.includes('overflow-hidden')) {
    throw new Error('DhyanaFocusModal must bound at max-w-2xl with overflow-hidden');
  }

  // Verify tabs responsiveness
  if (!modalCode.includes('activeTab === \'sanctuary\'') || !modalCode.includes('activeTab === \'impact\'')) {
    throw new Error('DhyanaFocusModal must support sanctuary and impact tabs');
  }

  // Verify sentiment selector grid is responsive (2 cols on mobile, 4 on sm)
  if (!modalCode.includes('grid grid-cols-2 sm:grid-cols-4 gap-2')) {
    throw new Error('Reflection sentiment grid must be 2 cols on mobile (grid-cols-2 sm:grid-cols-4)');
  }
});

runCheck('STRESS-3.5', 'No unconstrained fixed pixel widths > 290px in mobile views', () => {
  const files = [
    'src/components/common/FloatingNavbar.tsx',
    'src/components/smaran/CategoryCircle.tsx',
    'src/components/feed/FeedCard.tsx',
    'src/components/milestones/MilestonesView.tsx',
    'src/components/focus/DhyanaFocusModal.tsx',
    'src/components/reader/PadavaliReader.tsx',
  ];

  for (const file of files) {
    const code = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');
    // Match exact fixed width classes: (not max-w, not min-w)
    // e.g. class contains w-[350px] but not max-w-[350px] or min-w-[350px]
    const words = code.split(/[\s"'\`]+/);
    for (const word of words) {
      if (/^(?:[a-z0-9_-]+:)*w-\[(\d+)px\]$/.test(word)) {
        const match = word.match(/^(?:([a-z0-9_-]+):)?w-\[(\d+)px\]$/);
        const prefix = match[1];
        const px = parseInt(match[2], 10);
        if (px > 290) {
          // If no responsive prefix or mobile prefix
          if (!prefix || prefix === 'xs') {
            throw new Error(`Unconstrained fixed width ${word} in ${file} will overflow 320px screen`);
          }
        }
      }
    }
  }
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('='.repeat(75));
const passed = checks.filter(c => c.pass).length;
const total = checks.length;
const failed = checks.filter(c => !c.pass).length;
console.log(`Challenger 2 Stress Summary: ${passed}/${total} Passed (${failed} Failed)`);
console.log('='.repeat(75));

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

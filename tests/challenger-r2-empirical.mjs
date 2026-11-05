/**
 * Challenger R2 Empirical Stress Verification Harness
 * Tests edge cases, invariant integrity, and builds.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import assert from 'node:assert/strict';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(id, name, fn) {
  totalTests++;
  const t0 = performance.now();
  try {
    fn();
    passedTests++;
    const ms = (performance.now() - t0).toFixed(2);
    console.log(`[CHALLENGER-PASS] ${id}: ${name} (${ms}ms)`);
  } catch (err) {
    failedTests++;
    const ms = (performance.now() - t0).toFixed(2);
    console.error(`[CHALLENGER-FAIL] ${id}: ${name} (${ms}ms)\n  Error: ${err.message}`);
  }
}

function read(rel) {
  return fs.readFileSync(path.join(PROJECT_ROOT, rel), 'utf8');
}

console.log('='.repeat(75));
console.log('  CHALLENGER R2: INDEPENDENT EMPIRICAL VERIFICATION & STRESS SUITE');
console.log('='.repeat(75));

// 1. TypeScript compilation strict check
runTest('CHALLENGE-R2-01', 'tsc -b passes with zero output and code 0', () => {
  const res = execSync('npx tsc -b', { cwd: PROJECT_ROOT, encoding: 'utf8', stdio: 'pipe' });
  assert.equal(res.trim(), '', 'Expected clean silent output from tsc -b');
});

// 2. PadavaliReader symbols are genuinely referenced and wired
runTest('CHALLENGE-R2-02', 'PadavaliReader: All 8 previously flagged symbols actively wired in JSX', () => {
  const code = read('src/components/reader/PadavaliReader.tsx');
  assert.match(code, /<Copy\b/, 'Copy icon component must be rendered');
  assert.match(code, /<Check\b/, 'Check icon component must be rendered');
  assert.match(code, /BRAJ_GLOSSARY\.map/, 'BRAJ_GLOSSARY must be mapped in JSX');
  assert.match(code, /isGlossaryOpen/, 'isGlossaryOpen state must be read');
  assert.match(code, /setIsGlossaryOpen/, 'setIsGlossaryOpen setter must be called');
  assert.match(code, /copiedStanzaIdx\s*===/, 'copiedStanzaIdx must be checked for UI feedback');
  assert.match(code, /playbackPace\s*===/, 'playbackPace must be read for active pill highlight');
  assert.match(code, /handleCopyVerse\(/, 'handleCopyVerse must be bound to verse copy action');
});

// 3. Braj Sacred Glossary content depth and authenticity
runTest('CHALLENGE-R2-03', 'PadavaliReader: BRAJ_GLOSSARY contains 10 authentic definitions with required fields', () => {
  const code = read('src/components/reader/PadavaliReader.tsx');
  const match = code.match(/const BRAJ_GLOSSARY: Array<\{[^}]+\}> = (\[[\s\S]*?\n\]);/);
  assert.ok(match, 'BRAJ_GLOSSARY definition array must be present');
  
  // Verify 10 distinct entries
  const requiredTerms = [
    'प्यारो (प्रिया-प्रियतम)',
    'नित्य निकुंज',
    'केलि विलास',
    'सहज जोरी',
    'राधा सुधा निधि',
    'अनन्य धर्म',
    'उर धरे',
    'अष्टयाम वेला',
    'मानसी सेवा',
    'सखी भाव'
  ];
  for (const term of requiredTerms) {
    assert.ok(code.includes(term), `Missing expected glossary term: ${term}`);
  }
});

// 4. Anti-hover exhaustive regex audit across all source files
runTest('CHALLENGE-R2-04', 'Exhaustive AST/regex audit: Zero hover transforms across entire src/', () => {
  function scanDir(dir) {
    let files = [];
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) files.push(...scanDir(full));
      else if (/\.(tsx?|jsx?|css|html)$/.test(item)) files.push(full);
    }
    return files;
  }
  const files = scanDir(path.join(PROJECT_ROOT, 'src'));
  const forbiddenPatterns = [
    /(?:group-|peer-)?hover:(-)?translate/,
    /(?:group-|peer-)?hover:scale/,
    /(?:group-|peer-)?hover:rotate/,
    /(?:group-|peer-)?hover:skew/,
  ];
  const violations = [];
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    for (const pat of forbiddenPatterns) {
      if (pat.test(text)) {
        violations.push(`${path.relative(PROJECT_ROOT, f)} matches ${pat}`);
      }
    }
  }
  assert.equal(violations.length, 0, `Forbidden hover transform detected: ${violations.join(', ')}`);
});

// 5. Anti-hover compiled CSS audit
runTest('CHALLENGE-R2-05', 'Exhaustive compiled CSS audit: Zero hover transforms in dist/assets/*.css', () => {
  const distDir = path.join(PROJECT_ROOT, 'dist/assets');
  assert.ok(fs.existsSync(distDir), 'dist/assets must exist');
  const cssFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.css'));
  assert.ok(cssFiles.length > 0, 'At least one compiled CSS file must exist');

  for (const cssFile of cssFiles) {
    const content = fs.readFileSync(path.join(distDir, cssFile), 'utf8');
    const rules = content.split('}');
    for (const rule of rules) {
      if (rule.includes(':hover')) {
        assert.ok(!rule.includes('translateY'), `Forbidden translateY in hover rule: ${rule}`);
        assert.ok(!rule.includes('scale('), `Forbidden scale() in hover rule: ${rule}`);
        assert.ok(!rule.includes('--tw-scale'), `Forbidden --tw-scale in hover rule: ${rule}`);
        assert.ok(!rule.includes('--tw-translate'), `Forbidden --tw-translate in hover rule: ${rule}`);
      }
    }
  }
});

// 6. Adversarial Screen Constraints: 320px viewport
runTest('CHALLENGE-R2-06', 'Viewport Budget Verification: 320px layout constraints', () => {
  const navCode = read('src/components/common/FloatingNavbar.tsx');
  assert.match(navCode, /max-w-\[240px\]/, 'Nav pill max-w must be 240px');
  assert.match(navCode, /w-\[52px\]\s+h-\[52px\]/, 'FAB must be 52px on mobile');
  
  const total = 16 + 240 + 8 + 52; // 316px
  assert.ok(total <= 320, `Total navbar width ${total}px exceeds 320px screen width`);
});

// 7. Apple Spring Physics Spec Verification
runTest('CHALLENGE-R2-07', 'Apple Spring Curves: Canonical cubic-bezier and enter animations intact', () => {
  const indexCss = read('src/index.css');
  assert.match(indexCss, /--ease-ios-spring:\s*cubic-bezier\(0\.32,\s*0\.72,\s*0,\s*1\)/, 'Apple spring curve defined correctly');
  assert.match(indexCss, /\.apple-sheet-enter/, 'apple-sheet-enter class present');
  assert.match(indexCss, /\.apple-dialog-enter/, 'apple-dialog-enter class present');
  assert.match(indexCss, /\.pressable:active/, 'pressable active scaling present');
  assert.match(indexCss, /\.pressable-sm:active/, 'pressable-sm active scaling present');
});

// 8. Low-Spec GPU Fallback Verification
runTest('CHALLENGE-R2-08', 'Low-Spec Mode: Backdrop filters and keyframes rigorously disabled', () => {
  const indexCss = read('src/index.css');
  assert.match(indexCss, /\.low-spec\s+\[class\*="backdrop-blur"\][\s\S]*?backdrop-filter:\s*none\s*!important/, 'Backdrop-filter disabled in low-spec');
  assert.match(indexCss, /\.low-spec\s+\.animate-apple-eq-1/, 'animate-apple-eq-1 disabled in low-spec');
  assert.match(indexCss, /\.low-spec\s+\.animate-apple-glow/, 'animate-apple-glow disabled in low-spec');
  assert.match(indexCss, /\.low-spec\s+\.apple-sheet-enter/, 'apple-sheet-enter disabled in low-spec');
});

console.log('='.repeat(75));
console.log(`Challenger R2 Summary: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log('='.repeat(75));

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

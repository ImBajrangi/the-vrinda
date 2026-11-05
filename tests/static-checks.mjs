import { test, describe, assert, getAllSourceFiles, readSource, PROJECT_ROOT } from './test-framework.mjs';
import { execSync } from 'node:child_process';
import path from 'node:path';

describe('Static Rule & Build Checks', 'Rules', 'Rule-Compliance', () => {

  test('RULE-01', 'Zero occurrences of hover:translate-y across all source files', () => {
    const files = getAllSourceFiles();
    const violations = [];
    for (const f of files) {
      const content = readSource(f);
      if (content.includes('hover:translate-y')) {
        violations.push(path.relative(PROJECT_ROOT, f));
      }
    }
    assert.strictEqual(
      violations.length,
      0,
      `Violation: hover:translate-y found in ${violations.join(', ')}`
    );
  });

  test('RULE-02', 'Zero occurrences of hover:-translate-y across all source files', () => {
    const files = getAllSourceFiles();
    const violations = [];
    for (const f of files) {
      const content = readSource(f);
      if (content.includes('hover:-translate-y')) {
        violations.push(path.relative(PROJECT_ROOT, f));
      }
    }
    assert.strictEqual(
      violations.length,
      0,
      `Violation: hover:-translate-y found in ${violations.join(', ')}`
    );
  });

  test('RULE-03', 'Zero occurrences of hover:scale across all source files', () => {
    const files = getAllSourceFiles();
    const violations = [];
    for (const f of files) {
      const content = readSource(f);
      if (content.includes('hover:scale')) {
        violations.push(path.relative(PROJECT_ROOT, f));
      }
    }
    assert.strictEqual(
      violations.length,
      0,
      `Violation: hover:scale found in ${violations.join(', ')}`
    );
  });

  test('RULE-04', 'CSS index.css contains zero hover translateY or hover scale declarations', () => {
    const css = readSource('src/index.css');
    // Check if any :hover selector applies transform: translateY or transform: scale
    const hoverRegex = /:hover\s*\{[^}]*transform:[^}]*(translateY|scale)[^}]*\}/i;
    assert.notMatch(
      css,
      hoverRegex,
      'Violation: src/index.css has :hover rule containing translateY or scale'
    );
  });

  test('RULE-05', 'Active press dynamics strictly reserved for :active state in CSS', () => {
    const css = readSource('src/index.css');
    assert.match(
      css,
      /\.pressable:active\s*\{[^}]*transform:\s*scale\(/,
      'CSS must define .pressable:active with transform: scale'
    );
    assert.match(
      css,
      /\.pressable-sm:active\s*\{[^}]*transform:\s*scale\(/,
      'CSS must define .pressable-sm:active with transform: scale'
    );
  });

  test('BUILD-01', 'npm run build executes cleanly with exit code 0 and zero TS errors', () => {
    const output = execSync('npm run build', {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    assert.ok(output.includes('built in') || output.includes('dist/'), 'Build output should indicate successful build');
  });

});

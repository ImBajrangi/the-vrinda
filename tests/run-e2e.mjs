#!/usr/bin/env node

/**
 * ============================================================================
 * Vrindopnisad 2.0 - Comprehensive E2E Verification Suite Master Runner
 * ============================================================================
 * Adheres strictly to TEST_INFRA.md and PROJECT.md requirements:
 * - Tier 1: Feature Coverage (≥80 tests across 16 features)
 * - Tier 2: Boundary & Corner Cases (≥80 boundary tests across 16 features)
 * - Tier 3: Cross-Feature Combinations (16 pairwise integration tests)
 * - Tier 4: Real-World Application Scenarios (5 realistic end-user flows)
 * - Rules: Zero hover translateY / hover scale AST & CSS compliance (5 tests)
 * - Build: Production build compilation verification (1 test)
 *
 * Usage:
 *   node tests/run-e2e.mjs
 *   node tests/run-e2e.mjs --tier=1
 *   node tests/run-e2e.mjs --tier=2
 *   node tests/run-e2e.mjs --feature=F1
 *   node tests/run-e2e.mjs --summary
 *   node tests/run-e2e.mjs --strict
 * ============================================================================
 */

import { registry } from './test-framework.mjs';

// Import all test suites
import './static-checks.mjs';
import './tier1-features.mjs';
import './tier2-boundaries.mjs';
import './tier3-pairwise.mjs';
import './tier4-scenarios.mjs';
import './dhyana-e2e.mjs';

// Parse command-line arguments
const args = process.argv.slice(2);
const options = {
  tier: null,
  feature: null,
  search: null,
  strict: args.includes('--strict'),
  summary: args.includes('--summary'),
  json: args.includes('--json'),
  help: args.includes('--help') || args.includes('-h'),
};

for (const arg of args) {
  if (arg.startsWith('--tier=')) options.tier = arg.split('=')[1];
  if (arg.startsWith('--feature=')) options.feature = arg.split('=')[1];
  if (arg.startsWith('--search=')) options.search = arg.split('=')[1];
}

if (options.help) {
  console.log(`
Vrindopnisad 2.0 E2E Verification Test Runner
Options:
  --tier=<Tier 1|Tier 2|Tier 3|Tier 4|Rules>   Run only tests from specified tier
  --feature=<F1|F2|...|F18>                    Run only tests for specified feature
  --search=<text>                              Filter tests by title or ID
  --summary                                    Display compact summary table
  --strict                                     Exit with code 1 on any test failure
  --json                                       Output raw JSON test results
  --help                                       Show this help message
`);
  process.exit(0);
}

// Map CLI short tier names to registry tier names
if (options.tier === '1') options.tier = 'Tier 1';
if (options.tier === '2') options.tier = 'Tier 2';
if (options.tier === '3') options.tier = 'Tier 3';
if (options.tier === '4') options.tier = 'Tier 4';

// Filter expected Node environment fallback warnings for pristine output
const origWarn = console.warn;
console.warn = (...args) => {
  const msg = args[0] ? String(args[0]) : '';
  if (msg.includes('IndexedDB unavailable') || msg.includes('IndexedDB feed')) return;
  origWarn.apply(console, args);
};

async function main() {
  const suiteStartTime = performance.now();
  const filter = {};
  if (options.tier) filter.tier = options.tier;
  if (options.feature) filter.feature = options.feature;
  if (options.search) filter.search = options.search;

  const result = await registry.run(filter);
  const suiteDurationMs = Number((performance.now() - suiteStartTime).toFixed(2));

  if (options.json) {
    console.log(JSON.stringify({ ...result, suiteDurationMs }, null, 2));
    process.exit(options.strict && result.failed > 0 ? 1 : 0);
  }

  // Print Header
  console.log('\n================================================================================');
  console.log('              VRINDOPNISAD 2.0 - E2E TEST VERIFICATION REPORT                  ');
  console.log('================================================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Execution Time: ${suiteDurationMs} ms`);
  console.log(`Total Tests Executed: ${result.total} | Passed: ${result.passed} | Failed: ${result.failed}\n`);

  // Group by Tier
  const tierSummary = {};
  for (const t of result.results) {
    if (!tierSummary[t.tier]) {
      tierSummary[t.tier] = { total: 0, passed: 0, failed: 0, failedTests: [] };
    }
    tierSummary[t.tier].total++;
    if (t.passed) {
      tierSummary[t.tier].passed++;
    } else {
      tierSummary[t.tier].failed++;
      tierSummary[t.tier].failedTests.push(t);
    }
  }

  console.log('--------------------------------------------------------------------------------');
  console.log(' TIER BREAKDOWN SUMMARY                                                         ');
  console.log('--------------------------------------------------------------------------------');
  console.log(
    'Tier'.padEnd(16) +
    'Total'.padStart(8) +
    'Passed'.padStart(10) +
    'Failed'.padStart(10) +
    'Pass Rate'.padStart(14) +
    'Status'.padStart(14)
  );
  console.log('-'.repeat(72));

  for (const [tierName, stat] of Object.entries(tierSummary)) {
    const rate = ((stat.passed / stat.total) * 100).toFixed(1) + '%';
    const status = stat.failed === 0 ? '✓ COMPLETE' : `⚠ ${stat.failed} PENDING`;
    console.log(
      tierName.padEnd(16) +
      String(stat.total).padStart(8) +
      String(stat.passed).padStart(10) +
      String(stat.failed).padStart(10) +
      rate.padStart(14) +
      status.padStart(14)
    );
  }
  console.log('-'.repeat(72));

  // Feature Matrix Breakdown (Features 1 to 18)
  const FEATURES = [
    { id: 'F1', name: 'Two-Tier IDB Caching & Multi-Tab Sync' },
    { id: 'F2', name: 'Unified Reactive Dashboard Metrics' },
    { id: 'F3', name: 'Mobile FloatingNavbar 320px Fluidity' },
    { id: 'F4', name: 'Dynamic Notch Navbar Compact & Dynamic Island' },
    { id: 'F5', name: 'Sacred FAB Devotional Motif Icon' },
    { id: 'F6', name: 'Dynamic Ashtayama Time Calculation' },
    { id: 'F7', name: 'Low-Spec GPU Optimization & Spring Curves' },
    { id: 'F8', name: '3-Column Bento Dashboard & 320px Fluidity' },
    { id: 'F9', name: 'Sacred Feed Braj Terminology & Actions' },
    { id: 'F10', name: 'Feed Card 320px Row & Bilingual Toggle' },
    { id: 'F11', name: 'Persistent Feed Likes & Bookmarks in IDB' },
    { id: 'F12', name: 'Padavali Reader Line-Height & IDB Bookmarks' },
    { id: 'F13', name: 'Mobile Rasik Commentary Drawer (< xl)' },
    { id: 'F14', name: 'Milestones Authentic Braj Devotional Terms' },
    { id: 'F15', name: 'Interactive ScallopedBadge Blessing Sheet' },
    { id: 'F16', name: 'Zero Hover translateY / scale Compliance' },
    { id: 'F17', name: 'Contemplative & Mental Focus UI' },
    { id: 'F18', name: 'Cognitive/Spiritual Impact & Cache' },
  ];

  console.log('\n--------------------------------------------------------------------------------');
  console.log(' 18-FEATURE COVERAGE MATRIX                                                     ');
  console.log('--------------------------------------------------------------------------------');
  console.log(
    'Feature'.padEnd(8) +
    'Description'.padEnd(42) +
    'Tier 1'.padStart(8) +
    'Tier 2'.padStart(8) +
    'Status'.padStart(14)
  );
  console.log('-'.repeat(80));

  for (const feat of FEATURES) {
    const featRegex = new RegExp(`^${feat.id}(-[0-9]|-[A-Z]|$)`);
    const t1Tests = result.results.filter(r => r.tier === 'Tier 1' && featRegex.test(r.id));
    const t2Tests = result.results.filter(r => r.tier === 'Tier 2' && featRegex.test(r.id));

    const t1Passed = t1Tests.filter(t => t.passed).length;
    const t2Passed = t2Tests.filter(t => t.passed).length;

    const t1Total = t1Tests.length;
    const t2Total = t2Tests.length;

    const t1Str = t1Total > 0 ? `${t1Passed}/${t1Total}` : '-';
    const t2Str = t2Total > 0 ? `${t2Passed}/${t2Total}` : '-';

    const isAllPassed = (t1Passed === t1Total) && (t2Passed === t2Total) && (t1Total > 0 || t2Total > 0);
    const status = isAllPassed ? '✓ PASS' : `⚠ ${t1Total - t1Passed + t2Total - t2Passed} Pending`;

    console.log(
      feat.id.padEnd(8) +
      feat.name.slice(0, 40).padEnd(42) +
      t1Str.padStart(8) +
      t2Str.padStart(8) +
      status.padStart(14)
    );
  }
  console.log('-'.repeat(80));

  // Print pending / failed test list if any
  if (result.failed > 0 && !options.summary) {
    console.log('\n--------------------------------------------------------------------------------');
    console.log(` PENDING / FAILED TESTS (${result.failed} items requiring implementation/fix):`);
    console.log('--------------------------------------------------------------------------------');
    for (const [tierName, stat] of Object.entries(tierSummary)) {
      if (stat.failed > 0) {
        console.log(`\n[${tierName}] - ${stat.failed} item(s):`);
        for (const ft of stat.failedTests) {
          console.log(`  ✗ ${ft.id.padEnd(10)} ${ft.title}`);
          if (ft.error) {
            console.log(`    Reason: ${ft.error}`);
          }
        }
      }
    }
  }

  console.log('\n================================================================================');
  console.log(` VERIFICATION RESULT: ${result.passed}/${result.total} PASSED (${((result.passed / result.total) * 100).toFixed(1)}%)`);
  if (result.failed === 0) {
    console.log(` ALL ${result.total} VERIFICATION TESTS PASSED SUCCESSFULLY! SUITE IS 100% HEALTHY.`);
  } else {
    console.log(` ${result.failed} test(s) pending completion of assigned implementation milestones.`);
    console.log(' Use this suite to progressively verify M1 through M5 completion.');
  }
  console.log('================================================================================\n');

  if (options.strict && result.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});

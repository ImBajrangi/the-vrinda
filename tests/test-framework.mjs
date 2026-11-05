import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, '..');
export const SRC_DIR = path.join(PROJECT_ROOT, 'src');

/**
 * Lightweight, robust test registry and runner.
 */
class TestRegistry {
  constructor() {
    this.tests = [];
    this.currentSuite = 'General';
    this.currentTier = 'Tier 1';
    this.currentFeature = 'General';
  }

  setContext(suite, tier, feature) {
    if (suite) this.currentSuite = suite;
    if (tier) this.currentTier = tier;
    if (feature) this.currentFeature = feature;
  }

  register(id, title, fn, meta = {}) {
    this.tests.push({
      id,
      title,
      fn,
      suite: meta.suite || this.currentSuite,
      tier: meta.tier || this.currentTier,
      feature: meta.feature || this.currentFeature,
      source: meta.source || 'PROJECT.md',
    });
  }

  async run(filter = {}) {
    const results = [];
    let passedCount = 0;
    let failedCount = 0;

    for (const t of this.tests) {
      if (filter.tier && t.tier !== filter.tier) continue;
      if (filter.feature && t.feature !== filter.feature) continue;
      if (filter.search && !t.title.toLowerCase().includes(filter.search.toLowerCase()) && !t.id.toLowerCase().includes(filter.search.toLowerCase())) continue;

      const startTime = performance.now();
      let passed = false;
      let error = null;

      try {
        await t.fn();
        passed = true;
        passedCount++;
      } catch (err) {
        passed = false;
        error = err;
        failedCount++;
      }

      const durationMs = performance.now() - startTime;
      results.push({
        ...t,
        passed,
        error: error ? (error.message || String(error)) : null,
        durationMs: Number(durationMs.toFixed(2)),
      });
    }

    return {
      total: results.length,
      passed: passedCount,
      failed: failedCount,
      results,
    };
  }
}

export const registry = new TestRegistry();

export function test(id, title, fn, meta = {}) {
  registry.register(id, title, fn, meta);
}

export function describe(suite, tier, feature, fn) {
  registry.setContext(suite, tier, feature);
  fn();
}

/**
 * Pure Assertions
 */
export const assert = {
  strictEqual(actual, expected, msg = '') {
    if (actual !== expected) {
      throw new Error(`${msg ? msg + ': ' : ''}Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  },
  deepEqual(actual, expected, msg = '') {
    const aStr = JSON.stringify(actual);
    const eStr = JSON.stringify(expected);
    if (aStr !== eStr) {
      throw new Error(`${msg ? msg + ': ' : ''}Expected ${eStr}, got ${aStr}`);
    }
  },
  ok(val, msg = 'Assertion failed: value is not truthy') {
    if (!val) {
      throw new Error(msg);
    }
  },
  isTrue(val, msg = 'Expected true') {
    if (val !== true) throw new Error(`${msg}: got ${val}`);
  },
  isFalse(val, msg = 'Expected false') {
    if (val !== false) throw new Error(`${msg}: got ${val}`);
  },
  match(str, regex, msg = '') {
    if (!regex.test(str)) {
      throw new Error(`${msg ? msg + ': ' : ''}String does not match pattern ${regex}`);
    }
  },
  notMatch(str, regex, msg = '') {
    if (regex.test(str)) {
      throw new Error(`${msg ? msg + ': ' : ''}String should NOT match pattern ${regex}`);
    }
  },
  includes(container, item, msg = '') {
    if (!container || !container.includes(item)) {
      throw new Error(`${msg ? msg + ': ' : ''}Expected container to include ${JSON.stringify(item)}`);
    }
  },
  notIncludes(container, item, msg = '') {
    if (container && container.includes(item)) {
      throw new Error(`${msg ? msg + ': ' : ''}Expected container NOT to include ${JSON.stringify(item)}`);
    }
  },
  lessThanOrEqual(actual, limit, msg = '') {
    if (actual > limit) {
      throw new Error(`${msg ? msg + ': ' : ''}Expected ${actual} <= ${limit}`);
    }
  },
  greaterThanOrEqual(actual, limit, msg = '') {
    if (actual < limit) {
      throw new Error(`${msg ? msg + ': ' : ''}Expected ${actual} >= ${limit}`);
    }
  },
  throws(fn, msg = 'Expected function to throw') {
    let threw = false;
    try {
      fn();
    } catch {
      threw = true;
    }
    if (!threw) throw new Error(msg);
  },
  async rejects(promise, msg = 'Expected promise to reject') {
    let rejected = false;
    try {
      await promise;
    } catch {
      rejected = true;
    }
    if (!rejected) throw new Error(msg);
  }
};

/**
 * Dynamic TypeScript/TSX Module Loader via esbuild
 */
export async function loadTSModule(relPath) {
  const full = path.isAbsolute(relPath) ? relPath : path.join(PROJECT_ROOT, relPath);
  const bundleDir = path.join(PROJECT_ROOT, 'tests/.build_tmp');
  if (!fs.existsSync(bundleDir)) {
    fs.mkdirSync(bundleDir, { recursive: true });
  }
  const safeName = relPath.replace(/[^a-zA-Z0-9]/g, '_') + '.mjs';
  const outPath = path.join(bundleDir, safeName);
  
  await import('esbuild').then(e => e.default.build({
    entryPoints: [full],
    bundle: true,
    outfile: outPath,
    format: 'esm',
    platform: 'node',
    packages: 'external',
  }));
  
  return import(`file://${outPath}?t=${Date.now()}`);
}

/**
 * File & AST Analysis Helpers
 */
export function readSource(relPath) {
  const fullPath = path.isAbsolute(relPath) ? relPath : path.join(PROJECT_ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Source file not found: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

export function parseTS(relPath) {
  const fullPath = path.isAbsolute(relPath) ? relPath : path.join(PROJECT_ROOT, relPath);
  const content = readSource(fullPath);
  return ts.createSourceFile(
    path.basename(fullPath),
    content,
    ts.ScriptTarget.Latest,
    true,
    fullPath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
}

export function getAllSourceFiles(dir = SRC_DIR, exts = ['.ts', '.tsx', '.css']) {
  const files = [];
  function traverse(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(current, ent.name);
      if (ent.isDirectory()) {
        traverse(full);
      } else if (exts.some(ext => ent.name.endsWith(ext))) {
        files.push(full);
      }
    }
  }
  if (fs.existsSync(dir)) traverse(dir);
  return files;
}

/**
 * AST Traverser to find JSX attributes and expressions
 */
export function findJSXAttributeValues(sourceFile, attrName) {
  const values = [];
  function visit(node) {
    if (ts.isJsxAttribute(node) && node.name.text === attrName) {
      if (node.initializer) {
        if (ts.isStringLiteral(node.initializer)) {
          values.push(node.initializer.text);
        } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
          values.push(node.initializer.expression.getText(sourceFile));
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return values;
}

/**
 * Mock Storage Implementations for isolated testing
 */
export class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

export class MockIndexedDB {
  constructor() {
    this.store = new Map();
    this.failMode = false;
  }
  async get(key) {
    if (this.failMode) throw new Error('Simulated IndexedDB failure');
    return this.store.get(key);
  }
  async set(key, val) {
    if (this.failMode) throw new Error('Simulated IndexedDB failure');
    this.store.set(key, val);
  }
  async del(key) {
    if (this.failMode) throw new Error('Simulated IndexedDB failure');
    this.store.delete(key);
  }
  async clear() {
    this.store.clear();
  }
}

export class MockBroadcastChannel {
  static channels = new Map();

  constructor(name) {
    this.name = name;
    this.onmessage = null;
    if (!MockBroadcastChannel.channels.has(name)) {
      MockBroadcastChannel.channels.set(name, new Set());
    }
    MockBroadcastChannel.channels.get(name).add(this);
  }

  postMessage(data) {
    const peers = MockBroadcastChannel.channels.get(this.name) || new Set();
    for (const peer of peers) {
      if (peer !== this && typeof peer.onmessage === 'function') {
        peer.onmessage({ data });
      }
    }
  }

  close() {
    const peers = MockBroadcastChannel.channels.get(this.name);
    if (peers) peers.delete(this);
  }
}

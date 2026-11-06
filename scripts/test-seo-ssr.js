/**
 * Vrindopnisad 2.0 - Dynamic SSR & SEO Verification Script
 * Validates dynamic on-demand rendering, verse extraction, and JSON-LD structured data.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function testDynamicSSR() {
  const serverEntryPath = path.resolve(projectRoot, 'dist', 'server', 'entry-server.js');
  console.log('🧪 Testing Dynamic SSR for SEO...');

  const { render } = await import(`file://${serverEntryPath}`);

  // Test Case 1: Specific Pada Deep Link for Search Bots
  const testUrl1 = '/?tab=padavali&pad=radheju-merau-janam-sudharau';
  console.log(`\n1. Testing Pada Deep-Link: ${testUrl1}`);
  const res1 = render(testUrl1);

  if (!res1.html || !res1.seo) {
    throw new Error('Test 1 Failed: render result missing html or seo object');
  }

  console.log('  ✓ Rendered HTML length:', res1.html.length, 'bytes');
  console.log('  ✓ Dynamic Title:', res1.seo.title);
  console.log('  ✓ Canonical URL:', res1.seo.canonicalUrl);
  console.log('  ✓ Schema.org Types:', res1.seo.schemas.map((s) => s['@type']).join(', '));

  if (!res1.seo.title.includes('राधेजू मेरौ जनम सुधारौ')) {
    throw new Error('Test 1 Failed: Expected title to contain pad name');
  }

  const creativeWork = res1.seo.schemas.find((s) => s['@type'] === 'CreativeWork');
  if (!creativeWork || !creativeWork.headline.includes('राधेजू मेरौ जनम सुधारौ')) {
    throw new Error('Test 1 Failed: Expected CreativeWork schema for pad');
  }
  console.log('  ✓ CreativeWork headline:', creativeWork.headline);
  console.log('  ✓ Musical key (Rag):', creativeWork.musicalKey);

  // Test Case 2: Darshan Feed Tab
  const testUrl2 = '/?tab=feed';
  console.log(`\n2. Testing Tab SEO: ${testUrl2}`);
  const res2 = render(testUrl2);
  console.log('  ✓ Dynamic Title:', res2.seo.title);
  console.log('  ✓ Initial State Tab:', res2.initialState.tab);

  if (res2.initialState.tab !== 'feed') {
    throw new Error('Test 2 Failed: Expected initialState.tab to be feed');
  }

  console.log('\n✨ All Dynamic SSR & SEO tests passed with 100% precision!');
}

testDynamicSSR().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

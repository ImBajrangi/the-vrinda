import playwrightPkg from '/Users/sakhi/Code/rishabhlab-bjg/node_modules/playwright/index.js';
const { chromium } = playwrightPkg;
import fs from 'fs';
import path from 'path';

const outDir = '/Users/sakhi/Code/vrindopnisad/.agents/teamwork/teamwork_challenger_1';

async function run() {
  console.log('='.repeat(70));
  console.log('  EMPIRICAL 320PX VIEWPORT BROWSER STRESS MEASUREMENT');
  console.log('='.repeat(70));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 320, height: 640 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Check root document horizontal overflow
  const rootScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const rootClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);

  console.log(`[Viewport] clientWidth: ${rootClientWidth}px, scrollWidth: ${rootScrollWidth}px, bodyScrollWidth: ${bodyScrollWidth}px`);
  if (rootScrollWidth > 320) {
    throw new Error(`CRITICAL: Page experiences horizontal overflow! scrollWidth = ${rootScrollWidth}px > 320px`);
  }

  // 2. Measure TopBar container and elements
  const topBarHeader = await page.$('header');
  const topBarBox = await topBarHeader.boundingBox();
  console.log(`[TopBar] Box: x=${topBarBox.x.toFixed(1)}, y=${topBarBox.y.toFixed(1)}, w=${topBarBox.width.toFixed(1)}, h=${topBarBox.height.toFixed(1)}`);
  
  const notchBar = await page.$('header > div > div');
  const notchBox = await notchBar.boundingBox();
  console.log(`[NotchBar] Box: x=${notchBox.x.toFixed(1)}, y=${notchBox.y.toFixed(1)}, w=${notchBox.width.toFixed(1)}, h=${notchBox.height.toFixed(1)}`);
  
  if (notchBox.x < 0 || (notchBox.x + notchBox.width) > 320.5) {
    throw new Error(`TopBar notch overflows 320px bounds: left=${notchBox.x}, right=${notchBox.x + notchBox.width}`);
  }

  // 3. Measure FloatingNavbar container and tabs
  const navContainer = await page.$('div.md\\:hidden.fixed.bottom-3\\.5');
  const navContainerBox = await navContainer.boundingBox();
  console.log(`[FloatingNavbar Container] Box: x=${navContainerBox.x.toFixed(1)}, y=${navContainerBox.y.toFixed(1)}, w=${navContainerBox.width.toFixed(1)}, h=${navContainerBox.height.toFixed(1)}`);

  if (navContainerBox.x < 0 || (navContainerBox.x + navContainerBox.width) > 320.5) {
    throw new Error(`FloatingNavbar container overflows 320px bounds: left=${navContainerBox.x}, right=${navContainerBox.x + navContainerBox.width}`);
  }

  const navPill = await page.$('nav[aria-label="Mobile Navigation"]');
  const navPillBox = await navPill.boundingBox();
  console.log(`[Nav Pill] Box: x=${navPillBox.x.toFixed(1)}, y=${navPillBox.y.toFixed(1)}, w=${navPillBox.width.toFixed(1)}, h=${navPillBox.height.toFixed(1)}`);

  const fabBtn = await page.$('button[aria-label="Open Ras Shravan Player"]');
  const fabBox = await fabBtn.boundingBox();
  console.log(`[Audio FAB] Box: x=${fabBox.x.toFixed(1)}, y=${fabBox.y.toFixed(1)}, w=${fabBox.width.toFixed(1)}, h=${fabBox.height.toFixed(1)}`);

  // Assert FAB + Nav Pill total span
  const minX = Math.min(navPillBox.x, fabBox.x);
  const maxX = Math.max(navPillBox.x + navPillBox.width, fabBox.x + fabBox.width);
  const totalNavSpan = maxX - minX;
  console.log(`[Bottom Elements Total Span]: ${totalNavSpan.toFixed(1)}px (<= 320px)`);

  if (maxX > 320.5 || minX < -0.5) {
    throw new Error(`FloatingNavbar elements overflow viewport: minX=${minX}, maxX=${maxX}`);
  }

  // 4. Measure each of the 4 tabs inside Nav Pill
  const tabs = ['Home', 'Vani', 'Feed', 'Badges'];
  for (const tabName of tabs) {
    const tabEl = await page.$(`nav[aria-label="Mobile Navigation"] button:has-text("${tabName}")`);
    if (!tabEl) {
      throw new Error(`Tab "${tabName}" not found in Mobile Navigation`);
    }
    const isVisible = await tabEl.isVisible();
    const box = await tabEl.boundingBox();
    console.log(`  Tab [${tabName}]: visible=${isVisible}, x=${box.x.toFixed(1)}, w=${box.width.toFixed(1)}, h=${box.height.toFixed(1)}`);

    if (!isVisible) throw new Error(`Tab "${tabName}" is not visible`);
    if (box.width < 40) throw new Error(`Tab "${tabName}" is abnormally narrow (< 40px): ${box.width}px`);
    if (box.x < navPillBox.x || (box.x + box.width) > (navPillBox.x + navPillBox.width + 1)) {
      throw new Error(`Tab "${tabName}" is clipped or outside nav pill bounds!`);
    }
  }

  // Take screenshot of 320px Smaran
  await page.screenshot({ path: path.join(outDir, 'empirical-320px-smaran.png') });
  console.log(`Captured screenshot: empirical-320px-smaran.png`);

  // 5. Test Tab Switching and layout stability at 320px
  // Test Vani tab
  const vaniTab = await page.$('nav[aria-label="Mobile Navigation"] button:has-text("Vani")');
  await vaniTab.click();
  await page.waitForTimeout(500);
  const vaniScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log(`[Tab: Vani] root scrollWidth: ${vaniScrollWidth}px`);
  if (vaniScrollWidth > 320) throw new Error(`Vani tab overflows 320px: ${vaniScrollWidth}px`);
  await page.screenshot({ path: path.join(outDir, 'empirical-320px-padavali.png') });

  // Test Feed tab
  const feedTab = await page.$('nav[aria-label="Mobile Navigation"] button:has-text("Feed")');
  await feedTab.click();
  await page.waitForTimeout(500);
  const feedScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log(`[Tab: Feed] root scrollWidth: ${feedScrollWidth}px`);
  if (feedScrollWidth > 320) throw new Error(`Feed tab overflows 320px: ${feedScrollWidth}px`);
  await page.screenshot({ path: path.join(outDir, 'empirical-320px-feed.png') });

  // Test Badges tab
  const badgesTab = await page.$('nav[aria-label="Mobile Navigation"] button:has-text("Badges")');
  await badgesTab.click();
  await page.waitForTimeout(500);
  const badgesScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log(`[Tab: Badges] root scrollWidth: ${badgesScrollWidth}px`);
  if (badgesScrollWidth > 320) throw new Error(`Badges tab overflows 320px: ${badgesScrollWidth}px`);
  await page.screenshot({ path: path.join(outDir, 'empirical-320px-milestones.png') });

  await context.close();
  await browser.close();

  console.log('='.repeat(70));
  console.log('  ALL 320PX EMPIRICAL INVARIANTS CONFIRMED ZERO OVERFLOW!');
  console.log('='.repeat(70));
}

run().catch((err) => {
  console.error('[FAIL] 320px empirical measurement failed:', err);
  process.exit(1);
});

import playwrightPkg from '/Users/sakhi/Code/rishabhlab-bjg/node_modules/playwright/index.js';
const { chromium, devices } = playwrightPkg;
import fs from 'fs';
import path from 'path';

const outDir = '/Users/sakhi/.gemini/antigravity/brain/037553d2-29b7-49fd-b026-398817c7517a/screenshots';
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });
  
  // 1. Desktop 1440x900
  console.log('Capturing Desktop Screenshots...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await desktopContext.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Screenshot 1: Desktop Smaran Dashboard
  await page.screenshot({ path: path.join(outDir, 'desktop-01-smaran.png') });
  console.log('Captured: desktop-01-smaran.png');

  // Screenshot 2: Desktop Dhyana Mental Focus Modal
  // Click on the Dhyana trigger button
  const dhyanaBtn = await page.$('button[title*="ध्यान"], button:has-text("ध्यान कक्ष")');
  if (dhyanaBtn) {
    await dhyanaBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, 'desktop-02-focus-sanctuary.png') });
    console.log('Captured: desktop-02-focus-sanctuary.png');

    // Click on Tab 2: Cognitive Impact
    const impactTab = await page.$('button:has-text("चित्त वृत्ति निरोध प्रभाव")');
    if (impactTab) {
      await impactTab.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(outDir, 'desktop-03-cognitive-impact.png') });
      console.log('Captured: desktop-03-cognitive-impact.png');
    }

    // Close modal
    const closeBtn = await page.$('button[aria-label="Close Focus Sanctuary"]');
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(400);
  }

  // Screenshot 4: Desktop Padavali Reader
  const padavaliTab = await page.$('button:has-text("पदावली")');
  if (padavaliTab) {
    await padavaliTab.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, 'desktop-04-padavali.png') });
    console.log('Captured: desktop-04-padavali.png');
  }

  // Screenshot 5: Desktop Braj Darshan Feed
  const feedTab = await page.$('button:has-text("दिव्य दर्शन")');
  if (feedTab) {
    await feedTab.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, 'desktop-05-feed.png') });
    console.log('Captured: desktop-05-feed.png');
  }

  // Screenshot 6: Desktop Milestones
  const milestonesTab = await page.$('button:has-text("साधना सिद्धि")');
  if (milestonesTab) {
    await milestonesTab.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, 'desktop-06-milestones.png') });
    console.log('Captured: desktop-06-milestones.png');
  }

  await desktopContext.close();

  // 2. Mobile Viewport (iPhone 14 / 390x844)
  console.log('Capturing Mobile Screenshots...');
  const mobileContext = await browser.newContext({
    ...devices['iPhone 14'],
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  // Mobile Screenshot 1: Smaran
  await mobilePage.screenshot({ path: path.join(outDir, 'mobile-01-smaran.png') });
  console.log('Captured: mobile-01-smaran.png');

  // Mobile Screenshot 2: Dhyana Focus Modal
  const mobileDhyanaBtn = await mobilePage.$('button[title*="ध्यान"], button:has-text("ध्यान कक्ष")');
  if (mobileDhyanaBtn) {
    await mobileDhyanaBtn.click();
    await mobilePage.waitForTimeout(600);
    await mobilePage.screenshot({ path: path.join(outDir, 'mobile-02-focus-modal.png') });
    console.log('Captured: mobile-02-focus-modal.png');
    const closeBtn = await mobilePage.$('button[aria-label="Close Focus Sanctuary"]');
    if (closeBtn) await closeBtn.click();
    await mobilePage.waitForTimeout(400);
  }

  // Mobile Screenshot 3: Feed
  const mobileFeedBtn = await mobilePage.$('nav[aria-label="Mobile Navigation"] button:has-text("Feed")');
  if (mobileFeedBtn) {
    await mobileFeedBtn.click();
    await mobilePage.waitForTimeout(600);
    await mobilePage.screenshot({ path: path.join(outDir, 'mobile-03-feed.png') });
    console.log('Captured: mobile-03-feed.png');
  }

  await mobileContext.close();
  await browser.close();

  console.log('All screenshots captured successfully in:', outDir);
}

run().catch((err) => {
  console.error('Screenshot run failed:', err);
  process.exit(1);
});

import fs from 'fs';
import path from 'path';

// Import Playwright
const playwrightPkg = await import('/Users/sakhi/Code/rishabhlab-bjg/node_modules/playwright/index.js');
const { chromium, devices } = playwrightPkg.default;

const workspaceScreenshotsDir = '/Users/sakhi/Code/vrindopnisad/screenshots';
const artifactScreenshotsDir = '/Users/sakhi/.gemini/antigravity/brain/74bd807f-5dbf-4891-a1b1-99827951d059/screenshots';

fs.mkdirSync(workspaceScreenshotsDir, { recursive: true });
fs.mkdirSync(artifactScreenshotsDir, { recursive: true });

async function saveScreenshot(page, filename) {
  const p1 = path.join(workspaceScreenshotsDir, filename);
  const p2 = path.join(artifactScreenshotsDir, filename);
  await page.screenshot({ path: p1, fullPage: false });
  fs.copyFileSync(p1, p2);
  console.log(`[SAVED] ${filename}`);
}

async function run() {
  console.log('--- Launching Chromium for Multi-Viewport UI Capture ---');
  const browser = await chromium.launch({ headless: true });
  const baseUrl = 'http://localhost:5173';

  // ==========================================
  // 1. DESKTOP MODE (1440 x 900, 2x scale)
  // ==========================================
  console.log('\n>>> Starting Desktop Captures (1440x900, 2x Retina)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const desktopPage = await desktopContext.newPage();

  // 1.1 Desktop: Smaran (Home Sanctuary)
  await desktopPage.goto(`${baseUrl}/?tab=smaran`, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1200);
  await saveScreenshot(desktopPage, 'desktop-01-smaran.png');

  // 1.2 Desktop: Padavali (Scriptures Reader)
  await desktopPage.goto(`${baseUrl}/?tab=padavali`, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1200);
  await saveScreenshot(desktopPage, 'desktop-02-padavali.png');

  // 1.3 Desktop: Darshan Feed
  await desktopPage.goto(`${baseUrl}/?tab=feed`, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1200);
  await saveScreenshot(desktopPage, 'desktop-03-feed.png');

  // 1.4 Desktop: Milestones & Streaks
  await desktopPage.goto(`${baseUrl}/?tab=milestones`, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1200);
  await saveScreenshot(desktopPage, 'desktop-04-milestones.png');

  // 1.5 Desktop: Milestone Blessing Modal
  const rosetteBtn = await desktopPage.$('[role="button"]:has-text("Niyam"), [role="button"]:has-text("Mala"), button:has-text("Niyam"), button:has-text("Mala")');
  if (rosetteBtn) {
    await rosetteBtn.click();
    await desktopPage.waitForTimeout(600);
    await saveScreenshot(desktopPage, 'desktop-05-milestone-blessing.png');
    // Close modal
    await desktopPage.keyboard.press('Escape');
    await desktopPage.waitForTimeout(300);
  }

  // 1.6 Desktop: Dhyana Mental Focus Sanctuary Modal
  await desktopPage.goto(`${baseUrl}/?tab=smaran`, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(800);
  const focusBtn = await desktopPage.$('button[title*="ध्यान"], button:has-text("ध्यान कक्ष")');
  if (focusBtn) {
    await focusBtn.click();
    await desktopPage.waitForTimeout(700);
    await saveScreenshot(desktopPage, 'desktop-06-focus-sanctuary.png');

    // Tab 2: Cognitive Impact
    const impactTab = await desktopPage.$('button:has-text("चित्त वृत्ति निरोध प्रभाव")');
    if (impactTab) {
      await impactTab.click();
      await desktopPage.waitForTimeout(500);
      await saveScreenshot(desktopPage, 'desktop-07-cognitive-impact.png');
    }

    const closeFocus = await desktopPage.$('button[aria-label="Close Focus Sanctuary"]');
    if (closeFocus) await closeFocus.click();
    await desktopPage.waitForTimeout(400);
  }

  // 1.7 Desktop: Rasik Saints Directory Modal
  const saintsBtn = await desktopPage.$('button:has-text("१३१ रसिक संत नामावली"), button:has-text("संत नामावली")');
  if (saintsBtn) {
    await saintsBtn.click();
    await desktopPage.waitForTimeout(600);
    await saveScreenshot(desktopPage, 'desktop-08-saints-directory.png');
    await desktopPage.keyboard.press('Escape');
    await desktopPage.waitForTimeout(400);
  }

  // 1.8 Desktop: Spotlight Search Modal (Cmd+K)
  const searchBtn = await desktopPage.$('button[aria-label="Search (Cmd+K)"]');
  if (searchBtn) {
    await searchBtn.click();
    await desktopPage.waitForTimeout(500);
    await saveScreenshot(desktopPage, 'desktop-09-spotlight-search.png');
    await desktopPage.keyboard.press('Escape');
    await desktopPage.waitForTimeout(400);
  }

  // 1.9 Desktop: Naam Japa Pillar Detail Modal
  const japaPillar = await desktopPage.$('div[role="button"]:has-text("नाम जप")');
  if (japaPillar) {
    await japaPillar.click();
    await desktopPage.waitForTimeout(600);
    await saveScreenshot(desktopPage, 'desktop-10-japa-pillar-modal.png');
    await desktopPage.keyboard.press('Escape');
    await desktopPage.waitForTimeout(400);
  }

  await desktopContext.close();

  // ==========================================
  // 2. TABLET MODE (iPad 820 x 1180, 2x scale)
  // ==========================================
  console.log('\n>>> Starting Tablet Captures (820x1180, 2x scale)...');
  const tabletContext = await browser.newContext({
    viewport: { width: 820, height: 1180 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const tabletPage = await tabletContext.newPage();

  // 2.1 Tablet: Smaran
  await tabletPage.goto(`${baseUrl}/?tab=smaran`, { waitUntil: 'networkidle' });
  await tabletPage.waitForTimeout(1000);
  await saveScreenshot(tabletPage, 'tablet-01-smaran.png');

  // 2.2 Tablet: Padavali
  await tabletPage.goto(`${baseUrl}/?tab=padavali`, { waitUntil: 'networkidle' });
  await tabletPage.waitForTimeout(1000);
  await saveScreenshot(tabletPage, 'tablet-02-padavali.png');

  // 2.3 Tablet: Feed
  await tabletPage.goto(`${baseUrl}/?tab=feed`, { waitUntil: 'networkidle' });
  await tabletPage.waitForTimeout(1000);
  await saveScreenshot(tabletPage, 'tablet-03-feed.png');

  // 2.4 Tablet: Milestones
  await tabletPage.goto(`${baseUrl}/?tab=milestones`, { waitUntil: 'networkidle' });
  await tabletPage.waitForTimeout(1000);
  await saveScreenshot(tabletPage, 'tablet-04-milestones.png');

  // 2.5 Tablet: Focus Modal
  await tabletPage.goto(`${baseUrl}/?tab=smaran`, { waitUntil: 'networkidle' });
  await tabletPage.waitForTimeout(800);
  const tabFocusBtn = await tabletPage.$('button[title*="ध्यान"], button:has-text("ध्यान कक्ष")');
  if (tabFocusBtn) {
    await tabFocusBtn.click();
    await tabletPage.waitForTimeout(600);
    await saveScreenshot(tabletPage, 'tablet-05-focus-modal.png');
    const closeTabFocus = await tabletPage.$('button[aria-label="Close Focus Sanctuary"]');
    if (closeTabFocus) await closeTabFocus.click();
    await tabletPage.waitForTimeout(400);
  }

  // 2.6 Tablet: Saints Directory Modal
  const tabSaintsBtn = await tabletPage.$('button:has-text("१३१ रसिक संत नामावली"), button:has-text("संत नामावली")');
  if (tabSaintsBtn) {
    await tabSaintsBtn.click();
    await tabletPage.waitForTimeout(600);
    await saveScreenshot(tabletPage, 'tablet-06-saints-directory.png');
    await tabletPage.keyboard.press('Escape');
    await tabletPage.waitForTimeout(400);
  }

  // 2.7 Tablet: Spotlight Modal
  const tabSearchBtn = await tabletPage.$('button[aria-label="Search (Cmd+K)"]');
  if (tabSearchBtn) {
    await tabSearchBtn.click();
    await tabletPage.waitForTimeout(500);
    await saveScreenshot(tabletPage, 'tablet-07-spotlight-search.png');
    await tabletPage.keyboard.press('Escape');
    await tabletPage.waitForTimeout(400);
  }

  await tabletContext.close();

  // ==========================================
  // 3. MOBILE MODE (iPhone 14 - 390 x 844, 2x scale)
  // ==========================================
  console.log('\n>>> Starting Mobile Captures (iPhone 14 / 390x844)...');
  const mobileContext = await browser.newContext({
    ...devices['iPhone 14'],
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileContext.newPage();

  // 3.1 Mobile: Smaran Sanctuary
  await mobilePage.goto(`${baseUrl}/?tab=smaran`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  await saveScreenshot(mobilePage, 'mobile-01-smaran.png');

  // 3.2 Mobile: Padavali Reader
  await mobilePage.goto(`${baseUrl}/?tab=padavali`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  await saveScreenshot(mobilePage, 'mobile-02-padavali.png');

  // 3.3 Mobile: Darshan Feed
  await mobilePage.goto(`${baseUrl}/?tab=feed`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  await saveScreenshot(mobilePage, 'mobile-03-feed.png');

  // 3.4 Mobile: Milestones
  await mobilePage.goto(`${baseUrl}/?tab=milestones`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  await saveScreenshot(mobilePage, 'mobile-04-milestones.png');

  // 3.5 Mobile: Navigation Drawer / Dropdown Menu
  await mobilePage.goto(`${baseUrl}/?tab=smaran`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(800);
  const mobileMenuBtn = await mobilePage.$('header button[aria-label*="Menu"]');
  if (mobileMenuBtn) {
    await mobileMenuBtn.click();
    await mobilePage.waitForTimeout(500);
    await saveScreenshot(mobilePage, 'mobile-05-nav-drawer.png');
    // Click outside / toggle to close
    await mobileMenuBtn.click();
    await mobilePage.waitForTimeout(300);
  }

  // 3.6 Mobile: Focus Modal
  const mobFocusBtn = await mobilePage.$('button[title*="ध्यान"], button:has-text("ध्यान कक्ष")');
  if (mobFocusBtn) {
    await mobFocusBtn.click();
    await mobilePage.waitForTimeout(600);
    await saveScreenshot(mobilePage, 'mobile-06-focus-modal.png');
    const closeMobFocus = await mobilePage.$('button[aria-label="Close Focus Sanctuary"]');
    if (closeMobFocus) await closeMobFocus.click();
    await mobilePage.waitForTimeout(400);
  }

  // 3.7 Mobile: Spotlight Search Modal
  const mobSearchBtn = await mobilePage.$('button[aria-label="Search (Cmd+K)"]');
  if (mobSearchBtn) {
    await mobSearchBtn.click();
    await mobilePage.waitForTimeout(500);
    await saveScreenshot(mobilePage, 'mobile-07-spotlight-search.png');
  }

  await mobileContext.close();

  await browser.close();
  console.log('\n=== All screenshots captured successfully across Desktop, Tablet, and Mobile! ===');
}

run().catch((err) => {
  console.error('Error during screenshot execution:', err);
  process.exit(1);
});


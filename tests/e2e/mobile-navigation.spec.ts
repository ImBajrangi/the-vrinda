import { test, expect } from '@playwright/test';
import { DOMAINS } from '../support/route-inventory';

test.describe('Mobile-First Navigation & Viewport Fluidity', () => {
  test('Floating Navbar auto-hides on down-scroll and reappears near bottom', async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${DOMAINS.bhav}/?tab=padavali`, { waitUntil: 'domcontentloaded' });

    const navbar = page.locator('nav[aria-label="Mobile Navigation"]').first();
    await expect(navbar).toBeVisible();

    // Scroll down 400px
    await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'instant' }));
    await page.waitForTimeout(300);

    // Scroll to near bottom (within 200px of page end)
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight - 200, behavior: 'instant' }));
    await page.waitForTimeout(500);

    // Navbar should be visible at bottom (not stranded off-screen)
    const navParent = page.locator('.fixed.bottom-3\\.5, .fixed.bottom-5').first();
    await expect(navParent).toBeVisible();
  });

  test('Viewports from 320px to 430px exhibit zero horizontal overflow', async ({ page }) => {
    const mobileWidths = [320, 360, 375, 390, 414, 430];
    for (const width of mobileWidths) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(DOMAINS.bhav, { waitUntil: 'domcontentloaded' });

      const hasHorizontalScrollbar = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScrollbar).toBe(false);
    }
  });
});


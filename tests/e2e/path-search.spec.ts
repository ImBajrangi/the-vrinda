import { test, expect } from '@playwright/test';
import { DOMAINS } from '../support/route-inventory';

test.describe('Search & Discovery Engine', () => {
  test('Spotlight search opens and searches Devanagari sacred keywords', async ({ page }) => {
    await page.goto(DOMAINS.bhav, { waitUntil: 'domcontentloaded' });

    // Open search modal via keyboard Cmd+K or UI icon
    const searchBtn = page.locator('button[title*="खोजें"], button[aria-label="Search"], [aria-label*="Search"]').first();
    if (await searchBtn.isVisible()) {
      await searchBtn.click();
    } else {
      await page.keyboard.press('Meta+k');
    }
    await page.waitForTimeout(400);

    const searchInput = page.locator('input[placeholder*="खोजें"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      // Type Devanagari query
      await searchInput.fill('राधा');
      await page.waitForTimeout(600);

      // Verify search results appear
      const results = page.locator('text=राधा').first();
      await expect(results).toBeVisible();

      // Test zero result
      await searchInput.fill('xyznonexistentterm123');
      await page.waitForTimeout(400);
      await expect(page.locator('text=कोई परिणाम नहीं मिला, text=नहीं मिला').first()).toBeVisible();

      await page.keyboard.press('Escape');
    }
  });
});


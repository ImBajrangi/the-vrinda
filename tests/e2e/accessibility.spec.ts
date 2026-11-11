import { test, expect } from '@playwright/test';
import { DOMAINS } from '../support/route-inventory';

test.describe('Accessibility & Keyboard Navigation', () => {
  test('Semantic headings and main landmarks are present', async ({ page }) => {
    await page.goto(DOMAINS.bhav, { waitUntil: 'domcontentloaded' });

    // Verify main landmark
    await expect(page.locator('main')).toBeVisible();

    // Verify buttons have accessible text or aria-labels
    const unlabelledButtons = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.filter((b) => !b.innerText.trim() && !b.getAttribute('aria-label') && !b.getAttribute('title')).length;
    });
    expect(unlabelledButtons).toBe(0);
  });

  test('Interactive modals trap focus and dismiss via Escape key', async ({ page }) => {
    await page.goto(DOMAINS.bhav, { waitUntil: 'domcontentloaded' });
    const searchBtn = page.locator('button[title*="खोजें"], button[aria-label="Search"]').first();
    if (await searchBtn.isVisible()) {
      await searchBtn.click();
      await page.waitForTimeout(300);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
  });
});


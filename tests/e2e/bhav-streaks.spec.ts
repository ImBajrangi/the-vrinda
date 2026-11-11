import { test, expect } from '@playwright/test';
import { DOMAINS } from '../support/route-inventory';

test.describe('Bhav Application — Devotion Streaks & Milestones', () => {
  test('Milestones view renders authentic streak progression', async ({ page }) => {
    await page.goto(`${DOMAINS.bhav}/?tab=milestones`, { waitUntil: 'domcontentloaded' });

    // Verify streak and milestones elements
    await expect(page.locator('text=अखंड निष्ठा, text=साधना सोपान, text=स्ट्रीक').first()).toBeVisible();

    // Verify badge or blessing sheets are interactive
    const badge = page.locator('[role="button"], button').filter({ hasText: /दिन|सोपान|कृपा/i }).first();
    if (await badge.isVisible()) {
      await badge.click();
      await page.waitForTimeout(300);
      await page.keyboard.press('Escape');
    }
  });
});


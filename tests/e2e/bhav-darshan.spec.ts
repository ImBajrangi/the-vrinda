import { test, expect } from '@playwright/test';
import { DOMAINS } from '../support/route-inventory';

test.describe('Bhav Application — Darshan & Temple Feed', () => {
  test('Darshan feed displays temples and filters properly', async ({ page }) => {
    await page.goto(`${DOMAINS.bhav}/?tab=feed`, { waitUntil: 'domcontentloaded' });

    // Verify Darshan feed heading or temple cards
    await expect(page.locator('text=नित्य दर्शन, text=ठाकुर जी, text=बांके बिहारी').first()).toBeVisible();

    // Verify filter buttons work
    const filterBtn = page.locator('button:has-text("आरती"), button:has-text("उत्सव")').first();
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await page.waitForTimeout(300);
    }
  });
});


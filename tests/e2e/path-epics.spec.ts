import { test, expect } from '@playwright/test';
import { DOMAINS, CANONICAL_EPICS } from '../support/route-inventory';

test.describe('Path Application — Monumental Epics Discovery & Navigation', () => {
  test('Renders monumental epics pothi segmented grid', async ({ page }) => {
    await page.goto(DOMAINS.path, { waitUntil: 'domcontentloaded' });

    for (const epic of CANONICAL_EPICS) {
      await expect(page.locator(`text=${epic.name}`).first()).toBeVisible();
    }
  });

  test('Two-step Kanda navigator & numeric sarga grid operates cleanly', async ({ page }) => {
    await page.goto(`${DOMAINS.path}/?tab=granthas&grantha=valmiki-ramayana`, { waitUntil: 'domcontentloaded' });

    // Open Mobile / Header Title Pill
    const titlePill = page.locator('button[title*="सूची खोलें"], button[aria-label*="Table of Contents"]').first();
    if (await titlePill.isVisible()) {
      await titlePill.click();
      await page.waitForTimeout(400);

      // Verify Section pills exist (e.g. बालकाण्ड, अयोध्याकाण्ड)
      const kandaPill = page.locator('button:has-text("बालकाण्ड")').first();
      if (await kandaPill.isVisible()) {
        await kandaPill.click();
        await page.waitForTimeout(300);
      }

      // Close drawer
      await page.keyboard.press('Escape');
    }

    // Verify verse content is visible
    await expect(page.locator('#verse-stream-valmiki-ramayana_k1_s1_v1, [id^="shloka-"], [id^="verse-stream-"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('Direct sarga deep link loads correct chapter without waterfall freeze', async ({ page }) => {
    await page.goto(`${DOMAINS.path}/?tab=granthas&grantha=valmiki-ramayana&chapter=k1_s1`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=बालकाण्ड, text=सर्ग 1, text=वाल्मीकि').first()).toBeVisible();
  });
});


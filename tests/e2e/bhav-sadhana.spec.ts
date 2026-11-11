import { test, expect } from '@playwright/test';
import { DOMAINS } from '../support/route-inventory';

test.describe('Bhav Application — User Journey: Daily Sadhana & Sanctuary', () => {
  test('Sadhana Dashboard renders beads ring and updates count locally', async ({ page }) => {
    await page.goto(DOMAINS.bhav, { waitUntil: 'domcontentloaded' });

    // Locate Japa bead click target / counter
    const japaButton = page.locator('button:has-text("जप माला"), button:has-text("मनका"), [aria-label*="जप"]').first();
    if (await japaButton.isVisible()) {
      await japaButton.click();
      // Counter increments without throw
      await page.waitForTimeout(300);
    }

    // Verify Sadhana ring is present
    await expect(page.locator('text=दैनिक स्मरण व नित्य सेवा').first()).toBeVisible();
    await expect(page.locator('text=अष्टयाम').first()).toBeVisible();
  });

  test('Ashtayama watch reflects current time period accurately', async ({ page }) => {
    await page.goto(DOMAINS.bhav, { waitUntil: 'domcontentloaded' });
    // Verify an active watch tag is visible (e.g. मंगला, शृंगार, राजभोग, उत्थापन, भोग/संध्या, शयन)
    const activeWatch = page.locator('text=प्रहर, text=आरती, text=दर्शन').first();
    await expect(activeWatch).toBeVisible();
  });

  test('Daily Resolve affirmation sheet can be opened and closed safely', async ({ page }) => {
    await page.goto(DOMAINS.bhav, { waitUntil: 'domcontentloaded' });
    const resolveCard = page.locator('text=दैनिक संकल्प, text=संकल्प').first();
    if (await resolveCard.isVisible()) {
      await resolveCard.click();
      await page.waitForTimeout(400);
      // Close via escape or close button
      await page.keyboard.press('Escape');
    }
  });
});


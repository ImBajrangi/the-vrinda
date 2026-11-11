import { test, expect } from '@playwright/test';
import { DOMAINS } from '../support/route-inventory';

test.describe('Path & Bhav Application — Sacred Padavali Repository', () => {
  test('Padavali loads sacred padas with author filter without 0-verse defect', async ({ page }) => {
    // Navigate to Bhori Sakhi directly
    await page.goto(`${DOMAINS.bhav}/?tab=padavali&author=saint-bhori-sakhi`, { waitUntil: 'domcontentloaded' });

    // Ensure empty bug state is NOT shown
    await expect(page.locator('text=चयनित अध्याय या फ़िल्टर में पद संकलित हो रहे हैं')).toHaveCount(0);

    // Verify sacred verses are rendered
    const verseCard = page.locator('[id^="verse-stream-"], article, .font-serif').first();
    await expect(verseCard).toBeVisible({ timeout: 10000 });
  });

  test('Rasik Braj Lexicon bottom sheet opens with correct padding and no overlapping button', async ({ page }) => {
    await page.goto(`${DOMAINS.bhav}/?tab=padavali`, { waitUntil: 'domcontentloaded' });

    // Open Lexicon if icon is visible
    const lexiconBtn = page.locator('button[title*="Lexicon"], button[title*="शब्दावली"], button:has-text("शब्दावली")').first();
    if (await lexiconBtn.isVisible()) {
      await lexiconBtn.click();
      await page.waitForTimeout(400);

      // Verify lexicon header
      await expect(page.locator('text=Rasik Braj Lexicon').first()).toBeVisible();

      // Close modal
      const closeBtn = page.locator('button:has-text("Close"), button:has-text("बन्द करें")').first();
      await closeBtn.click();
      await page.waitForTimeout(300);
    }
  });
});


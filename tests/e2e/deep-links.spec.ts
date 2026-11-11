import { test, expect } from '@playwright/test';
import { DOMAINS, DEEP_LINKS } from '../support/route-inventory';

test.describe('Deep Links & History Navigation', () => {
  test('Direct deep link to Gita Adhyay 1 renders with correct scripture context', async ({ page }) => {
    await page.goto(DEEP_LINKS.gitaChapter1, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=श्रीमद्भगवद्गीता').first()).toBeVisible({ timeout: 10000 });
  });

  test('Direct deep link to Hit Chaurasi Pad 1 renders authentic verse', async ({ page }) => {
    await page.goto(DEEP_LINKS.hitChaurasiPad1, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=श्री हित चौरासी, text=जोई जोई प्यारो करे').first()).toBeVisible({ timeout: 10000 });
  });

  test('Browser Back and Forward buttons preserve tab and reading position', async ({ page }) => {
    await page.goto(`${DOMAINS.bhav}/?tab=smaran`, { waitUntil: 'domcontentloaded' });
    await page.goto(`${DOMAINS.bhav}/?tab=feed`, { waitUntil: 'domcontentloaded' });

    // Go back to smaran
    await page.goBack();
    await expect(page.locator('text=दैनिक स्मरण व नित्य सेवा').first()).toBeVisible();

    // Go forward to feed
    await page.goForward();
    await expect(page.locator('text=नित्य दर्शन, text=ठाकुर जी').first()).toBeVisible();
  });
});


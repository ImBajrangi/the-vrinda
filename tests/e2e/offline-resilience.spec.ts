import { test, expect } from '@playwright/test';
import { DOMAINS } from '../support/route-inventory';
import { simulateOffline, restoreNetwork } from '../support/network-helpers';

test.describe('Failure & Offline Resilience', () => {
  test('Previously loaded scripture survives offline mode without crashing', async ({ page }) => {
    await page.goto(`${DOMAINS.path}/?tab=granthas&grantha=valmiki-ramayana`, { waitUntil: 'networkidle' });

    // Go offline
    await simulateOffline(page);
    await page.waitForTimeout(400);

    // Reading should still be functional without unhandled blank screen
    const verseContent = page.locator('#verse-stream-valmiki-ramayana_k1_s1_v1, [id^="shloka-"], [id^="verse-stream-"]').first();
    await expect(verseContent).toBeVisible();

    // Restore network
    await restoreNetwork(page);
  });
});


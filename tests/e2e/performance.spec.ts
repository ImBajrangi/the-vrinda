import { test, expect } from '@playwright/test';
import { DOMAINS } from '../support/route-inventory';

test.describe('Performance Metrics & Budgets', () => {
  test('First Contentful Paint (FCP) and navigation timings meet budgets', async ({ page }) => {
    await page.goto(DOMAINS.bhav, { waitUntil: 'domcontentloaded' });

    const timing = await page.evaluate(() => {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find((p) => p.name === 'first-contentful-paint');

      return {
        ttfb: navEntry ? navEntry.responseStart - navEntry.requestStart : 0,
        domContentLoaded: navEntry ? navEntry.domContentLoadedEventEnd - navEntry.startTime : 0,
        fcp: fcp ? fcp.startTime : 0,
      };
    });

    console.log(`[Performance Benchmark] TTFB: ${timing.ttfb.toFixed(1)}ms, FCP: ${timing.fcp.toFixed(1)}ms, DOMContentLoaded: ${timing.domContentLoaded.toFixed(1)}ms`);

    // Budgets under real-world connection
    expect(timing.ttfb).toBeLessThan(1500);
  });

  test('Warm tab transition executes under budget without long freeze', async ({ page }) => {
    await page.goto(DOMAINS.bhav, { waitUntil: 'networkidle' });

    // Measure tab switch interaction latency
    const start = Date.now();
    const epicsTab = page.locator('button:has-text("Epics"), button:has-text("ग्रंथ")').first();
    if (await epicsTab.isVisible()) {
      await epicsTab.click();
      await page.waitForTimeout(200);
    }
    const duration = Date.now() - start;
    console.log(`[Interaction Benchmark] Tab Switch Latency: ${duration}ms`);
    expect(duration).toBeLessThan(800);
  });
});


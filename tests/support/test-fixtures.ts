import { test as base, expect } from '@playwright/test';

/**
 * Custom Playwright Fixtures for Read-Only Production Testing
 */
export const test = base.extend<{
  isolatedContext: any;
}>({
  isolatedContext: async ({ browser }, use) => {
    // Isolated incognito context with zero residual cache or cookies
    const context = await browser.newContext({
      ignoreHTTPSErrors: false,
    });
    await use(context);
    await context.close();
  },
});

export { expect };


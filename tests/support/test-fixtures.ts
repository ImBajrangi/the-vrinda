import { test as base, expect, Browser, BrowserContext } from '@playwright/test';

export interface TestFixtures {
  isolatedContext: BrowserContext;
}

/**
 * Custom Playwright Fixtures for Read-Only Production Testing
 */
export const test = base.extend<TestFixtures>({
  isolatedContext: async (
    { browser }: { browser: Browser },
    use: (context: BrowserContext) => Promise<void>
  ) => {
    // Isolated incognito context with zero residual cache or cookies
    const context = await browser.newContext({
      ignoreHTTPSErrors: false,
    });
    await use(context);
    await context.close();
  },
});

export { expect };


import { Page, expect } from '@playwright/test';

export async function openMobileTab(page: Page, tabLabel: string) {
  const tabButton = page.locator(`nav[aria-label="Mobile Navigation"] button:has-text("${tabLabel}")`);
  if (await tabButton.isVisible()) {
    await tabButton.click();
  } else {
    // Top desktop navigation
    await page.locator(`button:has-text("${tabLabel}")`).first().click();
  }
}

export async function openMobileDrawer(page: Page) {
  const pill = page.locator('button[title*="खोलें"], button[aria-label*="Table of Contents"]').first();
  await expect(pill).toBeVisible();
  await pill.click();
  const drawer = page.locator('[role="dialog"], .drawer-scrollable').first();
  await expect(drawer).toBeVisible();
}

export async function closeMobileDrawer(page: Page) {
  const closeBtn = page.locator('button[aria-label="Close"], button[aria-label="बन्द करें"]').first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
  } else {
    await page.keyboard.press('Escape');
  }
}


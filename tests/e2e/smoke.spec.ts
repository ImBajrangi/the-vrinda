import { test, expect } from '@playwright/test';
import { DOMAINS } from '../support/route-inventory';

test.describe('Live Production Smoke Suite', () => {
  test('Bhav Sanctuary renders without unhandled runtime errors', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.goto(DOMAINS.bhav, { waitUntil: 'networkidle' });
    expect(pageErrors.length).toBe(0);

    // Verify key UI elements render
    await expect(page.locator('text=दैनिक स्मरण व नित्य सेवा').first()).toBeVisible();
    await expect(page.locator('text=अष्टयाम').first()).toBeVisible();
  });

  test('Path Parayana renders monumental epics grid without unhandled runtime errors', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.goto(DOMAINS.path, { waitUntil: 'networkidle' });
    expect(pageErrors.length).toBe(0);

    // Verify Epics navigation elements
    await expect(page.locator('text=सनातन महाग्रंथ पारायण').first()).toBeVisible();
    await expect(page.locator('text=श्रीमद् वाल्मीकि रामायण').first()).toBeVisible();
  });
});


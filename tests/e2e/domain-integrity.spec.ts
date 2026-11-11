import { test, expect } from '@playwright/test';
import { DOMAINS } from '../support/route-inventory';

test.describe('Phase 0: Domain & Deployment Integrity', () => {
  test('Bhav domain loads over valid HTTPS with correct canonical metadata', async ({ page }) => {
    const response = await page.goto(DOMAINS.bhav, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    // Verify title and canonical link
    const title = await page.title();
    expect(title).toContain('Home Sanctuary');
    expect(title).toContain('वृन्दोपनिषद् 2.0');

    const canonicalHref = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonicalHref).toBe('https://bhav.vrindopnishad.in/');

    // Verify landing view is Sadhana Sanctuary
    await expect(page.locator('text=दैनिक स्मरण व नित्य सेवा').first()).toBeVisible();
  });

  test('Path domain loads over valid HTTPS and defaults to Sanatan Mahagranth Parayana', async ({ page }) => {
    const response = await page.goto(DOMAINS.path, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    const title = await page.title();
    expect(title).toContain('Sanatan Mahagranth Parayana');

    const canonicalHref = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonicalHref).toContain('path.vrindopnishad.in');

    // Verify landing view is Sanatan Mahagranth
    await expect(page.locator('text=सनातन महाग्रंथ पारायण').first()).toBeVisible();
  });

  test('Robots.txt references domain-specific sitemaps correctly', async ({ request }) => {
    const bhavRobots = await request.get(`${DOMAINS.bhav}/robots.txt`);
    expect(bhavRobots.status()).toBe(200);
    const bhavText = await bhavRobots.text();
    expect(bhavText).toContain('Sitemap: https://bhav.vrindopnishad.in/sitemap.xml');

    const pathRobots = await request.get(`${DOMAINS.path}/robots.txt`);
    expect(pathRobots.status()).toBe(200);
    const pathText = await pathRobots.text();
    expect(pathText).toContain('Sitemap: https://path.vrindopnishad.in/sitemap.xml');
  });

  test('Sitemaps are partitioned according to canonical domain responsibilities', async ({ request }) => {
    const bhavSitemap = await request.get(`${DOMAINS.bhav}/sitemap.xml`);
    expect(bhavSitemap.status()).toBe(200);
    const bhavXml = await bhavSitemap.text();
    expect(bhavXml).toContain('sitemap-main.xml');
    expect(bhavXml).toContain('sitemap-padas.xml');

    const pathSitemap = await request.get(`${DOMAINS.path}/sitemap.xml`);
    expect(pathSitemap.status()).toBe(200);
    const pathXml = await pathSitemap.text();
    expect(pathXml).toContain('sitemap-path-main.xml');
    expect(pathXml).toContain('sitemap-path-granthas.xml');
  });
});


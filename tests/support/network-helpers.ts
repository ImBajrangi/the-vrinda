import { Page, CDPSession } from '@playwright/test';

export async function simulateSlow4G(page: Page) {
  try {
    const client: CDPSession = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150, // ms
      downloadThroughput: (1.5 * 1024 * 1024) / 8, // 1.5 Mbps
      uploadThroughput: (750 * 1024) / 8, // 750 Kbps
    });
  } catch { }
}

export async function simulateOffline(page: Page) {
  try {
    const client: CDPSession = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    });
  } catch { }
}

export async function restoreNetwork(page: Page) {
  try {
    const client: CDPSession = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });
  } catch { }
}


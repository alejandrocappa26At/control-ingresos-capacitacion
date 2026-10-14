import { chromium } from 'playwright-core';

/** Captura el login actual para comparativa visual (baseline vs rediseño). */
const BASE = process.env.CIC_SHOT_BASE ?? 'http://localhost:3000';
const TAG = process.env.CIC_SHOT_TAG ?? 'actual';

const browser = await chromium.launch({ channel: 'msedge', headless: true });

for (const [name, w, h] of [
  ['desktop', 1440, 900],
  ['laptop', 1280, 800],
  ['mobile', 390, 844],
]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(1500); // asentar animaciones de entrada
  await page.screenshot({ path: `scripts/.tmp-login-${TAG}-${name}.png` });

  // Estado de error (solo en desktop): credenciales inválidas.
  if (name === 'desktop' && process.env.CIC_SHOT_ERROR === '1') {
    await page.locator('#login-user').fill('noexiste');
    await page.locator('#login-password').fill('incorrecta');
    await page.locator('button[type="submit"]').click();
    await page.getByText('Credenciales incorrectas').first().waitFor({ timeout: 15000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `scripts/.tmp-login-${TAG}-error.png` });
  }

  await ctx.close();
}

await browser.close();
console.log(`OK screenshots (${TAG})`);

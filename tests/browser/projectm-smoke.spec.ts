import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const wasmJs = path.join(root, 'public', 'vendor', 'projectm', 'webmilk-projectm.js');
const wasmBinary = path.join(root, 'public', 'vendor', 'projectm', 'webmilk-projectm.wasm');
const sourceWasmJs = path.join(root, 'src', 'vendor', 'projectm', 'webmilk-projectm.js');
const sourceWasmBinary = path.join(root, 'src', 'vendor', 'projectm', 'webmilk-projectm.wasm');

test.describe('ProjectM plug-in smoke harness', () => {
  test.skip(
    !fs.existsSync(wasmJs) || !fs.existsSync(wasmBinary) || !fs.existsSync(sourceWasmJs) || !fs.existsSync(sourceWasmBinary),
    'ProjectM WASM artifacts are missing. Run npm run wasm:projectm first.',
  );

  test('renders via plugin definition and generic frame requests', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Host-style ProjectM frame requests' })).toBeVisible();
    await page.getByRole('button', { name: 'Run smoke test' }).click();

    try {
      await expect(page.locator('#status')).toHaveText('PASS', { timeout: 45_000 });
    } catch (err) {
      const harnessLog = await page.locator('#log').textContent().catch(() => '');
      throw new Error(`${err instanceof Error ? err.message : String(err)}\n\nHarness log:\n${harnessLog}`);
    }
    await expect(page.locator('#log')).toContainText('PASS: canvas sample changed after sequential frame rendering');
    await expect(page.locator('#log')).toContainText('PASS: forceReset + warm-up request completed');
    expect(consoleErrors).toEqual([]);
  });
});

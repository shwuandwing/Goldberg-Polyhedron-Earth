import { chromium } from 'playwright';

/**
 * Visual Verification Script for Goldberg Earth
 * Captures key geographical landmarks to ensure correct orientation and rendering.
 */
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  const url = 'http://localhost:5174/';
  console.log(`Connecting to ${url}...`);
  
  try {
    await page.goto(url);
    await page.waitForSelector('canvas', { timeout: 60000 });
    await page.waitForTimeout(3000); // Allow time for board generation

    const canvas = await page.$('canvas');
    const box = await canvas.boundingBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // 1. Initial State (Typically Africa/Prime Meridian)
    console.log('Capturing: 01_Prime_Meridian.png');
    await page.screenshot({ path: 'test_results/01_Prime_Meridian.png' });

    // 2. Look at North Pole
    console.log('Capturing: 02_North_Pole.png');
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx, cy + 300, { steps: 30 });
    await page.mouse.up();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test_results/02_North_Pole.png' });

    // 3. Look at South Pole
    console.log('Capturing: 03_South_Pole.png');
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx, cy - 600, { steps: 30 });
    await page.mouse.up();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test_results/03_South_Pole.png' });

    // 4. Rotate to Pacific / Bering Strait
    console.log('Capturing: 04_Bering_Strait.png');
    // Reset to center first (approximate)
    await page.reload();
    await page.waitForTimeout(3000);
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 500, cy, { steps: 30 }); 
    await page.mouse.up();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test_results/04_Bering_Strait.png' });

    // 5. Verify Hover Highlight
    console.log('Capturing: 05_Hover_State.png');
    await page.mouse.move(cx, cy);
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test_results/05_Hover_State.png' });

    console.log('Verification suite complete. Check the "test_results" folder.');
  } catch (e) {
    console.error('Test failed:', e);
  } finally {
    await browser.close();
  }
})();

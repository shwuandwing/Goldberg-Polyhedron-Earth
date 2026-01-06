import { chromium } from 'playwright';

/**
 * Zoom Verification Script for Goldberg Earth
 * Tests zoom in/out functionality and captures artifacts.
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
    await page.waitForTimeout(3000);

    const canvas = await page.$('canvas');
    const box = await canvas.boundingBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // 1. Initial State
    console.log('Capturing: zoom_01_default.png');
    await page.screenshot({ path: 'test_results/zoom_01_default.png' });

    // 2. Zoom in moderate
    console.log('Zooming in (moderate)...');
    await page.mouse.move(cx, cy);
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, -200); // Negative is zoom in for some reason in playwright? Or positive?
      // Actually wheel(deltaX, deltaY). deltaY > 0 is scroll down (usually zoom out)
    }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test_results/zoom_02_in_moderate.png' });

    // 3. Zoom in deep (Extreme)
    console.log('Zooming in (extreme)...');
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, -500); 
    }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test_results/zoom_03_in_extreme.png' });

    // 4. Zoom out extreme
    console.log('Zooming out (extreme)...');
    for (let i = 0; i < 30; i++) {
      await page.mouse.wheel(0, 1000); 
    }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test_results/zoom_04_out_extreme.png' });

    console.log('Zoom verification complete.');
  } catch (e) {
    console.error('Test failed:', e);
  } finally {
    await browser.close();
  }
})();

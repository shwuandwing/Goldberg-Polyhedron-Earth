import { chromium } from 'playwright';

/**
 * Rotation Shape Verification Script
 * Captures a landmass at the center and at the edge to check for distortion or culling issues.
 */
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:5174/');
  await page.waitForSelector('canvas', { timeout: 60000 });
  await page.waitForTimeout(3000);

  const canvas = await page.$('canvas');
  const box = await canvas.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  // 1. Australia at Center (Approximate starting view)
  console.log('Capturing: Australia at Center...');
  await page.screenshot({ path: 'test_results/rotation_01_center.png' });

  // 2. Rotate Australia to the edge (Drag mouse Left to spin globe Right/East)
  console.log('Rotating Australia to the edge...');
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx - 350, cy, { steps: 50 }); 
  await page.mouse.up();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test_results/rotation_02_edge.png' });

  // 3. Extreme rotation to check for "jumping into view"
  console.log('Aggressive spinning to check culling/jumping...');
  for(let i=0; i<3; i++) {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 500, cy, { steps: 20 });
    await page.mouse.up();
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test_results/rotation_03_spun.png' });

  await browser.close();
  console.log('Rotation verification complete.');
})();

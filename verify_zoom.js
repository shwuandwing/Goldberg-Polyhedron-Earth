import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('canvas', { timeout: 60000 });
  await page.waitForTimeout(3000);

  const canvas = await page.$('canvas');
  const box = await canvas.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  console.log('Default capture...');
  await page.screenshot({ path: 'test_results/zoom_01_default.png' });

  console.log('Zooming in to the limit...');
  await page.mouse.move(cx, cy);
  for (let i = 0; i < 100; i++) {
    await page.mouse.wheel(0, -500); 
  }
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test_results/zoom_02_in_deep.png' });

  console.log('Zooming out to the limit...');
  for (let i = 0; i < 150; i++) {
    await page.mouse.wheel(0, 500); 
  }
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test_results/zoom_03_out_far.png' });

  await browser.close();
  console.log('Zoom test complete.');
})();

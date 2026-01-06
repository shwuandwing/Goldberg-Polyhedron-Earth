import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport to a good size
  await page.setViewportSize({ width: 1280, height: 800 });

  console.log('Navigating to http://localhost:5174/ ...');
  await page.goto('http://localhost:5174/');

  // Wait for board to load
  console.log('Waiting for board to calculate...');
  await page.waitForSelector('canvas', { timeout: 60000 });
  // Wait a bit more for rendering to stabilize
  await page.waitForTimeout(2000);

  console.log('Capturing initial state...');
  await page.screenshot({ path: 'screenshot_initial.png' });

  // Rotate the globe
  console.log('Rotating globe...');
  const canvas = await page.$('canvas');
  const box = await canvas.boundingBox();
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Perform a drag to rotate
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 200, centerY + 50, { steps: 20 });
  await page.mouse.up();

  await page.waitForTimeout(1000);
  console.log('Capturing rotated state...');
  await page.screenshot({ path: 'screenshot_rotated.png' });

  // Try to hover over a cell
  console.log('Hovering over a cell...');
  await page.mouse.move(centerX, centerY);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshot_hover.png' });

  await browser.close();
  console.log('Done.');
})();

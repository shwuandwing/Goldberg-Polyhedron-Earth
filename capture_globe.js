import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1280, height: 800 });

  console.log('Navigating to http://localhost:5174/ ...');
  await page.goto('http://localhost:5174/');

  console.log('Waiting for board to calculate...');
  await page.waitForSelector('canvas', { timeout: 60000 });
  await page.waitForTimeout(2000);

  console.log('Capturing initial state...');
  await page.screenshot({ path: 'screenshot_initial.png' });

  const canvas = await page.$('canvas');
  const box = await canvas.boundingBox();
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  const drags = [
    { dx: 400, dy: 0, name: 'rotated_east' },
    { dx: -400, dy: 0, name: 'rotated_west' },
    { dx: 0, dy: 400, name: 'rotated_south' }
  ];

  for (const drag of drags) {
    console.log(`Rotating globe: ${drag.name}...`);
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + drag.dx, centerY + drag.dy, { steps: 20 });
    await page.mouse.up();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `screenshot_${drag.name}.png` });
    
    // Reset position slightly by dragging back or just let it be
  }

  console.log('Hovering over a cell...');
  await page.mouse.move(centerX, centerY);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshot_hover.png' });

  await browser.close();
  console.log('Done.');
})();
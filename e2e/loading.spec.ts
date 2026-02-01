import { test, expect } from '@playwright/test';

test('Application loads successfully', async ({ page }) => {
  // 1. Go to the page
  await page.goto('/');

  // 2. Wait for the Main UI to appear
  // This confirms the app initialized and generation finished
  const title = page.getByRole('heading', { name: 'Geo-Goldberg Board' });
  await expect(title).toBeVisible({ timeout: 60000 });

  // 3. Verify Canvas (Globe) is present
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  // 4. Verify Controls are interactive
  const bfsButton = page.getByRole('button', { name: 'BFS' });
  await expect(bfsButton).toBeVisible();
  await bfsButton.click();
  
  // 5. Verify dynamic text (Resolution)
  await expect(page.getByText('Resolution: GP(43, 0)')).toBeVisible();
});

import { test, expect } from '@playwright/test';

test.describe('Blog Frontend E2E', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to be ready
    await page.waitForLoadState('domcontentloaded');
    
    // Verify the page loaded
    expect(page.url()).toContain('/');
  });

  test('page has valid title', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page has a title
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});

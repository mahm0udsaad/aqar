import { test, expect } from '@playwright/test';

test.describe('Property Image Upload', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the admin dashboard before each test
    await page.goto('/admin/dashboard');
  });

  test('should upload an image and display it in the property details', async ({ page }) => {
    // Navigate to the properties section
    await page.click('text=Properties');

    // Click on the "Add New Property" button
    await page.click('text=Add New Property');

    // Fill in the property details
    await page.fill('input[name="title"]', 'Test Property');
    await page.fill('textarea[name="description"]', 'This is a test property description.');
    await page.fill('input[name="price"]', '100000');
    // ... fill in other required fields

    // Upload an image
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('input[type="file"]'),
    ]);
    await fileChooser.setFiles('tests/e2e/fixtures/test-image.jpg');

    // Wait for the image to be uploaded and displayed
    await page.waitForSelector('img[alt="Test Property"]');

    // Verify that the image is displayed
    const image = page.locator('img[alt="Test Property"]');
    await expect(image).toBeVisible();
  });
});
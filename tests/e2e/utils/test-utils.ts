import { Page, expect } from '@playwright/test'
import { testConfig } from '../test.config'

export class TestUtils {
  constructor(private page: Page) {}

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Take a screenshot with a custom name
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `tests/e2e/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    })
  }

  /**
   * Generate unique test data with timestamp
   */
  generateUniqueTestData() {
    const timestamp = Date.now()
    return {
      property: {
        ...testConfig.testData.property,
        title: `${testConfig.testData.property.title} ${timestamp}`,
        location: `${testConfig.testData.property.location} ${timestamp}`,
      },
      category: {
        ...testConfig.testData.category,
        name: `${testConfig.testData.category.name} ${timestamp}`,
      }
    }
  }

  /**
   * Wait for toast/notification message
   */
  async waitForToast(message: string) {
    await expect(this.page.locator(`text=${message}`)).toBeVisible({ 
      timeout: testConfig.timeouts.medium 
    })
  }

  /**
   * Clear all test data (run after tests)
   */
  async cleanupTestData() {
    try {
      // Navigate to admin dashboard
      await this.page.goto('/en/admin')
      
      // Clean up test properties
      await this.cleanupTestProperties()
      
      // Clean up test categories
      await this.cleanupTestCategories()
      
    } catch (error) {
      console.warn('Cleanup failed:', error)
    }
  }

  /**
   * Clean up test properties
   */
  private async cleanupTestProperties() {
    await this.page.goto('/en/admin/properties')
    
    // Find all test properties (those with "Test Property E2E" in title)
    const testProperties = this.page.locator('text=/Test Property E2E/')
    const count = await testProperties.count()
    
    for (let i = 0; i < count; i++) {
      try {
        // Get the property row
        const propertyRow = testProperties.nth(i).locator('..').locator('..')
        
        // Click delete button
        await propertyRow.locator('[data-testid="delete-button"]').click()
        
        // Confirm deletion
        await this.page.click('text=Confirm Delete')
        
        // Wait for deletion to complete
        await this.waitForToast('Property deleted successfully')
        
        // Wait a bit between deletions
        await this.page.waitForTimeout(500)
      } catch (error) {
        console.warn(`Failed to delete test property ${i}:`, error)
      }
    }
  }

  /**
   * Clean up test categories
   */
  private async cleanupTestCategories() {
    await this.page.goto('/en/admin/categories')
    
    // Find all test categories (those with "Test Category E2E" in name)
    const testCategories = this.page.locator('text=/Test Category E2E/')
    const count = await testCategories.count()
    
    for (let i = 0; i < count; i++) {
      try {
        // Get the category card
        const categoryCard = testCategories.nth(i).locator('..').locator('..')
        
        // Click delete button
        await categoryCard.locator('[data-testid="delete-button"]').click()
        
        // Confirm deletion
        await this.page.click('text=Delete Category')
        
        // Wait for deletion to complete
        await this.waitForToast('Category deleted successfully')
        
        // Wait a bit between deletions
        await this.page.waitForTimeout(500)
      } catch (error) {
        console.warn(`Failed to delete test category ${i}:`, error)
      }
    }
  }

  /**
   * Create test image file for upload testing
   */
  async createTestImage(): Promise<Buffer> {
    // Create a simple test image (1x1 pixel PNG)
    const testImageData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // Width: 1, Height: 1
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // Bit depth: 8, Color type: 2
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, // Image data
      0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 
      0x01, 0xE2, 0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, // IEND chunk
      0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ])
    
    return testImageData
  }

  /**
   * Verify dashboard statistics are reasonable
   */
  async verifyDashboardStats() {
    await this.page.goto('/en/admin')
    
    // Check that all stat cards are visible
    await expect(this.page.locator('[data-testid="total-properties"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="total-categories"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="featured-count"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="total-value"]')).toBeVisible()
    
    // Verify stats contain numbers
    const totalProps = await this.page.locator('[data-testid="total-properties"]').textContent()
    const totalCats = await this.page.locator('[data-testid="total-categories"]').textContent()
    
    expect(totalProps).toMatch(/\d+/)
    expect(totalCats).toMatch(/\d+/)
  }

  /**
   * Fill form field safely (clear first, then fill)
   */
  async fillField(selector: string, value: string) {
    await this.page.fill(selector, '')
    await this.page.fill(selector, value)
  }

  /**
   * Click and wait for navigation
   */
  async clickAndWaitForNavigation(selector: string) {
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click(selector)
    ])
  }

  /**
   * Retry an operation with exponential backoff
   */
  async retry<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 3, 
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt)
          await this.page.waitForTimeout(delay)
        }
      }
    }
    
    throw lastError!
  }
} 
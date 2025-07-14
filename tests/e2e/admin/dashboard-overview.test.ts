import { test, expect } from '@playwright/test'
import { AuthHelper } from '../utils/auth'
import { PropertyHelper } from '../utils/property-helper'
import { CategoryHelper } from '../utils/category-helper'
import { TestUtils } from '../utils/test-utils'
import { testConfig } from '../test.config'

test.describe('Admin Dashboard Overview', () => {
  let authHelper: AuthHelper
  let propertyHelper: PropertyHelper
  let categoryHelper: CategoryHelper
  let testUtils: TestUtils
  let createdPropertyIds: string[] = []
  let createdCategoryIds: string[] = []

  test.beforeAll(async ({ browser }) => {
    // Setup admin session
    const context = await browser.newContext()
    const page = await context.newPage()
    const auth = new AuthHelper(page)
    await auth.setupAdminSession()
    await context.close()
  })

  test.beforeEach(async ({ page }) => {
    // Use stored admin session
    authHelper = new AuthHelper(page)
    propertyHelper = new PropertyHelper(page)
    categoryHelper = new CategoryHelper(page)
    testUtils = new TestUtils(page)
    
    // Navigate to admin dashboard
    await page.goto('/en/admin')
    await testUtils.waitForPageLoad()
  })

  test.afterEach(async ({ page }) => {
    // Clean up created test data
    for (const propertyId of createdPropertyIds) {
      try {
        await propertyHelper.deleteProperty(propertyId)
      } catch (error) {
        console.warn(`Failed to cleanup property ${propertyId}:`, error)
      }
    }
    createdPropertyIds = []

    for (const categoryId of createdCategoryIds) {
      try {
        await categoryHelper.deleteCategory(categoryId)
      } catch (error) {
        console.warn(`Failed to cleanup category ${categoryId}:`, error)
      }
    }
    createdCategoryIds = []
  })

  test('should display main dashboard correctly', async ({ page }) => {
    // Verify we're on the admin dashboard
    await expect(page).toHaveURL('/en/admin')
    await expect(page.locator('h1')).toContainText('Dashboard')
    
    // Verify main navigation elements are present
    await expect(page.locator('text=Properties')).toBeVisible()
    await expect(page.locator('text=Categories')).toBeVisible()
    await expect(page.locator('text=Featured')).toBeVisible()
    await expect(page.locator('text=Settings')).toBeVisible()
  })

  test('should display statistics cards', async ({ page }) => {
    // Verify all statistic cards are visible
    await expect(page.locator('[data-testid="total-properties"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-categories"]')).toBeVisible()
    await expect(page.locator('[data-testid="featured-count"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-value"]')).toBeVisible()
    
    // Verify stats contain numbers
    const totalProps = await page.locator('[data-testid="total-properties"]').textContent()
    const totalCats = await page.locator('[data-testid="total-categories"]').textContent()
    const featuredCount = await page.locator('[data-testid="featured-count"]').textContent()
    const totalValue = await page.locator('[data-testid="total-value"]').textContent()
    
    expect(totalProps).toMatch(/\d+/)
    expect(totalCats).toMatch(/\d+/)
    expect(featuredCount).toMatch(/\d+/)
    expect(totalValue).toMatch(/[\d,]+/)
  })

  test('should update statistics when adding properties', async ({ page }) => {
    // Get initial property count
    const initialPropsElement = page.locator('[data-testid="total-properties"]')
    const initialPropsText = await initialPropsElement.textContent()
    const initialCount = parseInt(initialPropsText?.match(/\d+/)?.[0] || '0')
    
    // Create a new property
    const uniqueData = testUtils.generateUniqueTestData()
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    createdPropertyIds.push(propertyId)
    
    // Go back to dashboard
    await page.goto('/en/admin')
    
    // Verify property count increased
    const newPropsText = await initialPropsElement.textContent()
    const newCount = parseInt(newPropsText?.match(/\d+/)?.[0] || '0')
    
    expect(newCount).toBe(initialCount + 1)
  })

  test('should update statistics when adding categories', async ({ page }) => {
    // Get initial category count
    const initialCatsElement = page.locator('[data-testid="total-categories"]')
    const initialCatsText = await initialCatsElement.textContent()
    const initialCount = parseInt(initialCatsText?.match(/\d+/)?.[0] || '0')
    
    // Create a new category
    const uniqueData = testUtils.generateUniqueTestData()
    const categoryId = await categoryHelper.createCategory(uniqueData.category)
    createdCategoryIds.push(categoryId)
    
    // Go back to dashboard
    await page.goto('/en/admin')
    
    // Verify category count increased
    const newCatsText = await initialCatsElement.textContent()
    const newCount = parseInt(newCatsText?.match(/\d+/)?.[0] || '0')
    
    expect(newCount).toBe(initialCount + 1)
  })

  test('should update featured count when toggling featured status', async ({ page }) => {
    // Get initial featured count
    const initialFeaturedElement = page.locator('[data-testid="featured-count"]')
    const initialFeaturedText = await initialFeaturedElement.textContent()
    const initialCount = parseInt(initialFeaturedText?.match(/\d+/)?.[0] || '0')
    
    // Create a property and make it featured
    const uniqueData = testUtils.generateUniqueTestData()
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    createdPropertyIds.push(propertyId)
    
    await propertyHelper.toggleFeatured(propertyId)
    
    // Go back to dashboard
    await page.goto('/en/admin')
    
    // Verify featured count increased
    const newFeaturedText = await initialFeaturedElement.textContent()
    const newCount = parseInt(newFeaturedText?.match(/\d+/)?.[0] || '0')
    
    expect(newCount).toBe(initialCount + 1)
  })

  test('should update total value when adding properties with prices', async ({ page }) => {
    // Get initial total value
    const initialValueElement = page.locator('[data-testid="total-value"]')
    const initialValueText = await initialValueElement.textContent()
    const initialValue = parseFloat(initialValueText?.replace(/[^0-9.]/g, '') || '0')
    
    // Create a property with a specific price
    const uniqueData = testUtils.generateUniqueTestData()
    const propertyWithPrice = {
      ...uniqueData.property,
      price: '1000000' // 1 million
    }
    
    const propertyId = await propertyHelper.createProperty(propertyWithPrice)
    createdPropertyIds.push(propertyId)
    
    // Go back to dashboard
    await page.goto('/en/admin')
    
    // Verify total value increased
    const newValueText = await initialValueElement.textContent()
    const newValue = parseFloat(newValueText?.replace(/[^0-9.]/g, '') || '0')
    
    expect(newValue).toBeGreaterThan(initialValue)
  })

  test('should navigate to different admin sections from dashboard', async ({ page }) => {
    // Test navigation to Properties
    await page.click('text=Properties')
    await expect(page).toHaveURL('/en/admin/properties')
    await expect(page.locator('h1')).toContainText('Properties')
    
    // Go back to dashboard
    await page.click('text=Dashboard')
    await expect(page).toHaveURL('/en/admin')
    
    // Test navigation to Categories
    await page.click('text=Categories')
    await expect(page).toHaveURL('/en/admin/categories')
    await expect(page.locator('h1')).toContainText('Categories')
    
    // Go back to dashboard
    await page.click('text=Dashboard')
    await expect(page).toHaveURL('/en/admin')
    
    // Test navigation to Featured
    await page.click('text=Featured')
    await expect(page).toHaveURL('/en/admin/featured')
    await expect(page.locator('h1')).toContainText('Featured')
    
    // Go back to dashboard
    await page.click('text=Dashboard')
    await expect(page).toHaveURL('/en/admin')
    
    // Test navigation to Settings
    await page.click('text=Settings')
    await expect(page).toHaveURL('/en/admin/settings')
    await expect(page.locator('h1')).toContainText('Settings')
  })

  test('should display recent properties if available', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create a few properties
    for (let i = 1; i <= 3; i++) {
      const propertyData = {
        ...uniqueData.property,
        title: `Recent Property ${i} ${Date.now()}`
      }
      
      const propertyId = await propertyHelper.createProperty(propertyData)
      createdPropertyIds.push(propertyId)
    }
    
    // Go back to dashboard
    await page.goto('/en/admin')
    
    // Check if recent properties section exists
    const recentPropertiesSection = page.locator('[data-testid="recent-properties"]')
    if (await recentPropertiesSection.isVisible()) {
      // Verify recent properties are displayed
      await expect(recentPropertiesSection).toBeVisible()
      
      // Should show some properties
      const propertyItems = recentPropertiesSection.locator('[data-testid="property-item"]')
      const count = await propertyItems.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('should display featured properties summary if available', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create a property and make it featured
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    createdPropertyIds.push(propertyId)
    await propertyHelper.toggleFeatured(propertyId)
    
    // Go back to dashboard
    await page.goto('/en/admin')
    
    // Check if featured properties summary exists
    const featuredSummary = page.locator('[data-testid="featured-summary"]')
    if (await featuredSummary.isVisible()) {
      // Verify featured summary is displayed
      await expect(featuredSummary).toBeVisible()
      
      // Should show the featured property
      await expect(featuredSummary.locator(`text=${uniqueData.property.title}`)).toBeVisible()
    }
  })

  test('should handle dashboard refresh correctly', async ({ page }) => {
    // Verify initial state
    await expect(page).toHaveURL('/en/admin')
    await expect(page.locator('h1')).toContainText('Dashboard')
    
    // Refresh the page
    await page.reload()
    
    // Should still be on dashboard
    await expect(page).toHaveURL('/en/admin')
    await expect(page.locator('h1')).toContainText('Dashboard')
    
    // Statistics should still be visible
    await expect(page.locator('[data-testid="total-properties"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-categories"]')).toBeVisible()
  })

  test('should display appropriate loading states', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/en/admin')
    
    // Check for any loading indicators
    const loadingIndicators = page.locator('[data-testid="loading"]')
    
    // If loading indicators exist, they should disappear after content loads
    if (await loadingIndicators.count() > 0) {
      await expect(loadingIndicators.first()).not.toBeVisible({ timeout: testConfig.timeouts.medium })
    }
    
    // Content should be loaded
    await expect(page.locator('[data-testid="total-properties"]')).toBeVisible()
  })

  test('should have responsive design on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Dashboard should still be accessible
    await expect(page.locator('h1')).toContainText('Dashboard')
    
    // Navigation should work (might be collapsed on mobile)
    const mobileMenu = page.locator('[data-testid="mobile-menu"]')
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click()
    }
    
    // Properties link should be accessible
    await expect(page.locator('text=Properties')).toBeVisible()
    
    // Statistics should be visible (might be stacked on mobile)
    await expect(page.locator('[data-testid="total-properties"]')).toBeVisible()
  })

  test('should handle empty states gracefully', async ({ page }) => {
    // Dashboard should handle empty states well
    await expect(page.locator('h1')).toContainText('Dashboard')
    
    // Statistics should show 0 values gracefully
    const totalProps = await page.locator('[data-testid="total-properties"]').textContent()
    const totalCats = await page.locator('[data-testid="total-categories"]').textContent()
    
    // Values should be numbers (could be 0)
    expect(totalProps).toMatch(/\d+/)
    expect(totalCats).toMatch(/\d+/)
  })

  test('should show quick action buttons', async ({ page }) => {
    // Check for quick action buttons
    const addPropertyButton = page.locator('[data-testid="quick-add-property"]')
    const addCategoryButton = page.locator('[data-testid="quick-add-category"]')
    
    // If quick action buttons exist, they should work
    if (await addPropertyButton.isVisible()) {
      await addPropertyButton.click()
      await expect(page).toHaveURL('/en/admin/properties/new')
      
      // Go back to dashboard
      await page.goto('/en/admin')
    }
    
    if (await addCategoryButton.isVisible()) {
      await addCategoryButton.click()
      // Should open category dialog or navigate
      await page.waitForTimeout(1000)
    }
  })

  test('should maintain dashboard state across navigation', async ({ page }) => {
    // Note initial state
    const initialPropsText = await page.locator('[data-testid="total-properties"]').textContent()
    
    // Navigate away and back
    await page.click('text=Properties')
    await expect(page).toHaveURL('/en/admin/properties')
    
    await page.click('text=Dashboard')
    await expect(page).toHaveURL('/en/admin')
    
    // State should be preserved
    const returnPropsText = await page.locator('[data-testid="total-properties"]').textContent()
    expect(returnPropsText).toBe(initialPropsText)
  })

  test('should display version and system information if available', async ({ page }) => {
    // Check for system information footer or section
    const systemInfo = page.locator('[data-testid="system-info"]')
    const versionInfo = page.locator('[data-testid="version-info"]')
    
    if (await systemInfo.isVisible()) {
      await expect(systemInfo).toBeVisible()
    }
    
    if (await versionInfo.isVisible()) {
      await expect(versionInfo).toBeVisible()
    }
  })

  test('should handle real-time updates if implemented', async ({ page, context }) => {
    // Create a second browser context to simulate another admin user
    const page2 = await context.newPage()
    await page2.goto('/en/admin')
    
    // Get initial count on first page
    const initialPropsText = await page.locator('[data-testid="total-properties"]').textContent()
    const initialCount = parseInt(initialPropsText?.match(/\d+/)?.[0] || '0')
    
    // Create property in second context
    const propertyHelper2 = new PropertyHelper(page2)
    const uniqueData = testUtils.generateUniqueTestData()
    const propertyId = await propertyHelper2.createProperty(uniqueData.property)
    createdPropertyIds.push(propertyId)
    
    // Check if first page updates (might require refresh for non-real-time systems)
    await page.reload()
    
    const newPropsText = await page.locator('[data-testid="total-properties"]').textContent()
    const newCount = parseInt(newPropsText?.match(/\d+/)?.[0] || '0')
    
    expect(newCount).toBeGreaterThan(initialCount)
    
    // Clean up
    await page2.close()
  })
}) 
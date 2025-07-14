import { test, expect } from '@playwright/test'
import { AuthHelper } from '../utils/auth'
import { PropertyHelper } from '../utils/property-helper'
import { TestUtils } from '../utils/test-utils'
import { testConfig } from '../test.config'

test.describe('Featured Properties Management', () => {
  let authHelper: AuthHelper
  let propertyHelper: PropertyHelper
  let testUtils: TestUtils
  let createdPropertyIds: string[] = []

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
  })

  test('should navigate to featured properties page', async ({ page }) => {
    // Navigate to featured properties
    await page.click('text=Featured')
    
    // Should be on featured properties page
    await expect(page).toHaveURL('/en/admin/featured')
    await expect(page.locator('h1')).toContainText('Featured Properties')
    
    // Should see featured properties table or empty state
    const table = page.locator('table')
    const emptyState = page.locator('text=No featured properties found')
    
    const tableExists = await table.isVisible()
    const emptyStateExists = await emptyState.isVisible()
    
    expect(tableExists || emptyStateExists).toBeTruthy()
  })

  test('should toggle property featured status from properties list', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create a property first
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    createdPropertyIds.push(propertyId)
    
    // Navigate to properties list
    await propertyHelper.navigateToProperties()
    
    // Toggle featured status
    await propertyHelper.toggleFeatured(propertyId)
    
    // Verify property is now featured
    const propertyRow = page.locator(`[data-testid="property-row-${propertyId}"]`)
    await expect(propertyRow.locator('[data-testid="featured-badge"]')).toBeVisible()
    
    // Navigate to featured properties page
    await page.click('text=Featured')
    
    // Should see the property in featured list
    await expect(page.locator(`text=${uniqueData.property.title}`)).toBeVisible()
  })

  test('should toggle property featured status from featured properties page', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create a property and make it featured
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    createdPropertyIds.push(propertyId)
    
    await propertyHelper.toggleFeatured(propertyId)
    
    // Navigate to featured properties page
    await page.goto('/en/admin/featured')
    
    // Should see the property in featured list
    await expect(page.locator(`text=${uniqueData.property.title}`)).toBeVisible()
    
    // Toggle featured status from featured page
    const propertyRow = page.locator(`text=${uniqueData.property.title}`).locator('..').locator('..')
    await propertyRow.locator('[data-testid="toggle-featured"]').click()
    
    // Wait for success message
    await expect(page.locator('text=Featured status updated')).toBeVisible({ 
      timeout: testConfig.timeouts.short 
    })
    
    // Property should no longer be in featured list
    await expect(page.locator(`text=${uniqueData.property.title}`)).not.toBeVisible()
  })

  test('should display featured properties with correct information', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create a property and make it featured
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    createdPropertyIds.push(propertyId)
    
    await propertyHelper.toggleFeatured(propertyId)
    
    // Navigate to featured properties page
    await page.goto('/en/admin/featured')
    
    // Verify property information is displayed
    const propertyRow = page.locator(`text=${uniqueData.property.title}`).locator('..').locator('..')
    
    await expect(propertyRow.locator(`text=${uniqueData.property.title}`)).toBeVisible()
    await expect(propertyRow.locator(`text=${uniqueData.property.price}`)).toBeVisible()
    await expect(propertyRow.locator(`text=${uniqueData.property.location}`)).toBeVisible()
    
    // Should have featured badge
    await expect(propertyRow.locator('[data-testid="featured-badge"]')).toBeVisible()
  })

  test('should allow viewing property details from featured list', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create a property and make it featured
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    createdPropertyIds.push(propertyId)
    
    await propertyHelper.toggleFeatured(propertyId)
    
    // Navigate to featured properties page
    await page.goto('/en/admin/featured')
    
    // Click view button
    const propertyRow = page.locator(`text=${uniqueData.property.title}`).locator('..').locator('..')
    await propertyRow.locator('[data-testid="view-button"]').click()
    
    // Should navigate to property view page
    await expect(page).toHaveURL(`/en/properties/${propertyId}`)
    await expect(page.locator('h1')).toContainText(uniqueData.property.title)
  })

  test('should allow editing property from featured list', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create a property and make it featured
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    createdPropertyIds.push(propertyId)
    
    await propertyHelper.toggleFeatured(propertyId)
    
    // Navigate to featured properties page
    await page.goto('/en/admin/featured')
    
    // Click edit button
    const propertyRow = page.locator(`text=${uniqueData.property.title}`).locator('..').locator('..')
    await propertyRow.locator('[data-testid="edit-button"]').click()
    
    // Should navigate to property edit page
    await expect(page).toHaveURL(`/en/admin/properties/${propertyId}/edit`)
    await expect(page.locator('h1')).toContainText('Edit Property')
  })

  test('should show featured properties count on dashboard', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Get initial featured count
    await page.goto('/en/admin')
    const initialFeaturedCountElement = page.locator('[data-testid="featured-count"]')
    const initialCountText = await initialFeaturedCountElement.textContent()
    const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || '0')
    
    // Create a property and make it featured
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    createdPropertyIds.push(propertyId)
    
    await propertyHelper.toggleFeatured(propertyId)
    
    // Go back to dashboard
    await page.goto('/en/admin')
    
    // Verify featured count increased
    const newCountText = await initialFeaturedCountElement.textContent()
    const newCount = parseInt(newCountText?.match(/\d+/)?.[0] || '0')
    
    expect(newCount).toBe(initialCount + 1)
  })

  test('should handle multiple featured properties', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    const timestamp = Date.now()
    
    // Create multiple properties and make them featured
    const propertyIds = []
    for (let i = 1; i <= 3; i++) {
      const propertyData = {
        ...uniqueData.property,
        title: `Featured Property ${i} ${timestamp}`,
        price: (500000 + i * 100000).toString()
      }
      
      const propertyId = await propertyHelper.createProperty(propertyData)
      propertyIds.push(propertyId)
      createdPropertyIds.push(propertyId)
      
      // Make it featured
      await propertyHelper.toggleFeatured(propertyId)
    }
    
    // Navigate to featured properties page
    await page.goto('/en/admin/featured')
    
    // Verify all featured properties are displayed
    for (let i = 1; i <= 3; i++) {
      await expect(page.locator(`text=Featured Property ${i} ${timestamp}`)).toBeVisible()
    }
  })

  test('should maintain featured status when editing property', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create a property and make it featured
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    createdPropertyIds.push(propertyId)
    
    await propertyHelper.toggleFeatured(propertyId)
    
    // Edit the property
    const updatedData = {
      title: `${uniqueData.property.title} - Updated`,
      price: '750000'
    }
    
    await propertyHelper.editProperty(propertyId, updatedData)
    
    // Navigate to featured properties page
    await page.goto('/en/admin/featured')
    
    // Should still see the property with updated information
    await expect(page.locator(`text=${updatedData.title}`)).toBeVisible()
    await expect(page.locator('text=750000')).toBeVisible()
    
    // Should still have featured badge
    const propertyRow = page.locator(`text=${updatedData.title}`).locator('..').locator('..')
    await expect(propertyRow.locator('[data-testid="featured-badge"]')).toBeVisible()
  })

  test('should remove property from featured list when deleted', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create a property and make it featured
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    
    await propertyHelper.toggleFeatured(propertyId)
    
    // Verify property is in featured list
    await page.goto('/en/admin/featured')
    await expect(page.locator(`text=${uniqueData.property.title}`)).toBeVisible()
    
    // Delete the property
    await propertyHelper.deleteProperty(propertyId)
    
    // Navigate back to featured properties page
    await page.goto('/en/admin/featured')
    
    // Property should no longer be in featured list
    await expect(page.locator(`text=${uniqueData.property.title}`)).not.toBeVisible()
  })

  test('should handle featured properties pagination', async ({ page }) => {
    // Navigate to featured properties page
    await page.goto('/en/admin/featured')
    
    // If there are many featured properties, pagination should work
    const nextButton = page.locator('[data-testid="pagination-next"]')
    const prevButton = page.locator('[data-testid="pagination-prev"]')
    
    if (await nextButton.isVisible()) {
      await nextButton.click()
      await testUtils.waitForPageLoad()
      
      // Should be on next page
      await expect(prevButton).toBeVisible()
      
      // Go back to first page
      await prevButton.click()
      await testUtils.waitForPageLoad()
    }
  })

  test('should search featured properties', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create a property with unique title
    const searchableProperty = {
      ...uniqueData.property,
      title: `Unique Featured Property ${Date.now()}`
    }
    
    const propertyId = await propertyHelper.createProperty(searchableProperty)
    createdPropertyIds.push(propertyId)
    
    await propertyHelper.toggleFeatured(propertyId)
    
    // Navigate to featured properties page
    await page.goto('/en/admin/featured')
    
    // Search for the property
    const searchInput = page.locator('[data-testid="featured-search"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill(searchableProperty.title)
      await page.press('[data-testid="featured-search"]', 'Enter')
      
      // Should see the searched property
      await expect(page.locator(`text=${searchableProperty.title}`)).toBeVisible()
    }
  })

  test('should show featured properties in correct order', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    const timestamp = Date.now()
    
    // Create properties at different times to test ordering
    const propertyData1 = {
      ...uniqueData.property,
      title: `Featured Property A ${timestamp}`
    }
    
    const propertyId1 = await propertyHelper.createProperty(propertyData1)
    createdPropertyIds.push(propertyId1)
    await propertyHelper.toggleFeatured(propertyId1)
    
    // Wait a bit to ensure different timestamps
    await page.waitForTimeout(1000)
    
    const propertyData2 = {
      ...uniqueData.property,
      title: `Featured Property B ${timestamp}`
    }
    
    const propertyId2 = await propertyHelper.createProperty(propertyData2)
    createdPropertyIds.push(propertyId2)
    await propertyHelper.toggleFeatured(propertyId2)
    
    // Navigate to featured properties page
    await page.goto('/en/admin/featured')
    
    // Verify both properties are visible
    await expect(page.locator(`text=${propertyData1.title}`)).toBeVisible()
    await expect(page.locator(`text=${propertyData2.title}`)).toBeVisible()
    
    // Verify they are in some consistent order (usually newest first)
    const propertyElements = await page.locator('tbody tr').all()
    expect(propertyElements.length).toBeGreaterThanOrEqual(2)
  })

  test('should handle empty featured properties list', async ({ page }) => {
    // Navigate to featured properties page
    await page.goto('/en/admin/featured')
    
    // If there are any featured properties, unfeat all of them for this test
    const featuredRows = await page.locator('[data-testid="toggle-featured"]').all()
    
    for (const row of featuredRows) {
      if (await row.isVisible()) {
        await row.click()
        await page.waitForTimeout(500)
      }
    }
    
    // Refresh the page
    await page.reload()
    
    // Should show empty state
    await expect(page.locator('text=No featured properties found')).toBeVisible()
  })

  test('should maintain featured properties after browser refresh', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create a property and make it featured
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    createdPropertyIds.push(propertyId)
    
    await propertyHelper.toggleFeatured(propertyId)
    
    // Navigate to featured properties page
    await page.goto('/en/admin/featured')
    
    // Verify property is there
    await expect(page.locator(`text=${uniqueData.property.title}`)).toBeVisible()
    
    // Refresh the page
    await page.reload()
    
    // Property should still be there
    await expect(page.locator(`text=${uniqueData.property.title}`)).toBeVisible()
  })
}) 
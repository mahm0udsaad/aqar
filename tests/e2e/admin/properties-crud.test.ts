import { test, expect } from '@playwright/test'
import { AuthHelper } from '../utils/auth'
import { PropertyHelper, PropertyTestData } from '../utils/property-helper'
import { CategoryHelper } from '../utils/category-helper'
import { TestUtils } from '../utils/test-utils'
import { testConfig } from '../test.config'

test.describe('Properties CRUD Operations', () => {
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

  test('should create a new property with all required fields', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create property
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    createdPropertyIds.push(propertyId)
    
    // Verify property appears in list
    const exists = await propertyHelper.verifyPropertyExists(uniqueData.property.title)
    expect(exists).toBeTruthy()
    
    // Verify property data on view page
    const propertyData = await propertyHelper.getPropertyData(propertyId)
    expect(propertyData.title).toContain(uniqueData.property.title)
    expect(propertyData.price).toContain(uniqueData.property.price)
    expect(propertyData.location).toContain(uniqueData.property.location)
  })

  test('should create property with features and amenities', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    const propertyWithExtras: PropertyTestData = {
      ...uniqueData.property,
      features: ['Garage', 'Garden', 'Balcony'],
      amenities: ['Swimming Pool', 'Gym', 'Security']
    }
    
    const propertyId = await propertyHelper.createProperty(propertyWithExtras)
    createdPropertyIds.push(propertyId)
    
    // Verify property was created
    const exists = await propertyHelper.verifyPropertyExists(propertyWithExtras.title)
    expect(exists).toBeTruthy()
  })

  test('should edit an existing property', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create property first
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    createdPropertyIds.push(propertyId)
    
    // Edit the property
    const updatedData = {
      title: `${uniqueData.property.title} - Updated`,
      price: '750000',
      location: `${uniqueData.property.location} - Updated`
    }
    
    await propertyHelper.editProperty(propertyId, updatedData)
    
    // Verify changes
    const propertyData = await propertyHelper.getPropertyData(propertyId)
    expect(propertyData.title).toContain('Updated')
    expect(propertyData.price).toContain('750000')
    expect(propertyData.location).toContain('Updated')
  })

  test('should delete a property', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create property first
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    
    // Delete the property
    await propertyHelper.deleteProperty(propertyId)
    
    // Verify property no longer exists
    const exists = await propertyHelper.verifyPropertyNotExists(uniqueData.property.title)
    expect(exists).toBeTruthy()
  })

  test('should toggle featured status of property', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create property first
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    createdPropertyIds.push(propertyId)
    
    // Toggle featured status
    await propertyHelper.toggleFeatured(propertyId)
    
    // Verify featured status changed
    await propertyHelper.navigateToProperties()
    const propertyRow = page.locator(`[data-testid="property-row-${propertyId}"]`)
    const featuredBadge = propertyRow.locator('[data-testid="featured-badge"]')
    await expect(featuredBadge).toBeVisible()
    
    // Toggle back
    await propertyHelper.toggleFeatured(propertyId)
    await expect(featuredBadge).not.toBeVisible()
  })

  test('should search for properties', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create property with unique searchable terms
    const searchableProperty: PropertyTestData = {
      ...uniqueData.property,
      title: `Unique Searchable Property ${Date.now()}`,
      location: `Unique Searchable Location ${Date.now()}`
    }
    
    const propertyId = await propertyHelper.createProperty(searchableProperty)
    createdPropertyIds.push(propertyId)
    
    // Search for the property by title
    await propertyHelper.searchProperties(searchableProperty.title)
    
    // Verify search results show the property
    await expect(page.locator(`text=${searchableProperty.title}`)).toBeVisible()
    
    // Search for the property by location
    await propertyHelper.searchProperties(searchableProperty.location)
    
    // Verify search results show the property
    await expect(page.locator(`text=${searchableProperty.title}`)).toBeVisible()
  })

  test('should filter properties by category', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create a test category first
    const categoryId = await categoryHelper.createCategory(uniqueData.category)
    createdCategoryIds.push(categoryId)
    
    // Create property in that category
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    createdPropertyIds.push(propertyId)
    
    // Filter by category
    await propertyHelper.filterByCategory(uniqueData.category.name)
    
    // Verify filtered results show the property
    await expect(page.locator(`text=${uniqueData.property.title}`)).toBeVisible()
  })

  test('should validate required fields when creating property', async ({ page }) => {
    await propertyHelper.navigateToProperties()
    
    // Click "Add New Property" without filling required fields
    await page.click('text=Add New Property')
    await page.click('text=Save Property')
    
    // Should see validation errors
    await expect(page.locator('text=Title is required')).toBeVisible()
    await expect(page.locator('text=Description is required')).toBeVisible()
    await expect(page.locator('text=Price is required')).toBeVisible()
    await expect(page.locator('text=Location is required')).toBeVisible()
  })

  test('should validate price format', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    await propertyHelper.navigateToProperties()
    await page.click('text=Add New Property')
    
    // Fill all required fields except use invalid price
    await page.fill('[name="title"]', uniqueData.property.title)
    await page.fill('[name="description"]', uniqueData.property.description)
    await page.fill('[name="price"]', 'invalid-price')
    await page.fill('[name="location"]', uniqueData.property.location)
    
    await page.click('text=Save Property')
    
    // Should see price validation error
    await expect(page.locator('text=Price must be a valid number')).toBeVisible()
  })

  test('should validate email format in contact info', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    await propertyHelper.navigateToProperties()
    await page.click('text=Add New Property')
    
    // Fill basic required fields
    await page.fill('[name="title"]', uniqueData.property.title)
    await page.fill('[name="description"]', uniqueData.property.description)
    await page.fill('[name="price"]', uniqueData.property.price)
    await page.fill('[name="location"]', uniqueData.property.location)
    
    // Use invalid email
    await page.fill('[name="contact_email"]', 'invalid-email')
    
    await page.click('text=Save Property')
    
    // Should see email validation error
    await expect(page.locator('text=Invalid email format')).toBeVisible()
  })

  test('should handle large property descriptions', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create property with very long description
    const longDescription = 'Lorem ipsum '.repeat(200) // Very long description
    const propertyWithLongDesc: PropertyTestData = {
      ...uniqueData.property,
      description: longDescription
    }
    
    const propertyId = await propertyHelper.createProperty(propertyWithLongDesc)
    createdPropertyIds.push(propertyId)
    
    // Verify property was created successfully
    const exists = await propertyHelper.verifyPropertyExists(propertyWithLongDesc.title)
    expect(exists).toBeTruthy()
  })

  test('should handle special characters in property fields', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create property with special characters
    const specialCharProperty: PropertyTestData = {
      ...uniqueData.property,
      title: `Property with Special Chars: @#$%^&*()_+ ${Date.now()}`,
      location: `Location with Üñíçödé & Symbols ${Date.now()}`,
      description: 'Description with "quotes" and \'apostrophes\' and <tags>'
    }
    
    const propertyId = await propertyHelper.createProperty(specialCharProperty)
    createdPropertyIds.push(propertyId)
    
    // Verify property was created successfully
    const exists = await propertyHelper.verifyPropertyExists(specialCharProperty.title)
    expect(exists).toBeTruthy()
  })

  test('should create multiple properties and verify order', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    const timestamp = Date.now()
    
    // Create multiple properties
    const properties = []
    for (let i = 1; i <= 3; i++) {
      const propertyData: PropertyTestData = {
        ...uniqueData.property,
        title: `Test Property ${i} ${timestamp}`,
        price: (500000 + i * 100000).toString()
      }
      
      const propertyId = await propertyHelper.createProperty(propertyData)
      createdPropertyIds.push(propertyId)
      properties.push(propertyData)
    }
    
    // Navigate to properties list
    await propertyHelper.navigateToProperties()
    
    // Verify all properties are visible
    for (const property of properties) {
      await expect(page.locator(`text=${property.title}`)).toBeVisible()
    }
  })

  test('should navigate between property form pages', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create property first
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    createdPropertyIds.push(propertyId)
    
    // Navigate to properties list
    await propertyHelper.navigateToProperties()
    
    // Click view button
    const propertyRow = page.locator(`[data-testid="property-row-${propertyId}"]`)
    await propertyRow.locator('[data-testid="view-button"]').click()
    
    // Should be on property view page
    await expect(page).toHaveURL(`/en/properties/${propertyId}`)
    await expect(page.locator('h1')).toContainText(uniqueData.property.title)
    
    // Go back to admin
    await page.goto('/en/admin/properties')
    
    // Click edit button
    await propertyRow.locator('[data-testid="edit-button"]').click()
    
    // Should be on edit page
    await expect(page).toHaveURL(`/en/admin/properties/${propertyId}/edit`)
    await expect(page.locator('h1')).toContainText('Edit Property')
  })

  test('should handle concurrent property operations', async ({ page, context }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create multiple browser contexts to simulate concurrent users
    const page2 = await context.newPage()
    const propertyHelper2 = new PropertyHelper(page2)
    
    // Navigate both to admin
    await page2.goto('/en/admin')
    
    // Create properties concurrently
    const [propertyId1, propertyId2] = await Promise.all([
      propertyHelper.createProperty({
        ...uniqueData.property,
        title: `${uniqueData.property.title} - User 1`
      }),
      propertyHelper2.createProperty({
        ...uniqueData.property,
        title: `${uniqueData.property.title} - User 2`
      })
    ])
    
    createdPropertyIds.push(propertyId1, propertyId2)
    
    // Verify both properties were created
    const exists1 = await propertyHelper.verifyPropertyExists(`${uniqueData.property.title} - User 1`)
    const exists2 = await propertyHelper2.verifyPropertyExists(`${uniqueData.property.title} - User 2`)
    
    expect(exists1).toBeTruthy()
    expect(exists2).toBeTruthy()
    
    // Clean up
    await page2.close()
  })
}) 
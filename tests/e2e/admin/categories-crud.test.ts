import { test, expect } from '@playwright/test'
import { AuthHelper } from '../utils/auth'
import { CategoryHelper, CategoryTestData } from '../utils/category-helper'
import { PropertyHelper } from '../utils/property-helper'
import { TestUtils } from '../utils/test-utils'
import { testConfig } from '../test.config'

test.describe('Categories CRUD Operations', () => {
  let authHelper: AuthHelper
  let categoryHelper: CategoryHelper
  let propertyHelper: PropertyHelper
  let testUtils: TestUtils
  let createdCategoryIds: string[] = []
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
    categoryHelper = new CategoryHelper(page)
    propertyHelper = new PropertyHelper(page)
    testUtils = new TestUtils(page)
    
    // Navigate to admin dashboard
    await page.goto('/en/admin')
    await testUtils.waitForPageLoad()
  })

  test.afterEach(async ({ page }) => {
    // Clean up created test data (properties first, then categories)
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

  test('should create a new category', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create category
    const categoryId = await categoryHelper.createCategory(uniqueData.category)
    createdCategoryIds.push(categoryId)
    
    // Verify category appears in list
    const exists = await categoryHelper.verifyCategoryExists(uniqueData.category.name)
    expect(exists).toBeTruthy()
  })

  test('should edit an existing category', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create category first
    const categoryId = await categoryHelper.createCategory(uniqueData.category)
    createdCategoryIds.push(categoryId)
    
    // Edit the category
    const updatedData = {
      name: `${uniqueData.category.name} - Updated`,
      description: `${uniqueData.category.description} - Updated`
    }
    
    await categoryHelper.editCategory(categoryId, updatedData)
    
    // Verify changes
    const exists = await categoryHelper.verifyCategoryExists(updatedData.name)
    expect(exists).toBeTruthy()
    
    // Verify old name no longer exists
    const oldExists = await categoryHelper.verifyCategoryExists(uniqueData.category.name)
    expect(oldExists).toBeFalsy()
  })

  test('should delete an empty category', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create category first
    const categoryId = await categoryHelper.createCategory(uniqueData.category)
    
    // Delete the category
    await categoryHelper.deleteCategory(categoryId)
    
    // Verify category no longer exists
    const exists = await categoryHelper.verifyCategoryNotExists(uniqueData.category.name)
    expect(exists).toBeTruthy()
  })

  test('should prevent deletion of category with properties', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create category first
    const categoryId = await categoryHelper.createCategory(uniqueData.category)
    createdCategoryIds.push(categoryId)
    
    // Create property in that category
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    createdPropertyIds.push(propertyId)
    
    // Try to delete category with properties
    await categoryHelper.verifyCannotDeleteCategoryWithProperties(categoryId)
    
    // Verify category still exists
    const exists = await categoryHelper.verifyCategoryExists(uniqueData.category.name)
    expect(exists).toBeTruthy()
  })

  test('should reorder categories', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    const timestamp = Date.now()
    
    // Create multiple categories
    const categories = []
    for (let i = 1; i <= 3; i++) {
      const categoryData: CategoryTestData = {
        name: `Test Category ${i} ${timestamp}`,
        description: `Test Category ${i} Description`
      }
      
      const categoryId = await categoryHelper.createCategory(categoryData)
      createdCategoryIds.push(categoryId)
      categories.push(categoryData)
    }
    
    // Get initial order
    const initialOrder = await categoryHelper.getAllCategories()
    
    // Reorder categories (move first to second position)
    await categoryHelper.reorderCategories(0, 1)
    
    // Get new order
    const newOrder = await categoryHelper.getAllCategories()
    
    // Verify order changed
    expect(newOrder).not.toEqual(initialOrder)
  })

  test('should validate required fields when creating category', async ({ page }) => {
    await categoryHelper.navigateToCategories()
    
    // Click "Add Category" without filling required fields
    await page.click('text=Add Category')
    await page.click('text=Create Category')
    
    // Should see validation errors
    await expect(page.locator('text=Name is required')).toBeVisible()
  })

  test('should validate category name uniqueness', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create first category
    const categoryId = await categoryHelper.createCategory(uniqueData.category)
    createdCategoryIds.push(categoryId)
    
    // Try to create another category with same name
    await categoryHelper.navigateToCategories()
    await page.click('text=Add Category')
    
    await page.fill('[name="name"]', uniqueData.category.name)
    await page.fill('[name="description"]', 'Different description')
    await page.click('text=Create Category')
    
    // Should see uniqueness error
    await expect(page.locator('text=Category name already exists')).toBeVisible()
  })

  test('should handle long category names and descriptions', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create category with long name and description
    const longCategoryData: CategoryTestData = {
      name: `Very Long Category Name ${Date.now()} `.repeat(5).trim(),
      description: 'Very long description '.repeat(50)
    }
    
    const categoryId = await categoryHelper.createCategory(longCategoryData)
    createdCategoryIds.push(categoryId)
    
    // Verify category was created successfully
    const exists = await categoryHelper.verifyCategoryExists(longCategoryData.name)
    expect(exists).toBeTruthy()
  })

  test('should handle special characters in category fields', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create category with special characters
    const specialCharCategory: CategoryTestData = {
      name: `Category with Special Chars: @#$%^&*()_+ ${Date.now()}`,
      description: 'Description with "quotes" and \'apostrophes\' and <tags> & symbols'
    }
    
    const categoryId = await categoryHelper.createCategory(specialCharCategory)
    createdCategoryIds.push(categoryId)
    
    // Verify category was created successfully
    const exists = await categoryHelper.verifyCategoryExists(specialCharCategory.name)
    expect(exists).toBeTruthy()
  })

  test('should show property count for each category', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create category
    const categoryId = await categoryHelper.createCategory(uniqueData.category)
    createdCategoryIds.push(categoryId)
    
    // Initial property count should be 0
    let propertyCount = await categoryHelper.getCategoryPropertyCount(categoryId)
    expect(propertyCount).toBe(0)
    
    // Create property in the category
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    createdPropertyIds.push(propertyId)
    
    // Property count should now be 1
    propertyCount = await categoryHelper.getCategoryPropertyCount(categoryId)
    expect(propertyCount).toBe(1)
  })

  test('should allow empty description for category', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create category with empty description
    const categoryWithoutDesc: CategoryTestData = {
      name: uniqueData.category.name,
      description: ''
    }
    
    const categoryId = await categoryHelper.createCategory(categoryWithoutDesc)
    createdCategoryIds.push(categoryId)
    
    // Verify category was created successfully
    const exists = await categoryHelper.verifyCategoryExists(categoryWithoutDesc.name)
    expect(exists).toBeTruthy()
  })

  test('should create multiple categories and verify they appear in list', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    const timestamp = Date.now()
    
    // Create multiple categories
    const categories = []
    for (let i = 1; i <= 5; i++) {
      const categoryData: CategoryTestData = {
        name: `Bulk Test Category ${i} ${timestamp}`,
        description: `Bulk test category ${i} description`
      }
      
      const categoryId = await categoryHelper.createCategory(categoryData)
      createdCategoryIds.push(categoryId)
      categories.push(categoryData)
    }
    
    // Navigate to categories list
    await categoryHelper.navigateToCategories()
    
    // Verify all categories are visible
    for (const category of categories) {
      await expect(page.locator(`text=${category.name}`)).toBeVisible()
    }
  })

  test('should handle category creation and deletion workflow', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create category
    const categoryId = await categoryHelper.createCategory(uniqueData.category)
    
    // Verify it exists
    let exists = await categoryHelper.verifyCategoryExists(uniqueData.category.name)
    expect(exists).toBeTruthy()
    
    // Delete it
    await categoryHelper.deleteCategory(categoryId)
    
    // Verify it no longer exists
    exists = await categoryHelper.verifyCategoryNotExists(uniqueData.category.name)
    expect(exists).toBeTruthy()
  })

  test('should maintain category data integrity after edit', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create category
    const categoryId = await categoryHelper.createCategory(uniqueData.category)
    createdCategoryIds.push(categoryId)
    
    // Edit only the name
    const updatedData = {
      name: `${uniqueData.category.name} - Name Updated`
    }
    
    await categoryHelper.editCategory(categoryId, updatedData)
    
    // Navigate to categories to verify the change
    await categoryHelper.navigateToCategories()
    
    // Should see updated name
    await expect(page.locator(`text=${updatedData.name}`)).toBeVisible()
    
    // Should still see original description
    await expect(page.locator(`text=${uniqueData.category.description}`)).toBeVisible()
  })

  test('should handle concurrent category operations', async ({ page, context }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create multiple browser contexts to simulate concurrent users
    const page2 = await context.newPage()
    const categoryHelper2 = new CategoryHelper(page2)
    
    // Navigate both to admin
    await page2.goto('/en/admin')
    
    // Create categories concurrently
    const [categoryId1, categoryId2] = await Promise.all([
      categoryHelper.createCategory({
        name: `${uniqueData.category.name} - User 1`,
        description: `${uniqueData.category.description} - User 1`
      }),
      categoryHelper2.createCategory({
        name: `${uniqueData.category.name} - User 2`,
        description: `${uniqueData.category.description} - User 2`
      })
    ])
    
    createdCategoryIds.push(categoryId1, categoryId2)
    
    // Verify both categories were created
    const exists1 = await categoryHelper.verifyCategoryExists(`${uniqueData.category.name} - User 1`)
    const exists2 = await categoryHelper2.verifyCategoryExists(`${uniqueData.category.name} - User 2`)
    
    expect(exists1).toBeTruthy()
    expect(exists2).toBeTruthy()
    
    // Clean up
    await page2.close()
  })

  test('should navigate between category management sections', async ({ page }) => {
    // Navigate to categories
    await categoryHelper.navigateToCategories()
    
    // Should be on categories page
    await expect(page).toHaveURL('/en/admin/categories')
    await expect(page.locator('h1')).toContainText('Categories')
    
    // Navigate back to dashboard
    await page.click('text=Dashboard')
    await expect(page).toHaveURL('/en/admin')
    
    // Navigate back to categories
    await page.click('text=Categories')
    await expect(page).toHaveURL('/en/admin/categories')
  })

  test('should show appropriate UI feedback during category operations', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Test create feedback
    await categoryHelper.navigateToCategories()
    await page.click('text=Add Category')
    
    // Fill form
    await page.fill('[name="name"]', uniqueData.category.name)
    await page.fill('[name="description"]', uniqueData.category.description)
    
    // Submit and verify success message
    await page.click('text=Create Category')
    await testUtils.waitForToast('Category created successfully')
    
    // Get the created category ID for cleanup
    const categoryId = await categoryHelper.getCategoryIdByName(uniqueData.category.name)
    createdCategoryIds.push(categoryId)
    
    // Test edit feedback
    const categoryCard = page.locator(`[data-testid="category-card-${categoryId}"]`)
    await categoryCard.locator('[data-testid="edit-button"]').click()
    
    await page.fill('[name="name"]', `${uniqueData.category.name} - Edited`)
    await page.click('text=Update Category')
    await testUtils.waitForToast('Category updated successfully')
    
    // Test delete feedback
    await categoryCard.locator('[data-testid="delete-button"]').click()
    await page.click('text=Delete Category')
    await testUtils.waitForToast('Category deleted successfully')
    
    // Remove from cleanup list since it's already deleted
    createdCategoryIds.pop()
  })
}) 
import { Page, expect } from '@playwright/test'
import { testConfig } from '../test.config'

export interface CategoryTestData {
  name: string
  description: string
}

export class CategoryHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to categories management page
   */
  async navigateToCategories() {
    await this.page.goto('/en/admin/categories')
    await expect(this.page.locator('h1')).toContainText('Categories', { timeout: testConfig.timeouts.short })
  }

  /**
   * Create a new category
   */
  async createCategory(categoryData: CategoryTestData = testConfig.testData.category) {
    await this.navigateToCategories()
    
    // Click "Add Category" button
    await this.page.click('text=Add Category')
    
    // Wait for dialog to open
    await expect(this.page.locator('text=Create Category')).toBeVisible({ timeout: testConfig.timeouts.short })
    
    // Fill category form
    await this.page.fill('[name="name"]', categoryData.name)
    await this.page.fill('[name="description"]', categoryData.description)
    
    // Submit form
    await this.page.click('text=Create Category')
    
    // Wait for success message
    await expect(this.page.locator('text=Category created successfully')).toBeVisible({ timeout: testConfig.timeouts.medium })
    
    // Wait for dialog to close and category to appear in list
    await this.page.waitForTimeout(1000)
    
    return await this.getCategoryIdByName(categoryData.name)
  }

  /**
   * Edit an existing category
   */
  async editCategory(categoryId: string, updatedData: Partial<CategoryTestData>) {
    await this.navigateToCategories()
    
    // Find category card and click edit button
    const categoryCard = this.page.locator(`[data-testid="category-card-${categoryId}"]`)
    await categoryCard.locator('[data-testid="edit-button"]').click()
    
    // Wait for edit dialog to open
    await expect(this.page.locator('text=Edit Category')).toBeVisible({ timeout: testConfig.timeouts.short })
    
    // Update fields that are provided
    if (updatedData.name) {
      await this.page.fill('[name="name"]', updatedData.name)
    }
    if (updatedData.description) {
      await this.page.fill('[name="description"]', updatedData.description)
    }
    
    // Submit form
    await this.page.click('text=Update Category')
    
    // Wait for success message
    await expect(this.page.locator('text=Category updated successfully')).toBeVisible({ timeout: testConfig.timeouts.medium })
  }

  /**
   * Delete a category
   */
  async deleteCategory(categoryId: string) {
    await this.navigateToCategories()
    
    // Find category card and click delete button
    const categoryCard = this.page.locator(`[data-testid="category-card-${categoryId}"]`)
    await categoryCard.locator('[data-testid="delete-button"]').click()
    
    // Confirm deletion in dialog
    await expect(this.page.locator('text=Delete Category')).toBeVisible({ timeout: testConfig.timeouts.short })
    await this.page.click('text=Delete Category')
    
    // Wait for success message
    await expect(this.page.locator('text=Category deleted successfully')).toBeVisible({ timeout: testConfig.timeouts.medium })
  }

  /**
   * Reorder categories by drag and drop
   */
  async reorderCategories(fromIndex: number, toIndex: number) {
    await this.navigateToCategories()
    
    // Get category cards
    const categoryCards = this.page.locator('[data-testid^="category-card-"]')
    
    // Get source and target elements
    const sourceCard = categoryCards.nth(fromIndex)
    const targetCard = categoryCards.nth(toIndex)
    
    // Perform drag and drop
    await sourceCard.dragTo(targetCard)
    
    // Wait for reorder to complete
    await this.page.waitForTimeout(1000)
  }

  /**
   * Get category ID by name from the categories list
   */
  async getCategoryIdByName(name: string): Promise<string> {
    await this.navigateToCategories()
    
    // Find category card by name
    const categoryCard = this.page.locator(`text=${name}`).locator('..').locator('..')
    const dataTestId = await categoryCard.getAttribute('data-testid')
    
    if (!dataTestId) {
      throw new Error(`Could not find category with name: ${name}`)
    }
    
    // Extract ID from data-testid like "category-card-123"
    const match = dataTestId.match(/category-card-(.+)/)
    if (!match) {
      throw new Error(`Could not extract category ID from data-testid: ${dataTestId}`)
    }
    
    return match[1]
  }

  /**
   * Verify category exists in list
   */
  async verifyCategoryExists(name: string): Promise<boolean> {
    await this.navigateToCategories()
    return await this.page.locator(`text=${name}`).isVisible()
  }

  /**
   * Verify category does not exist in list
   */
  async verifyCategoryNotExists(name: string): Promise<boolean> {
    await this.navigateToCategories()
    return !(await this.page.locator(`text=${name}`).isVisible())
  }

  /**
   * Get all categories from the page
   */
  async getAllCategories(): Promise<string[]> {
    await this.navigateToCategories()
    
    const categoryNames = await this.page.locator('[data-testid^="category-card-"] h3').allTextContents()
    return categoryNames
  }

  /**
   * Get category property count
   */
  async getCategoryPropertyCount(categoryId: string): Promise<number> {
    await this.navigateToCategories()
    
    const categoryCard = this.page.locator(`[data-testid="category-card-${categoryId}"]`)
    const propertyCountText = await categoryCard.locator('[data-testid="property-count"]').textContent()
    
    if (!propertyCountText) {
      return 0
    }
    
    // Extract number from text like "5 properties"
    const match = propertyCountText.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }

  /**
   * Verify category cannot be deleted if it has properties
   */
  async verifyCannotDeleteCategoryWithProperties(categoryId: string) {
    await this.navigateToCategories()
    
    // Try to delete category
    const categoryCard = this.page.locator(`[data-testid="category-card-${categoryId}"]`)
    await categoryCard.locator('[data-testid="delete-button"]').click()
    
    // Should see error message about properties
    await expect(this.page.locator('text=Cannot delete category with existing properties')).toBeVisible({ 
      timeout: testConfig.timeouts.short 
    })
  }

  /**
   * Create category if it doesn't exist
   */
  async ensureCategoryExists(categoryData: CategoryTestData): Promise<string> {
    const exists = await this.verifyCategoryExists(categoryData.name)
    if (exists) {
      return await this.getCategoryIdByName(categoryData.name)
    } else {
      return await this.createCategory(categoryData)
    }
  }
} 
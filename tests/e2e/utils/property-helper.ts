import { Page, expect } from '@playwright/test'
import { testConfig } from '../test.config'
import path from 'path'

export interface PropertyTestData {
  title: string
  description: string
  price: string
  location: string
  area: string
  bedrooms: string
  bathrooms: string
  size: string
  yearBuilt: string
  propertyType: string
  status: string
  contactName: string
  contactPhone: string
  contactEmail: string
  features?: string[]
  amenities?: string[]
}

export class PropertyHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to properties management page
   */
  async navigateToProperties() {
    await this.page.goto('/en/admin/properties')
    await expect(this.page.locator('h1')).toContainText('Properties', { timeout: testConfig.timeouts.short })
  }

  /**
   * Create a new property with all required fields
   */
  async createProperty(propertyData: PropertyTestData = testConfig.testData.property, withImages: boolean = false) {
    await this.navigateToProperties()
    
    // Click "Add New Property" button
    await this.page.click('text=Add New Property')
    await expect(this.page).toHaveURL('/en/admin/properties/new', { timeout: testConfig.timeouts.short })

    // Fill basic information
    await this.page.fill('[name="title"]', propertyData.title)
    await this.page.fill('[name="description"]', propertyData.description)
    await this.page.fill('[name="price"]', propertyData.price)
    await this.page.fill('[name="location"]', propertyData.location)
    await this.page.fill('[name="area"]', propertyData.area)

    // Fill property details
    await this.page.fill('[name="bedrooms"]', propertyData.bedrooms)
    await this.page.fill('[name="bathrooms"]', propertyData.bathrooms)
    await this.page.fill('[name="size"]', propertyData.size)
    await this.page.fill('[name="year_built"]', propertyData.yearBuilt)

    // Select property type
    await this.page.click('[data-testid="property-type-select"]')
    await this.page.click(`[data-value="${propertyData.propertyType}"]`)

    // Select status
    await this.page.click('[data-testid="status-select"]')
    await this.page.click(`[data-value="${propertyData.status}"]`)

    // Fill contact information
    await this.page.fill('[name="contact_name"]', propertyData.contactName)
    await this.page.fill('[name="contact_phone"]', propertyData.contactPhone)
    await this.page.fill('[name="contact_email"]', propertyData.contactEmail)

    // Add features if provided
    if (propertyData.features && propertyData.features.length > 0) {
      for (const feature of propertyData.features) {
        await this.addFeature(feature)
      }
    }

    // Add amenities if provided
    if (propertyData.amenities && propertyData.amenities.length > 0) {
      for (const amenity of propertyData.amenities) {
        await this.addAmenity(amenity)
      }
    }

    // Upload images if requested
    if (withImages) {
      await this.uploadTestImages()
    }

    // Save the property
    await this.page.click('text=Save Property')
    
    // Wait for success message and redirect
    await expect(this.page.locator('text=Property created successfully')).toBeVisible({ timeout: testConfig.timeouts.medium })
    await expect(this.page).toHaveURL('/en/admin/properties', { timeout: testConfig.timeouts.short })

    // Return the created property ID (extract from URL or find in list)
    return await this.getPropertyIdByTitle(propertyData.title)
  }

  /**
   * Edit an existing property
   */
  async editProperty(propertyId: string, updatedData: Partial<PropertyTestData>) {
    await this.page.goto(`/en/admin/properties/${propertyId}/edit`)
    await expect(this.page.locator('h1')).toContainText('Edit Property', { timeout: testConfig.timeouts.short })

    // Update fields that are provided
    if (updatedData.title) {
      await this.page.fill('[name="title"]', updatedData.title)
    }
    if (updatedData.description) {
      await this.page.fill('[name="description"]', updatedData.description)
    }
    if (updatedData.price) {
      await this.page.fill('[name="price"]', updatedData.price)
    }
    if (updatedData.location) {
      await this.page.fill('[name="location"]', updatedData.location)
    }

    // Save changes
    await this.page.click('text=Update Property')
    
    // Wait for success message
    await expect(this.page.locator('text=Property updated successfully')).toBeVisible({ timeout: testConfig.timeouts.medium })
  }

  /**
   * Delete a property
   */
  async deleteProperty(propertyId: string) {
    await this.navigateToProperties()
    
    // Find property row and click delete button
    const propertyRow = this.page.locator(`[data-testid="property-row-${propertyId}"]`)
    await propertyRow.locator('[data-testid="delete-button"]').click()
    
    // Confirm deletion in dialog
    await this.page.click('text=Confirm Delete')
    
    // Wait for success message
    await expect(this.page.locator('text=Property deleted successfully')).toBeVisible({ timeout: testConfig.timeouts.medium })
  }

  /**
   * Toggle featured status of a property
   */
  async toggleFeatured(propertyId: string) {
    await this.navigateToProperties()
    
    const propertyRow = this.page.locator(`[data-testid="property-row-${propertyId}"]`)
    await propertyRow.locator('[data-testid="toggle-featured"]').click()
    
    // Wait for success message
    await expect(this.page.locator('text=Featured status updated')).toBeVisible({ timeout: testConfig.timeouts.short })
  }

  /**
   * Search for properties
   */
  async searchProperties(searchTerm: string) {
    await this.navigateToProperties()
    
    await this.page.fill('[data-testid="search-input"]', searchTerm)
    await this.page.press('[data-testid="search-input"]', 'Enter')
    
    // Wait for search results
    await this.page.waitForTimeout(1000)
  }

  /**
   * Filter properties by category
   */
  async filterByCategory(categoryName: string) {
    await this.navigateToProperties()
    
    await this.page.click('[data-testid="category-filter"]')
    await this.page.click(`text=${categoryName}`)
    
    // Wait for filter results
    await this.page.waitForTimeout(1000)
  }

  /**
   * Upload test images to property
   */
  async uploadTestImages() {
    // Create test image file paths (you should have test images in tests/e2e/fixtures/)
    const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg')
    
    // Upload image
    const uploadInput = this.page.locator('input[type="file"]')
    await uploadInput.setInputFiles(testImagePath)
    
    // Wait for crop dialog
    await expect(this.page.locator('text=Advanced Image Editor')).toBeVisible({ timeout: testConfig.timeouts.short })
    
    // Add alt text and save
    await this.page.fill('[id="altText"]', 'Test property image')
    await this.page.click('text=Save Image')
    
    // Wait for image to be added
    await expect(this.page.locator('text=Image added successfully')).toBeVisible({ timeout: testConfig.timeouts.short })
  }

  /**
   * Add a feature to the property
   */
  private async addFeature(feature: string) {
    await this.page.fill('[data-testid="custom-feature-input"]', feature)
    await this.page.click('[data-testid="add-feature-button"]')
  }

  /**
   * Add an amenity to the property
   */
  private async addAmenity(amenity: string) {
    await this.page.fill('[data-testid="custom-amenity-input"]', amenity)
    await this.page.click('[data-testid="add-amenity-button"]')
  }

  /**
   * Get property ID by title from the properties list
   */
  async getPropertyIdByTitle(title: string): Promise<string> {
    await this.navigateToProperties()
    
    const propertyRow = this.page.locator(`text=${title}`).locator('..').locator('..')
    const editLink = propertyRow.locator('a[href*="/edit"]')
    const href = await editLink.getAttribute('href')
    
    if (!href) {
      throw new Error(`Could not find property with title: ${title}`)
    }
    
    // Extract ID from URL like /en/admin/properties/123/edit
    const match = href.match(/\/properties\/([^\/]+)\/edit/)
    if (!match) {
      throw new Error(`Could not extract property ID from URL: ${href}`)
    }
    
    return match[1]
  }

  /**
   * Verify property exists in list
   */
  async verifyPropertyExists(title: string): Promise<boolean> {
    await this.navigateToProperties()
    return await this.page.locator(`text=${title}`).isVisible()
  }

  /**
   * Verify property does not exist in list
   */
  async verifyPropertyNotExists(title: string): Promise<boolean> {
    await this.navigateToProperties()
    return !(await this.page.locator(`text=${title}`).isVisible())
  }

  /**
   * Get property data from the view page
   */
  async getPropertyData(propertyId: string) {
    await this.page.goto(`/en/properties/${propertyId}`)
    
    const title = await this.page.locator('h1').textContent()
    const price = await this.page.locator('[data-testid="property-price"]').textContent()
    const location = await this.page.locator('[data-testid="property-location"]').textContent()
    
    return { title, price, location }
  }
} 
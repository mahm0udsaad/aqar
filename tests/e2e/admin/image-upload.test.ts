import { test, expect } from '@playwright/test'
import { AuthHelper } from '../utils/auth'
import { PropertyHelper } from '../utils/property-helper'
import { TestUtils } from '../utils/test-utils'
import { testConfig } from '../test.config'
import path from 'path'

test.describe('Image Upload & Cropping Functionality', () => {
  let authHelper: AuthHelper
  let propertyHelper: PropertyHelper
  let testUtils: TestUtils
  let createdPropertyIds: string[] = []

  const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg')

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

  test('should upload and crop image during property creation', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Navigate to create property
    await propertyHelper.navigateToProperties()
    await page.click('text=Add New Property')
    
    // Fill basic property information
    await page.fill('[name="title"]', uniqueData.property.title)
    await page.fill('[name="description"]', uniqueData.property.description)
    await page.fill('[name="price"]', uniqueData.property.price)
    await page.fill('[name="location"]', uniqueData.property.location)
    
    // Upload image
    const uploadInput = page.locator('input[type="file"]')
    await uploadInput.setInputFiles(testImagePath)
    
    // Wait for Advanced Image Editor to open
    await expect(page.locator('text=Advanced Image Editor')).toBeVisible({ 
      timeout: testConfig.timeouts.medium 
    })
    
    // Verify crop interface is loaded
    await expect(page.locator('[data-testid="crop-area"]')).toBeVisible()
    
    // Add alt text
    await page.fill('[id="altText"]', 'Test property image alt text')
    
    // Save the cropped image
    await page.click('text=Save Image')
    
    // Wait for image to be added
    await expect(page.locator('text=Image added successfully')).toBeVisible({ 
      timeout: testConfig.timeouts.medium 
    })
    
    // Verify image appears in the property form
    await expect(page.locator('[data-testid="uploaded-image"]')).toBeVisible()
    
    // Save the property
    await page.click('text=Save Property')
    
    // Wait for success and get property ID
    await expect(page.locator('text=Property created successfully')).toBeVisible({ 
      timeout: testConfig.timeouts.medium 
    })
    
    const propertyId = await propertyHelper.getPropertyIdByTitle(uniqueData.property.title)
    createdPropertyIds.push(propertyId)
  })

  test('should allow multiple image uploads', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Navigate to create property
    await propertyHelper.navigateToProperties()
    await page.click('text=Add New Property')
    
    // Fill basic property information
    await page.fill('[name="title"]', uniqueData.property.title)
    await page.fill('[name="description"]', uniqueData.property.description)
    await page.fill('[name="price"]', uniqueData.property.price)
    await page.fill('[name="location"]', uniqueData.property.location)
    
    // Upload first image
    const uploadInput = page.locator('input[type="file"]')
    await uploadInput.setInputFiles(testImagePath)
    
    // Crop and save first image
    await expect(page.locator('text=Advanced Image Editor')).toBeVisible()
    await page.fill('[id="altText"]', 'First property image')
    await page.click('text=Save Image')
    await expect(page.locator('text=Image added successfully')).toBeVisible()
    
    // Upload second image
    await uploadInput.setInputFiles(testImagePath)
    
    // Crop and save second image
    await expect(page.locator('text=Advanced Image Editor')).toBeVisible()
    await page.fill('[id="altText"]', 'Second property image')
    await page.click('text=Save Image')
    await expect(page.locator('text=Image added successfully')).toBeVisible()
    
    // Verify both images are present
    const imageCount = await page.locator('[data-testid="uploaded-image"]').count()
    expect(imageCount).toBe(2)
    
    // Save the property
    await page.click('text=Save Property')
    await expect(page.locator('text=Property created successfully')).toBeVisible()
    
    const propertyId = await propertyHelper.getPropertyIdByTitle(uniqueData.property.title)
    createdPropertyIds.push(propertyId)
  })

  test('should set main image correctly', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create property first
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    createdPropertyIds.push(propertyId)
    
    // Navigate to edit property
    await page.goto(`/en/admin/properties/${propertyId}/edit`)
    
    // Upload first image
    const uploadInput = page.locator('input[type="file"]')
    await uploadInput.setInputFiles(testImagePath)
    
    // Crop and save first image
    await expect(page.locator('text=Advanced Image Editor')).toBeVisible()
    await page.fill('[id="altText"]', 'First property image')
    await page.click('text=Save Image')
    await expect(page.locator('text=Image added successfully')).toBeVisible()
    
    // Upload second image
    await uploadInput.setInputFiles(testImagePath)
    
    // Crop and save second image
    await expect(page.locator('text=Advanced Image Editor')).toBeVisible()
    await page.fill('[id="altText"]', 'Second property image')
    await page.click('text=Save Image')
    await expect(page.locator('text=Image added successfully')).toBeVisible()
    
    // Verify first image is marked as main
    const firstImage = page.locator('[data-testid="uploaded-image"]').first()
    await expect(firstImage.locator('text=Main Image')).toBeVisible()
    
    // Click "Set as Main Image" on second image
    const secondImage = page.locator('[data-testid="uploaded-image"]').nth(1)
    await secondImage.locator('text=Set as Main Image').click()
    
    // Verify second image is now marked as main
    await expect(secondImage.locator('text=Main Image')).toBeVisible()
    
    // Save the property
    await page.click('text=Update Property')
    await expect(page.locator('text=Property updated successfully')).toBeVisible()
  })

  test('should delete uploaded images', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Navigate to create property
    await propertyHelper.navigateToProperties()
    await page.click('text=Add New Property')
    
    // Fill basic property information
    await page.fill('[name="title"]', uniqueData.property.title)
    await page.fill('[name="description"]', uniqueData.property.description)
    await page.fill('[name="price"]', uniqueData.property.price)
    await page.fill('[name="location"]', uniqueData.property.location)
    
    // Upload image
    const uploadInput = page.locator('input[type="file"]')
    await uploadInput.setInputFiles(testImagePath)
    
    // Crop and save image
    await expect(page.locator('text=Advanced Image Editor')).toBeVisible()
    await page.fill('[id="altText"]', 'Test property image')
    await page.click('text=Save Image')
    await expect(page.locator('text=Image added successfully')).toBeVisible()
    
    // Verify image is present
    await expect(page.locator('[data-testid="uploaded-image"]')).toBeVisible()
    
    // Delete the image
    const uploadedImage = page.locator('[data-testid="uploaded-image"]').first()
    await uploadedImage.hover()
    await uploadedImage.locator('[data-testid="delete-button"]').click()
    
    // Verify image is removed
    await expect(page.locator('[data-testid="uploaded-image"]')).not.toBeVisible()
    
    // Save the property without images
    await page.click('text=Save Property')
    await expect(page.locator('text=Property created successfully')).toBeVisible()
    
    const propertyId = await propertyHelper.getPropertyIdByTitle(uniqueData.property.title)
    createdPropertyIds.push(propertyId)
  })

  test('should reorder images by drag and drop', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Navigate to create property
    await propertyHelper.navigateToProperties()
    await page.click('text=Add New Property')
    
    // Fill basic property information
    await page.fill('[name="title"]', uniqueData.property.title)
    await page.fill('[name="description"]', uniqueData.property.description)
    await page.fill('[name="price"]', uniqueData.property.price)
    await page.fill('[name="location"]', uniqueData.property.location)
    
    // Upload multiple images
    const uploadInput = page.locator('input[type="file"]')
    
    // First image
    await uploadInput.setInputFiles(testImagePath)
    await expect(page.locator('text=Advanced Image Editor')).toBeVisible()
    await page.fill('[id="altText"]', 'First image')
    await page.click('text=Save Image')
    await expect(page.locator('text=Image added successfully')).toBeVisible()
    
    // Second image
    await uploadInput.setInputFiles(testImagePath)
    await expect(page.locator('text=Advanced Image Editor')).toBeVisible()
    await page.fill('[id="altText"]', 'Second image')
    await page.click('text=Save Image')
    await expect(page.locator('text=Image added successfully')).toBeVisible()
    
    // Third image
    await uploadInput.setInputFiles(testImagePath)
    await expect(page.locator('text=Advanced Image Editor')).toBeVisible()
    await page.fill('[id="altText"]', 'Third image')
    await page.click('text=Save Image')
    await expect(page.locator('text=Image added successfully')).toBeVisible()
    
    // Verify all images are present
    const imageCount = await page.locator('[data-testid="uploaded-image"]').count()
    expect(imageCount).toBe(3)
    
    // Perform drag and drop to reorder
    const firstImage = page.locator('[data-testid="uploaded-image"]').first()
    const thirdImage = page.locator('[data-testid="uploaded-image"]').nth(2)
    
    await firstImage.dragTo(thirdImage)
    
    // Wait for reorder to complete
    await page.waitForTimeout(1000)
    
    // Save the property
    await page.click('text=Save Property')
    await expect(page.locator('text=Property created successfully')).toBeVisible()
    
    const propertyId = await propertyHelper.getPropertyIdByTitle(uniqueData.property.title)
    createdPropertyIds.push(propertyId)
  })

  test('should validate image file types', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Navigate to create property
    await propertyHelper.navigateToProperties()
    await page.click('text=Add New Property')
    
    // Fill basic property information
    await page.fill('[name="title"]', uniqueData.property.title)
    await page.fill('[name="description"]', uniqueData.property.description)
    await page.fill('[name="price"]', uniqueData.property.price)
    await page.fill('[name="location"]', uniqueData.property.location)
    
    // Try to upload a non-image file (create a text file)
    const textFilePath = path.join(__dirname, '../fixtures/test-file.txt')
    await page.locator('input[type="file"]').setInputFiles(textFilePath)
    
    // Should see error message
    await expect(page.locator('text=Please upload only image files')).toBeVisible({ 
      timeout: testConfig.timeouts.short 
    })
  })

  test('should handle image cropping with different aspect ratios', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Navigate to create property
    await propertyHelper.navigateToProperties()
    await page.click('text=Add New Property')
    
    // Fill basic property information
    await page.fill('[name="title"]', uniqueData.property.title)
    await page.fill('[name="description"]', uniqueData.property.description)
    await page.fill('[name="price"]', uniqueData.property.price)
    await page.fill('[name="location"]', uniqueData.property.location)
    
    // Upload image
    const uploadInput = page.locator('input[type="file"]')
    await uploadInput.setInputFiles(testImagePath)
    
    // Wait for Advanced Image Editor to open
    await expect(page.locator('text=Advanced Image Editor')).toBeVisible()
    
    // Test different aspect ratios
    await page.click('text=16:9')
    await page.waitForTimeout(500)
    
    await page.click('text=4:3')
    await page.waitForTimeout(500)
    
    await page.click('text=1:1')
    await page.waitForTimeout(500)
    
    // Test zoom controls
    const zoomSlider = page.locator('[data-testid="zoom-slider"]')
    await zoomSlider.fill('1.5')
    await page.waitForTimeout(500)
    
    // Add alt text
    await page.fill('[id="altText"]', 'Cropped test image')
    
    // Save the cropped image
    await page.click('text=Save Image')
    await expect(page.locator('text=Image added successfully')).toBeVisible()
    
    // Save the property
    await page.click('text=Save Property')
    await expect(page.locator('text=Property created successfully')).toBeVisible()
    
    const propertyId = await propertyHelper.getPropertyIdByTitle(uniqueData.property.title)
    createdPropertyIds.push(propertyId)
  })

  test('should edit image alt text', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Navigate to create property
    await propertyHelper.navigateToProperties()
    await page.click('text=Add New Property')
    
    // Fill basic property information
    await page.fill('[name="title"]', uniqueData.property.title)
    await page.fill('[name="description"]', uniqueData.property.description)
    await page.fill('[name="price"]', uniqueData.property.price)
    await page.fill('[name="location"]', uniqueData.property.location)
    
    // Upload image
    const uploadInput = page.locator('input[type="file"]')
    await uploadInput.setInputFiles(testImagePath)
    
    // Crop and save image with initial alt text
    await expect(page.locator('text=Advanced Image Editor')).toBeVisible()
    await page.fill('[id="altText"]', 'Initial alt text')
    await page.click('text=Save Image')
    await expect(page.locator('text=Image added successfully')).toBeVisible()
    
    // Find the uploaded image and edit alt text
    const uploadedImage = page.locator('[data-testid="uploaded-image"]').first()
    
    // Click on the description area to edit
    await uploadedImage.locator('[data-testid="alt-text-display"]').click()
    
    // Edit the alt text
    await uploadedImage.locator('textarea').fill('Updated alt text description')
    await uploadedImage.locator('text=Save').click()
    
    // Verify alt text was updated
    await expect(uploadedImage.locator('text=Updated alt text description')).toBeVisible()
    
    // Save the property
    await page.click('text=Save Property')
    await expect(page.locator('text=Property created successfully')).toBeVisible()
    
    const propertyId = await propertyHelper.getPropertyIdByTitle(uniqueData.property.title)
    createdPropertyIds.push(propertyId)
  })

  test('should handle maximum image limit', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Navigate to create property
    await propertyHelper.navigateToProperties()
    await page.click('text=Add New Property')
    
    // Fill basic property information
    await page.fill('[name="title"]', uniqueData.property.title)
    await page.fill('[name="description"]', uniqueData.property.description)
    await page.fill('[name="price"]', uniqueData.property.price)
    await page.fill('[name="location"]', uniqueData.property.location)
    
    const uploadInput = page.locator('input[type="file"]')
    
    // Upload maximum number of images (assuming limit is 10)
    for (let i = 0; i < 10; i++) {
      await uploadInput.setInputFiles(testImagePath)
      await expect(page.locator('text=Advanced Image Editor')).toBeVisible()
      await page.fill('[id="altText"]', `Image ${i + 1}`)
      await page.click('text=Save Image')
      await expect(page.locator('text=Image added successfully')).toBeVisible()
    }
    
    // Try to upload one more image
    await uploadInput.setInputFiles(testImagePath)
    
    // Should see maximum limit error
    await expect(page.locator('text=Maximum 10 images allowed')).toBeVisible({ 
      timeout: testConfig.timeouts.short 
    })
    
    // Save the property
    await page.click('text=Save Property')
    await expect(page.locator('text=Property created successfully')).toBeVisible()
    
    const propertyId = await propertyHelper.getPropertyIdByTitle(uniqueData.property.title)
    createdPropertyIds.push(propertyId)
  })

  test('should preserve images when editing property', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Create property first
    const propertyId = await propertyHelper.createProperty(uniqueData.property)
    createdPropertyIds.push(propertyId)
    
    // Navigate to edit property
    await page.goto(`/en/admin/properties/${propertyId}/edit`)
    
    // Upload image
    const uploadInput = page.locator('input[type="file"]')
    await uploadInput.setInputFiles(testImagePath)
    
    // Crop and save image
    await expect(page.locator('text=Advanced Image Editor')).toBeVisible()
    await page.fill('[id="altText"]', 'Test property image')
    await page.click('text=Save Image')
    await expect(page.locator('text=Image added successfully')).toBeVisible()
    
    // Update property information
    await page.fill('[name="title"]', `${uniqueData.property.title} - Updated`)
    
    // Save the property
    await page.click('text=Update Property')
    await expect(page.locator('text=Property updated successfully')).toBeVisible()
    
    // Navigate back to edit page
    await page.goto(`/en/admin/properties/${propertyId}/edit`)
    
    // Verify image is still there
    await expect(page.locator('[data-testid="uploaded-image"]')).toBeVisible()
    await expect(page.locator('text=Test property image')).toBeVisible()
  })

  test('should cancel image crop and return to upload', async ({ page }) => {
    const uniqueData = testUtils.generateUniqueTestData()
    
    // Navigate to create property
    await propertyHelper.navigateToProperties()
    await page.click('text=Add New Property')
    
    // Fill basic property information
    await page.fill('[name="title"]', uniqueData.property.title)
    await page.fill('[name="description"]', uniqueData.property.description)
    await page.fill('[name="price"]', uniqueData.property.price)
    await page.fill('[name="location"]', uniqueData.property.location)
    
    // Upload image
    const uploadInput = page.locator('input[type="file"]')
    await uploadInput.setInputFiles(testImagePath)
    
    // Wait for Advanced Image Editor to open
    await expect(page.locator('text=Advanced Image Editor')).toBeVisible()
    
    // Cancel the crop
    await page.click('text=Cancel')
    
    // Should be back to the property form
    await expect(page.locator('text=Advanced Image Editor')).not.toBeVisible()
    
    // Should not have any uploaded images
    await expect(page.locator('[data-testid="uploaded-image"]')).not.toBeVisible()
    
    // Save the property without images
    await page.click('text=Save Property')
    await expect(page.locator('text=Property created successfully')).toBeVisible()
    
    const propertyId = await propertyHelper.getPropertyIdByTitle(uniqueData.property.title)
    createdPropertyIds.push(propertyId)
  })
}) 
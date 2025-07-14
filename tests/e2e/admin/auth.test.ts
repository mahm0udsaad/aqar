import { test, expect } from '@playwright/test'
import { AuthHelper } from '../utils/auth'
import { TestUtils } from '../utils/test-utils'
import { testConfig } from '../test.config'

test.describe('Admin Authentication & Authorization', () => {
  let authHelper: AuthHelper
  let testUtils: TestUtils

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    testUtils = new TestUtils(page)
  })

  test.afterEach(async ({ page }) => {
    // Cleanup after each test
    try {
      await authHelper.logout()
    } catch (error) {
      // Ignore logout errors in cleanup
    }
  })

  test('should login as admin successfully', async ({ page }) => {
    // Login as admin
    await authHelper.loginAsAdmin()
    
    // Verify we're on admin dashboard
    await expect(page).toHaveURL('/en/admin')
    await expect(page.locator('h1')).toContainText('Dashboard')
    
    // Verify admin navigation is visible
    await expect(page.locator('text=Properties')).toBeVisible()
    await expect(page.locator('text=Categories')).toBeVisible()
    await expect(page.locator('text=Featured')).toBeVisible()
    await expect(page.locator('text=Settings')).toBeVisible()
  })

  test('should reject invalid admin credentials', async ({ page }) => {
    await page.goto('/en/auth/login')
    
    // Try invalid credentials
    await page.fill('[name="email"]', 'invalid@example.com')
    await page.fill('[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Should see error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ 
      timeout: testConfig.timeouts.short 
    })
    
    // Should stay on login page
    await expect(page).toHaveURL('/en/auth/login')
  })

  test('should prevent non-admin users from accessing admin dashboard', async ({ page }) => {
    // Login as regular user
    await authHelper.loginAsRegularUser()
    
    // Try to access admin dashboard
    await page.goto('/en/admin')
    
    // Should be redirected away from admin
    await expect(page).not.toHaveURL('/en/admin', { timeout: testConfig.timeouts.short })
    
    // Should be on home page or login page
    const currentUrl = page.url()
    expect(currentUrl.endsWith('/en') || currentUrl.includes('/auth/login')).toBeTruthy()
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access admin dashboard without login
    await page.goto('/en/admin')
    
    // Should be redirected to login
    await expect(page).toHaveURL('/en/auth/login', { timeout: testConfig.timeouts.short })
  })

  test('should logout admin successfully', async ({ page }) => {
    // Login first
    await authHelper.loginAsAdmin()
    
    // Logout
    await authHelper.logout()
    
    // Try to access admin dashboard again
    await page.goto('/en/admin')
    
    // Should be redirected to login
    await expect(page).toHaveURL('/en/auth/login', { timeout: testConfig.timeouts.short })
  })

  test('should maintain admin session across page refreshes', async ({ page }) => {
    // Login as admin
    await authHelper.loginAsAdmin()
    
    // Refresh the page
    await page.reload()
    
    // Should still be on admin dashboard
    await expect(page).toHaveURL('/en/admin')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('should allow admin to access all admin sections', async ({ page }) => {
    // Login as admin
    await authHelper.loginAsAdmin()
    
    // Test access to Properties section
    await page.click('text=Properties')
    await expect(page).toHaveURL('/en/admin/properties')
    await expect(page.locator('h1')).toContainText('Properties')
    
    // Test access to Categories section
    await page.click('text=Categories')
    await expect(page).toHaveURL('/en/admin/categories')
    await expect(page.locator('h1')).toContainText('Categories')
    
    // Test access to Featured section
    await page.click('text=Featured')
    await expect(page).toHaveURL('/en/admin/featured')
    await expect(page.locator('h1')).toContainText('Featured')
    
    // Test access to Settings section
    await page.click('text=Settings')
    await expect(page).toHaveURL('/en/admin/settings')
    await expect(page.locator('h1')).toContainText('Settings')
    
    // Return to dashboard
    await page.click('text=Dashboard')
    await expect(page).toHaveURL('/en/admin')
  })

  test('should show proper error for missing email', async ({ page }) => {
    await page.goto('/en/auth/login')
    
    // Submit without email
    await page.fill('[name="password"]', 'somepassword')
    await page.click('button[type="submit"]')
    
    // Should see validation error
    await expect(page.locator('text=Email is required')).toBeVisible({ 
      timeout: testConfig.timeouts.short 
    })
  })

  test('should show proper error for missing password', async ({ page }) => {
    await page.goto('/en/auth/login')
    
    // Submit without password
    await page.fill('[name="email"]', 'test@example.com')
    await page.click('button[type="submit"]')
    
    // Should see validation error
    await expect(page.locator('text=Password is required')).toBeVisible({ 
      timeout: testConfig.timeouts.short 
    })
  })

  test('should handle session expiry gracefully', async ({ page }) => {
    // Login as admin
    await authHelper.loginAsAdmin()
    
    // Simulate session expiry by clearing storage
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Try to access admin functionality
    await page.goto('/en/admin/properties')
    
    // Should be redirected to login
    await expect(page).toHaveURL('/en/auth/login', { timeout: testConfig.timeouts.medium })
  })

  test('should prevent SQL injection in login form', async ({ page }) => {
    await page.goto('/en/auth/login')
    
    // Try SQL injection in email field
    await page.fill('[name="email"]', "admin@test.com'; DROP TABLE users; --")
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    
    // Should see invalid credentials error, not crash
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ 
      timeout: testConfig.timeouts.short 
    })
  })

  test('should handle concurrent login attempts', async ({ page, context }) => {
    // Create a second page
    const page2 = await context.newPage()
    const authHelper2 = new AuthHelper(page2)
    
    // Login on both pages simultaneously
    await Promise.all([
      authHelper.loginAsAdmin(),
      authHelper2.loginAsAdmin()
    ])
    
    // Both should be able to access admin
    await expect(page).toHaveURL('/en/admin')
    await expect(page2).toHaveURL('/en/admin')
    
    // Clean up
    await page2.close()
  })
}) 
import { Page, expect } from '@playwright/test'
import { testConfig } from '../test.config'

export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Login as admin user
   */
  async loginAsAdmin() {
    await this.page.goto('/en/auth/login')
    
    // Fill login form
    await this.page.fill('[name="email"]', testConfig.testUsers.admin.email)
    await this.page.fill('[name="password"]', testConfig.testUsers.admin.password)
    
    // Submit form
    await this.page.click('button[type="submit"]')
    
    // Wait for redirect to admin dashboard
    await expect(this.page).toHaveURL('/en/admin', { timeout: testConfig.timeouts.medium })
    
    // Verify admin dashboard loaded
    await expect(this.page.locator('h1')).toContainText('Dashboard', { timeout: testConfig.timeouts.short })
  }

  /**
   * Login as regular user
   */
  async loginAsRegularUser() {
    await this.page.goto('/en/auth/login')
    
    // Fill login form  
    await this.page.fill('[name="email"]', testConfig.testUsers.regularUser.email)
    await this.page.fill('[name="password"]', testConfig.testUsers.regularUser.password)
    
    // Submit form
    await this.page.click('button[type="submit"]')
    
    // Wait for redirect to home page (regular users can't access admin)
    await expect(this.page).toHaveURL('/en', { timeout: testConfig.timeouts.medium })
  }

  /**
   * Logout current user
   */
  async logout() {
    // Look for user menu or logout button
    const userMenu = this.page.locator('[data-testid="user-menu"]').first()
    if (await userMenu.isVisible()) {
      await userMenu.click()
      await this.page.click('[data-testid="logout-button"]')
    } else {
      // Try direct logout if user menu not found
      await this.page.goto('/en/auth/logout')
    }
    
    // Verify redirected to home or login page
    await expect(this.page).toHaveURL(/\/(en\/)?(auth\/login)?$/, { timeout: testConfig.timeouts.short })
  }

  /**
   * Verify user is logged in as admin
   */
  async verifyAdminAccess() {
    // Try to access admin dashboard
    await this.page.goto('/en/admin')
    
    // Should be able to access without redirect
    await expect(this.page).toHaveURL('/en/admin', { timeout: testConfig.timeouts.short })
    await expect(this.page.locator('h1')).toContainText('Dashboard', { timeout: testConfig.timeouts.short })
  }

  /**
   * Verify user does not have admin access
   */
  async verifyNoAdminAccess() {
    // Try to access admin dashboard
    await this.page.goto('/en/admin')
    
    // Should be redirected to home page or login
    await expect(this.page).not.toHaveURL('/en/admin', { timeout: testConfig.timeouts.short })
  }

  /**
   * Create admin session for test setup
   */
  async setupAdminSession() {
    await this.loginAsAdmin()
    
    // Store authentication state
    await this.page.context().storageState({ path: 'tests/e2e/fixtures/admin-auth.json' })
  }

  /**
   * Create regular user session for test setup
   */
  async setupRegularUserSession() {
    await this.loginAsRegularUser()
    
    // Store authentication state
    await this.page.context().storageState({ path: 'tests/e2e/fixtures/user-auth.json' })
  }
} 
# End-to-End Testing for Real Estate Admin Dashboard

This directory contains comprehensive end-to-end tests for the admin dashboard functionality using Playwright.

## Test Coverage

The E2E test suite covers all major CRUD operations and functionality:

### 🔐 Authentication & Authorization (`auth.test.ts`)
- Admin login/logout
- Invalid credentials handling
- Non-admin user access restrictions
- Session persistence and expiry
- Security validations (SQL injection prevention)

### 🏠 Properties CRUD (`properties-crud.test.ts`)
- Create properties with all fields
- Edit existing properties
- Delete properties
- Toggle featured status
- Search and filter properties
- Form validation (required fields, email format, price validation)
- Special characters and large data handling
- Concurrent operations

### 🏷️ Categories CRUD (`categories-crud.test.ts`)
- Create categories
- Edit existing categories
- Delete categories (with proper validation for categories with properties)
- Reorder categories via drag-and-drop
- Category name uniqueness validation
- Property count tracking per category

### 📸 Image Upload & Cropping (`image-upload.test.ts`)
- Upload multiple images
- Advanced image cropping with different aspect ratios
- Set main image
- Edit alt text for accessibility
- Delete images
- Reorder images via drag-and-drop
- File type validation
- Maximum image limit enforcement
- Image persistence across property edits

### ⭐ Featured Properties (`featured-properties.test.ts`)
- Toggle featured status from multiple locations
- View featured properties list
- Edit/view properties from featured list
- Featured count tracking on dashboard
- Featured status persistence

### 📊 Dashboard Overview (`dashboard-overview.test.ts`)
- Statistics display and updates
- Navigation between admin sections
- Real-time statistics updates
- Responsive design testing
- Loading states and error handling

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm add -D @playwright/test
```

### 2. Configure Test Environment

Create a `.env.test.local` file with your test credentials:

```bash
# Test Environment Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Test admin user credentials (create these in your Supabase)
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=testpassword123
TEST_REGULAR_USER_EMAIL=user@test.com
TEST_REGULAR_USER_PASSWORD=testpassword123

# Base URL for testing
BASE_URL=http://localhost:3000
```

### 3. Create Test Users in Supabase

Before running tests, create test users in your Supabase database:

1. **Admin User**: Create a user with `admin@test.com` and set their role to `admin` in the `user_profiles` table
2. **Regular User**: Create a user with `user@test.com` with regular user role

### 4. Install Playwright Browsers

```bash
npx playwright install
```

## Running Tests

### Run All Tests
```bash
pnpm playwright test
```

### Run Specific Test Suites
```bash
# Authentication tests
pnpm playwright test tests/e2e/admin/auth.test.ts

# Properties CRUD tests
pnpm playwright test tests/e2e/admin/properties-crud.test.ts

# Categories CRUD tests
pnpm playwright test tests/e2e/admin/categories-crud.test.ts

# Image upload tests
pnpm playwright test tests/e2e/admin/image-upload.test.ts

# Featured properties tests
pnpm playwright test tests/e2e/admin/featured-properties.test.ts

# Dashboard overview tests
pnpm playwright test tests/e2e/admin/dashboard-overview.test.ts
```

### Run Tests in Different Browsers
```bash
# Chrome
pnpm playwright test --project=chromium

# Firefox
pnpm playwright test --project=firefox

# Safari
pnpm playwright test --project=webkit

# Mobile Chrome
pnpm playwright test --project="Mobile Chrome"
```

### Run Tests in Debug Mode
```bash
pnpm playwright test --debug
```

### Run Tests with UI Mode
```bash
pnpm playwright test --ui
```

## Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

Reports include:
- Test results with pass/fail status
- Screenshots on failure
- Video recordings of failed tests
- Detailed error messages and stack traces

## Test Structure

### Utils Directory (`utils/`)
Contains helper classes and utilities:

- **`auth.ts`**: Authentication helper for login/logout operations
- **`property-helper.ts`**: Property CRUD operations helper
- **`category-helper.ts`**: Category CRUD operations helper
- **`test-utils.ts`**: General test utilities and cleanup functions
- **`test.config.ts`**: Test configuration and test data

### Fixtures Directory (`fixtures/`)
Contains test assets:

- **`test-image.jpg`**: Sample image for upload testing
- **`admin-auth.json`**: Stored admin authentication state
- **`user-auth.json`**: Stored regular user authentication state

## Best Practices

### 1. Test Isolation
- Each test is isolated and cleans up after itself
- Uses unique test data with timestamps to avoid conflicts
- Properly handles concurrent test execution

### 2. Data Management
- Creates test data with predictable naming patterns
- Comprehensive cleanup in `afterEach` hooks
- Handles test data dependencies (e.g., properties before categories)

### 3. Error Handling
- Robust error handling with try-catch blocks
- Graceful handling of cleanup failures
- Proper timeout configurations

### 4. Maintainability
- Modular helper classes for reusable functionality
- Clear test descriptions and organized test suites
- Comprehensive documentation and comments

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify test user credentials in `.env.test.local`
   - Ensure test users exist in Supabase with correct roles
   - Check Supabase URL and API keys

2. **Test Timeouts**
   - Increase timeout values in `test.config.ts`
   - Check if development server is running properly
   - Verify network connectivity

3. **Image Upload Tests Failing**
   - Ensure `test-image.jpg` exists in `fixtures/` directory
   - Check file permissions
   - Verify image upload functionality works in manual testing

4. **Database Cleanup Issues**
   - Check if test data is being created with proper naming patterns
   - Verify cleanup functions have proper error handling
   - Run tests with `--debug` to see detailed cleanup logs

### Debugging Tips

1. **Use Debug Mode**: `pnpm playwright test --debug`
2. **Screenshots**: Automatic screenshots are taken on failure
3. **Video Recording**: Videos are recorded for failed tests
4. **Console Logs**: Check browser console logs in the HTML report
5. **Slow Motion**: Add `page.setDefaultTimeout(10000)` for slower execution

## Continuous Integration

For CI/CD pipelines, add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ci": "playwright test --reporter=github",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: pnpm install
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          TEST_ADMIN_EMAIL: ${{ secrets.TEST_ADMIN_EMAIL }}
          TEST_ADMIN_PASSWORD: ${{ secrets.TEST_ADMIN_PASSWORD }}
          # ... other environment variables
```

## Contributing

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Add comprehensive cleanup in `afterEach` hooks
3. Use the helper classes for common operations
4. Include both positive and negative test cases
5. Test edge cases and error conditions
6. Update this README with new test descriptions

## Test Data Patterns

The tests use predictable patterns for test data:
- Properties: `Test Property E2E ${timestamp}`
- Categories: `Test Category E2E ${timestamp}`
- Unique identifiers ensure no conflicts between test runs
- All test data is automatically cleaned up after tests complete 
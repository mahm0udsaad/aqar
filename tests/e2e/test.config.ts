export const testConfig = {
  // Base URL for testing
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  
  // Test user credentials
  testUsers: {
    admin: {
      email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
      password: process.env.TEST_ADMIN_PASSWORD || 'testpassword123',
    },
    regularUser: {
      email: process.env.TEST_REGULAR_USER_EMAIL || 'user@test.com', 
      password: process.env.TEST_REGULAR_USER_PASSWORD || 'testpassword123',
    }
  },
  
  // Test timeouts
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000,
  },
  
  // Test data
  testData: {
    property: {
      title: 'Test Property E2E',
      description: 'This is a test property created during E2E testing',
      price: '500000',
      location: 'Test City, Test State',
      area: 'Test Area',
      bedrooms: '3',
      bathrooms: '2',
      size: '1200',
      yearBuilt: '2020',
      propertyType: 'villa',
      status: 'for_sale',
      contactName: 'Test Agent',
      contactPhone: '+1234567890',
      contactEmail: 'agent@test.com',
    },
    category: {
      name: 'Test Category E2E',
      description: 'This is a test category created during E2E testing',
    }
  }
} 
# StudioSyncWork Integration Tests

This directory contains comprehensive unit tests for the StudioSyncWork application's integration layers, specifically for **Supabase** and **Cloudinary** services.

## 🧪 Test Structure

```
src/integrations/
├── supabase/
│   ├── __tests__/
│   │   ├── client.test.ts          # Supabase client tests
│   │   └── edgeFunctions.test.ts   # Edge Functions tests
│   ├── client.ts                   # Supabase client
│   └── types.ts                    # Database types
├── cloudinary/
│   ├── __tests__/
│   │   └── cloudinaryClient.test.ts # Cloudinary integration tests
│   └── cloudinaryClient.ts          # Cloudinary client
└── test/
    └── setup.ts                     # Test configuration
```

## 🚀 Running Tests

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Quick Start
```bash
# Install dependencies (if not already installed)
npm install

# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run integration tests specifically
./run-integration-tests.sh
```

## 📋 Test Coverage

### Supabase Integration Tests (`client.test.ts`)

**Client Initialization**
- ✅ Client creation with correct configuration
- ✅ Environment variable validation
- ✅ Client instance export

**Database Operations**
- ✅ Profiles table operations (CRUD)
- ✅ Clients table operations (CRUD)
- ✅ Events table operations with pagination
- ✅ Error handling for database operations

**Authentication**
- ✅ User sign up
- ✅ User sign in
- ✅ User sign out
- ✅ Authentication error handling
- ✅ Session management

**Storage Operations**
- ✅ File upload to Supabase Storage
- ✅ Public URL generation
- ✅ File deletion from storage
- ✅ Storage error handling

**Edge Functions**
- ✅ Function invocation
- ✅ Function error handling
- ✅ Response parsing

**Real-time Subscriptions**
- ✅ Channel creation
- ✅ Event subscription
- ✅ Subscription cleanup

### Supabase Edge Functions Tests (`edgeFunctions.test.ts`)

**Upload to Cloudinary Function**
- ✅ Successful file upload
- ✅ Error handling
- ✅ CORS preflight requests

**Email Functions**
- ✅ Send estimate email
- ✅ Send onboarding email
- ✅ Email error handling

**AI Functions**
- ✅ Media tagging
- ✅ Face detection
- ✅ Intelligent scheduling
- ✅ Logo generation

**Error Handling**
- ✅ Network errors
- ✅ Malformed responses
- ✅ Timeout handling

### Cloudinary Integration Tests (`cloudinaryClient.test.ts`)

**Configuration**
- ✅ Environment variable setup
- ✅ Client initialization

**File Upload**
- ✅ Basic file upload
- ✅ Custom upload options
- ✅ Video uploads
- ✅ Error handling
- ✅ FileReader error handling

**File Management**
- ✅ File deletion
- ✅ Delete error handling
- ✅ Special character handling

**URL Generation**
- ✅ Basic URL generation
- ✅ URL with transformations
- ✅ Responsive URL generation

**Image Transformations**
- ✅ Thumbnail transformation
- ✅ Medium transformation
- ✅ Large transformation
- ✅ Square transformation
- ✅ WebP transformation
- ✅ Blur transformation
- ✅ Auto-crop transformation

**Edge Cases**
- ✅ Empty file handling
- ✅ Large file uploads
- ✅ Network timeout errors
- ✅ Complete workflow testing
- ✅ Batch operations

## 🔧 Test Configuration

### Environment Variables
Tests use mocked environment variables defined in `src/test/setup.ts`:

```typescript
VITE_SUPABASE_URL: 'https://test.supabase.co'
VITE_SUPABASE_ANON_KEY: 'test-anon-key'
VITE_CLOUDINARY_CLOUD_NAME: 'test-cloud'
VITE_CLOUDINARY_API_KEY: 'test-api-key'
VITE_CLOUDINARY_API_SECRET: 'test-api-secret'
```

### Mocking Strategy
- **Supabase Client**: Fully mocked with Jest mocks
- **Cloudinary SDK**: Mocked uploader and URL generation
- **FileReader**: Mocked for file reading operations
- **Fetch API**: Mocked for Edge Function testing

## 📊 Test Metrics

### Coverage Goals
- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

### Performance Benchmarks
- Individual test execution: < 100ms
- Full test suite: < 30s
- Memory usage: < 100MB

## 🐛 Debugging Tests

### Running Individual Tests
```bash
# Run specific test file
npm run test src/integrations/supabase/__tests__/client.test.ts

# Run tests matching pattern
npm run test -- --grep "uploadToCloudinary"

# Run tests in watch mode
npm run test -- --watch
```

### Debug Mode
```bash
# Run tests with debug output
npm run test -- --reporter=verbose

# Run tests with UI for debugging
npm run test:ui
```

## 🔄 Continuous Integration

### GitHub Actions Integration
```yaml
name: Integration Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:run
      - run: npm run test:coverage
```

## 📝 Writing New Tests

### Test Structure
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Feature Name', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle success case', async () => {
    // Arrange
    const mockData = { /* test data */ }
    
    // Act
    const result = await functionUnderTest(mockData)
    
    // Assert
    expect(result).toEqual(expectedResult)
  })

  it('should handle error case', async () => {
    // Arrange
    const error = new Error('Test error')
    
    // Act & Assert
    await expect(functionUnderTest()).rejects.toThrow('Test error')
  })
})
```

### Best Practices
1. **Arrange-Act-Assert**: Structure tests clearly
2. **Mock External Dependencies**: Don't make real API calls
3. **Test Edge Cases**: Include error scenarios
4. **Descriptive Names**: Use clear test descriptions
5. **Single Responsibility**: One assertion per test when possible

## 🚨 Troubleshooting

### Common Issues

**Tests failing with "Cannot find module"**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Mock not working**
```bash
# Ensure mocks are properly imported
import { vi } from 'vitest'
```

**Environment variables not loaded**
```bash
# Check test setup file is imported
# Verify vitest.config.ts includes setupFiles
```

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Supabase Testing Guide](https://supabase.com/docs/guides/getting-started/testing)
- [Cloudinary Testing Guide](https://cloudinary.com/documentation/testing)

## 🤝 Contributing

When adding new integration tests:

1. Follow the existing test structure
2. Add comprehensive error handling tests
3. Include edge cases and boundary conditions
4. Update this README with new test coverage
5. Ensure all tests pass before submitting PR

---

**Happy Testing! 🎉**

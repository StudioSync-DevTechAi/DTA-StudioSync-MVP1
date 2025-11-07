// =====================================================
// Services Index - Central Export Point
// =====================================================

// Dashboard services
export * from './dashboard';

// Finance services
export * from './finance/queries';

// Preview services
export * from './preview';

// Events services
export * from './events/queries';

// Invoices services
export * from './invoices/queries';

// Quote Enquiries services
export * from './quoteEnquiries';

// =====================================================
// Service Configuration
// =====================================================

export const SERVICE_CONFIG = {
  // Cache settings
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Error handling
  DEFAULT_ERROR_MESSAGE: 'An error occurred while fetching data'
} as const;

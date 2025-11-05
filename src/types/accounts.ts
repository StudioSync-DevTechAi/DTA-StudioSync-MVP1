// Accounts table TypeScript interfaces for StudioSyncWork

export interface Account {
  id: string;
  account_number: string;
  account_name: string;
  account_type: 'client' | 'vendor' | 'internal';
  
  // Client information
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: Record<string, any>;
  
  // Account settings
  payment_terms: number; // days
  credit_limit: number;
  current_balance: number;
  currency: string;
  
  // Account status
  status: 'active' | 'suspended' | 'closed' | 'pending';
  status_reason?: string;
  
  // Financial tracking
  total_invoiced: number;
  total_paid: number;
  outstanding_balance: number;
  last_payment_date?: string;
  last_invoice_date?: string;
  
  // Account preferences
  preferred_payment_method?: 'credit_card' | 'bank_transfer' | 'check' | 'cash';
  billing_frequency: 'monthly' | 'quarterly' | 'annually' | 'per_project';
  auto_invoice: boolean;
  
  // Tax information
  tax_id?: string;
  tax_exempt: boolean;
  tax_rate: number; // percentage as decimal
  
  // Notes and metadata
  notes?: string;
  tags: string[];
  metadata: Record<string, any>;
  
  // Audit fields
  created_by?: string;
  created_at: string;
  updated_by?: string;
  updated_at: string;
}

export interface CreateAccountData {
  account_name: string;
  account_type?: 'client' | 'vendor' | 'internal';
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: Record<string, any>;
  payment_terms?: number;
  credit_limit?: number;
  currency?: string;
  preferred_payment_method?: 'credit_card' | 'bank_transfer' | 'check' | 'cash';
  billing_frequency?: 'monthly' | 'quarterly' | 'annually' | 'per_project';
  auto_invoice?: boolean;
  tax_id?: string;
  tax_exempt?: boolean;
  tax_rate?: number;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateAccountData {
  account_name?: string;
  account_type?: 'client' | 'vendor' | 'internal';
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: Record<string, any>;
  payment_terms?: number;
  credit_limit?: number;
  currency?: string;
  status?: 'active' | 'suspended' | 'closed' | 'pending';
  status_reason?: string;
  preferred_payment_method?: 'credit_card' | 'bank_transfer' | 'check' | 'cash';
  billing_frequency?: 'monthly' | 'quarterly' | 'annually' | 'per_project';
  auto_invoice?: boolean;
  tax_id?: string;
  tax_exempt?: boolean;
  tax_rate?: number;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface AccountSummary {
  account_number: string;
  account_name: string;
  current_balance: number;
  outstanding_balance: number;
  credit_limit: number;
  available_credit: number;
  days_overdue: number;
  status: string;
}

export interface OverdueAccount {
  account_id: string;
  account_number: string;
  account_name: string;
  outstanding_balance: number;
  days_overdue: number;
  last_payment_date?: string;
}

// Account transaction types
export type AccountTransactionType = 'invoice' | 'payment' | 'credit' | 'debit';

// Account status types
export type AccountStatus = 'active' | 'suspended' | 'closed' | 'pending';

// Account type options
export type AccountType = 'client' | 'vendor' | 'internal';

// Payment method options
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'check' | 'cash';

// Billing frequency options
export type BillingFrequency = 'monthly' | 'quarterly' | 'annually' | 'per_project';

# Accounts Table - StudioSyncWork

## Overview

The `accounts` table is a comprehensive account management system for StudioSyncWork that handles client accounts, vendor accounts, and internal accounts with full financial tracking capabilities.

## Table Structure

### Core Fields
- **`id`** - UUID primary key
- **`account_number`** - Auto-generated unique identifier (AC000001, AC000002, etc.)
- **`account_name`** - Display name for the account
- **`account_type`** - Type: 'client', 'vendor', or 'internal'

### Client Information
- **`client_name`** - Client's full name
- **`client_email`** - Client's email address
- **`client_phone`** - Client's phone number
- **`client_address`** - JSON object with address details

### Financial Tracking
- **`payment_terms`** - Payment terms in days (default: 30)
- **`credit_limit`** - Maximum credit allowed
- **`current_balance`** - Current account balance
- **`outstanding_balance`** - Amount owed by the account
- **`total_invoiced`** - Total amount invoiced
- **`total_paid`** - Total amount paid
- **`last_payment_date`** - Date of last payment
- **`last_invoice_date`** - Date of last invoice

### Account Settings
- **`status`** - Account status: 'active', 'suspended', 'closed', 'pending'
- **`currency`** - Account currency (default: 'USD')
- **`billing_frequency`** - How often to bill: 'monthly', 'quarterly', 'annually', 'per_project'
- **`auto_invoice`** - Whether to automatically generate invoices
- **`preferred_payment_method`** - Preferred payment method

### Tax Information
- **`tax_id`** - Tax identification number
- **`tax_exempt`** - Whether account is tax exempt
- **`tax_rate`** - Tax rate as decimal (e.g., 0.08 for 8%)

### Metadata
- **`notes`** - Additional notes about the account
- **`tags`** - Array of tags for categorization
- **`metadata`** - JSON object for additional data

## Database Functions

### `generate_account_number()`
Automatically generates unique account numbers in the format AC000001, AC000002, etc.

### `update_account_balance(account_id, amount, transaction_type)`
Updates account balances when transactions occur. Transaction types:
- `'invoice'` - Increases outstanding balance
- `'payment'` - Decreases outstanding balance
- `'credit'` - Decreases balance (refund/credit)
- `'debit'` - Increases balance (charge/adjustment)

### `get_account_summary(account_id)`
Returns a summary of account financials including:
- Current balance
- Outstanding balance
- Available credit
- Days overdue
- Account status

### `get_overdue_accounts(days_threshold)`
Returns accounts that are overdue by the specified number of days.

## Security (RLS Policies)

- **View**: Users can view accounts they created or if they have manager/accounts/crm roles
- **Insert**: Only managers, accounts, and CRM users can create accounts
- **Update**: Only managers, accounts, and CRM users can update accounts
- **Delete**: Only managers can delete accounts

## Usage Examples

### Creating an Account
```typescript
const newAccount = await supabase
  .from('accounts')
  .insert({
    account_name: 'John Doe Photography',
    account_type: 'client',
    client_name: 'John Doe',
    client_email: 'john@example.com',
    payment_terms: 30,
    credit_limit: 5000,
    currency: 'USD'
  })
  .select()
  .single();
```

### Updating Account Balance
```typescript
// When creating an invoice
await supabase.rpc('update_account_balance', {
  account_id: 'account-uuid',
  amount: 1500.00,
  transaction_type: 'invoice'
});

// When receiving payment
await supabase.rpc('update_account_balance', {
  account_id: 'account-uuid',
  amount: 1500.00,
  transaction_type: 'payment'
});
```

### Getting Account Summary
```typescript
const summary = await supabase
  .rpc('get_account_summary', { account_id: 'account-uuid' });
```

### Finding Overdue Accounts
```typescript
const overdueAccounts = await supabase
  .rpc('get_overdue_accounts', { days_threshold: 30 });
```

## Integration with Existing Tables

The accounts table integrates with:
- **`invoices`** - Link invoices to accounts for payment tracking
- **`finance_transactions`** - Track all financial activity
- **`scheduled_events`** - Associate events with client accounts
- **`profiles`** - Track which user created/manages accounts

## React Hook Usage

Use the `useAccounts` hook for easy account management:

```typescript
import { useAccounts } from '@/hooks/accounts/useAccounts';

function MyComponent() {
  const {
    accounts,
    loading,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccountSummary,
    getOverdueAccounts
  } = useAccounts();

  // Use the hook methods...
}
```

## React Component Usage

Use the `AccountsManager` component for a complete account management interface:

```typescript
import { AccountsManager } from '@/components/accounts/AccountsManager';

function AccountsPage() {
  return <AccountsManager />;
}
```

## Best Practices

1. **Always use the `update_account_balance` function** for financial transactions
2. **Set appropriate credit limits** based on client history
3. **Use tags for categorization** (e.g., 'corporate', 'individual', 'repeat-client')
4. **Monitor overdue accounts** regularly using the `get_overdue_accounts` function
5. **Keep account status updated** to reflect current business relationship
6. **Use metadata field** for account-specific custom data

## Migration

To apply the accounts table to your Supabase database, run the migration file:
`supabase/migrations/20250104000000_add_accounts_table.sql`

This will create the table, indexes, functions, triggers, and RLS policies.

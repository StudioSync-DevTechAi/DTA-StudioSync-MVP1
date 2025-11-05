/*
  # Add Accounts Table to StudioSyncWork
  
  This migration creates a comprehensive accounts table for managing
  client accounts, payment terms, credit limits, and account status.
  
  Features:
  - Client account management
  - Payment terms and credit limits
  - Account status tracking
  - Integration with existing financial system
  - RLS security policies
  - Helper functions for account management
*/

-- Create accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Account identification
  account_number TEXT UNIQUE NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'client', -- 'client', 'vendor', 'internal'
  
  -- Client information (if account_type = 'client')
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  client_address JSONB DEFAULT '{}',
  
  -- Account settings
  payment_terms INTEGER DEFAULT 30, -- days
  credit_limit DECIMAL(15,2) DEFAULT 0.00,
  current_balance DECIMAL(15,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  
  -- Account status
  status TEXT DEFAULT 'active', -- 'active', 'suspended', 'closed', 'pending'
  status_reason TEXT,
  
  -- Financial tracking
  total_invoiced DECIMAL(15,2) DEFAULT 0.00,
  total_paid DECIMAL(15,2) DEFAULT 0.00,
  outstanding_balance DECIMAL(15,2) DEFAULT 0.00,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  last_invoice_date TIMESTAMP WITH TIME ZONE,
  
  -- Account preferences
  preferred_payment_method TEXT, -- 'credit_card', 'bank_transfer', 'check', 'cash'
  billing_frequency TEXT DEFAULT 'monthly', -- 'monthly', 'quarterly', 'annually', 'per_project'
  auto_invoice BOOLEAN DEFAULT false,
  
  -- Tax information
  tax_id TEXT,
  tax_exempt BOOLEAN DEFAULT false,
  tax_rate DECIMAL(5,4) DEFAULT 0.0000, -- percentage as decimal
  
  -- Notes and metadata
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Audit fields
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_account_number ON public.accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_accounts_account_type ON public.accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON public.accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_client_email ON public.accounts(client_email);
CREATE INDEX IF NOT EXISTS idx_accounts_outstanding_balance ON public.accounts(outstanding_balance);
CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON public.accounts(created_at);

-- Enable RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accounts table
CREATE POLICY "Users can view accounts they created or manage" 
  ON public.accounts 
  FOR SELECT 
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('manager', 'accounts', 'crm')
      AND ur.is_active = true
    )
  );

CREATE POLICY "Managers and accounts can insert accounts" 
  ON public.accounts 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('manager', 'accounts', 'crm')
      AND ur.is_active = true
    )
  );

CREATE POLICY "Managers and accounts can update accounts" 
  ON public.accounts 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('manager', 'accounts', 'crm')
      AND ur.is_active = true
    )
  );

CREATE POLICY "Only managers can delete accounts" 
  ON public.accounts 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'manager'
      AND ur.is_active = true
    )
  );

-- Create function to generate account number
CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Get the next counter value
  SELECT COALESCE(MAX(CAST(SUBSTRING(account_number FROM 3) AS INTEGER)), 0) + 1
  INTO counter
  FROM public.accounts
  WHERE account_number ~ '^AC[0-9]+$';
  
  -- Format as AC000001, AC000002, etc.
  new_number := 'AC' || LPAD(counter::TEXT, 6, '0');
  
  RETURN new_number;
END;
$$;

-- Create function to update account balance
CREATE OR REPLACE FUNCTION public.update_account_balance(
  account_id UUID,
  amount DECIMAL(15,2),
  transaction_type TEXT -- 'invoice', 'payment', 'credit', 'debit'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.accounts
  SET 
    current_balance = CASE 
      WHEN transaction_type IN ('invoice', 'debit') THEN current_balance + amount
      WHEN transaction_type IN ('payment', 'credit') THEN current_balance - amount
      ELSE current_balance
    END,
    outstanding_balance = CASE 
      WHEN transaction_type IN ('invoice', 'debit') THEN outstanding_balance + amount
      WHEN transaction_type IN ('payment', 'credit') THEN outstanding_balance - amount
      ELSE outstanding_balance
    END,
    total_invoiced = CASE 
      WHEN transaction_type = 'invoice' THEN total_invoiced + amount
      ELSE total_invoiced
    END,
    total_paid = CASE 
      WHEN transaction_type = 'payment' THEN total_paid + amount
      ELSE total_paid
    END,
    last_payment_date = CASE 
      WHEN transaction_type = 'payment' THEN now()
      ELSE last_payment_date
    END,
    last_invoice_date = CASE 
      WHEN transaction_type = 'invoice' THEN now()
      ELSE last_invoice_date
    END,
    updated_at = now()
  WHERE id = account_id;
END;
$$;

-- Create function to get account summary
CREATE OR REPLACE FUNCTION public.get_account_summary(account_id UUID)
RETURNS TABLE (
  account_number TEXT,
  account_name TEXT,
  current_balance DECIMAL(15,2),
  outstanding_balance DECIMAL(15,2),
  credit_limit DECIMAL(15,2),
  available_credit DECIMAL(15,2),
  days_overdue INTEGER,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.account_number,
    a.account_name,
    a.current_balance,
    a.outstanding_balance,
    a.credit_limit,
    (a.credit_limit - a.outstanding_balance) as available_credit,
    CASE 
      WHEN a.outstanding_balance > 0 AND a.last_invoice_date IS NOT NULL 
      THEN EXTRACT(DAYS FROM now() - a.last_invoice_date)::INTEGER
      ELSE 0
    END as days_overdue,
    a.status
  FROM public.accounts a
  WHERE a.id = account_id;
END;
$$;

-- Create function to get overdue accounts
CREATE OR REPLACE FUNCTION public.get_overdue_accounts(
  days_threshold INTEGER DEFAULT 30
)
RETURNS TABLE (
  account_id UUID,
  account_number TEXT,
  account_name TEXT,
  outstanding_balance DECIMAL(15,2),
  days_overdue INTEGER,
  last_payment_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.account_number,
    a.account_name,
    a.outstanding_balance,
    EXTRACT(DAYS FROM now() - COALESCE(a.last_payment_date, a.last_invoice_date))::INTEGER as days_overdue,
    a.last_payment_date
  FROM public.accounts a
  WHERE a.outstanding_balance > 0
  AND a.status = 'active'
  AND (
    a.last_payment_date IS NULL 
    OR EXTRACT(DAYS FROM now() - a.last_payment_date) > days_threshold
  )
  ORDER BY days_overdue DESC;
END;
$$;

-- Create trigger to auto-generate account number
CREATE OR REPLACE FUNCTION public.set_account_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.account_number IS NULL OR NEW.account_number = '' THEN
    NEW.account_number := public.generate_account_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_account_number
  BEFORE INSERT ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_account_number();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default account types and statuses
-- This could be expanded with more default data as needed

-- Add comments for documentation
COMMENT ON TABLE public.accounts IS 'Client and vendor account management with payment tracking';
COMMENT ON COLUMN public.accounts.account_number IS 'Unique account identifier (auto-generated)';
COMMENT ON COLUMN public.accounts.account_type IS 'Type of account: client, vendor, or internal';
COMMENT ON COLUMN public.accounts.payment_terms IS 'Payment terms in days (e.g., 30 for net 30)';
COMMENT ON COLUMN public.accounts.credit_limit IS 'Maximum credit allowed for this account';
COMMENT ON COLUMN public.accounts.current_balance IS 'Current account balance';
COMMENT ON COLUMN public.accounts.outstanding_balance IS 'Amount owed by this account';
COMMENT ON COLUMN public.accounts.status IS 'Account status: active, suspended, closed, pending';

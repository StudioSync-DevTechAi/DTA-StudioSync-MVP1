-- ============================================
-- ADD PAYMENT FORM DATA AND PAYMENT HISTORY COLUMNS
-- ============================================
-- Purpose: Add JSONB columns to invoice_items_table for storing payment form data and payment history
-- Created: 2025-01-27
-- ============================================

-- Add payment_form_data JSONB column to store payment form window data
ALTER TABLE public.invoice_items_table 
ADD COLUMN IF NOT EXISTS payment_form_data JSONB DEFAULT '{}'::jsonb;

-- Add payment_history JSONB column to store history of payments per invoice
ALTER TABLE public.invoice_items_table 
ADD COLUMN IF NOT EXISTS payment_history JSONB DEFAULT '[]'::jsonb;

-- Create GIN indexes for efficient JSONB queries
CREATE INDEX IF NOT EXISTS invoice_items_table_payment_form_data_idx 
ON public.invoice_items_table USING GIN (payment_form_data);

CREATE INDEX IF NOT EXISTS invoice_items_table_payment_history_idx 
ON public.invoice_items_table USING GIN (payment_history);

-- Add comments
COMMENT ON COLUMN public.invoice_items_table.payment_form_data IS 
'Stores payment form window data (payment date, amount, method, collected by, etc.) as JSONB';

COMMENT ON COLUMN public.invoice_items_table.payment_history IS 
'Stores array of payment history records, each containing payment details and timestamp';


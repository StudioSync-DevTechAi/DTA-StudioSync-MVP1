-- ============================================
-- ADD FOREIGN KEY: invoice_uuid in project_estimation_table
-- ============================================
-- This migration adds a foreign key constraint from project_estimation_table.invoice_uuid
-- to invoice_items_table.invoice_uuid
-- ============================================
-- Created: 2025-01-30
-- Purpose: Establish referential integrity between project_estimation_table and invoice_items_table
-- ============================================

-- Check if the foreign key constraint already exists before adding it
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'fk_project_estimation_invoice'
    AND conrelid = 'public.project_estimation_table'::regclass
  ) THEN
    -- Add foreign key constraint
    ALTER TABLE public.project_estimation_table
    ADD CONSTRAINT fk_project_estimation_invoice 
    FOREIGN KEY (invoice_uuid) 
    REFERENCES public.invoice_items_table (invoice_uuid) 
    ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key constraint fk_project_estimation_invoice added successfully';
  ELSE
    RAISE NOTICE 'Foreign key constraint fk_project_estimation_invoice already exists';
  END IF;
END $$;

-- Add index on invoice_uuid if it doesn't exist (for better query performance)
CREATE INDEX IF NOT EXISTS idx_project_estimation_invoice 
ON public.project_estimation_table (invoice_uuid) 
TABLESPACE pg_default
WHERE invoice_uuid IS NOT NULL;

-- Add comment to document the relationship
COMMENT ON CONSTRAINT fk_project_estimation_invoice ON public.project_estimation_table IS 
'Foreign key reference to invoice_items_table. When an invoice is deleted, the invoice_uuid in project_estimation_table is set to NULL (ON DELETE SET NULL)';


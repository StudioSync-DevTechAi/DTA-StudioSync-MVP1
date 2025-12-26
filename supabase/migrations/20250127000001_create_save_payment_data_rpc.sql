-- ============================================
-- CREATE SAVE PAYMENT DATA RPC FUNCTION
-- ============================================
-- Purpose: Save payment form data and update payment history in invoice_items_table
-- Created: 2025-01-27
-- Updated: 2025-01-27 - Added support for creating invoice if it doesn't exist
-- ============================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.save_payment_data(
  p_invoice_uuid UUID,
  p_payment_form_data JSONB
);

-- Function to save payment form data and update payment history
CREATE OR REPLACE FUNCTION public.save_payment_data(
  p_invoice_uuid UUID,
  p_payment_form_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment_history JSONB;
  v_existing_history JSONB;
  v_payment_record JSONB;
  v_current_time TIMESTAMP WITH TIME ZONE;
  v_invoice_exists BOOLEAN;
BEGIN
  -- Get current timestamp
  v_current_time := now();
  
  -- Check if invoice exists in invoice_items_table
  SELECT EXISTS(SELECT 1 FROM public.invoice_items_table WHERE invoice_uuid = p_invoice_uuid)
  INTO v_invoice_exists;
  
  -- If invoice doesn't exist, return error
  IF NOT v_invoice_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invoice not found in invoice_items_table. Please create the invoice first using the invoice form.',
      'error_code', 'INVOICE_NOT_FOUND'
    );
  END IF;
  
  -- Create payment record with timestamp
  v_payment_record := jsonb_build_object(
    'payment_id', gen_random_uuid(),
    'payment_date', p_payment_form_data->>'paymentDate',
    'payment_amount', p_payment_form_data->>'paymentAmount',
    'payment_method', p_payment_form_data->>'paymentMethod',
    'collected_by', p_payment_form_data->>'collectedBy',
    'timestamp', v_current_time
  );
  
  -- Get existing payment history
  SELECT COALESCE(payment_history, '[]'::jsonb)
  INTO v_existing_history
  FROM public.invoice_items_table
  WHERE invoice_uuid = p_invoice_uuid;
  
  -- Append new payment record to history
  v_payment_history := v_existing_history || jsonb_build_array(v_payment_record);
  
  -- Update invoice_items_table with payment form data and history
  UPDATE public.invoice_items_table
  SET
    payment_form_data = p_payment_form_data,
    payment_history = v_payment_history,
    updated_at = v_current_time
  WHERE invoice_uuid = p_invoice_uuid;
  
  -- Check if update was successful
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to update invoice payment data',
      'error_code', 'UPDATE_FAILED'
    );
  END IF;
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'invoice_uuid', p_invoice_uuid,
    'payment_history', v_payment_history,
    'message', 'Payment data saved successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.save_payment_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_payment_data TO anon;

-- Add comment
COMMENT ON FUNCTION public.save_payment_data IS 
'Saves payment form data and updates payment history in invoice_items_table. Requires invoice to exist in invoice_items_table. Appends new payment record to existing history.';


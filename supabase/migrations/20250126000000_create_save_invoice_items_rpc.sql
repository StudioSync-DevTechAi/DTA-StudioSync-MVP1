-- ============================================
-- CREATE SAVE INVOICE ITEMS RPC FUNCTION
-- ============================================
-- Purpose: Save invoice form data to invoice_items_table
-- Created: 2025-01-26
-- ============================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.save_invoice_items_form_data(
  p_photography_owner_phno TEXT,
  p_client_phno TEXT,
  p_invoice_form_data JSONB,
  p_project_estimate_uuid UUID,
  p_cost_items_uuid UUID,
  p_invoice_uuid UUID
);

-- Function to save invoice form data
CREATE OR REPLACE FUNCTION public.save_invoice_items_form_data(
  p_photography_owner_phno TEXT,
  p_client_phno TEXT,
  p_invoice_form_data JSONB,
  p_project_estimate_uuid UUID DEFAULT NULL,
  p_cost_items_uuid UUID DEFAULT NULL,
  p_invoice_uuid UUID DEFAULT NULL -- If provided, update existing invoice; otherwise create new
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice_uuid UUID;
  v_is_update BOOLEAN := false;
  v_client_name TEXT;
  v_client_email TEXT;
  v_invoice_type TEXT;
  v_invoice_status TEXT;
  v_client_exists BOOLEAN;
BEGIN
  -- Extract client information from invoice form data
  v_client_name := p_invoice_form_data->'clientDetails'->>'name';
  v_client_email := p_invoice_form_data->'clientDetails'->>'email';
  v_invoice_type := COALESCE(p_invoice_form_data->>'invoiceType', 'proforma');
  
  -- Determine invoice status based on payment tracking
  IF p_invoice_form_data->'paymentTracking' IS NOT NULL THEN
    DECLARE
      v_total_amount DECIMAL;
      v_paid_amount DECIMAL;
    BEGIN
      v_total_amount := COALESCE((p_invoice_form_data->'paymentTracking'->>'totalAmount')::DECIMAL, 0);
      v_paid_amount := COALESCE((p_invoice_form_data->'paymentTracking'->>'paidAmount')::DECIMAL, 0);
      
      IF v_paid_amount >= v_total_amount AND v_total_amount > 0 THEN
        v_invoice_status := 'paid';
      ELSIF v_paid_amount > 0 THEN
        v_invoice_status := 'sent'; -- Partial payment
      ELSE
        v_invoice_status := 'draft';
      END IF;
    END;
  ELSE
    v_invoice_status := 'draft';
  END IF;
  
  -- Use provided UUID or generate new one
  IF p_invoice_uuid IS NOT NULL THEN
    v_invoice_uuid := p_invoice_uuid;
    v_is_update := true;
  ELSE
    v_invoice_uuid := gen_random_uuid();
  END IF;
  
  -- Check if client exists, if not create it
  SELECT EXISTS(SELECT 1 FROM public.client_details_table WHERE clientid_phno = p_client_phno)
  INTO v_client_exists;
  
  IF NOT v_client_exists THEN
    INSERT INTO public.client_details_table (
      clientid_phno,
      client_name,
      client_email,
      client_project_uuids_list_json,
      created_at,
      updated_at
    ) VALUES (
      p_client_phno,
      COALESCE(v_client_name, ''),
      COALESCE(v_client_email, ''),
      '{}'::jsonb,
      now(),
      now()
    );
  ELSE
    -- Update existing client information if provided
    UPDATE public.client_details_table
    SET 
      client_name = COALESCE(v_client_name, client_name),
      client_email = COALESCE(v_client_email, client_email),
      updated_at = now()
    WHERE clientid_phno = p_client_phno;
  END IF;
  
  -- Insert or update invoice_items_table
  INSERT INTO public.invoice_items_table (
    invoice_uuid,
    photography_owner_phno,
    project_estimate_uuid,
    clientid_phno,
    cost_items_uuid,
    invoice_type,
    invoice_date,
    invoice_form_data,
    invoice_status,
    created_by,
    updated_by,
    created_at,
    updated_at
  ) VALUES (
    v_invoice_uuid,
    p_photography_owner_phno,
    p_project_estimate_uuid,
    p_client_phno,
    p_cost_items_uuid,
    v_invoice_type,
    COALESCE((p_invoice_form_data->>'invoiceDate')::DATE, CURRENT_DATE),
    p_invoice_form_data,
    v_invoice_status,
    p_photography_owner_phno,
    p_photography_owner_phno,
    CASE WHEN p_invoice_uuid IS NULL THEN now() ELSE (SELECT created_at FROM public.invoice_items_table WHERE invoice_uuid = p_invoice_uuid) END,
    now()
  )
  ON CONFLICT (invoice_uuid) 
  DO UPDATE SET
    photography_owner_phno = EXCLUDED.photography_owner_phno,
    project_estimate_uuid = EXCLUDED.project_estimate_uuid,
    clientid_phno = EXCLUDED.clientid_phno,
    cost_items_uuid = EXCLUDED.cost_items_uuid,
    invoice_type = EXCLUDED.invoice_type,
    invoice_date = EXCLUDED.invoice_date,
    invoice_form_data = EXCLUDED.invoice_form_data,
    invoice_status = EXCLUDED.invoice_status,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();
  
  -- Return success response with UUID
  RETURN jsonb_build_object(
    'success', true,
    'invoice_uuid', v_invoice_uuid,
    'is_update', v_is_update,
    'invoice_status', v_invoice_status,
    'message', CASE WHEN v_is_update THEN 'Invoice updated successfully' ELSE 'Invoice created successfully' END
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
GRANT EXECUTE ON FUNCTION public.save_invoice_items_form_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_invoice_items_form_data TO anon;

-- Add comment
COMMENT ON FUNCTION public.save_invoice_items_form_data IS 
'Saves invoice form data to invoice_items_table. Creates or updates invoice based on whether invoice_uuid is provided. Automatically creates/updates client if needed.';


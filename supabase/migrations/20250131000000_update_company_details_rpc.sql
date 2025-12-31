-- ============================================
-- CREATE UPDATE COMPANY DETAILS RPC FUNCTION
-- ============================================
-- Purpose: Update company details (company_name, company_email, company_phno, company_address) 
--          in photography_owner_table
-- Created: 2025-01-31
-- ============================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.update_company_details(
  p_photography_owner_email TEXT,
  p_company_name TEXT,
  p_company_email TEXT,
  p_company_phno TEXT,
  p_company_address TEXT
);

-- Function to update company details
CREATE OR REPLACE FUNCTION public.update_company_details(
  p_photography_owner_email TEXT,
  p_company_name TEXT DEFAULT NULL,
  p_company_email TEXT DEFAULT NULL,
  p_company_phno TEXT DEFAULT NULL,
  p_company_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_record RECORD;
  v_result JSONB;
BEGIN
  -- Validate that photography_owner_email is provided
  IF p_photography_owner_email IS NULL OR TRIM(p_photography_owner_email) = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Photography owner email is required'
    );
  END IF;

  -- Update the photography_owner_table
  UPDATE public.photography_owner_table
  SET 
    company_name = NULLIF(TRIM(p_company_name), ''),
    company_email = NULLIF(TRIM(p_company_email), ''),
    company_phno = NULLIF(TRIM(p_company_phno), ''),
    company_address = NULLIF(TRIM(p_company_address), ''),
    updated_at = now()
  WHERE photography_owner_email = p_photography_owner_email;

  -- Check if any row was updated
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No record found with the provided photography owner email'
    );
  END IF;

  -- Fetch the updated record
  SELECT 
    company_name,
    company_email,
    company_phno,
    company_address,
    updated_at
  INTO v_updated_record
  FROM public.photography_owner_table
  WHERE photography_owner_email = p_photography_owner_email;

  -- Build success response
  v_result := jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'company_name', v_updated_record.company_name,
      'company_email', v_updated_record.company_email,
      'company_phno', v_updated_record.company_phno,
      'company_address', v_updated_record.company_address,
      'updated_at', v_updated_record.updated_at
    ),
    'message', 'Company details updated successfully'
  );

  RETURN v_result;

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
GRANT EXECUTE ON FUNCTION public.update_company_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_company_details TO anon;

-- Add comment
COMMENT ON FUNCTION public.update_company_details IS 
'Updates company details (company_name, company_email, company_phno, company_address) in photography_owner_table for a given photography_owner_email. Returns the updated record as JSONB.';


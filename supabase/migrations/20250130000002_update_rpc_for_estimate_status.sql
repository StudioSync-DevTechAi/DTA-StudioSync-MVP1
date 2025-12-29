-- ============================================
-- UPDATE RPC FUNCTIONS FOR estimate_status
-- ============================================
-- This migration updates RPC functions to handle estimate_status column
-- estimate_status tracks approval state: PENDING, APPROVED, DECLINED
-- project_status tracks workflow state: LEAD-INPROGRESS, PRE-PROD, etc.
-- ============================================
-- Created: 2025-01-30
-- Purpose: Support estimate_status column for estimate approval tracking
-- ============================================

-- 1. Update save_estimate_form_data to set estimate_status = 'PENDING'
CREATE OR REPLACE FUNCTION public.save_estimate_form_data(
  p_photography_owner_phno TEXT,
  p_client_phno TEXT,
  p_estimate_form_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_estimate_uuid UUID;
  v_existing_uuid UUID;
  v_photography_owner_estimates JSONB;
  v_client_name TEXT;
  v_client_email TEXT;
  v_project_name TEXT;
BEGIN
  -- Extract client name and email from estimate form data
  v_client_name := p_estimate_form_data->>'clientName';
  v_client_email := p_estimate_form_data->>'clientEmail';
  -- Explicitly extract project name from JSONB and normalize (trim whitespace, convert empty to NULL)
  -- This ensures project_name column is explicitly set, not just stored in JSONB
  v_project_name := NULLIF(TRIM(COALESCE(p_estimate_form_data->>'projectName', '')), '');
  
  -- Check if this is an update (estimate has existing project_estimate_uuid)
  IF p_estimate_form_data ? 'project_estimate_uuid' THEN
    v_project_estimate_uuid := (p_estimate_form_data->>'project_estimate_uuid')::UUID;
    v_existing_uuid := v_project_estimate_uuid;
  ELSE
    -- Generate new UUID for new estimate
    v_project_estimate_uuid := gen_random_uuid();
  END IF;
  
  -- Check if client exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM public.client_details_table WHERE clientid_phno = p_client_phno) THEN
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
      jsonb_build_object(v_project_estimate_uuid::text, '[]'::jsonb),
      now(),
      now()
    );
  ELSE
    -- Update existing client
    IF v_existing_uuid IS NULL THEN
      UPDATE public.client_details_table
      SET 
        client_name = COALESCE(v_client_name, client_name),
        client_email = COALESCE(v_client_email, client_email),
        client_project_uuids_list_json = COALESCE(client_project_uuids_list_json, '{}'::jsonb) || 
                                         jsonb_build_object(v_project_estimate_uuid::text, '[]'::jsonb),
        updated_at = now()
      WHERE clientid_phno = p_client_phno;
    ELSE
      -- Just update client name/email for existing project
      UPDATE public.client_details_table
      SET 
        client_name = COALESCE(v_client_name, client_name),
        client_email = COALESCE(v_client_email, client_email),
        updated_at = now()
      WHERE clientid_phno = p_client_phno;
    END IF;
  END IF;
  
  -- Insert or update project_estimation_table with LEAD-INPROGRESS status and PENDING estimate_status
  -- Explicitly set project_name column from extracted value (not just from JSONB)
  INSERT INTO public.project_estimation_table (
    project_estimate_uuid,
    photography_owner_phno,
    clientid_phno,
    estimate_form_data,
    project_name,  -- Explicitly set project_name column from extracted value
    project_status,
    estimate_status,  -- Set estimate_status to PENDING for new estimates
    is_drafted,
    created_at,
    updated_at
  ) VALUES (
    v_project_estimate_uuid,
    p_photography_owner_phno,
    p_client_phno,
    p_estimate_form_data,
    v_project_name,  -- Explicitly set project_name column (extracted and normalized from JSONB)
    'LEAD-INPROGRESS',
    'PENDING',  -- New estimates start as PENDING
    false,
    CASE WHEN v_existing_uuid IS NULL THEN now() ELSE (SELECT created_at FROM public.project_estimation_table WHERE project_estimate_uuid = v_existing_uuid) END,
    now()
  )
  ON CONFLICT (project_estimate_uuid) 
  DO UPDATE SET
    estimate_form_data = EXCLUDED.estimate_form_data,
    -- Explicitly update project_name column: use new value if provided, otherwise keep existing
    project_name = CASE 
      WHEN v_project_name IS NOT NULL THEN v_project_name 
      ELSE project_estimation_table.project_name 
    END,
    project_status = 'LEAD-INPROGRESS',
    -- Preserve existing estimate_status when updating (don't reset to PENDING)
    estimate_status = COALESCE(project_estimation_table.estimate_status, 'PENDING'),
    updated_at = now();
  
  -- Update photography_owner_table to add the UUID to the list
  SELECT project_estimation_uuids_list_json
  INTO v_photography_owner_estimates
  FROM public.photography_owner_table
  WHERE photography_owner_phno = p_photography_owner_phno;
  
  -- Add the new UUID to the array if it doesn't already exist
  IF v_photography_owner_estimates IS NULL THEN
    v_photography_owner_estimates := jsonb_build_array(v_project_estimate_uuid::text);
  ELSIF NOT (v_photography_owner_estimates @> jsonb_build_array(v_project_estimate_uuid::text)) THEN
    v_photography_owner_estimates := v_photography_owner_estimates || jsonb_build_array(v_project_estimate_uuid::text);
  END IF;
  
  -- Update photography_owner_table
  UPDATE public.photography_owner_table
  SET 
    project_estimation_uuids_list_json = v_photography_owner_estimates,
    updated_at = now()
  WHERE photography_owner_phno = p_photography_owner_phno;
  
  -- Return success response with UUID
  RETURN jsonb_build_object(
    'success', true,
    'project_estimate_uuid', v_project_estimate_uuid,
    'message', 'Estimate saved successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- Update comment
COMMENT ON FUNCTION public.save_estimate_form_data IS 
'Saves estimate form data to project_estimation_table with LEAD-INPROGRESS project_status and PENDING estimate_status. Automatically updates photography_owner_table with the new project_estimate_uuid';

-- 2. Update update_project_status to accept optional estimate_status parameter
-- Drop ALL existing versions of update_project_status first
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT oid::regprocedure
    FROM pg_proc
    WHERE proname = 'update_project_status'
    AND pronamespace = 'public'::regnamespace
  ) LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.oid::regprocedure || ' CASCADE';
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.update_project_status(
  p_project_estimate_uuid UUID,
  p_project_status TEXT,
  p_is_project_requested BOOLEAN DEFAULT false,
  p_is_invoice_requested BOOLEAN DEFAULT false,
  p_estimate_status TEXT DEFAULT NULL  -- NEW: Optional estimate_status parameter
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_status TEXT;
BEGIN
  -- Validate project_status value
  IF p_project_status NOT IN ('LEAD-INPROGRESS', 'PRE-PROD', 'PROD', 'POST-PROD', 'DELIVERED', 'APPROVED') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid project status value',
      'error_code', 'INVALID_STATUS'
    );
  END IF;

  -- Validate estimate_status if provided
  IF p_estimate_status IS NOT NULL AND p_estimate_status NOT IN ('PENDING', 'APPROVED', 'DECLINED') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid estimate status value. Must be PENDING, APPROVED, or DECLINED',
      'error_code', 'INVALID_ESTIMATE_STATUS'
    );
  END IF;

  -- Update the project status and estimate_status if provided
  UPDATE public.project_estimation_table
  SET 
    project_status = p_project_status,
    is_project_requested = COALESCE(p_is_project_requested, is_project_requested),
    is_invoice_requested = COALESCE(p_is_invoice_requested, is_invoice_requested),
    estimate_status = COALESCE(p_estimate_status, estimate_status),  -- Only update if provided
    updated_at = now()
  WHERE project_estimate_uuid = p_project_estimate_uuid;
  
  -- Check if any row was updated
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Project estimation not found',
      'error_code', 'NOT_FOUND'
    );
  END IF;

  -- Get the updated status to verify
  SELECT project_status INTO v_updated_status
  FROM public.project_estimation_table
  WHERE project_estimate_uuid = p_project_estimate_uuid;
  
  RETURN jsonb_build_object(
    'success', true,
    'project_status', v_updated_status,
    'message', 'Project status updated successfully'
  );
  
EXCEPTION
  WHEN check_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid status value (check constraint violation)',
      'error_code', SQLSTATE
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_project_status(UUID, TEXT, BOOLEAN, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_project_status(UUID, TEXT, BOOLEAN, BOOLEAN, TEXT) TO anon;

-- Update comment
COMMENT ON FUNCTION public.update_project_status IS 
'Updates the project_status and optionally estimate_status for a project estimation. 
Valid project_status values: LEAD-INPROGRESS, PRE-PROD, PROD, POST-PROD, DELIVERED, APPROVED.
Valid estimate_status values: PENDING, APPROVED, DECLINED.
Uses SECURITY DEFINER to bypass RLS policies.';

-- 3. Create update_estimate_status function
CREATE OR REPLACE FUNCTION public.update_estimate_status(
  p_project_estimate_uuid UUID,
  p_estimate_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_status TEXT;
BEGIN
  -- Validate estimate_status value
  IF p_estimate_status NOT IN ('PENDING', 'APPROVED', 'DECLINED') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid estimate status value. Must be PENDING, APPROVED, or DECLINED',
      'error_code', 'INVALID_STATUS'
    );
  END IF;

  -- Update the estimate status
  UPDATE public.project_estimation_table
  SET 
    estimate_status = p_estimate_status,
    updated_at = now()
  WHERE project_estimate_uuid = p_project_estimate_uuid;
  
  -- Check if any row was updated
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Project estimation not found',
      'error_code', 'NOT_FOUND'
    );
  END IF;

  -- Get the updated status to verify
  SELECT estimate_status INTO v_updated_status
  FROM public.project_estimation_table
  WHERE project_estimate_uuid = p_project_estimate_uuid;
  
  RETURN jsonb_build_object(
    'success', true,
    'estimate_status', v_updated_status,
    'message', 'Estimate status updated successfully'
  );
  
EXCEPTION
  WHEN check_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid estimate status value (check constraint violation)',
      'error_code', SQLSTATE
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_estimate_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_estimate_status(UUID, TEXT) TO anon;

-- Add comment
COMMENT ON FUNCTION public.update_estimate_status IS 
'Updates only the estimate_status (approval state) for a project estimation.
Valid values: PENDING, APPROVED, DECLINED.
Uses SECURITY DEFINER to bypass RLS policies.';


-- ============================================
-- CREATE SAVE ESTIMATE RPC FUNCTION
-- ============================================
-- Purpose: Save estimate form data to project_estimation_table and update photography_owner_table
-- Created: 2025-01-25
-- ============================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.save_estimate_form_data(
  p_photography_owner_phno TEXT,
  p_client_phno TEXT,
  p_estimate_form_data JSONB
);

-- Function to save estimate form data
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
BEGIN
  -- Extract client name and email from estimate form data
  v_client_name := p_estimate_form_data->>'clientName';
  v_client_email := p_estimate_form_data->>'clientEmail';
  
  -- Generate new UUID for the estimate
  v_project_estimate_uuid := gen_random_uuid();
  
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
    -- Update existing client with new project UUID
    UPDATE public.client_details_table
    SET 
      client_name = COALESCE(v_client_name, client_name),
      client_email = COALESCE(v_client_email, client_email),
      client_project_uuids_list_json = COALESCE(client_project_uuids_list_json, '{}'::jsonb) || 
                                       jsonb_build_object(v_project_estimate_uuid::text, '[]'::jsonb),
      updated_at = now()
    WHERE clientid_phno = p_client_phno;
  END IF;
  
  -- Insert into project_estimation_table
  INSERT INTO public.project_estimation_table (
    project_estimate_uuid,
    photography_owner_phno,
    clientid_phno,
    estimate_form_data,
    project_status,
    is_drafted,
    created_at,
    updated_at
  ) VALUES (
    v_project_estimate_uuid,
    p_photography_owner_phno,
    p_client_phno,
    p_estimate_form_data,
    'PRE-PROD',
    false, -- Not a draft, it's a saved estimate
    now(),
    now()
  );
  
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
    -- Return error information
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.save_estimate_form_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_estimate_form_data TO anon;

-- Add comment
COMMENT ON FUNCTION public.save_estimate_form_data IS 
'Saves estimate form data to project_estimation_table and automatically updates photography_owner_table with the new project_estimate_uuid';


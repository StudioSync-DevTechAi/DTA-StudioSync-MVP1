-- ============================================
-- CREATE PROJECT ESTIMATION RPC FUNCTION
-- ============================================
-- This function creates a new project estimation and client details
-- in a single transaction, ensuring data consistency.
-- ============================================
-- Created: 2025-01-25
-- Purpose: Handle Page 1 "Next" button click - Create project estimation and client
-- ============================================

-- Function to create project estimation and client details
CREATE OR REPLACE FUNCTION public.create_project_estimation(
  p_project_name TEXT,
  p_project_type TEXT,
  p_start_date DATE,
  p_start_time TIME WITHOUT TIME ZONE,
  p_start_datetime_confirmed BOOLEAN,
  p_end_date DATE,
  p_end_time TIME WITHOUT TIME ZONE,
  p_end_datetime_confirmed BOOLEAN,
  p_photography_owner_phno TEXT,
  p_client_name TEXT,
  p_client_email TEXT,
  p_client_phno TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_estimate_uuid UUID;
  v_client_exists BOOLEAN;
  v_client_project_uuids JSONB;
BEGIN
  -- Generate UUID for project estimation
  v_project_estimate_uuid := gen_random_uuid();
  
  -- Check if client already exists
  SELECT EXISTS(SELECT 1 FROM public.client_details_table WHERE clientid_phno = p_client_phno)
  INTO v_client_exists;
  
  -- Insert or update client details
  IF v_client_exists THEN
    -- Update existing client: add project UUID to their project list
    SELECT client_project_uuids_list_json
    INTO v_client_project_uuids
    FROM public.client_details_table
    WHERE clientid_phno = p_client_phno;
    
    -- Add new project UUID to the JSON object
    -- Format: { "project_uuid": [] }
    v_client_project_uuids := COALESCE(v_client_project_uuids, '{}'::jsonb) || 
                             jsonb_build_object(v_project_estimate_uuid::text, '[]'::jsonb);
    
    UPDATE public.client_details_table
    SET 
      client_name = p_client_name,
      client_email = p_client_email,
      client_project_uuids_list_json = v_client_project_uuids,
      updated_at = now()
    WHERE clientid_phno = p_client_phno;
  ELSE
    -- Insert new client
    INSERT INTO public.client_details_table (
      clientid_phno,
      client_name,
      client_email,
      client_project_uuids_list_json,
      created_at,
      updated_at
    ) VALUES (
      p_client_phno,
      p_client_name,
      p_client_email,
      jsonb_build_object(v_project_estimate_uuid::text, '[]'::jsonb),
      now(),
      now()
    );
  END IF;
  
  -- Insert into project_estimation_table
  INSERT INTO public.project_estimation_table (
    project_estimate_uuid,
    photography_owner_phno,
    clientid_phno,
    project_name,
    project_type,
    start_date,
    start_time,
    startdatetime_confirmed,
    end_date,
    end_time,
    enddatetime_confirmed,
    eventuuids_list_json,
    projectquotedoc_uuid,
    created_at,
    updated_at
  ) VALUES (
    v_project_estimate_uuid,
    p_photography_owner_phno,
    p_client_phno,
    p_project_name,
    p_project_type,
    p_start_date,
    p_start_time,
    COALESCE(p_start_datetime_confirmed, false),
    p_end_date,
    p_end_time,
    COALESCE(p_end_datetime_confirmed, false),
    '[]'::jsonb,
    NULL,
    now(),
    now()
  );
  
  -- Return the generated UUID and success status
  RETURN jsonb_build_object(
    'project_estimate_uuid', v_project_estimate_uuid,
    'success', true,
    'message', 'Project estimation created successfully'
  );
  
EXCEPTION
  WHEN foreign_key_violation THEN
    -- Handle foreign key constraint violations
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Foreign key constraint violation. Please check photography_owner_phno or client_phno.',
      'error_code', SQLSTATE
    );
  WHEN not_null_violation THEN
    -- Handle NOT NULL constraint violations
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Required field is missing.',
      'error_code', SQLSTATE
    );
  WHEN OTHERS THEN
    -- Return error information
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_project_estimation TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_project_estimation TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION public.create_project_estimation IS 
'Creates a new project estimation and client details in a single transaction. 
Returns project_estimate_uuid on success. 
Handles both new and existing clients automatically.

Usage:
  SELECT public.create_project_estimation(
    'Project Name',
    'wedding',
    '2025-02-01'::DATE,
    '10:00:00'::TIME,
    true,
    '2025-02-02'::DATE,
    '18:00:00'::TIME,
    false,
    '+919876543210',
    'Client Name',
    'client@example.com',
    '+919876543211'
  );

Response:
  {
    "project_estimate_uuid": "uuid-here",
    "success": true,
    "message": "Project estimation created successfully"
  }
';


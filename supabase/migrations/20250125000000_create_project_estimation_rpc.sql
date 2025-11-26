-- ============================================
-- CREATE PROJECT ESTIMATION RPC FUNCTION
-- ============================================
-- This function creates a new project estimation and client details
-- in a single transaction, ensuring data consistency.
-- ============================================

-- Drop ALL existing versions of the function first (to avoid "function name is not unique" error)
-- This drops all overloaded versions regardless of parameter types
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT oid::regprocedure
    FROM pg_proc
    WHERE proname = 'create_project_estimation'
    AND pronamespace = 'public'::regnamespace
  ) LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.oid::regprocedure || ' CASCADE';
  END LOOP;
END $$;

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
  p_client_phno TEXT,
  p_is_drafted BOOLEAN DEFAULT true,
  p_drafted_json JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_estimate_uuid UUID;
  v_client_exists BOOLEAN;
  v_client_project_uuids JSONB;
  v_existing_project_uuid UUID;
BEGIN
  -- Check if a project already exists with the same client_phno and start_date
  -- This prevents duplicate records when user goes back and clicks Next again
  SELECT project_estimate_uuid
  INTO v_existing_project_uuid
  FROM public.project_estimation_table
  WHERE clientid_phno = p_client_phno
    AND start_date = p_start_date
    AND is_drafted = true  -- Only check draft projects (completed ones can have duplicates)
  LIMIT 1;
  
  -- If existing project found, use its UUID (will update instead of insert)
  IF v_existing_project_uuid IS NOT NULL THEN
    v_project_estimate_uuid := v_existing_project_uuid;
  ELSE
    -- Generate new UUID for new project estimation
    v_project_estimate_uuid := gen_random_uuid();
  END IF;
  
  -- Check if client already exists
  SELECT EXISTS(SELECT 1 FROM public.client_details_table WHERE clientid_phno = p_client_phno)
  INTO v_client_exists;
  
  -- Insert or update client details
  IF v_client_exists THEN
    -- Update existing client: add project UUID to their project list only if it's a new project
    SELECT client_project_uuids_list_json
    INTO v_client_project_uuids
    FROM public.client_details_table
    WHERE clientid_phno = p_client_phno;
    
    -- Only add project UUID if it's a new project (not an update)
    IF v_existing_project_uuid IS NULL THEN
      -- Add new project UUID to the JSON object
      -- Format: { "project_uuid": [] }
      v_client_project_uuids := COALESCE(v_client_project_uuids, '{}'::jsonb) || 
                               jsonb_build_object(v_project_estimate_uuid::text, '[]'::jsonb);
    END IF;
    
    UPDATE public.client_details_table
    SET 
      client_name = p_client_name,
      client_email = p_client_email,
      client_project_uuids_list_json = COALESCE(v_client_project_uuids, jsonb_build_object(v_project_estimate_uuid::text, '[]'::jsonb)),
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
  
  -- Insert or update project_estimation_table
  -- Use INSERT ... ON CONFLICT to update if project already exists
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
    is_drafted,
    drafted_json,
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
    COALESCE(p_is_drafted, true),
    COALESCE(p_drafted_json, '{}'::jsonb),
    CASE WHEN v_existing_project_uuid IS NULL THEN now() ELSE (SELECT created_at FROM public.project_estimation_table WHERE project_estimate_uuid = v_existing_project_uuid) END,
    now()
  )
  ON CONFLICT (project_estimate_uuid) 
  DO UPDATE SET
    photography_owner_phno = EXCLUDED.photography_owner_phno,
    project_name = EXCLUDED.project_name,
    project_type = EXCLUDED.project_type,
    start_date = EXCLUDED.start_date,
    start_time = EXCLUDED.start_time,
    startdatetime_confirmed = EXCLUDED.startdatetime_confirmed,
    end_date = EXCLUDED.end_date,
    end_time = EXCLUDED.end_time,
    enddatetime_confirmed = EXCLUDED.enddatetime_confirmed,
    is_drafted = EXCLUDED.is_drafted,
    drafted_json = EXCLUDED.drafted_json,
    updated_at = now();
  
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
Handles both new and existing clients automatically.';


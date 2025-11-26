-- ============================================
-- APPLY DRAFT FEATURES - COMBINED MIGRATION
-- ============================================
-- Run this migration to add draft functionality
-- ============================================

-- Step 1: Add is_drafted and drafted_json columns
ALTER TABLE public.project_estimation_table
ADD COLUMN IF NOT EXISTS is_drafted BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.project_estimation_table
ADD COLUMN IF NOT EXISTS drafted_json JSONB NULL DEFAULT '{}'::jsonb;

-- Add comments
COMMENT ON COLUMN public.project_estimation_table.is_drafted IS 
'Indicates whether the project estimation is still in draft state (TRUE) or has been completed/submitted (FALSE).';

COMMENT ON COLUMN public.project_estimation_table.drafted_json IS 
'Stores the draft form data as JSON. This includes form fields, event packages, selected format, and other draft-specific data.';

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_project_estimation_is_drafted 
ON public.project_estimation_table (is_drafted)
WHERE is_drafted = true;

CREATE INDEX IF NOT EXISTS idx_project_estimation_drafted_json_gin 
ON public.project_estimation_table USING gin (drafted_json);

-- Step 3: Drop ALL existing versions of create_project_estimation function first
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

-- Step 4: Create create_project_estimation function with new parameters
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
  
  -- Return the UUID and success status
  -- Include flag to indicate if it was an update or new creation
  RETURN jsonb_build_object(
    'project_estimate_uuid', v_project_estimate_uuid,
    'success', true,
    'message', CASE 
      WHEN v_existing_project_uuid IS NOT NULL THEN 'Project estimation updated successfully (duplicate prevented)'
      ELSE 'Project estimation created successfully'
    END,
    'is_update', v_existing_project_uuid IS NOT NULL
  );
  
EXCEPTION
  WHEN foreign_key_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Foreign key constraint violation. Please check photography_owner_phno or client_phno.',
      'error_code', SQLSTATE
    );
  WHEN not_null_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Required field is missing.',
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

-- Step 5: Create update_project_draft_status function
CREATE OR REPLACE FUNCTION public.update_project_draft_status(
  p_project_estimate_uuid UUID,
  p_is_drafted BOOLEAN,
  p_drafted_json JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.project_estimation_table
  SET 
    is_drafted = p_is_drafted,
    drafted_json = COALESCE(p_drafted_json, drafted_json),
    updated_at = now()
  WHERE project_estimate_uuid = p_project_estimate_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Project estimation not found',
      'error_code', 'NOT_FOUND'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Draft status updated successfully'
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_project_estimation TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_project_estimation TO anon;
GRANT EXECUTE ON FUNCTION public.update_project_draft_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_project_draft_status TO anon;

-- Add comments
COMMENT ON FUNCTION public.create_project_estimation IS 
'Creates a new project estimation and client details in a single transaction. 
Now includes is_drafted and drafted_json parameters.';

COMMENT ON FUNCTION public.update_project_draft_status IS 
'Updates the is_drafted flag and drafted_json for a project estimation.';


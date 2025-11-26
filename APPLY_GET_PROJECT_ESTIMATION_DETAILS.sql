-- ============================================
-- GET PROJECT ESTIMATION DETAILS RPC FUNCTION
-- ============================================
-- This function fetches project estimation details along with client information
-- by project_estimate_uuid
-- ============================================
-- Created: 2025-01-25
-- Purpose: Fetch project and client details for Page 2 (Event Details)
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- ============================================

-- Function to get project estimation details with client information
CREATE OR REPLACE FUNCTION public.get_project_estimation_details(
  p_project_estimate_uuid UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Fetch project estimation with client details via JOIN
  SELECT jsonb_build_object(
    'project_estimate_uuid', pe.project_estimate_uuid,
    'project_name', pe.project_name,
    'project_type', pe.project_type,
    'clientid_phno', pe.clientid_phno,
    'client_name', cd.client_name,
    'client_email', cd.client_email,
    'photography_owner_phno', pe.photography_owner_phno,
    'start_date', pe.start_date,
    'start_time', pe.start_time,
    'startdatetime_confirmed', pe.startdatetime_confirmed,
    'end_date', pe.end_date,
    'end_time', pe.end_time,
    'enddatetime_confirmed', pe.enddatetime_confirmed,
    'created_at', pe.created_at,
    'updated_at', pe.updated_at
  )
  INTO v_result
  FROM public.project_estimation_table pe
  LEFT JOIN public.client_details_table cd ON pe.clientid_phno = cd.clientid_phno
  WHERE pe.project_estimate_uuid = p_project_estimate_uuid;
  
  -- Return result or empty object if not found
  RETURN COALESCE(v_result, '{}'::jsonb);
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_project_estimation_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_estimation_details TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_project_estimation_details IS 
'Fetches project estimation details along with client information by project_estimate_uuid. Usage: SELECT public.get_project_estimation_details(uuid_value); Returns JSONB with project_name, project_type, clientid_phno, client_name, client_email, photography_owner_phno, start_date, start_time, startdatetime_confirmed, end_date, end_time, enddatetime_confirmed, created_at, updated_at.';


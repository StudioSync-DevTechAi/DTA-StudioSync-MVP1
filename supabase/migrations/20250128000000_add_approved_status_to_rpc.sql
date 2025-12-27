-- ============================================
-- ADD APPROVED STATUS TO UPDATE PROJECT STATUS RPC
-- ============================================
-- This migration updates the update_project_status function
-- to accept 'APPROVED' as a valid status value
-- ============================================
-- Created: 2025-01-28
-- Purpose: Support approved estimates in project_estimation_table
-- ============================================

-- Update the function to include APPROVED status
CREATE OR REPLACE FUNCTION public.update_project_status(
  p_project_estimate_uuid UUID,
  p_project_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_status TEXT;
BEGIN
  -- Validate status value (now includes APPROVED)
  IF p_project_status NOT IN ('LEAD-INPROGRESS', 'PRE-PROD', 'PROD', 'POST-PROD', 'DELIVERED', 'APPROVED') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid project status value',
      'error_code', 'INVALID_STATUS'
    );
  END IF;

  -- Update the project status
  UPDATE public.project_estimation_table
  SET 
    project_status = p_project_status,
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
      'error', 'Invalid project status value (check constraint violation)',
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

-- Update the comment
COMMENT ON FUNCTION public.update_project_status IS 
'Updates the project_status for a project estimation. 
Valid status values: LEAD-INPROGRESS, PRE-PROD, PROD, POST-PROD, DELIVERED, APPROVED.
Uses SECURITY DEFINER to bypass RLS policies.';


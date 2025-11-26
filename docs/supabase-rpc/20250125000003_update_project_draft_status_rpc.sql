-- ============================================
-- UPDATE PROJECT DRAFT STATUS RPC FUNCTION
-- ============================================
-- This function updates the draft status and drafted_json for a project estimation
-- ============================================
-- Created: 2025-01-25
-- Purpose: Update is_drafted flag and drafted_json when saving/updating drafts
-- ============================================

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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_project_draft_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_project_draft_status TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION public.update_project_draft_status IS 
'Updates the is_drafted flag and drafted_json for a project estimation.
Usage:
  - Set is_drafted = false when submitting: update_project_draft_status(uuid, false)
  - Update draft data: update_project_draft_status(uuid, true, drafted_json)
  - Mark as completed: update_project_draft_status(uuid, false, NULL)
';


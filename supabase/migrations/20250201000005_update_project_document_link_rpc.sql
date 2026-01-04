-- ============================================================================
-- RPC FUNCTION: update_project_document_link
-- ============================================================================
-- Updates project_document_link in project_estimation_table
-- This is called after frontend successfully uploads PDF to storage
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_project_document_link(
  p_project_estimate_uuid UUID,
  p_document_link TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate input
  IF p_project_estimate_uuid IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Project estimate UUID is required'
    );
  END IF;

  IF p_document_link IS NULL OR p_document_link = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Document link is required'
    );
  END IF;

  -- Update project_document_link
  UPDATE public.project_estimation_table
  SET 
    project_document_link = p_document_link,
    updated_at = now()
  WHERE project_estimate_uuid = p_project_estimate_uuid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Project not found'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Document link updated successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_project_document_link(UUID, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.update_project_document_link(UUID, TEXT) IS 
  'Updates project_document_link in project_estimation_table after PDF upload to storage.';


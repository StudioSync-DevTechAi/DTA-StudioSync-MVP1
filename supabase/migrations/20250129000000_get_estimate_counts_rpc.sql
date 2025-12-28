-- ============================================
-- GET ESTIMATE COUNTS RPC FUNCTION
-- ============================================
-- This function returns counts of estimates by status:
-- - Pending: from localStorage (handled client-side)
-- - Approved: from project_estimation_table and invoice_items_table
-- - Declined: from localStorage (handled client-side)
-- ============================================
-- Created: 2025-01-29
-- Purpose: Fetch only counts for estimates tabs without loading full data
-- ============================================

-- Function to get estimate counts
CREATE OR REPLACE FUNCTION public.get_estimate_counts(
  p_photography_owner_phno TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_result JSONB;
  v_approved_count INTEGER := 0;
  v_photography_owner TEXT;
BEGIN
  -- Get photography owner phone number if not provided
  IF p_photography_owner_phno IS NULL THEN
    SELECT photography_owner_phno INTO v_photography_owner
    FROM public.photography_owner_table
    LIMIT 1;
    -- If no photography owner found, v_photography_owner will be NULL (will count all)
  ELSE
    v_photography_owner := p_photography_owner_phno;
  END IF;

  -- Count approved estimates from project_estimation_table
  SELECT COALESCE(COUNT(*), 0) INTO v_approved_count
  FROM public.project_estimation_table
  WHERE project_status = 'APPROVED'
    AND (v_photography_owner IS NULL OR photography_owner_phno = v_photography_owner);

  -- Also count approved estimates from invoice_items_table that have project_estimate_uuid
  -- or have approved status in estimateData
  SELECT v_approved_count + COALESCE(COUNT(*), 0) INTO v_approved_count
  FROM public.invoice_items_table
  WHERE (
    project_estimate_uuid IS NOT NULL
    OR (
      invoice_form_data IS NOT NULL 
      AND invoice_form_data->'estimateData' IS NOT NULL
      AND invoice_form_data->'estimateData'->>'status' = 'approved'
    )
  )
    AND (v_photography_owner IS NULL OR photography_owner_phno = v_photography_owner);

  -- Return counts
  -- Note: Pending and Declined counts are handled client-side from localStorage
  -- This function only returns the Approved count from database
  RETURN jsonb_build_object(
    'approved', v_approved_count,
    'pending', 0,  -- Handled client-side
    'declined', 0  -- Handled client-side
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'error_code', SQLSTATE,
      'approved', 0,
      'pending', 0,
      'declined', 0
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_estimate_counts TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_estimate_counts TO anon;

-- Add comment
COMMENT ON FUNCTION public.get_estimate_counts IS 'Returns counts of estimates by status. Approved count from database, Pending/Declined handled client-side.';


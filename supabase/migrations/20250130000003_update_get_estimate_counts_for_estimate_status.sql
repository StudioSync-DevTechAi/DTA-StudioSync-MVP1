-- ============================================
-- UPDATE get_estimate_counts TO USE estimate_status
-- ============================================
-- This migration updates get_estimate_counts to count by estimate_status
-- instead of project_status for better accuracy
-- ============================================
-- Created: 2025-01-30
-- Purpose: Count estimates by estimate_status (PENDING, APPROVED, DECLINED)
-- ============================================

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
  v_pending_count INTEGER := 0;
  v_approved_count INTEGER := 0;
  v_declined_count INTEGER := 0;
  v_photography_owner TEXT;
BEGIN
  -- Get photography owner phone number if not provided
  IF p_photography_owner_phno IS NULL THEN
    SELECT photography_owner_phno INTO v_photography_owner
    FROM public.photography_owner_table
    LIMIT 1;
  ELSE
    v_photography_owner := p_photography_owner_phno;
  END IF;

  -- Count estimates by estimate_status from project_estimation_table
  SELECT 
    COALESCE(COUNT(*) FILTER (WHERE estimate_status = 'PENDING'), 0),
    COALESCE(COUNT(*) FILTER (WHERE estimate_status = 'APPROVED'), 0),
    COALESCE(COUNT(*) FILTER (WHERE estimate_status = 'DECLINED'), 0)
  INTO v_pending_count, v_approved_count, v_declined_count
  FROM public.project_estimation_table
  WHERE (v_photography_owner IS NULL OR photography_owner_phno = v_photography_owner);

  -- Also count approved estimates from invoice_items_table that have project_estimate_uuid
  -- but don't have a corresponding APPROVED estimate_status in project_estimation_table
  -- (for backward compatibility with existing data)
  SELECT v_approved_count + COALESCE(COUNT(*), 0) INTO v_approved_count
  FROM public.invoice_items_table iit
  WHERE (
    iit.project_estimate_uuid IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 
      FROM public.project_estimation_table pet
      WHERE pet.project_estimate_uuid = iit.project_estimate_uuid
      AND pet.estimate_status = 'APPROVED'
    )
  )
  AND (v_photography_owner IS NULL OR iit.photography_owner_phno = v_photography_owner);

  -- Return counts
  RETURN jsonb_build_object(
    'pending', v_pending_count,
    'approved', v_approved_count,
    'declined', v_declined_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'error_code', SQLSTATE,
      'pending', 0,
      'approved', 0,
      'declined', 0
    );
END;
$$;

-- Update comment
COMMENT ON FUNCTION public.get_estimate_counts IS 
'Returns counts of estimates by estimate_status (PENDING, APPROVED, DECLINED) from project_estimation_table.
Also includes approved estimates from invoice_items_table for backward compatibility.';


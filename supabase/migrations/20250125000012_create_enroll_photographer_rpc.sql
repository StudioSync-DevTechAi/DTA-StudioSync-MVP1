-- ============================================
-- CREATE ENROLL PHOTOGRAPHER/VIDEOGRAPHER RPC FUNCTION
-- ============================================
-- This function inserts photographers or videographers into their respective tables
-- Uses SECURITY DEFINER to bypass RLS
-- ============================================
-- Created: 2025-01-25
-- Purpose: Enroll photographers and videographers bypassing RLS
-- ============================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.enroll_photographer_or_videographer(
  TEXT, TEXT, INTEGER, JSONB, TEXT, BOOLEAN
);

DROP FUNCTION IF EXISTS public.enroll_photographer_or_videographer(
  TEXT, TEXT, NUMERIC, JSONB, TEXT, BOOLEAN
);

CREATE OR REPLACE FUNCTION public.enroll_photographer_or_videographer(
  p_phone_number TEXT,
  p_name TEXT,
  p_pay_per_day NUMERIC(10, 2),
  p_about_section_json JSONB,
  p_dp_url TEXT,
  p_is_photographer BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_is_photographer THEN
    -- Insert into photographers_details_table
    INSERT INTO public.photographers_details_table (
      photographer_phno,
      photographer_name,
      photography_eventids_list_json,
      payperday,
      about_section_json,
      dp_url,
      created_at,
      updated_at
    ) VALUES (
      p_phone_number,
      p_name,
      '[]'::jsonb,
      CASE WHEN p_pay_per_day > 0 THEN p_pay_per_day::INTEGER ELSE NULL END,
      COALESCE(p_about_section_json, '{}'::jsonb),
      p_dp_url,
      now(),
      now()
    )
    ON CONFLICT (photographer_phno) DO UPDATE SET
      photographer_name = EXCLUDED.photographer_name,
      payperday = EXCLUDED.payperday,
      about_section_json = EXCLUDED.about_section_json,
      dp_url = EXCLUDED.dp_url,
      updated_at = now();
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Photographer enrolled successfully',
      'type', 'photographer'
    );
  ELSE
    -- Insert into videographers_details_table
    INSERT INTO public.videographers_details_table (
      videographer_phno,
      videographer_name,
      videography_eventids_list_json,
      payperday,
      about_section_json,
      dp_url,
      created_at,
      updated_at
    ) VALUES (
      p_phone_number,
      p_name,
      '[]'::jsonb,
      CASE WHEN p_pay_per_day > 0 THEN p_pay_per_day ELSE NULL END,
      COALESCE(p_about_section_json, '{}'::jsonb),
      p_dp_url,
      now(),
      now()
    )
    ON CONFLICT (videographer_phno) DO UPDATE SET
      videographer_name = EXCLUDED.videographer_name,
      payperday = EXCLUDED.payperday,
      about_section_json = EXCLUDED.about_section_json,
      dp_url = EXCLUDED.dp_url,
      updated_at = now();
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Videographer enrolled successfully',
      'type', 'videographer'
    );
  END IF;
  
EXCEPTION
  WHEN check_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid data: check constraint violation',
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.enroll_photographer_or_videographer TO authenticated;
GRANT EXECUTE ON FUNCTION public.enroll_photographer_or_videographer TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION public.enroll_photographer_or_videographer IS 
'Enrolls a photographer or videographer into the respective table.
Uses SECURITY DEFINER to bypass RLS policies.
Parameters:
  - p_phone_number: Phone number (primary key)
  - p_name: Name of photographer/videographer
  - p_pay_per_day: Pay per day (numeric, will be converted to INTEGER for photographers)
  - p_about_section_json: Bio/about section as JSONB
  - p_dp_url: Display picture URL
  - p_is_photographer: true for photographer, false for videographer
Returns JSONB with success status and message.';


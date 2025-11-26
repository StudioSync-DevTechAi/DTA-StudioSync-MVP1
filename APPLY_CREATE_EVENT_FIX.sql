-- ============================================
-- FIX CREATE_EVENT RPC FUNCTION AND COLUMNS
-- ============================================
-- This script:
-- 1. Adds missing workdays columns if they don't exist
-- 2. Updates the create_event RPC function to handle NULL coordinators
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- ============================================

-- Step 1: Add workdays columns if they don't exist
ALTER TABLE public.events_details_table
ADD COLUMN IF NOT EXISTS videography_workdays DECIMAL(5,2) NULL;

ALTER TABLE public.events_details_table
ADD COLUMN IF NOT EXISTS photography_workdays DECIMAL(5,2) NULL;

-- Step 2: Add check constraints (drop first if they exist to avoid errors)
ALTER TABLE public.events_details_table
DROP CONSTRAINT IF EXISTS events_details_table_videography_workdays_check;

ALTER TABLE public.events_details_table
ADD CONSTRAINT events_details_table_videography_workdays_check 
CHECK (videography_workdays IS NULL OR videography_workdays >= 0);

ALTER TABLE public.events_details_table
DROP CONSTRAINT IF EXISTS events_details_table_photography_workdays_check;

ALTER TABLE public.events_details_table
ADD CONSTRAINT events_details_table_photography_workdays_check 
CHECK (photography_workdays IS NULL OR photography_workdays >= 0);

-- Step 2.5: Fix photography_eventowner_phno foreign key constraint
-- Drop the constraint that references photographers_details_table
-- (since we're using photography_owner_table values, not photographers)
ALTER TABLE public.events_details_table
DROP CONSTRAINT IF EXISTS events_details_table_photography_eventowner_phno_fkey;

-- Make the column nullable if it isn't already
DO $$ 
BEGIN
  -- Check if column is NOT NULL and alter it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events_details_table' 
    AND column_name = 'photography_eventowner_phno'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.events_details_table
    ALTER COLUMN photography_eventowner_phno DROP NOT NULL;
  END IF;
END $$;

-- Step 3: Drop and recreate the create_event function with proper NULL handling
DROP FUNCTION IF EXISTS public.create_event CASCADE;

CREATE OR REPLACE FUNCTION public.create_event(
  p_event_name TEXT,
  p_event_start_date DATE,
  p_event_start_time TIME WITHOUT TIME ZONE,
  p_event_photo_coordinator_phno TEXT,
  p_event_video_coordinator_phno TEXT,
  p_event_photographers_count INTEGER,
  p_event_videographers_count INTEGER,
  p_event_deliverables_notes_json TEXT,
  p_event_prep_checklist_json JSONB,
  p_project_uuid UUID,
  p_photography_eventowner_phno TEXT,
  p_event_client_phno TEXT,
  p_event_uuid UUID DEFAULT NULL,
  p_event_days_count DECIMAL(5,2) DEFAULT NULL,
  p_photography_workdays DECIMAL(5,2) DEFAULT NULL,
  p_videography_workdays DECIMAL(5,2) DEFAULT NULL,
  p_event_photographers_days_count DECIMAL(5,2) DEFAULT NULL,
  p_event_videographers_days_count DECIMAL(5,2) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_uuid UUID;
  v_event_start_timestamp TIMESTAMP WITH TIME ZONE;
  v_photography_eventowner_phno TEXT;
BEGIN
  -- Use provided UUID or generate new one
  IF p_event_uuid IS NOT NULL THEN
    v_event_uuid := p_event_uuid;
  ELSE
    v_event_uuid := gen_random_uuid();
  END IF;
  
  -- Handle photography_eventowner_phno: 
  -- Since we dropped the FK constraint, we can use the value directly
  -- or set to NULL if empty (to avoid any remaining constraint issues)
  IF p_photography_eventowner_phno IS NOT NULL AND TRIM(p_photography_eventowner_phno) != '' THEN
    v_photography_eventowner_phno := TRIM(p_photography_eventowner_phno);
  ELSE
    v_photography_eventowner_phno := NULL;
  END IF;
  
  -- Combine date and time into timestamp
  v_event_start_timestamp := (p_event_start_date::text || ' ' || COALESCE(p_event_start_time::text, '00:00:00'))::timestamp with time zone;
  
  -- Insert or update event
  INSERT INTO public.events_details_table (
    event_uuid,
    event_name,
    event_start_date,
    event_start_time,
    event_photo_coordinator_phno,
    event_video_coordinator_phno,
    event_client_phno,
    event_deliverables_notes_json,
    event_prep_checklist_json,
    project_uuid,
    photography_eventowner_phno,
    event_photographers_count,
    event_videographers_count,
    event_days_count,
    photography_workdays,
    videography_workdays,
    event_photographers_days_count,
    event_videographers_days_count,
    created_at,
    updated_at
  ) VALUES (
    v_event_uuid,
    p_event_name,
    v_event_start_timestamp,
    p_event_start_time,
    NULLIF(TRIM(p_event_photo_coordinator_phno), ''), -- Convert empty strings to NULL
    NULLIF(TRIM(p_event_video_coordinator_phno), ''), -- Convert empty strings to NULL
    p_event_client_phno,
    p_event_deliverables_notes_json,
    COALESCE(p_event_prep_checklist_json, '[]'::jsonb),
    p_project_uuid,
    v_photography_eventowner_phno, -- Use the validated/null value
    COALESCE(p_event_photographers_count, 0),
    COALESCE(p_event_videographers_count, 0),
    p_event_days_count,
    p_photography_workdays,
    p_videography_workdays,
    p_event_photographers_days_count,
    p_event_videographers_days_count,
    CASE WHEN p_event_uuid IS NULL THEN now() ELSE (SELECT created_at FROM public.events_details_table WHERE event_uuid = p_event_uuid) END,
    now()
  )
  ON CONFLICT (event_uuid) 
  DO UPDATE SET
    event_name = EXCLUDED.event_name,
    event_start_date = EXCLUDED.event_start_date,
    event_start_time = EXCLUDED.event_start_time,
    event_photo_coordinator_phno = EXCLUDED.event_photo_coordinator_phno,
    event_video_coordinator_phno = EXCLUDED.event_video_coordinator_phno,
    event_client_phno = EXCLUDED.event_client_phno,
    event_deliverables_notes_json = EXCLUDED.event_deliverables_notes_json,
    event_prep_checklist_json = EXCLUDED.event_prep_checklist_json,
    project_uuid = EXCLUDED.project_uuid,
    photography_eventowner_phno = NULLIF(TRIM(EXCLUDED.photography_eventowner_phno), ''), -- Convert empty strings to NULL
    event_photographers_count = EXCLUDED.event_photographers_count,
    event_videographers_count = EXCLUDED.event_videographers_count,
    event_days_count = EXCLUDED.event_days_count,
    photography_workdays = EXCLUDED.photography_workdays,
    videography_workdays = EXCLUDED.videography_workdays,
    event_photographers_days_count = EXCLUDED.event_photographers_days_count,
    event_videographers_days_count = EXCLUDED.event_videographers_days_count,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'event_uuid', v_event_uuid,
    'success', true,
    'message', CASE 
      WHEN p_event_uuid IS NOT NULL THEN 'Event updated successfully'
      ELSE 'Event created successfully'
    END
  );
  
EXCEPTION
  WHEN foreign_key_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Foreign key constraint violation. Please check project_uuid, coordinator phone numbers, or client_phno.',
      'error_code', SQLSTATE,
      'error_detail', SQLERRM,
      'project_uuid', p_project_uuid,
      'client_phno', p_event_client_phno,
      'photo_coordinator', p_event_photo_coordinator_phno,
      'video_coordinator', p_event_video_coordinator_phno
    );
  WHEN check_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Check constraint violation. Please check event name length, counts, or deliverables notes length.',
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
GRANT EXECUTE ON FUNCTION public.create_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_event TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION public.create_event IS 
'Creates or updates an event in events_details_table. If p_event_uuid is provided, updates existing event; otherwise creates new event. Returns event_uuid on success. Handles NULL coordinator phone numbers.';


-- ============================================
-- UPDATE CREATE_EVENT RPC WITH DUPLICATE CHECK
-- ============================================
-- This migration updates the create_event function to check for duplicates
-- based on project_uuid, event_start_date, and event_client_phno
-- If duplicate found, updates existing record instead of creating new one
-- ============================================
-- Created: 2025-01-25
-- Purpose: Prevent duplicate event records and enable upsert functionality
-- ============================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.create_event CASCADE;

-- Create updated function with duplicate check
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
  v_existing_event_uuid UUID;
  v_is_duplicate BOOLEAN := FALSE;
  v_is_update BOOLEAN := FALSE;
BEGIN
  -- Handle photography_eventowner_phno
  IF p_photography_eventowner_phno IS NOT NULL AND TRIM(p_photography_eventowner_phno) != '' THEN
    v_photography_eventowner_phno := TRIM(p_photography_eventowner_phno);
  ELSE
    v_photography_eventowner_phno := NULL;
  END IF;
  
  -- Combine date and time into timestamp
  v_event_start_timestamp := (p_event_start_date::text || ' ' || COALESCE(p_event_start_time::text, '00:00:00'))::timestamp with time zone;
  
  -- If p_event_uuid is provided, use it (explicit update)
  IF p_event_uuid IS NOT NULL THEN
    v_event_uuid := p_event_uuid;
    v_is_update := TRUE;
  ELSE
    -- Check for duplicate event based on: project_uuid, event_start_date, event_client_phno
    SELECT event_uuid
    INTO v_existing_event_uuid
    FROM public.events_details_table
    WHERE project_uuid = p_project_uuid
      AND DATE(event_start_date) = p_event_start_date
      AND event_client_phno = p_event_client_phno
    LIMIT 1;
    
    IF v_existing_event_uuid IS NOT NULL THEN
      -- Duplicate found - use existing UUID and update
      v_event_uuid := v_existing_event_uuid;
      v_is_duplicate := TRUE;
      v_is_update := TRUE;
      RAISE NOTICE 'Duplicate event found. Updating existing event with UUID: %', v_event_uuid;
    ELSE
      -- No duplicate - create new event
      v_event_uuid := gen_random_uuid();
      v_is_duplicate := FALSE;
      v_is_update := FALSE;
    END IF;
  END IF;
  
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
    NULLIF(TRIM(p_event_photo_coordinator_phno), ''),
    NULLIF(TRIM(p_event_video_coordinator_phno), ''),
    p_event_client_phno,
    p_event_deliverables_notes_json,
    COALESCE(p_event_prep_checklist_json, '[]'::jsonb),
    p_project_uuid,
    v_photography_eventowner_phno,
    COALESCE(p_event_photographers_count, 0),
    COALESCE(p_event_videographers_count, 0),
    p_event_days_count,
    p_photography_workdays,
    p_videography_workdays,
    p_event_photographers_days_count,
    p_event_videographers_days_count,
    CASE 
      WHEN v_is_update AND v_is_duplicate THEN 
        (SELECT created_at FROM public.events_details_table WHERE event_uuid = v_event_uuid)
      ELSE 
        now()
    END,
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
    photography_eventowner_phno = EXCLUDED.photography_eventowner_phno,
    event_photographers_count = EXCLUDED.event_photographers_count,
    event_videographers_count = EXCLUDED.event_videographers_count,
    event_days_count = EXCLUDED.event_days_count,
    photography_workdays = EXCLUDED.photography_workdays,
    videography_workdays = EXCLUDED.videography_workdays,
    event_photographers_days_count = EXCLUDED.event_photographers_days_count,
    event_videographers_days_count = EXCLUDED.event_videographers_days_count,
    updated_at = now();
  
  -- Return success with event UUID and status
  RETURN jsonb_build_object(
    'event_uuid', v_event_uuid,
    'success', true,
    'is_duplicate', v_is_duplicate,
    'is_update', v_is_update,
    'message', CASE 
      WHEN v_is_duplicate THEN 'Duplicate event found and updated successfully'
      WHEN v_is_update THEN 'Event updated successfully'
      ELSE 'Event created successfully'
    END
  );
  
EXCEPTION
  WHEN foreign_key_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Foreign key constraint violation. Please check project_uuid, coordinator phone numbers, or client_phno.',
      'error_code', SQLSTATE,
      'error_detail', SQLERRM
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
'Creates or updates an event in events_details_table.
Checks for duplicates based on project_uuid, event_start_date, and event_client_phno.
If duplicate found, updates existing record; otherwise creates new event.
If p_event_uuid is provided, updates that specific event.
Returns event_uuid, success status, is_duplicate flag, and is_update flag.
Usage:
  - Create new: create_event(..., NULL) - will check for duplicates
  - Update existing: create_event(..., existing_uuid) - explicit update
';


-- ============================================
-- CREATE EVENT RPC FUNCTION
-- ============================================
-- This function creates/updates an event in events_details_table
-- ============================================
-- Created: 2025-01-25
-- Purpose: Save event cards from Page 2 to events_details_table
-- ============================================

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
  p_event_uuid UUID DEFAULT NULL, -- If provided, update existing event; otherwise create new
  p_event_days_count DECIMAL(5,2) DEFAULT NULL,
  p_photography_workdays DECIMAL(5,2) DEFAULT NULL,
  p_videography_workdays DECIMAL(5,2) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_uuid UUID;
  v_event_start_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Use provided UUID or generate new one
  IF p_event_uuid IS NOT NULL THEN
    v_event_uuid := p_event_uuid;
  ELSE
    v_event_uuid := gen_random_uuid();
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
    created_at,
    updated_at
  ) VALUES (
    v_event_uuid,
    p_event_name,
    v_event_start_timestamp,
    p_event_start_time,
    p_event_photo_coordinator_phno,
    p_event_video_coordinator_phno,
    p_event_client_phno,
    p_event_deliverables_notes_json,
    COALESCE(p_event_prep_checklist_json, '[]'::jsonb),
    p_project_uuid,
    p_photography_eventowner_phno,
    COALESCE(p_event_photographers_count, 0),
    COALESCE(p_event_videographers_count, 0),
    p_event_days_count,
    p_photography_workdays,
    p_videography_workdays,
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
    photography_eventowner_phno = EXCLUDED.photography_eventowner_phno,
    event_photographers_count = EXCLUDED.event_photographers_count,
    event_videographers_count = EXCLUDED.event_videographers_count,
    event_days_count = EXCLUDED.event_days_count,
    photography_workdays = EXCLUDED.photography_workdays,
    videography_workdays = EXCLUDED.videography_workdays,
    updated_at = now();
  
  -- Return success with event UUID
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
      'error_code', SQLSTATE
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
If p_event_uuid is provided, updates existing event; otherwise creates new event.
Returns event_uuid on success.
Usage:
  - Create new: create_event(..., NULL)
  - Update existing: create_event(..., existing_uuid)
';


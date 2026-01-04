-- ============================================================================
-- RPC FUNCTION: get_project_events
-- ============================================================================
-- Retrieves all event details for a given project using eventuuids_list_json
-- Parameters:
--   p_project_estimate_uuid: UUID of the project
--   p_client_phno: Client phone number (for validation/security)
-- Returns: JSONB array of event details
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_project_events(
  p_project_estimate_uuid UUID,
  p_client_phno TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_eventuuids_list JSONB;
  v_events_result JSONB;
  v_client_phno TEXT;
BEGIN
  -- Get eventuuids_list_json and client_phno from project_estimation_table
  SELECT 
    COALESCE(eventuuids_list_json, '[]'::jsonb),
    clientid_phno
  INTO 
    v_eventuuids_list,
    v_client_phno
  FROM public.project_estimation_table
  WHERE project_estimate_uuid = p_project_estimate_uuid;

  -- If project not found, return empty array
  IF v_eventuuids_list IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  -- Optional: Validate client_phno if provided
  IF p_client_phno IS NOT NULL AND v_client_phno IS NOT NULL THEN
    IF v_client_phno != p_client_phno THEN
      RAISE EXCEPTION 'Client phone number mismatch for project %', p_project_estimate_uuid;
    END IF;
  END IF;

  -- If no event UUIDs, return empty array
  IF jsonb_array_length(v_eventuuids_list) = 0 THEN
    RETURN '[]'::jsonb;
  END IF;

  -- Fetch all event details using the UUIDs from eventuuids_list_json
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'event_uuid', event_uuid,
      'event_name', event_name,
      'event_start_date', event_start_date,
      'event_start_time', event_start_time,
      'event_photographers_count', event_photographers_count,
      'event_videographers_count', event_videographers_count,
      'event_photo_coordinator_phno', event_photo_coordinator_phno,
      'event_video_coordinator_phno', event_video_coordinator_phno,
      'event_client_phno', event_client_phno,
      'event_deliverables_notes_json', event_deliverables_notes_json,
      'event_prep_checklist_json', event_prep_checklist_json,
      'event_days_count', event_days_count,
      'pg_type', pg_type,
      'vg_type', vg_type,
      'event_type', event_type,
      'event_photographers_days_count', event_photographers_days_count,
      'event_videographers_days_count', event_videographers_days_count,
      'project_uuid', project_uuid,
      'photography_eventowner_phno', photography_eventowner_phno,
      'created_at', created_at,
      'updated_at', updated_at
    )
    ORDER BY event_start_date ASC NULLS LAST
  ), '[]'::jsonb)
  INTO v_events_result
  FROM public.events_details_table
  WHERE event_uuid = ANY(
    SELECT jsonb_array_elements_text(v_eventuuids_list)::UUID
  );

  -- Return the events as JSONB array
  RETURN COALESCE(v_events_result, '[]'::jsonb);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_project_events(UUID, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_project_events(UUID, TEXT) IS 
  'Retrieves all event details for a project using eventuuids_list_json from project_estimation_table';


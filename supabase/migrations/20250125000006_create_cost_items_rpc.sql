-- ============================================
-- CREATE/UPDATE COST ITEMS RPC FUNCTION
-- ============================================
-- This function creates/updates cost items in cost_items_table
-- ============================================
-- Created: 2025-01-25
-- Purpose: Save price card details from Page 2 to cost_items_table
-- ============================================

CREATE OR REPLACE FUNCTION public.create_or_update_cost_items(
  p_project_uuid UUID,
  p_clientid_phno TEXT,
  p_actual_price DECIMAL(10,2),
  p_subtotal_price DECIMAL(10,2),
  p_totalprice_withgst DECIMAL(10,2),
  p_cost_items_uuid UUID DEFAULT NULL -- If provided, update existing record; otherwise create new
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cost_items_uuid UUID;
  v_is_update BOOLEAN := false;
BEGIN
  -- Use provided UUID or generate new one
  IF p_cost_items_uuid IS NOT NULL THEN
    v_cost_items_uuid := p_cost_items_uuid;
    v_is_update := true;
  ELSE
    v_cost_items_uuid := gen_random_uuid();
  END IF;
  
  -- Insert or update cost items
  INSERT INTO public.cost_items_table (
    cost_items_uuid,
    project_uuid,
    clientid_phno,
    actual_price,
    subtotal_price,
    totalprice_withgst,
    created_at,
    updated_at
  ) VALUES (
    v_cost_items_uuid,
    p_project_uuid,
    p_clientid_phno,
    p_actual_price,
    p_subtotal_price,
    p_totalprice_withgst,
    CASE WHEN p_cost_items_uuid IS NULL THEN now() ELSE (SELECT created_at FROM public.cost_items_table WHERE cost_items_uuid = p_cost_items_uuid) END,
    now()
  )
  ON CONFLICT (cost_items_uuid) 
  DO UPDATE SET
    project_uuid = EXCLUDED.project_uuid,
    clientid_phno = EXCLUDED.clientid_phno,
    actual_price = EXCLUDED.actual_price,
    subtotal_price = EXCLUDED.subtotal_price,
    totalprice_withgst = EXCLUDED.totalprice_withgst,
    updated_at = now();
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'cost_items_uuid', v_cost_items_uuid,
    'project_uuid', p_project_uuid,
    'clientid_phno', p_clientid_phno,
    'is_update', v_is_update,
    'message', CASE WHEN v_is_update THEN 'Cost items updated successfully' ELSE 'Cost items created successfully' END
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to save cost items'
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_or_update_cost_items TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.create_or_update_cost_items IS 'Creates or updates cost items in cost_items_table. Returns cost_items_uuid, project_uuid, and clientid_phno on success.';


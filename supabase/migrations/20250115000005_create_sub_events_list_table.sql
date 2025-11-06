-- Create SubEvents_List_Table for storing dropdown options
-- This table stores the list of sub-event types that can be selected in PhotoBank

CREATE TABLE IF NOT EXISTS public.sub_events_list_table (
  sub_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_event_name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0, -- For ordering in dropdown
  is_active BOOLEAN DEFAULT true, -- Allow disabling without deleting
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sub_events_list_active ON public.sub_events_list_table(is_active, display_order);

-- Enable RLS
ALTER TABLE public.sub_events_list_table ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all authenticated users to read, only admins can modify
DROP POLICY IF EXISTS "Anyone can view sub events" ON public.sub_events_list_table;
DROP POLICY IF EXISTS "Admins can insert sub events" ON public.sub_events_list_table;
DROP POLICY IF EXISTS "Admins can update sub events" ON public.sub_events_list_table;
DROP POLICY IF EXISTS "Admins can delete sub events" ON public.sub_events_list_table;

-- Allow all users (including anonymous) to view active sub-events
-- This is needed for the dropdown to work without authentication
CREATE POLICY "Anyone can view sub events"
  ON public.sub_events_list_table
  FOR SELECT
  USING (is_active = true);

-- For now, allow authenticated users to insert/update/delete
-- In production, you might want to restrict this to admins only
CREATE POLICY "Authenticated users can insert sub events"
  ON public.sub_events_list_table
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update sub events"
  ON public.sub_events_list_table
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete sub events"
  ON public.sub_events_list_table
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Insert initial sub-event values
INSERT INTO public.sub_events_list_table (sub_event_name, display_order, is_active)
VALUES
  ('Engagement', 1, true),
  ('Bridal Shower', 2, true),
  ('Reception', 3, true),
  ('Mehendi and Sangeet', 4, true)
ON CONFLICT (sub_event_name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_sub_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_sub_events_updated_at ON public.sub_events_list_table;
CREATE TRIGGER trigger_update_sub_events_updated_at
  BEFORE UPDATE ON public.sub_events_list_table
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sub_events_updated_at();

-- Create function to get active sub-events ordered by display_order
CREATE OR REPLACE FUNCTION public.get_active_sub_events()
RETURNS TABLE (
  sub_event_id UUID,
  sub_event_name TEXT,
  display_order INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.sub_event_id,
    s.sub_event_name,
    s.display_order
  FROM public.sub_events_list_table s
  WHERE s.is_active = true
  ORDER BY s.display_order ASC, s.sub_event_name ASC;
END;
$$;

-- Grant execute permission on function
GRANT EXECUTE ON FUNCTION public.get_active_sub_events() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_sub_events() TO anon;
GRANT EXECUTE ON FUNCTION public.get_active_sub_events() TO public;

-- Grant SELECT permission on table to allow direct access
GRANT SELECT ON public.sub_events_list_table TO authenticated;
GRANT SELECT ON public.sub_events_list_table TO anon;
GRANT SELECT ON public.sub_events_list_table TO public;


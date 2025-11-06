# Troubleshooting Sub-Events Table Access Error

## Error Message
```
PGRST106: The schema must be one of the following: api
```

## Root Cause
This error occurs when Supabase PostgREST cannot access the `sub_events_list_table`. Common causes:

1. **Table doesn't exist** - Migration script not executed
2. **RLS policy blocking access** - Row Level Security preventing reads
3. **Table not exposed** - PostgREST configuration issue

## Solutions

### Solution 1: Verify Table Exists
1. Go to Supabase Dashboard > Table Editor
2. Check if `sub_events_list_table` exists
3. If not, execute the migration script:
   - File: `supabase/migrations/20250115000005_create_sub_events_list_table.sql`
   - Execute in Supabase SQL Editor

### Solution 2: Check RLS Policies
1. Go to Supabase Dashboard > Authentication > Policies
2. Find `sub_events_list_table`
3. Verify there's a SELECT policy that allows access
4. The policy should be:
   ```sql
   CREATE POLICY "Anyone can view sub events"
     ON public.sub_events_list_table
     FOR SELECT
     USING (is_active = true);
   ```

### Solution 3: Grant Permissions
If the table exists but still can't be accessed, manually grant permissions:

```sql
-- Grant SELECT permission
GRANT SELECT ON public.sub_events_list_table TO authenticated;
GRANT SELECT ON public.sub_events_list_table TO anon;
GRANT SELECT ON public.sub_events_list_table TO public;
```

### Solution 4: Use Database Function (Fallback)
The code now includes a fallback that uses the `get_active_sub_events()` function if direct table access fails. This function should work even if table access is restricted.

### Solution 5: Verify PostgREST Configuration
If you're using a custom PostgREST configuration that only exposes the `api` schema:

1. Check Supabase Dashboard > Settings > API
2. Verify exposed schemas include `public`
3. Or create a view in the `api` schema that references the `public` table

## Quick Fix Script

Run this in Supabase SQL Editor to fix common issues:

```sql
-- Ensure table exists and has correct permissions
DO $$
BEGIN
  -- Grant permissions if table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sub_events_list_table') THEN
    GRANT SELECT ON public.sub_events_list_table TO authenticated;
    GRANT SELECT ON public.sub_events_list_table TO anon;
    GRANT SELECT ON public.sub_events_list_table TO public;
    
    -- Ensure RLS policy exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'sub_events_list_table' 
      AND policyname = 'Anyone can view sub events'
    ) THEN
      CREATE POLICY "Anyone can view sub events"
        ON public.sub_events_list_table
        FOR SELECT
        USING (is_active = true);
    END IF;
  ELSE
    RAISE NOTICE 'Table sub_events_list_table does not exist. Please run the migration script first.';
  END IF;
END $$;
```

## Verification Steps

1. **Check table exists:**
   ```sql
   SELECT * FROM public.sub_events_list_table LIMIT 1;
   ```

2. **Check RLS policies:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'sub_events_list_table';
   ```

3. **Test function:**
   ```sql
   SELECT * FROM public.get_active_sub_events();
   ```

4. **Test via API:**
   - Use Supabase Dashboard > API > REST
   - Try: `GET /rest/v1/sub_events_list_table?select=*&is_active=eq.true`

## Expected Behavior After Fix

- Page loads without errors
- Dropdown shows sub-events from database
- Console shows no PGRST106 errors
- Fallback to default values if database unavailable

## If Still Not Working

1. Check browser console for detailed error
2. Verify Supabase project URL and keys are correct
3. Check network tab for actual API request/response
4. Verify user is authenticated (if RLS requires it)
5. Try accessing table directly via Supabase Dashboard > Table Editor


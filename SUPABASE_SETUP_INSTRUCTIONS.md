# Supabase Setup Instructions for Project Estimation RPC Function

## Overview
This guide provides step-by-step instructions to set up the `create_project_estimation` RPC function in your Supabase database.

## Prerequisites
- Access to Supabase Dashboard
- SQL Editor permissions
- Database tables already created:
  - `project_estimation_table`
  - `client_details_table`
  - `photography_owner_table`

## Step 1: Run the Migration

### Option A: Via Supabase Dashboard (Recommended)

1. **Navigate to SQL Editor**
   - Go to your Supabase Dashboard
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

2. **Copy and Paste the Migration**
   - Open the file: `supabase/migrations/20250125000000_create_project_estimation_rpc.sql`
   - Copy the entire contents
   - Paste into the SQL Editor

3. **Execute the Migration**
   - Click "Run" or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
   - Wait for the success message

### Option B: Via Supabase CLI (If you have it set up)

```bash
# Navigate to your project directory
cd /path/to/your/project

# Run the migration
supabase db push
```

## Step 2: Verify the Function Was Created

1. **Check Function Exists**
   - In SQL Editor, run:
   ```sql
   SELECT 
     routine_name,
     routine_type,
     data_type
   FROM information_schema.routines
   WHERE routine_schema = 'public'
     AND routine_name = 'create_project_estimation';
   ```
   - You should see one row with the function details

2. **Test the Function** (Optional)
   ```sql
   -- Test with sample data (replace with actual values)
   SELECT public.create_project_estimation(
     'Test Project',
     'wedding',
     '2025-02-01'::DATE,
     '10:00:00'::TIME,
     true,
     '2025-02-02'::DATE,
     '18:00:00'::TIME,
     true,
     '+919876543210',  -- Photography owner phone (must exist)
     'Test Client',
     'test@example.com',
     '+919876543211'   -- Client phone
   );
   ```

## Step 3: Verify Permissions

1. **Check Function Permissions**
   - Run in SQL Editor:
   ```sql
   SELECT 
     p.proname AS function_name,
     pg_get_function_identity_arguments(p.oid) AS arguments,
     r.rolname AS grantee
   FROM pg_proc p
   JOIN pg_namespace n ON p.pronamespace = n.oid
   JOIN pg_proc_acl pa ON p.oid = pa.prooid
   JOIN pg_roles r ON pa.grantee = r.oid
   WHERE n.nspname = 'public'
     AND p.proname = 'create_project_estimation';
   ```

2. **Expected Result**
   - Should show grants to `authenticated` and `anon` roles

## Step 4: Verify RLS Policies

Ensure your tables have appropriate RLS policies:

### For `client_details_table`:
```sql
-- Check existing policies
SELECT * FROM pg_policies 
WHERE tablename = 'client_details_table';

-- If needed, create policies:
CREATE POLICY "Users can insert clients" 
ON public.client_details_table 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can update clients" 
ON public.client_details_table 
FOR UPDATE 
TO authenticated 
USING (true);
```

### For `project_estimation_table`:
```sql
-- Check existing policies
SELECT * FROM pg_policies 
WHERE tablename = 'project_estimation_table';

-- If needed, create policies:
CREATE POLICY "Users can insert project estimations" 
ON public.project_estimation_table 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can view project estimations" 
ON public.project_estimation_table 
FOR SELECT 
TO authenticated 
USING (true);
```

## Step 5: Test from Frontend

1. **Start your development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Navigate to New Project Page**
   - Go to `/estimates/projects/new` or click "New Project" button

3. **Fill in the form**
   - Project Name: "Test Project"
   - Type of Project: Select any option
   - Client Name: "Test Client"
   - Client Email: "test@example.com"
   - Client Phone: "+91 9876543210"
   - Set Start Date & Time
   - Set End Date & Time (optional)

4. **Click "Next"**
   - Check browser console for logs
   - Should see: "Project estimation created successfully: [UUID]"
   - Should navigate to Page 2

5. **Verify in Database**
   ```sql
   -- Check project was created
   SELECT * FROM project_estimation_table 
   ORDER BY created_at DESC 
   LIMIT 1;

   -- Check client was created/updated
   SELECT * FROM client_details_table 
   WHERE clientid_phno = '+919876543210';
   ```

## Troubleshooting

### Error: "function create_project_estimation does not exist"
- **Solution**: Make sure you ran the migration in Step 1
- Verify the function exists using the SQL query in Step 2

### Error: "permission denied for function create_project_estimation"
- **Solution**: Check function permissions in Step 3
- Re-run the GRANT statements from the migration file

### Error: "foreign key constraint violation"
- **Solution**: Ensure `photography_owner_phno` exists in `photography_owner_table`
- Check that the phone number format matches exactly (with or without spaces)

### Error: "null value in column violates not-null constraint"
- **Solution**: Ensure all required fields are filled:
  - `p_project_name`
  - `p_project_type`
  - `p_photography_owner_phno`
  - `p_client_phno`

### Function returns error but no details
- **Solution**: Check Supabase logs:
  - Go to Dashboard > Logs > Postgres Logs
  - Look for error messages around the time of the request

## Additional Notes

1. **UUID Generation**: The function uses `gen_random_uuid()` to generate UUIDs. This is PostgreSQL's built-in function.

2. **Transaction Safety**: The entire operation (client insert/update + project insert) happens in a single transaction. If any part fails, everything is rolled back.

3. **Client Updates**: If a client already exists (by phone number), the function updates their information and adds the new project UUID to their project list.

4. **Time Format**: Times should be in `HH:MM:SS` format (24-hour). The frontend converts from 12-hour format automatically.

## Next Steps

After successful setup:
1. The function is ready to use
2. Frontend will automatically call it when "Next" is clicked on Page 1
3. The returned `project_estimate_uuid` is stored in state and sessionStorage
4. You can use this UUID for subsequent operations (Page 2, Page 3, etc.)

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Check Supabase Dashboard > Logs for database errors
3. Verify all table structures match the provided DDL
4. Ensure foreign key relationships are correct


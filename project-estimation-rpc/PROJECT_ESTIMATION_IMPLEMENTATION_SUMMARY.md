# Project Estimation RPC Function - Implementation Summary

## ✅ What Has Been Implemented

### 1. **Supabase RPC Function** (`supabase/migrations/20250125000000_create_project_estimation_rpc.sql`)

Created a PostgreSQL function that:
- ✅ Generates UUID for project estimation
- ✅ Inserts/updates client details in `client_details_table`
- ✅ Inserts project estimation in `project_estimation_table`
- ✅ Handles both new and existing clients
- ✅ Runs in a single transaction (atomicity)
- ✅ Returns `project_estimate_uuid` on success
- ✅ Comprehensive error handling

**Function Signature:**
```sql
create_project_estimation(
  p_project_name TEXT,
  p_project_type TEXT,
  p_start_date DATE,
  p_start_time TIME WITHOUT TIME ZONE,
  p_start_datetime_confirmed BOOLEAN,
  p_end_date DATE,
  p_end_time TIME WITHOUT TIME ZONE,
  p_end_datetime_confirmed BOOLEAN,
  p_photography_owner_phno TEXT,
  p_client_name TEXT,
  p_client_email TEXT,
  p_client_phno TEXT
) RETURNS JSONB
```

**Response Format:**
```json
{
  "project_estimate_uuid": "uuid-here",
  "success": true,
  "message": "Project estimation created successfully"
}
```

### 2. **React Component Updates** (`src/pages/projects/NewProjectPage.tsx`)

Updated the component to:
- ✅ Call RPC function when "Next" is clicked on Page 1
- ✅ Format time from 12-hour to 24-hour format (HH:MM:SS)
- ✅ Handle loading states (`isSubmitting`)
- ✅ Store `project_estimate_uuid` in state and sessionStorage
- ✅ Display error messages to user
- ✅ Navigate to Page 2 on success
- ✅ Disable button during submission

**Key Changes:**
- Added `projectEstimateUuid` state
- Added `isSubmitting` state
- Updated `handleNext` to be async and call RPC function
- Added time formatting helper
- Updated Next button to show loading state

## 📋 What You Need to Do in Supabase

### Step 1: Run the Migration

1. **Open Supabase Dashboard**
   - Go to your project dashboard
   - Navigate to "SQL Editor"

2. **Execute the Migration**
   - Open file: `supabase/migrations/20250125000000_create_project_estimation_rpc.sql`
   - Copy the entire SQL code
   - Paste into SQL Editor
   - Click "Run" or press `Ctrl+Enter` / `Cmd+Enter`

3. **Verify Function Created**
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
     AND routine_name = 'create_project_estimation';
   ```
   Should return 1 row.

### Step 2: Verify Permissions

The migration includes GRANT statements, but verify:
```sql
-- Check function permissions
SELECT 
  p.proname AS function_name,
  r.rolname AS grantee
FROM pg_proc p
JOIN pg_proc_acl pa ON p.oid = pa.prooid
JOIN pg_roles r ON pa.grantee = r.oid
WHERE p.proname = 'create_project_estimation';
```

Should show `authenticated` and `anon` roles.

### Step 3: Verify RLS Policies

Ensure these tables have INSERT/UPDATE policies:

**For `client_details_table`:**
```sql
-- Check existing policies
SELECT * FROM pg_policies 
WHERE tablename = 'client_details_table';

-- If missing, create:
CREATE POLICY "Users can insert clients" 
ON public.client_details_table 
FOR INSERT TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can update clients" 
ON public.client_details_table 
FOR UPDATE TO authenticated 
USING (true);
```

**For `project_estimation_table`:**
```sql
-- Check existing policies
SELECT * FROM pg_policies 
WHERE tablename = 'project_estimation_table';

-- If missing, create:
CREATE POLICY "Users can insert project estimations" 
ON public.project_estimation_table 
FOR INSERT TO authenticated 
WITH CHECK (true);
```

### Step 4: Ensure Photography Owner Exists

The function requires a valid `photography_owner_phno`. Verify:
```sql
SELECT * FROM photography_owner_table LIMIT 1;
```

If empty, insert a test record:
```sql
INSERT INTO photography_owner_table (
  photography_owner_phno,
  photography_owner_email,
  photography_owner_name
) VALUES (
  '+919876543210',  -- Replace with actual phone
  'owner@example.com',
  'Test Owner'
);
```

## 🧪 Testing

### Test the Function Directly in SQL Editor

```sql
SELECT public.create_project_estimation(
  'Test Project Name',
  'wedding',
  '2025-02-01'::DATE,
  '10:00:00'::TIME,
  true,
  '2025-02-02'::DATE,
  '18:00:00'::TIME,
  false,
  '+919876543210',  -- Must exist in photography_owner_table
  'Test Client Name',
  'client@example.com',
  '+919876543211'
);
```

Expected result:
```json
{
  "project_estimate_uuid": "some-uuid",
  "success": true,
  "message": "Project estimation created successfully"
}
```

### Test from Frontend

1. Start dev server: `npm run dev`
2. Navigate to New Project page
3. Fill in all required fields
4. Click "Next"
5. Check browser console for success message
6. Verify data in database:
   ```sql
   SELECT * FROM project_estimation_table 
   ORDER BY created_at DESC LIMIT 1;
   
   SELECT * FROM client_details_table 
   WHERE clientid_phno = '+919876543211';
   ```

## 📊 Data Flow

```
User fills form (Page 1)
    ↓
Clicks "Next"
    ↓
Frontend validates form
    ↓
Frontend calls: supabase.rpc('create_project_estimation', {...})
    ↓
PostgreSQL function executes:
    1. Generates UUID
    2. Inserts/Updates client_details_table
    3. Inserts project_estimation_table
    (All in single transaction)
    ↓
Returns: { project_estimate_uuid, success: true }
    ↓
Frontend stores UUID in state & sessionStorage
    ↓
Navigates to Page 2
```

## 🔍 Error Handling

The function handles:
- ✅ Foreign key violations (invalid photography_owner_phno)
- ✅ NOT NULL violations (missing required fields)
- ✅ General exceptions
- ✅ Returns structured error responses

Frontend handles:
- ✅ Network errors
- ✅ RPC errors
- ✅ Displays user-friendly error messages
- ✅ Prevents navigation on error

## 📝 Important Notes

1. **Phone Number Format**: The function expects phone numbers without spaces. The frontend removes spaces before sending.

2. **Time Format**: Times must be in `HH:MM:SS` format (24-hour). Frontend converts from 12-hour format.

3. **Date Format**: Dates must be in `YYYY-MM-DD` format. Frontend uses `date-fns` format function.

4. **UUID Storage**: The `project_estimate_uuid` is stored in:
   - Component state (`projectEstimateUuid`)
   - SessionStorage (`newProjectEstimateUuid`)
   - Use this UUID for subsequent operations (Page 2, Page 3)

5. **Client Updates**: If a client with the same phone number exists, their information is updated and the new project UUID is added to their project list.

## 🚀 Next Steps

After successful setup:
1. ✅ Function is ready to use
2. ✅ Frontend automatically calls it on "Next" click
3. ⏭️ Implement Page 2 logic (event packages)
4. ⏭️ Implement Page 3 logic (quotation format)
5. ⏭️ Use `projectEstimateUuid` for subsequent saves

## 📚 Files Modified

1. `supabase/migrations/20250125000000_create_project_estimation_rpc.sql` - New RPC function
2. `src/pages/projects/NewProjectPage.tsx` - Updated to call RPC function
3. `SUPABASE_SETUP_INSTRUCTIONS.md` - Detailed setup guide
4. `PROJECT_ESTIMATION_IMPLEMENTATION_SUMMARY.md` - This file

## ❓ Troubleshooting

See `SUPABASE_SETUP_INSTRUCTIONS.md` for detailed troubleshooting steps.

Common issues:
- Function not found → Run migration
- Permission denied → Check GRANT statements
- Foreign key violation → Verify photography_owner exists
- RLS policy error → Create INSERT/UPDATE policies


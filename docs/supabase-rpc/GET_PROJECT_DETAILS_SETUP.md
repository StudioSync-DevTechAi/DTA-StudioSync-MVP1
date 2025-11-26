# Get Project Estimation Details RPC Function - Setup Guide

## Overview
This RPC function fetches project estimation details along with client information from the database using `project_estimate_uuid`.

## Purpose
- Fetch `client_phno`, `client_name`, `project_name`, and `project_type` from `project_estimation_table`
- Used in Page 2 (Event Details) to display client information in Event Cards
- Joins with `client_details_table` to get client name

## Step 1: Run the Migration

1. **Open Supabase Dashboard → SQL Editor**
2. **Copy the SQL from**: `supabase/migrations/20250125000001_get_project_estimation_details_rpc.sql`
   OR `docs/supabase-rpc/get_project_estimation_details_rpc.sql`
3. **Paste and execute** in SQL Editor

## Step 2: Verify the Function

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'get_project_estimation_details';
```

Should return 1 row.

## Step 3: Test the Function

```sql
-- Replace with an actual project_estimate_uuid from your database
SELECT public.get_project_estimation_details(
  'your-project-uuid-here'::UUID
);
```

Expected response:
```json
{
  "project_estimate_uuid": "uuid",
  "project_name": "Test Project",
  "project_type": "wedding",
  "clientid_phno": "+919876543210",
  "client_name": "Client Name",
  "client_email": "client@example.com",
  "photography_owner_phno": "+919876543211",
  ...
}
```

## Function Details

**Function Name**: `get_project_estimation_details`

**Parameter**:
- `p_project_estimate_uuid` (UUID) - The project estimation UUID

**Returns**: JSONB object with:
- `project_estimate_uuid`
- `project_name`
- `project_type`
- `clientid_phno`
- `client_name` (from client_details_table via JOIN)
- `client_email`
- `photography_owner_phno`
- `start_date`, `start_time`, `startdatetime_confirmed`
- `end_date`, `end_time`, `enddatetime_confirmed`
- `created_at`, `updated_at`

## Frontend Usage

The function is automatically called when:
1. User navigates to Page 2 (Event Details)
2. `projectEstimateUuid` is available
3. Component fetches data and displays in Event Cards

**No additional setup needed** - the React component handles the API call automatically.

## Troubleshooting

### Error: "function get_project_estimation_details does not exist"
- **Solution**: Run the migration SQL in Step 1

### Error: "permission denied"
- **Solution**: Check that GRANT statements were executed (included in migration)

### Returns empty object `{}`
- **Solution**: Verify the UUID exists in `project_estimation_table`
- Check that the client exists in `client_details_table` (for client_name)

### Client name is null
- **Solution**: Ensure the client record exists in `client_details_table` with matching `clientid_phno`


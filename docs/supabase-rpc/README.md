# Supabase RPC Functions Documentation

This folder contains all Supabase RPC (Remote Procedure Call) functions used in the project.

## 📁 Files in this folder

### `create_project_estimation_rpc.sql`
- **Purpose**: Creates a new project estimation and client details in a single transaction
- **Triggered by**: Page 1 "Next" button click in New Project form
- **Tables affected**: 
  - `project_estimation_table` (INSERT)
  - `client_details_table` (INSERT or UPDATE)
- **Returns**: `{ project_estimate_uuid, success, message }`

### `get_project_estimation_details_rpc.sql`
- **Purpose**: Fetches project estimation details along with client information by UUID
- **Triggered by**: Page 2 load (Event Details page)
- **Tables queried**: 
  - `project_estimation_table` (SELECT)
  - `client_details_table` (JOIN SELECT)
- **Returns**: `{ project_estimate_uuid, project_name, project_type, clientid_phno, client_name, client_email, ... }`

### `update_project_draft_status_rpc.sql`
- **Purpose**: Updates the `is_drafted` flag and `drafted_json` for a project estimation
- **Triggered by**: 
  - Auto-save (debounced, every 2 seconds after form changes)
  - "Save" button click (keeps `is_drafted = true`)
  - "Submit" button click (sets `is_drafted = false`)
- **Tables affected**: 
  - `project_estimation_table` (UPDATE)
- **Returns**: `{ success, message }`

## 🚀 Quick Setup

1. **Copy the SQL file content**
2. **Open Supabase Dashboard → SQL Editor**
3. **Paste and run the SQL**
4. **Verify function exists**:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name = 'create_project_estimation';
   ```

## 📋 Function Details

### `create_project_estimation`

**Parameters:**
- `p_project_name` - Project name from form
- `p_project_type` - Type of project (wedding, corporate, etc.)
- `p_start_date` - Project start date
- `p_start_time` - Project start time (HH:MM:SS format)
- `p_start_datetime_confirmed` - Boolean confirmation status
- `p_end_date` - Project end date (optional)
- `p_end_time` - Project end time (optional)
- `p_end_datetime_confirmed` - Boolean confirmation status
- `p_photography_owner_phno` - Photography owner phone (FK)
- `p_client_name` - Client full name
- `p_client_email` - Client email address
- `p_client_phno` - Client phone number (FK)

**Returns:**
```json
{
  "project_estimate_uuid": "uuid-here",
  "success": true,
  "message": "Project estimation created successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here",
  "error_code": "SQLSTATE"
}
```

## 🔍 Testing

### Test in SQL Editor:
```sql
SELECT public.create_project_estimation(
  'Test Project',
  'wedding',
  '2025-02-01'::DATE,
  '10:00:00'::TIME,
  true,
  '2025-02-02'::DATE,
  '18:00:00'::TIME,
  false,
  '+919876543210',  -- Must exist in photography_owner_table
  'Test Client',
  'test@example.com',
  '+919876543211'
);
```

### Verify Data:
```sql
-- Check project estimation
SELECT * FROM project_estimation_table 
ORDER BY created_at DESC LIMIT 1;

-- Check client details
SELECT * FROM client_details_table 
WHERE clientid_phno = '+919876543211';
```

## 📚 Related Documentation

- See `PROJECT_ESTIMATION_IMPLEMENTATION_SUMMARY.md` for complete implementation details
- See `SUPABASE_SETUP_INSTRUCTIONS.md` for detailed setup steps

## 🔧 Maintenance

When updating RPC functions:
1. Update the SQL file in this folder
2. Update the migration file in `supabase/migrations/`
3. Run the updated SQL in Supabase Dashboard
4. Test thoroughly before deploying

## 📝 Notes

- All RPC functions use `SECURITY DEFINER` for elevated privileges
- Functions are granted to `authenticated` and `anon` roles
- All operations run in transactions for data consistency
- Error handling is comprehensive with specific error codes


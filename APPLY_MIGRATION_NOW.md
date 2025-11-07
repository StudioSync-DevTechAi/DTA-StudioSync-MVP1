# ⚠️ URGENT: Apply Project_UserEmail Migration

## Current Status
The `project_useremail` column **does not exist** in your database yet. The app is using a fallback (filtering by `user_id`), but you need to apply the migration to enable email-based filtering.

## Quick Fix: Apply Migration via Supabase Dashboard

### Step 1: Open Supabase Dashboard
1. Go to: **https://supabase.com/dashboard**
2. Sign in to your account
3. Select your project: **StudioSyncWork Proj** (or your project name)

### Step 2: Open SQL Editor
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New Query"** button

### Step 3: Copy and Paste This SQL
Copy the **entire** SQL below and paste it into the SQL Editor:

```sql
-- Add Project_UserEmail column to project_details_table
-- This column stores the authenticated user's email ID for filtering user-specific projects

-- Add project_useremail column as TEXT
ALTER TABLE public.project_details_table
ADD COLUMN IF NOT EXISTS project_useremail TEXT;

-- Create index for faster lookups on project_useremail
CREATE INDEX IF NOT EXISTS idx_project_details_useremail ON public.project_details_table(project_useremail);

-- Add comment to explain the column
COMMENT ON COLUMN public.project_details_table.project_useremail IS 'Email address of the authenticated user who created the project. Used for filtering user-specific projects.';

-- Update existing rows to populate project_useremail from auth.users if possible
-- This is a one-time migration for existing data
UPDATE public.project_details_table pdt
SET project_useremail = au.email
FROM auth.users au
WHERE pdt.user_id = au.id
  AND pdt.project_useremail IS NULL;
```

### Step 4: Run the Migration
1. Click the **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
2. Wait for the success message
3. You should see: **"Success. No rows returned"** or similar

### Step 5: Verify the Column Was Added
Run this verification query:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'project_details_table' 
  AND column_name = 'project_useremail';
```

**Expected Result:**
- `column_name`: `project_useremail`
- `data_type`: `text`
- `is_nullable`: `YES`

### Step 6: Refresh Your Application
1. **Refresh your browser** (F5 or Cmd+R)
2. The error should be gone
3. Projects will now be filtered by email

## What This Migration Does

1. ✅ Adds `project_useremail` column to `project_details_table`
2. ✅ Creates an index for faster queries
3. ✅ Populates existing projects with email from `auth.users`
4. ✅ Safe to run multiple times (uses `IF NOT EXISTS`)

## After Migration

Once applied:
- ✅ New projects will automatically include `project_useremail`
- ✅ Projects will be filtered by the logged-in user's email
- ✅ The 400 error will be resolved
- ✅ The fallback message will disappear

## Troubleshooting

If you get an error:
- **"permission denied"**: Make sure you're logged in as a project owner/admin
- **"relation does not exist"**: Check that `project_details_table` exists
- **"column already exists"**: The migration was already applied (this is OK)

---

**File Location:** `supabase/migrations/20250115000012_add_project_useremail_to_project_details.sql`


# Apply Project_UserEmail Migration

## Error Explanation
The error `column project_details_table.project_useremail does not exist` occurs because the migration file was created but hasn't been applied to your Supabase database yet.

## Solution: Apply Migration via Supabase Dashboard

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Sign in to your account
3. Navigate to your project (StudioSyncWork Proj)

### Step 2: Open SQL Editor
1. Click on **"SQL Editor"** in the left sidebar
2. Click **"New Query"**

### Step 3: Copy and Execute Migration SQL
Copy the entire contents of the migration file and paste it into the SQL Editor:

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
2. Wait for the migration to complete
3. You should see a **"Success"** message

### Step 5: Verify Migration
Run this query to verify the column was added:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'project_details_table' 
  AND column_name = 'project_useremail';
```

You should see:
- `column_name`: `project_useremail`
- `data_type`: `text`
- `is_nullable`: `YES`

### Step 6: Refresh Your Application
1. Refresh your browser (or restart the dev server)
2. The error should be resolved
3. Projects will now be filtered by user email

## Temporary Fallback
The code has been updated with a fallback mechanism that will use `user_id` filtering if the `project_useremail` column doesn't exist. However, you should still apply the migration to enable email-based filtering.

## Notes
- The migration is idempotent (safe to run multiple times) - it uses `IF NOT EXISTS` clauses
- Existing projects will have their `project_useremail` populated automatically from `auth.users`
- New projects will have `project_useremail` set when they are created


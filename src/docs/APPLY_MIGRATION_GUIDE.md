# 🚀 Apply Freelancer-Portfolio Migration

## Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Sign in to your account
3. Navigate to your "StudioSyncWork Proj" project

## Step 2: Open SQL Editor
1. Click on "SQL Editor" in the left sidebar
2. Click "New Query"

## Step 3: Execute Migration SQL
Copy and paste this SQL into the editor:

```sql
-- Add portfolio_id and user_id to freelancers table
ALTER TABLE public.freelancers
ADD COLUMN portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE SET NULL,
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add additional fields to freelancers table
ALTER TABLE public.freelancers
ADD COLUMN email TEXT,
ADD COLUMN phone TEXT,
ADD COLUMN bio TEXT,
ADD COLUMN experience_years INTEGER DEFAULT 0,
ADD COLUMN portfolio_url TEXT,
ADD COLUMN website TEXT,
ADD COLUMN linkedin TEXT,
ADD COLUMN instagram TEXT;

-- Update RLS policies for freelancers table
DROP POLICY IF EXISTS "Authenticated users can update freelancers" ON public.freelancers;
CREATE POLICY "Users can update their own freelancer profile"
  ON public.freelancers
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can delete freelancers" ON public.freelancers;
CREATE POLICY "Users can delete their own freelancer profile"
  ON public.freelancers
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert freelancers" ON public.freelancers;
CREATE POLICY "Users can insert their own freelancer profile"
  ON public.freelancers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view freelancers" ON public.freelancers;
CREATE POLICY "Public can view active freelancers"
  ON public.freelancers
  FOR SELECT
  USING (is_available = TRUE);

CREATE POLICY "Authenticated users can view all freelancers"
  ON public.freelancers
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Create function to link freelancer to portfolio
CREATE OR REPLACE FUNCTION public.link_freelancer_portfolio(freelancer_id UUID, p_portfolio_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.freelancers
  SET portfolio_id = p_portfolio_id
  WHERE id = freelancer_id AND user_id = auth.uid();
END;
$$;

-- Create function to get freelancer with portfolio
CREATE OR REPLACE FUNCTION public.get_freelancer_with_portfolio(f_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  role TEXT,
  location TEXT,
  rating NUMERIC(3,1),
  review_count INTEGER,
  hourly_rate TEXT,
  avatar TEXT,
  specialties TEXT[],
  is_available BOOLEAN,
  portfolio_id UUID,
  user_id UUID,
  email TEXT,
  phone TEXT,
  bio TEXT,
  experience_years INTEGER,
  portfolio_url TEXT,
  website TEXT,
  linkedin TEXT,
  instagram TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  portfolio_name TEXT,
  portfolio_tagline TEXT,
  portfolio_about TEXT,
  portfolio_services TEXT[],
  portfolio_contact JSONB,
  portfolio_social_links JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.name,
    f.role,
    f.location,
    f.rating,
    f.review_count,
    f.hourly_rate,
    f.avatar,
    f.specialties,
    f.is_available,
    f.portfolio_id,
    f.user_id,
    f.email,
    f.phone,
    f.bio,
    f.experience_years,
    f.portfolio_url,
    f.website,
    f.linkedin,
    f.instagram,
    f.created_at,
    f.updated_at,
    p.name AS portfolio_name,
    p.tagline AS portfolio_tagline,
    p.about AS portfolio_about,
    p.services AS portfolio_services,
    p.contact AS portfolio_contact,
    p.social_links AS portfolio_social_links
  FROM public.freelancers f
  LEFT JOIN public.portfolios p ON f.portfolio_id = p.id
  WHERE f.id = f_id;
END;
$$;

-- Create function to get freelancers by specialty
CREATE OR REPLACE FUNCTION public.get_freelancers_by_specialty(s TEXT DEFAULT 'all')
RETURNS SETOF public.freelancers
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF s = 'all' THEN
    RETURN QUERY SELECT * FROM public.freelancers WHERE is_available = TRUE;
  ELSE
    RETURN QUERY SELECT * FROM public.freelancers WHERE s = ANY(specialties) AND is_available = TRUE;
  END IF;
END;
$$;

-- Add indexes for new foreign keys
CREATE INDEX IF NOT EXISTS idx_freelancers_portfolio_id ON public.freelancers(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_freelancers_user_id ON public.freelancers(user_id);
```

## Step 4: Run the Migration
1. Click "Run" button in the SQL Editor
2. Wait for the migration to complete
3. You should see "Success" message

## Step 5: Verify Migration
Run this query to verify the new fields were added:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'freelancers' 
ORDER BY ordinal_position;
```

## Step 6: Test the Application
1. Go to: http://localhost:8082/hire
2. Check if freelancer cards show new fields
3. Test portfolio functionality

## 🎉 Success!
Once the migration is applied, your freelancer-portfolio foreign key enhancement will be fully functional!

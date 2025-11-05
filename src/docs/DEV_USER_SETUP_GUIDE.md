# Dev User Freelancer Setup Guide

## Overview
This guide explains how to create a dev user freelancer account for testing the StudioSyncWork freelancer marketplace functionality.

## Step 1: Create Auth User in Supabase

### Option A: Using Supabase Dashboard (Recommended)
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add user"**
3. Fill in the details:
   - **Email**: `dev@photosyncwork.com`
   - **Password**: `devpassword123` (or your preferred password)
   - **Email Confirmed**: ✅ (check this box)
   - **User ID**: `11111111-1111-1111-1111-111111111111` ⭐ **IMPORTANT: Use this exact UUID**
4. Click **"Create user"**

### Option B: Using Supabase Auth API
```javascript
// You can also create the user programmatically with the specific UUID
const { data, error } = await supabase.auth.admin.createUser({
  email: 'dev@photosyncwork.com',
  password: 'devpassword123',
  email_confirm: true,
  user_metadata: {
    user_id: '11111111-1111-1111-1111-111111111111'
  }
})
```

## Step 2: Apply Database Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `supabase/migrations/20250104000005_dev_user_freelancer.sql`
3. Click **Run** to execute the migration
4. Verify success message

## Step 3: Verify Dev User Setup

Run these queries to verify the dev user was created correctly:

```sql
-- Check dev user profile
SELECT * FROM public.profiles WHERE email = 'dev@photosyncwork.com';

-- Check dev user role
SELECT * FROM public.user_roles WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- Check dev freelancer profile
SELECT * FROM public.freelancers WHERE email = 'dev@photosyncwork.com';

-- Check dev user portfolio
SELECT * FROM public.portfolios WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- Check portfolio gallery
SELECT * FROM public.portfolio_gallery 
WHERE portfolio_id = (
  SELECT id FROM public.portfolios WHERE user_id = '11111111-1111-1111-1111-111111111111'
);
```

## Step 5: Test Login

1. Go to `http://localhost:8080/auth`
2. Use the dev user credentials:
   - **Email**: `dev@photosyncwork.com`
   - **Password**: `devpassword123`
3. Click **Sign In**

## Step 6: Test Freelancer Features

### ✅ **Test Enlist/Delist Functionality**:
1. Go to `http://localhost:8080/hire`
2. You should see **"Delist My Profile"** button (since dev user is enlisted)
3. Click it to test delisting
4. Click **"Enlist My Profile"** to test enlisting

### ✅ **Test Portfolio Modal**:
1. Click on any freelancer card (including your own dev user)
2. Portfolio modal should open
3. Test the modal functionality

### ✅ **Test Profile Management**:
1. Check if dev user appears in freelancer listings
2. Verify all profile information displays correctly
3. Test contact and social links

## Dev User Profile Details

### 👤 **User Information**:
- **Name**: Dev Photographer
- **Email**: dev@photosyncwork.com
- **Phone**: +1 (555) 000-0000
- **Location**: San Francisco, CA
- **Role**: photographer

### 📸 **Freelancer Profile**:
- **Rating**: 4.8 stars
- **Reviews**: 45 reviews
- **Hourly Rate**: $120-180/hour
- **Experience**: 6 years
- **Specialties**: Portrait, Event, Commercial, Product Photography
- **Status**: Enlisted (visible in marketplace)

### 🎨 **Portfolio**:
- **Name**: Dev Photographer Portfolio
- **Tagline**: Capturing Life's Beautiful Moments
- **Services**: Portrait, Event, Commercial, Product, Wedding Photography
- **Gallery**: 3 sample images
- **Social Links**: Instagram, Website

## Troubleshooting

### ❌ **Common Issues**:

1. **Login Fails**:
   - Check if auth user was created successfully
   - Verify email confirmation status
   - Check Supabase Auth logs

2. **Profile Not Found**:
   - Verify User ID was replaced correctly in migration
   - Check if migration ran successfully
   - Verify RLS policies allow access

3. **Freelancer Profile Missing**:
   - Check if freelancer record was created
   - Verify user_id matches auth user ID
   - Check for foreign key constraints

4. **Portfolio Not Loading**:
   - Verify portfolio record exists
   - Check portfolio_gallery records
   - Verify freelancer-portfolio link

### 🔧 **Debug Steps**:
1. Check Supabase Auth users table
2. Verify all database records exist
3. Test API calls in browser console
4. Check RLS policies and permissions
5. Verify migration execution logs

## Security Notes

### 🔒 **Development Only**:
- This dev user is for **development/testing only**
- **Do not use** in production environment
- **Change password** if needed for security
- **Remove** dev user before production deployment

### 🛡️ **Best Practices**:
- Use strong passwords even for dev accounts
- Limit dev user permissions as needed
- Monitor dev user activity
- Clean up test data regularly

## Next Steps

### 🚀 **After Setup**:
1. **Test All Features**: Enlist/delist, portfolio modal, search, filtering
2. **User Experience**: Test the complete freelancer workflow
3. **Bug Testing**: Identify and report any issues
4. **Feature Validation**: Ensure all functionality works as expected
5. **Performance**: Monitor loading times and responsiveness

### 📊 **Testing Checklist**:
- [ ] Dev user can log in successfully
- [ ] Dev user appears in freelancer listings
- [ ] Enlist/delist functionality works
- [ ] Portfolio modal opens correctly
- [ ] Contact information displays properly
- [ ] Social links work correctly
- [ ] Search and filtering work with dev user
- [ ] Profile editing works (if implemented)

This dev user setup provides a complete testing environment for the StudioSyncWork freelancer marketplace! 🎉

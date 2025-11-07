# 🚀 Vercel Deployment Configuration Guide

This document lists all environment variables and external configurations needed for deploying the StudioSyncWork application to Vercel.

## 📋 Required Environment Variables

### 🔴 **CRITICAL - Required for Core Functionality**

#### **Supabase Configuration** (Primary Database & Auth)
These are **MANDATORY** for the application to function:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Where to find:**
- Go to your Supabase Dashboard → Project Settings → API
- Copy the "Project URL" → `VITE_SUPABASE_URL`
- Copy the "anon public" key → `VITE_SUPABASE_ANON_KEY`

**Current values (from code):**
- URL: `https://mogywlineksvyssnocwz.supabase.co` (or `https://tsdpfqbdwpwxmfsbdsmz.supabase.co`)
- Anon Key: Check your Supabase dashboard for the current key

---

### 🟡 **OPTIONAL - For Additional Features**

#### **AWS S3 Configuration** (Alternative Image Storage)
Only needed if you want to use AWS S3 instead of Supabase Storage:

```bash
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=your-aws-access-key-id
VITE_AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
VITE_AWS_BUCKET_NAME=your-bucket-name
```

**Note:** The application primarily uses Supabase Storage, so these are optional unless you specifically need S3 integration.

---

#### **Cloudinary Configuration** (Alternative Image Storage)
Only needed if you want to use Cloudinary for image management:

```bash
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_API_KEY=your-api-key
VITE_CLOUDINARY_API_SECRET=your-api-secret
```

**Note:** The application primarily uses Supabase Storage, so these are optional.

---

## 🔧 Vercel Configuration Steps

### **Step 1: Add Environment Variables in Vercel Dashboard**

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:

   **For Production:**
   - `VITE_SUPABASE_URL` = `https://your-project-ref.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`

   **For Preview/Development (optional):**
   - Same variables, or use different Supabase projects for testing

### **Step 2: Verify Supabase Configuration**

Before deploying, ensure:

1. ✅ **Supabase Project is Active**
   - Check your Supabase dashboard
   - Ensure project is not paused

2. ✅ **Database Migrations Applied**
   - All migrations in `supabase/migrations/` should be applied
   - Especially check: `20250115000012_add_project_useremail_to_project_details.sql`

3. ✅ **Storage Buckets Created**
   - `images` bucket exists in Supabase Storage
   - Bucket is set to **Public** (for public image access)
   - RLS policies are configured correctly

4. ✅ **Row Level Security (RLS) Policies**
   - Ensure RLS is enabled on all tables
   - Policies allow authenticated users to access their own data

### **Step 3: Build Configuration**

Vercel will automatically detect Vite and use the build command from `package.json`:

```json
{
  "build": "vite build"
}
```

**Build Output:** `dist/` directory

**Framework Preset:** Vite (auto-detected)

---

## 📝 Environment Variable Reference

### **Variable Naming Convention**
- All variables must be prefixed with `VITE_` for Vite to expose them to the client
- Variables without `VITE_` prefix will NOT be accessible in the browser

### **Current Usage in Code:**

| Variable | Used In | Required | Default |
|----------|---------|----------|---------|
| `VITE_SUPABASE_URL` | `src/integrations/supabase/client.ts` | ✅ Yes | `https://mogywlineksvyssnocwz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `src/integrations/supabase/client.ts` | ✅ Yes | (hardcoded fallback) |
| `VITE_AWS_REGION` | `src/integrations/aws/s3Client.ts` | ❌ No | `us-east-1` |
| `VITE_AWS_ACCESS_KEY_ID` | `src/integrations/aws/s3Client.ts` | ❌ No | `""` |
| `VITE_AWS_SECRET_ACCESS_KEY` | `src/integrations/aws/s3Client.ts` | ❌ No | `""` |
| `VITE_AWS_BUCKET_NAME` | `src/integrations/aws/s3Client.ts` | ❌ No | `studiosync-demo` |
| `VITE_CLOUDINARY_CLOUD_NAME` | `src/integrations/cloudinary/cloudinaryClient.ts` | ❌ No | `""` |
| `VITE_CLOUDINARY_API_KEY` | `src/integrations/cloudinary/cloudinaryClient.ts` | ❌ No | `""` |
| `VITE_CLOUDINARY_API_SECRET` | `src/integrations/cloudinary/cloudinaryClient.ts` | ❌ No | `""` |

---

## 🔐 Security Best Practices

### **✅ DO:**
- ✅ Use Vercel's environment variable encryption
- ✅ Set different values for Production, Preview, and Development
- ✅ Rotate keys regularly
- ✅ Use Supabase RLS policies for data security
- ✅ Never commit `.env` files to git

### **❌ DON'T:**
- ❌ Expose service role keys in client-side code
- ❌ Use production keys in development
- ❌ Commit environment variables to version control
- ❌ Share environment variables in public channels

---

## 🧪 Testing After Deployment

After deploying to Vercel, verify:

1. **Authentication Works**
   - Test login/signup
   - Verify OAuth (Google) login if configured

2. **Database Connection**
   - Check browser console for Supabase connection errors
   - Verify data loads correctly

3. **Image Upload**
   - Test image upload functionality
   - Verify images appear in Supabase Storage

4. **PhotoBank Features**
   - Create a project
   - Upload albums
   - Verify preview functionality

---

## 📚 Additional Resources

- **Supabase Dashboard:** https://app.supabase.com
- **Vercel Environment Variables:** https://vercel.com/docs/concepts/projects/environment-variables
- **Vite Environment Variables:** https://vitejs.dev/guide/env-and-mode.html

---

## 🆘 Troubleshooting

### **Issue: "Supabase URL not configured"**
- ✅ Check `VITE_SUPABASE_URL` is set in Vercel
- ✅ Verify the URL format: `https://xxx.supabase.co`
- ✅ Redeploy after adding environment variables

### **Issue: "Authentication failed"**
- ✅ Verify `VITE_SUPABASE_ANON_KEY` is correct
- ✅ Check Supabase project is active
- ✅ Verify RLS policies allow access

### **Issue: "Storage bucket not found"**
- ✅ Create `images` bucket in Supabase Storage
- ✅ Set bucket to Public
- ✅ Configure RLS policies for the bucket

### **Issue: "Build fails"**
- ✅ Check all required environment variables are set
- ✅ Verify Node.js version (Vercel auto-detects)
- ✅ Check build logs in Vercel dashboard

---

## ✅ Pre-Deployment Checklist

- [ ] `VITE_SUPABASE_URL` configured in Vercel
- [ ] `VITE_SUPABASE_ANON_KEY` configured in Vercel
- [ ] Supabase project is active and accessible
- [ ] All database migrations applied
- [ ] Storage bucket `images` created and configured
- [ ] RLS policies configured correctly
- [ ] Test build locally: `npm run build`
- [ ] Verify no hardcoded secrets in code
- [ ] Check browser console for errors after deployment

---

**Last Updated:** January 2025
**Project:** StudioSyncWork MVP1


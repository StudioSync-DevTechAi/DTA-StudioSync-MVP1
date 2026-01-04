# PDF Upload Edge Function Implementation

## Overview

This document describes the implementation of a Supabase Edge Function for PDF uploads, which bypasses Row Level Security (RLS) policies by using the service role key. This provides better security and reliability compared to direct client-side uploads.

## What Was Implemented

### 1. Edge Function (`supabase/functions/upload-pdf/`)

- **File**: `index.ts` - Main Edge Function code
- **File**: `config.toml` - Function configuration
- **File**: `README.md` - Detailed documentation

### 2. Frontend Updates

- **File**: `src/pages/projects/NewProjectPage.tsx`
- **Function**: `uploadPdfToStorage()` - Updated to use Edge Function

## Key Features

✅ **Bypasses RLS**: Uses service role key to upload without RLS restrictions  
✅ **User Authentication**: Validates user token before upload  
✅ **File Validation**: Checks file type (PDF only) and size (100MB limit)  
✅ **Error Handling**: Comprehensive error messages and logging  
✅ **Secure**: Only authenticated users can upload PDFs  

## Deployment Steps

### Step 1: Deploy Edge Function

```bash
# Make sure you're in the project root
cd /path/to/photosyncwork

# Link to your Supabase project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy upload-pdf
```

### Step 2: Verify Environment Variables

The Edge Function automatically uses these environment variables (set by Supabase):

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (found in Dashboard > Settings > API)

**Note**: These are automatically available in Edge Functions, no manual setup needed.

### Step 3: Test the Function

After deployment, test by clicking "Submit" on a project in the app. The PDF should upload successfully.

## How It Works

### Flow Diagram

```
Frontend (NewProjectPage.tsx)
    ↓
uploadPdfToStorage()
    ↓
Convert PDF to Base64
    ↓
Call Edge Function: upload-pdf
    ↓
Edge Function validates user token
    ↓
Edge Function uses service role key
    ↓
Upload to Supabase Storage (bypasses RLS)
    ↓
Return public URL
    ↓
Frontend saves URL to database
```

### Code Flow

1. **Frontend**: User clicks "Submit" button
2. **Frontend**: `handleSaveEvent()` is called
3. **Frontend**: `uploadPdfToStorage()` converts PDF to base64
4. **Frontend**: Calls `supabase.functions.invoke('upload-pdf', ...)`
5. **Edge Function**: Validates user authentication
6. **Edge Function**: Uses service role key to upload to storage
7. **Edge Function**: Returns public URL
8. **Frontend**: Saves URL to `project_estimation_table` via RPC

## Request/Response Format

### Request

```typescript
{
  file: string;        // Base64 encoded PDF
  fileName: string;     // e.g., "quotation-123.pdf"
  projectUuid: string;  // Project UUID
}
```

### Response (Success)

```json
{
  "success": true,
  "url": "https://...supabase.co/storage/v1/object/public/documents/...",
  "path": "user-id/project-uuid/timestamp-random-quotation.pdf",
  "size": 123456
}
```

### Response (Error)

```json
{
  "success": false,
  "error": "Error message here"
}
```

## Storage Path Structure

PDFs are stored with this structure:

```
{user_id}/{project_uuid}/{timestamp}-{random}-quotation.pdf
```

Example:
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890/
  550e8400-e29b-41d4-a716-446655440000/
  1704067200000-x7k9m2p-quotation.pdf
```

## Error Handling

The Edge Function handles these errors:

- **401 Unauthorized**: User not authenticated or invalid token
- **400 Bad Request**: Missing fields, invalid file type, or file too large
- **500 Internal Server Error**: Storage upload failure

All errors are logged and returned with descriptive messages.

## Troubleshooting

### Error: "Function not found"

**Solution**: Deploy the function:
```bash
supabase functions deploy upload-pdf
```

### Error: "Unauthorized"

**Solution**: 
1. Check that user is logged in
2. Verify session token is valid
3. Check browser console for auth errors

### Error: "Failed to upload to storage"

**Solution**:
1. Verify `documents` bucket exists in Supabase Dashboard
2. Check bucket permissions
3. Verify service role key is configured

### Error: "File size exceeds limit"

**Solution**: PDF is larger than 100MB. Either:
- Compress the PDF
- Increase limit in Edge Function (not recommended)

## Benefits Over Direct Upload

1. **Security**: Service role key is never exposed to client
2. **Reliability**: No RLS policy issues
3. **Validation**: Server-side file validation
4. **Error Handling**: Better error messages and logging
5. **Scalability**: Can add additional processing (e.g., virus scanning)

## Files Modified/Created

### Created
- `supabase/functions/upload-pdf/index.ts`
- `supabase/functions/upload-pdf/config.toml`
- `supabase/functions/upload-pdf/README.md`
- `docs/PDF_UPLOAD_EDGE_FUNCTION.md` (this file)

### Modified
- `src/pages/projects/NewProjectPage.tsx` - Updated `uploadPdfToStorage()` function

## Next Steps

1. ✅ Deploy the Edge Function
2. ✅ Test PDF upload in the app
3. ✅ Verify PDFs are saved to database
4. ✅ Check that PDFs are accessible via public URL

## Support

If you encounter issues:

1. Check Edge Function logs in Supabase Dashboard
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Ensure `documents` bucket exists and is public


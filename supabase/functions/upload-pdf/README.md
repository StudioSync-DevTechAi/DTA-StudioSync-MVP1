# Upload PDF Edge Function

This Edge Function handles PDF uploads to Supabase Storage, bypassing Row Level Security (RLS) policies by using the service role key.

## Features

- ✅ Bypasses RLS using service role key
- ✅ Validates user authentication
- ✅ Handles PDF files up to 100MB
- ✅ Generates unique storage paths
- ✅ Returns public URL for uploaded PDFs

## Storage Path Structure

```
{user_id}/{project_uuid}/{timestamp}-{random}-quotation.pdf
```

## Deployment

### Prerequisites

1. Supabase CLI installed
2. Project linked to Supabase
3. Service role key configured in environment

### Deploy Command

```bash
# Deploy the function
supabase functions deploy upload-pdf

# Or deploy all functions
supabase functions deploy
```

### Environment Variables

The Edge Function requires these environment variables (automatically set by Supabase):

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (bypasses RLS)

## Usage

### Frontend Call

```typescript
const { data, error } = await supabase.functions.invoke('upload-pdf', {
  body: {
    file: base64EncodedPdf,
    fileName: 'quotation-123.pdf',
    projectUuid: 'project-uuid-here'
  },
  headers: {
    Authorization: `Bearer ${session.access_token}`
  }
});

if (data?.success) {
  const pdfUrl = data.url;
  // Use the URL
}
```

### Request Format

```json
{
  "file": "base64-encoded-pdf-content",
  "fileName": "quotation-123.pdf",
  "projectUuid": "uuid-of-project"
}
```

### Response Format

**Success:**
```json
{
  "success": true,
  "url": "https://...supabase.co/storage/v1/object/public/documents/...",
  "path": "user-id/project-uuid/timestamp-random-quotation.pdf",
  "size": 123456
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Error Handling

- **401 Unauthorized**: User not authenticated or invalid token
- **400 Bad Request**: Missing fields, invalid file type, or file too large
- **500 Internal Server Error**: Storage upload failure or other server errors

## Testing

### Local Testing

```bash
# Start Supabase locally
supabase start

# Test the function locally
supabase functions serve upload-pdf
```

### Manual Test

```bash
curl -X POST http://localhost:54321/functions/v1/upload-pdf \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "file": "base64-encoded-pdf",
    "fileName": "test.pdf",
    "projectUuid": "test-uuid"
  }'
```

## Security Notes

- The function validates user authentication before upload
- Uses service role key only for storage operations (bypasses RLS)
- File size limit: 100MB
- Only accepts PDF files
- Storage path includes user ID for organization


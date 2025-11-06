# Image Upload Service

Unified image upload service that stores all images in the `image_obj_storage_table` and returns `{ Image_UUID, Image_AccessURL }` format.

## Features

- ✅ Unified storage table for all images
- ✅ Returns `{ Image_UUID, Image_AccessURL }` format
- ✅ Supports both Edge Function and direct upload
- ✅ Automatic fallback if Edge Function unavailable
- ✅ Progress tracking
- ✅ File validation (size, type)
- ✅ Concurrent upload support

## Usage

### Basic Upload

```typescript
import { uploadImageDirect } from '@/services/imageUpload/imageUploadService';

const file = // File object from input
const result = await uploadImageDirect({ file });

console.log(result.Image_UUID);      // "550e8400-e29b-41d4-a716-446655440000"
console.log(result.Image_AccessURL); // "https://..."
```

### Using React Hook

```typescript
import { useImageUpload } from '@/hooks/useImageUpload';

function MyComponent() {
  const { uploadImage, isUploading, uploadProgress } = useImageUpload();

  const handleUpload = async (file: File) => {
    const result = await uploadImage(file);
    if (result) {
      console.log('Uploaded:', result.Image_UUID, result.Image_AccessURL);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
      }} />
      {isUploading && <progress value={uploadProgress} max={100} />}
    </div>
  );
}
```

### Multiple Images

```typescript
const { uploadMultipleImages } = useImageUpload();

const files = // Array of File objects
const results = await uploadMultipleImages(files);

results.forEach(result => {
  console.log(result.Image_UUID, result.Image_AccessURL);
});
```

## API Reference

### `uploadImageDirect(options)`

Uploads image directly via Supabase Storage.

**Parameters:**
- `file: File` - Image file to upload
- `onProgress?: (progress: number) => void` - Progress callback

**Returns:**
```typescript
{
  Image_UUID: string;
  Image_AccessURL: string;
}
```

### `uploadImageViaEdgeFunction(options)`

Uploads image via Supabase Edge Function (recommended for production).

**Parameters:** Same as `uploadImageDirect`

**Returns:** Same format as `uploadImageDirect`

**Note:** Automatically falls back to direct upload if Edge Function fails.

### `getImageByUuid(imageUuid)`

Retrieves image metadata by UUID.

**Returns:**
```typescript
{
  image_uuid: string;
  image_obj: string;        // Storage path
  image_access_url: string; // Public URL
  image_create_datetime: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
} | null
```

### `deleteImageByUuid(imageUuid)`

Deletes image from both storage and database.

## Database Schema

The service uses the `image_obj_storage_table`:

```sql
CREATE TABLE image_obj_storage_table (
  image_uuid UUID PRIMARY KEY,
  image_obj TEXT NOT NULL,              -- Storage path
  image_access_url TEXT NOT NULL,       -- Public URL
  image_create_datetime TIMESTAMP,
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  user_id UUID REFERENCES auth.users(id)
);
```

## Storage Bucket

Images are stored in the `images` Supabase Storage bucket.

**Required Setup:**
1. Create bucket named `images` in Supabase Dashboard
2. Set as public (if you want public URLs)
3. Configure RLS policies if needed

## Edge Function

The Edge Function is located at `supabase/functions/upload-image/`.

**Deploy:**
```bash
supabase functions deploy upload-image
```

**Environment Variables Required:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Error Handling

The service provides helpful error messages:

- **"Not authenticated"** - User must be logged in
- **"File size exceeds XMB limit"** - File too large (10MB max)
- **"File must be an image"** - Invalid file type
- **"Storage bucket 'images' not found"** - Bucket needs to be created
- **"Image storage table not found"** - Migration needs to be run

## Testing

Run unit tests:
```bash
npm test -- imageUploadService.test.ts
```

Run integration tests (requires Supabase):
```bash
npm test -- imageUploadIntegration.test.ts
```

Skip integration tests:
```bash
SKIP_INTEGRATION_TESTS=true npm test
```

## Migration

Apply the database migration:

```sql
-- Run: supabase/migrations/20250115000001_create_image_obj_storage_table.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Copy and paste the migration SQL
3. Execute

## Vercel Deployment

1. Add environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Deploy Edge Function separately:
   ```bash
   supabase functions deploy upload-image
   ```

3. Build and deploy:
   ```bash
   npm run build
   ```

## Response Format

All upload functions return the same format:

```json
{
  "Image_UUID": "550e8400-e29b-41d4-a716-446655440000",
  "Image_AccessURL": "https://tsdpfqbdwpwxmfsbdsmz.supabase.co/storage/v1/object/public/images/user-id/path.jpg"
}
```


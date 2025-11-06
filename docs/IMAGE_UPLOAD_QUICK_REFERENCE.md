# Image Upload Quick Reference

## Quick Sequence Overview

### Album Creation Flow (Modal)
```
1. Click "Create Album" → Modal Opens
2. Select Images (up to 20) → Preview Shown
3. Select Thumbnail (optional) → Preview Shown
4. Click "Upload" → Images Upload Concurrently
   ├─ Each image → uploadImageDirect()
   ├─ Upload to Storage → Supabase Storage
   ├─ Create DB Record → image_obj_storage_table
   └─ Return { Image_UUID, Image_AccessURL }
5. Progress Bars Show → 0-100% per image
6. Success Indicators → Green checkmarks
7. Click "Submit" → Album Created with UUIDs
```

### Main Project Submission Flow
```
1. Fill Form → Project Details
2. Upload Thumbnail → Returns thumbnailUuid
3. Upload Images → Returns imageUuids[]
4. Click "Create Project" → handleSubmit()
5. All Images Upload → Concurrent uploads
6. Project Data Prepared → With UUIDs
7. Save to Database → TODO: API call
```

## Key Return Values

**Every upload returns:**
```typescript
{
  Image_UUID: string,        // Use this for relationships
  Image_AccessURL: string    // Use this for display
}
```

## Database Table Structure

```sql
image_obj_storage_table
├─ image_uuid (PK)          → Use in foreign keys
├─ image_obj               → Storage path
├─ image_access_url        → Display URL
├─ image_create_datetime   → Timestamp
├─ file_name               → Original filename
├─ file_size               → Bytes
├─ mime_type               → image/jpeg, etc.
└─ user_id                 → Owner
```

## Service Functions

### uploadImageDirect()
- **Location**: `src/services/imageUpload/imageUploadService.ts`
- **Input**: `{ file: File, onProgress?: (progress: number) => void }`
- **Output**: `{ Image_UUID, Image_AccessURL }`
- **Process**: Client-side upload → Storage → Database

### uploadImageViaEdgeFunction()
- **Location**: `src/services/imageUpload/imageUploadService.ts`
- **Input**: `{ file: File, onProgress?: (progress: number) => void }`
- **Output**: `{ Image_UUID, Image_AccessURL }`
- **Process**: Edge Function → Storage → Database
- **Fallback**: Uses uploadImageDirect() if Edge Function fails

## State Variables (PhotoBank.tsx)

```typescript
// Image selection
albumImages: UploadedImage[]           // Selected images
albumThumbnailFile: File | null        // Selected thumbnail

// Upload progress
uploadProgress: Record<string, number> // Progress % per image
uploadStatus: Record<string, Status>   // Status per image
thumbnailUploadProgress: number        // Thumbnail progress %
thumbnailUploadStatus: Status          // Thumbnail status

// Upload results
thumbnailUuid: string | null           // Thumbnail UUID after upload
isUploadComplete: boolean              // All uploads done
```

## Status Values

```typescript
type Status = 'pending' | 'uploading' | 'success' | 'error'
```

## UI Indicators

- **Uploading**: Blue progress bar (0-100%)
- **Success**: Green checkmark (✓)
- **Error**: Red X (✗)
- **Pending**: No indicator

## Error Scenarios

| Error | Handling |
|-------|----------|
| File > 10MB | Toast error, upload rejected |
| Not image/* | Toast error, upload rejected |
| > 20 images | Toast error, excess rejected |
| Network failure | Toast error, upload marked failed |
| Storage error | Toast error, upload marked failed |
| DB error | Toast error, upload marked failed |

## Concurrent Upload Behavior

- ✅ All images upload simultaneously
- ✅ Progress tracked independently
- ✅ Failures don't stop other uploads
- ✅ UI updates in real-time
- ✅ Final status shown per image

## Integration Points

### PhotoBank Project
```typescript
// After upload, save project:
createPhotoBankProject({
  title: string,
  thumbnail_image_id: thumbnailUuid,  // From upload
  // ... other fields
})
```

### PhotoBank Album
```typescript
// After upload, save album:
createPhotoBankAlbum({
  project_id: string,
  thumbnail_image_id: thumbnailUuid,   // From upload
  // ... other fields
})

// Then link images:
uploadAlbumImages(albumId, imageUuids) // Array of UUIDs
```

## Storage Path Format

```
images/{user_id}/{timestamp}-{random}-{sanitized_filename}
```

Example:
```
images/123e4567-e89b-12d3-a456-426614174000/1705123456789-abc123def456-photo.jpg
```

## Public URL Format

```
https://{supabase_url}/storage/v1/object/public/images/{path}
```

## Common Patterns

### Upload Single Image
```typescript
const result = await uploadImageDirect({ file });
console.log(result.Image_UUID);      // Use for DB relationships
console.log(result.Image_AccessURL); // Use for display
```

### Upload Multiple Images
```typescript
const results = await Promise.all(
  images.map(img => uploadImageDirect({ file: img.file }))
);
const uuids = results.map(r => r.Image_UUID);
const urls = results.map(r => r.Image_AccessURL);
```

### Track Progress
```typescript
await uploadImageDirect({
  file,
  onProgress: (progress) => {
    console.log(`Upload: ${progress}%`);
  }
});
```

## Next Steps

1. ✅ Upload service implemented
2. ✅ Progress tracking implemented
3. ✅ UI indicators implemented
4. ⏳ Project creation API integration
5. ⏳ Album creation API integration
6. ⏳ Image deletion functionality
7. ⏳ Image replacement functionality


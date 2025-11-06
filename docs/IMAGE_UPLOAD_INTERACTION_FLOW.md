# Image Upload Interaction Flow Documentation

## Overview
This document describes the complete interaction flow for image uploads in the PhotoBank module, which uses the unified `image_obj_storage_table` for all image storage operations.

## Architecture Components

### 1. Database Layer
- **Table**: `public.image_obj_storage_table`
  - `image_uuid` (UUID, Primary Key)
  - `image_obj` (TEXT) - Storage path in Supabase Storage bucket
  - `image_access_url` (TEXT) - Public access URL
  - `image_create_datetime` (TIMESTAMP)
  - `file_name`, `file_size`, `mime_type`, `user_id` (metadata)

### 2. Storage Layer
- **Bucket**: `images` (Supabase Storage)
- **Path Structure**: `images/{user_id}/{timestamp}-{random}-{filename}`

### 3. Service Layer
- **File**: `src/services/imageUpload/imageUploadService.ts`
  - `uploadImageDirect()` - Client-side upload
  - `uploadImageViaEdgeFunction()` - Server-side upload via Edge Function
  - Both return: `{ Image_UUID, Image_AccessURL }`

### 4. Edge Function
- **File**: `supabase/functions/upload-image/index.ts`
- **Endpoint**: `/functions/v1/upload-image`
- **Returns**: `{ Image_UUID, Image_AccessURL }`

## Interaction Flow Sequences

### Flow 1: Create Album Modal - Image Upload

```
User Action → UI Component → Service Layer → Storage → Database → Response

1. User clicks "Create Album" button
   ↓
2. Modal opens (Create Album Dialog)
   ↓
3. User selects images (up to 20)
   ↓
4. Images stored locally in state (preview generated)
   ↓
5. User clicks "Upload" button
   ↓
6. handleAlbumUpload() called
   ↓
7. For each image:
   a. uploadImageDirect() called with File object
   b. File validated (size < 10MB, type = image/*)
   c. Storage path generated: images/{user_id}/{timestamp}-{random}-{filename}
   d. File uploaded to Supabase Storage bucket "images"
   e. Public URL retrieved
   f. UUID generated (crypto.randomUUID())
   g. Record inserted into image_obj_storage_table:
      - image_uuid = UUID
      - image_obj = storage path
      - image_access_url = public URL
      - file_name, file_size, mime_type, user_id
   h. Progress updated (0-100%)
   i. Response: { Image_UUID, Image_AccessURL }
   ↓
8. All uploads run concurrently (Promise.allSettled)
   ↓
9. Success/Error status updated per image
   ↓
10. UI updates:
    - Progress bars show upload status
    - Green checkmark on success
    - Red X on error
    ↓
11. isUploadComplete = true (if at least one succeeded)
   ↓
12. "Submit" button enabled
   ↓
13. User clicks "Submit"
   ↓
14. handleAlbumSubmit() called
   ↓
15. Album data saved with image UUIDs
```

### Flow 2: Main Project Form Submission

```
User Action → Form Submission → Image Upload → Project Creation

1. User fills out PhotoBank project form:
   - Project Title (editable)
   - Main Event Name
   - Main Event Description
   - Short Description
   - Sub Event Name
   - Thumbnail Upload
   - Images (via "Create Album" or direct)
   ↓
2. User clicks "Create Project" button
   ↓
3. handleSubmit() called
   ↓
4. Thumbnail upload (if present):
   a. uploadImageDirect() called
   b. Uploaded to storage
   c. Record created in image_obj_storage_table
   d. Returns: { Image_UUID, Image_AccessURL }
   e. thumbnailUuid stored
   ↓
5. Images upload (if present):
   a. For each image: uploadImageDirect() called concurrently
   b. Each upload creates record in image_obj_storage_table
   c. Returns array of Image_UUIDs
   d. imageUuids array stored
   ↓
6. Project data prepared:
   {
     title: projectTitle,
     main_event_name: mainEventName,
     main_event_description: mainEventDescription,
     short_description: shortDescription,
     sub_event_name: subEventName,
     custom_sub_event_name: customSubEventName (if "Other"),
     thumbnail_image_id: thumbnailUuid,
     image_uuids: imageUuids
   }
   ↓
7. TODO: Call createPhotoBankProject() API
   ↓
8. Success toast shown
```

### Flow 3: Edge Function Upload (Alternative Path)

```
Client → Edge Function → Storage → Database → Response

1. uploadImageViaEdgeFunction() called
   ↓
2. File converted to base64
   ↓
3. POST request to /functions/v1/upload-image
   Headers:
   - Authorization: Bearer {session.access_token}
   - Content-Type: application/json
   Body:
   {
     file: base64_string,
     fileName: string,
     contentType: string
   }
   ↓
4. Edge Function receives request
   ↓
5. User authenticated via token
   ↓
6. Base64 decoded to binary
   ↓
7. File validated (size, type)
   ↓
8. Storage path generated
   ↓
9. Uploaded to Supabase Storage (admin client)
   ↓
10. Public URL retrieved
   ↓
11. UUID generated
   ↓
12. Record inserted into image_obj_storage_table (admin client)
   ↓
13. Response returned:
    {
      Image_UUID: string,
      Image_AccessURL: string
    }
   ↓
14. Client receives response
   ↓
15. Image UUID and URL stored in component state
```

## Data Flow Diagram

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Select Images
       ▼
┌─────────────────────────────────────┐
│   PhotoBank.tsx                     │
│   - handleAlbumImageSelect()        │
│   - handleAlbumUpload()             │
│   - State: albumImages[]            │
└──────┬──────────────────────────────┘
       │
       │ 2. Call uploadImageDirect()
       ▼
┌─────────────────────────────────────┐
│   imageUploadService.ts             │
│   - uploadImageDirect()             │
│   - Validates file                  │
│   - Generates storage path          │
└──────┬──────────────────────────────┘
       │
       │ 3. Upload to Storage
       ▼
┌─────────────────────────────────────┐
│   Supabase Storage                  │
│   Bucket: "images"                  │
│   Path: images/{user_id}/...        │
└──────┬──────────────────────────────┘
       │
       │ 4. Get Public URL
       ▼
┌─────────────────────────────────────┐
│   Supabase Storage API              │
│   Returns: publicUrl               │
└──────┬──────────────────────────────┘
       │
       │ 5. Insert Record
       ▼
┌─────────────────────────────────────┐
│   image_obj_storage_table           │
│   - image_uuid (PK)                 │
│   - image_obj (path)                │
│   - image_access_url                │
│   - metadata                        │
└──────┬──────────────────────────────┘
       │
       │ 6. Return UUID & URL
       ▼
┌─────────────────────────────────────┐
│   Response                          │
│   {                                 │
│     Image_UUID: string,             │
│     Image_AccessURL: string         │
│   }                                 │
└──────┬──────────────────────────────┘
       │
       │ 7. Update UI
       ▼
┌─────────────────────────────────────┐
│   PhotoBank.tsx                     │
│   - Update albumImages with UUIDs   │
│   - Show progress bars              │
│   - Enable Submit button            │
└─────────────────────────────────────┘
```

## Key Functions and Their Roles

### PhotoBank.tsx Functions

1. **handleAlbumImageSelect(files)**
   - Validates file count (max 20)
   - Validates file type and size
   - Creates preview URLs
   - Stores File objects in state

2. **handleAlbumUpload()**
   - Orchestrates upload process
   - Calls uploadImageDirect() for each image
   - Tracks progress per image
   - Updates UI with status indicators
   - Handles errors gracefully

3. **handleSubmit(e)**
   - Main project form submission
   - Uploads thumbnail and images
   - Collects UUIDs
   - Prepares project data
   - Calls API to save project

### imageUploadService.ts Functions

1. **uploadImageDirect(options)**
   - Validates file (size, type)
   - Authenticates user
   - Generates storage path
   - Uploads to Supabase Storage
   - Creates record in image_obj_storage_table
   - Returns { Image_UUID, Image_AccessURL }

2. **uploadImageViaEdgeFunction(options)**
   - Converts file to base64
   - Calls Edge Function
   - Falls back to uploadImageDirect() if Edge Function unavailable
   - Returns { Image_UUID, Image_AccessURL }

## Error Handling

### Upload Failures
- Individual image failures don't stop other uploads
- Failed uploads marked with red X indicator
- Toast notification shows success/failure counts
- User can retry failed uploads

### Validation Errors
- File size > 10MB → Error toast
- File type not image/* → Error toast
- More than 20 images → Error toast
- Not authenticated → Error toast

### Network Errors
- Edge Function unavailable → Falls back to direct upload
- Storage error → Error toast, upload marked as failed
- Database error → Error toast, upload marked as failed

## Progress Tracking

### Per-Image Progress
- State: `uploadProgress[imageId]` (0-100)
- State: `uploadStatus[imageId]` ('pending' | 'uploading' | 'success' | 'error')
- UI: Progress bar overlay on image preview
- UI: Status indicators (checkmark/X)

### Thumbnail Progress
- State: `thumbnailUploadProgress` (0-100)
- State: `thumbnailUploadStatus` ('pending' | 'uploading' | 'success' | 'error')
- UI: Progress bar overlay on thumbnail preview

## Concurrent Uploads

- All images upload simultaneously using `Promise.allSettled()`
- Each upload is independent
- Progress tracked per image
- Success/failure handled individually
- UI updates in real-time

## Return Values

Every upload function returns:
```typescript
{
  Image_UUID: string,        // UUID from image_obj_storage_table
  Image_AccessURL: string   // Public URL for the image
}
```

These values are:
1. Stored in component state
2. Used to create relationships in other tables (photobank_projects, photobank_albums)
3. Used to display images in the UI

## Next Steps (TODOs)

1. **Complete Project Creation**
   - Implement `createPhotoBankProject()` API call in `handleSubmit()`
   - Link thumbnail UUID to project
   - Link image UUIDs to project/albums

2. **Complete Album Submission**
   - Implement `createPhotoBankAlbum()` API call in `handleAlbumSubmit()`
   - Link thumbnail UUID to album
   - Link image UUIDs to album

3. **Add Retry Logic**
   - Allow users to retry failed uploads
   - Implement exponential backoff

4. **Add Image Deletion**
   - Allow users to delete uploaded images
   - Clean up storage and database records

5. **Add Image Replacement**
   - Allow users to replace images
   - Update existing records or create new ones

## Testing Checklist

- [ ] Single image upload
- [ ] Multiple image upload (concurrent)
- [ ] Thumbnail upload
- [ ] Upload progress tracking
- [ ] Error handling (large file, wrong type)
- [ ] Network failure recovery
- [ ] Edge Function fallback
- [ ] Database record creation
- [ ] UUID and URL return values
- [ ] UI state updates


# Project & Album Storage Implementation Summary

## Overview
This document describes the implementation of the new `project_details_table` and `albums_storage_table` integration in the PhotoBank module.

## Database Tables

### 1. `project_details_table`
- **Primary Key**: `project_main_event_id` (UUID)
- **Purpose**: Stores project information
- **Key Fields**:
  - `project_title` - Project title
  - `project_thumbnail_image_link` - Image_AccessURL from image_obj_storage_table
  - `main_event_name` - Main event name
  - `main_event_desc` - Main event description
  - `short_description` - Short description
  - `sub_event_name` - Sub event name
  - `custom_sub_event_name` - Custom sub event name (if "Other")
  - `project_last_modified` - Timestamp (auto-updated)
  - `project_last_modified_by` - Person name
  - `user_id` - Foreign key to auth.users

### 2. `albums_storage_table`
- **Primary Key**: `album_id` (UUID)
- **Purpose**: Stores album photos in JSON format
- **Key Fields**:
  - `project_main_event_id` - Foreign key to project_details_table
  - `album_photos_kv_json` - JSONB containing:
    ```json
    {
      "album_thumbnail_url": "https://...",
      "thumbnail_image_uuid": "uuid-here",
      "images": [
        {
          "image_uuid": "uuid-1",
          "image_access_url": "https://..."
        }
      ]
    }
    ```
  - `album_last_modified` - Timestamp (auto-updated)
  - `album_last_modified_by` - Person name

## Implementation Details

### API Functions Added (`src/hooks/photobank/api/photobankApi.ts`)

1. **`createProjectDetails(userId, projectData)`**
   - Creates a new project in `project_details_table`
   - Returns: `{ project_main_event_id, main_event_name }`
   - Used when user clicks "Create Project" or "Save"

2. **`updateProjectDetails(projectMainEventId, projectData)`**
   - Updates an existing project
   - Returns: `{ project_main_event_id, main_event_name }`

3. **`saveAlbumStorage(projectMainEventId, albumData, albumId?)`**
   - Creates or updates an album in `albums_storage_table`
   - Returns: `{ album_id }`
   - Used when user clicks "Submit" or "Save" on an album

4. **`fetchAlbumsStorage(projectMainEventId)`**
   - Fetches all albums for a project
   - Returns array of album records

### PhotoBank.tsx Changes

1. **State Management**
   - Added `projectMainEventId` state to track the current project ID
   - Added `useAuth` hook to get current user

2. **`handleSubmit()` - Main Project Form**
   - Uploads thumbnail and images to `image_obj_storage_table`
   - Gets `{ Image_UUID, Image_AccessURL }` for each image
   - Creates project in `project_details_table` using `createProjectDetails()`
   - Stores `project_main_event_id` in state for album creation
   - Shows success toast with project ID

3. **`handleAlbumUpload()` - Album Modal Upload**
   - Uploads album thumbnail and images concurrently
   - Updates `albumImages` state with `imageUuid` and `url` for each image
   - Tracks upload progress per image
   - Shows progress bars and status indicators

4. **`handleAlbumSubmit()` - Album Modal Submit**
   - Validates that project exists (`projectMainEventId` is set)
   - Prepares `album_photos_kv_json` with:
     - `album_thumbnail_url` - Thumbnail Image_AccessURL
     - `thumbnail_image_uuid` - Thumbnail Image_UUID
     - `images` - Array of `{ image_uuid, image_access_url }`
   - Saves album to `albums_storage_table` using `saveAlbumStorage()`
   - Shows success toast with album ID

5. **`handleAlbumSave()` - Album Card Save**
   - Similar to `handleAlbumSubmit()` but for saving albums from the album cards
   - Uses existing album data from state
   - Saves to `albums_storage_table`

## Data Flow

### Project Creation Flow
```
1. User fills form → Enters project details
2. User uploads thumbnail (optional) → Returns { Image_UUID, Image_AccessURL }
3. User uploads images (optional) → Returns [{ Image_UUID, Image_AccessURL }]
4. User clicks "Create Project" → handleSubmit()
5. createProjectDetails() called → Creates record in project_details_table
6. Returns { project_main_event_id, main_event_name }
7. projectMainEventId stored in state
8. Success toast shown
```

### Album Creation Flow
```
1. User clicks "Create Album" → Modal opens
2. User selects images → Stored in albumImages state (preview only)
3. User selects thumbnail → Stored in albumThumbnailFile state (preview only)
4. User clicks "Upload" → handleAlbumUpload()
   a. Uploads thumbnail → Returns { Image_UUID, Image_AccessURL }
   b. Uploads images concurrently → Returns [{ Image_UUID, Image_AccessURL }]
   c. Updates albumImages with UUIDs and URLs
   d. Shows progress bars
5. User clicks "Submit" → handleAlbumSubmit()
   a. Validates projectMainEventId exists
   b. Prepares album_photos_kv_json
   c. saveAlbumStorage() called → Creates record in albums_storage_table
   d. Returns { album_id }
   e. Success toast shown
   f. Modal closes
```

## JSON Structure Examples

### album_photos_kv_json Structure
```json
{
  "album_thumbnail_url": "https://mogywlineksvyssnocwz.supabase.co/storage/v1/object/public/images/...",
  "thumbnail_image_uuid": "123e4567-e89b-12d3-a456-426614174000",
  "images": [
    {
      "image_uuid": "223e4567-e89b-12d3-a456-426614174001",
      "image_access_url": "https://mogywlineksvyssnocwz.supabase.co/storage/v1/object/public/images/..."
    },
    {
      "image_uuid": "323e4567-e89b-12d3-a456-426614174002",
      "image_access_url": "https://mogywlineksvyssnocwz.supabase.co/storage/v1/object/public/images/..."
    }
  ]
}
```

## Key Points

1. **All images go to `image_obj_storage_table`**
   - Thumbnails and regular images both use the unified storage
   - Every upload returns `{ Image_UUID, Image_AccessURL }`

2. **Project must be created first**
   - Albums require `project_main_event_id` to be created
   - `projectMainEventId` is stored in component state after project creation

3. **Album JSON Structure**
   - Thumbnail URL stored in `album_thumbnail_url`
   - Thumbnail UUID stored in `thumbnail_image_uuid`
   - Images array contains `{ image_uuid, image_access_url }` objects

4. **User Tracking**
   - `project_last_modified_by` and `album_last_modified_by` store user name/email
   - Automatically populated from auth user metadata

5. **Timestamps**
   - `project_last_modified` and `album_last_modified` auto-updated via triggers
   - `created_at` and `updated_at` also tracked

## Error Handling

- Authentication checks before all operations
- Project existence validation before album creation
- Upload validation (file size, type, count)
- Graceful error handling with user-friendly toast messages
- Partial upload success handling (some images may fail)

## Testing Checklist

- [x] Project creation with thumbnail
- [x] Project creation without thumbnail
- [x] Project creation with images
- [x] Album creation with thumbnail and images
- [x] Album creation without thumbnail
- [x] Album save from album card
- [x] Error handling for missing project
- [x] Error handling for authentication
- [x] Upload progress tracking
- [x] JSON structure validation

## Next Steps (Future Enhancements)

1. **Album Update Functionality**
   - Allow updating existing albums
   - Track `album_id` in Album interface
   - Use `saveAlbumStorage()` with `albumId` parameter

2. **Project Update Functionality**
   - Allow updating existing projects
   - Use `updateProjectDetails()` function

3. **Album Fetching**
   - Load existing albums when project is loaded
   - Use `fetchAlbumsStorage()` function

4. **Image Deletion**
   - Allow removing images from albums
   - Update `album_photos_kv_json` accordingly

5. **Project Loading**
   - Load existing projects on page load
   - Pre-populate form fields
   - Restore `projectMainEventId` from loaded project


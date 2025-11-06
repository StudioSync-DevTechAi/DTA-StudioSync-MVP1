# Project_ImageObjects_JSON Implementation

## Overview
This document describes the implementation of the `Project_ImageObjects_JSON` column in `project_details_table`, which stores a comprehensive JSON object containing project images, albums, input fields, and state statuses.

## Database Schema

### Migration: `supabase/migrations/20250115000010_add_project_imageobjects_json.sql`

Adds `project_imageobjects_json JSONB` column to `project_details_table`:
- Type: JSONB (PostgreSQL JSON Binary format for efficient storage and querying)
- Default: `'{}'::jsonb` (empty JSON object)
- Index: GIN index for efficient JSON queries
- Validation: Optional validation function available

## JSON Structure

```json
{
  "Project_ID": "uuid-string",
  "thumbnail_link": "https://...",
  "Album_ID_1": {
    "thumbnail": "https://...",
    "Album_Images": [
      {
        "ImageId": "uuid-string",
        "Image_URL": "https://..."
      }
    ]
  },
  "Album_ID_2": {
    "thumbnail": "https://...",
    "Album_Images": [
      {
        "ImageId": "uuid-string",
        "Image_URL": "https://..."
      }
    ]
  },
  "project_title": "Project Title",
  "main_event_name": "Main Event Name",
  "main_event_desc": "Main Event Description",
  "short_description": "Short Description",
  "sub_event_name": "Sub Event Name",
  "custom_sub_event_name": "Custom Sub Event Name (optional)",
  "state_statuses": {
    "has_thumbnail": true,
    "has_images": true,
    "albums_count": 2,
    "is_other_sub_event": false,
    "linked_albums_count": 0
  }
}
```

## TypeScript Types

### File: `src/types/projectImageObjects.ts`

- `AlbumImage` - Individual image structure
- `AlbumData` - Album structure (thumbnail + images array)
- `ProjectStateStatuses` - State tracking object
- `ProjectImageObjectsJSON` - Complete JSON structure
- `ProjectImageObjectsData` - Helper type for construction

## Helper Functions

### File: `src/utils/projectImageObjectsBuilder.ts`

#### `buildProjectImageObjectsJSON(params)`
Constructs the complete JSON object from project data.

**Parameters:**
- `projectId`: Project main event ID
- `thumbnailLink`: Project thumbnail URL
- `albums`: Array of albums with images
- `inputFields`: Form input values
- `stateStatuses`: State tracking object

**Returns:** Complete `ProjectImageObjectsJSON` object

#### `validateProjectImageObjectsJSON(json)`
Validates the JSON structure (basic validation).

## API Integration

### File: `src/hooks/photobank/api/photobankApi.ts`

#### `createProjectDetails()`
Updated to accept `project_imageobjects_json` parameter (optional).

## Usage Flow

1. **User fills form** → Enters project details, uploads images, creates albums
2. **User clicks "Create Project"** → `handleSubmit()` is called
3. **Upload images** → Thumbnail and main project images are uploaded
4. **Process albums** → Albums with uploaded images are collected
5. **Create project** → Project is created in `project_details_table`
6. **Build JSON** → `buildProjectImageObjectsJSON()` constructs the JSON
7. **Update project** → Project is updated with the complete JSON

## Key Features

- **Dynamic Album Keys**: Each album is stored with its `Album_ID` as the key
- **Image References**: Images reference `Image_UUID` and `Image_AccessURL` from `image_obj_storage_table`
- **State Tracking**: `state_statuses` tracks project state (has thumbnail, has images, etc.)
- **Input Fields**: All form inputs are stored in the JSON for easy access
- **Linked Albums**: Linked albums can be included (when project is updated after linking)

## Notes

- Albums must have at least one uploaded image to be included in the JSON
- Album IDs can be database IDs (if saved) or temporary IDs (if not saved yet)
- The JSON is updated after project creation to include the actual `Project_ID`
- Linked albums are fetched and included when updating an existing project

## SQL Query to Execute

Execute this migration in Supabase SQL Editor:

```sql
-- File: supabase/migrations/20250115000010_add_project_imageobjects_json.sql
```

This will:
1. Add the `project_imageobjects_json` column
2. Create a GIN index for efficient queries
3. Add validation function (optional)


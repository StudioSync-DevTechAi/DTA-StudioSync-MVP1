# Link Album Feature Implementation

## Overview
This document describes the implementation of the "Link an Album" feature, which allows users to link existing albums to projects.

## Database Changes

### 1. Add `album_ids` Array to `project_details_table`
**Migration:** `supabase/migrations/20250115000008_add_album_ids_to_project_details.sql`

- Adds `album_ids UUID[]` column to store array of linked album IDs
- Creates GIN index for efficient array queries
- Adds helper functions:
  - `add_album_to_project()` - Adds album_id to project's album_ids array
  - `remove_album_from_project()` - Removes album_id from project's album_ids array

### 2. Add `album_name` Column to `albums_storage_table`
**Migration:** `supabase/migrations/20250115000009_add_album_name_to_albums_storage.sql`

- Adds `album_name TEXT` column for display purposes
- Creates index for faster lookups
- Updates existing albums with default names

## API Functions

### `fetchAlbumsForLinking(userId: string): Promise<AlbumLinkInfo[]>`
Fetches all albums available for linking, including:
- Album ID
- Album Name
- Project Main Event Name
- Sub-Event Name
- Album Thumbnail URL

**Returns:** Array of `AlbumLinkInfo` objects with project information

### `linkAlbumToProject(projectMainEventId: string, albumId: string): Promise<void>`
Links an album to a project by adding the album_id to the project's `album_ids` array.

### `unlinkAlbumFromProject(projectMainEventId: string, albumId: string): Promise<void>`
Unlinks an album from a project by removing the album_id from the project's `album_ids` array.

### `fetchLinkedAlbums(projectMainEventId: string): Promise<AlbumLinkInfo[]>`
Fetches all albums currently linked to a project.

## UI Components

### Link Album Modal
Located in `src/pages/PhotoBank.tsx`

**Features:**
- Displays all available albums in a grid layout
- Shows album thumbnail, name, project name, and sub-event name
- Indicates which albums are already linked (green border + checkmark)
- Click to link functionality
- Loading state while fetching albums
- Empty state when no albums available

**Access:**
- Click "link an album" button in the main form or album sections
- Requires authentication and existing project

## Usage Flow

1. **User creates/saves a project** → Gets `project_main_event_id`
2. **User clicks "link an album"** → Modal opens
3. **System fetches available albums** → Shows albums with project info
4. **User selects an album** → Album is linked to project
5. **System updates `project_details_table`** → Adds album_id to `album_ids` array

## Data Structure

### AlbumLinkInfo Interface
```typescript
interface AlbumLinkInfo {
  album_id: string;
  album_name: string;
  project_main_event_id: string;
  project_main_event_name: string;
  sub_event_name: string;
  album_thumbnail_url?: string;
}
```

## SQL Queries to Execute

Execute these migrations in order:

1. `supabase/migrations/20250115000008_add_album_ids_to_project_details.sql`
2. `supabase/migrations/20250115000009_add_album_name_to_albums_storage.sql`

## Notes

- Albums can only be linked after a project is created/saved
- Only albums from the user's own projects are shown
- Already linked albums are visually indicated and cannot be linked again
- The `album_name` column is optional but recommended for better UX
- If `album_name` is not provided, a default name is generated from the album_id



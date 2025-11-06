# PhotoBank Module

This module provides data management functionality for the PhotoBank feature, including projects, albums, and image uploads.

## Structure

```
src/hooks/photobank/
├── api/
│   └── photobankApi.ts      # Supabase API functions
├── usePhotoBankData.ts       # React Query hooks
└── README.md                 # This file
```

## Types

All PhotoBank types are defined in `src/types/photobank.ts`:

- `PhotoBankProject` - Main project entity
- `PhotoBankProjectThumbnailImage` - Project thumbnail image
- `PhotoBankAlbum` - Album within a project
- `PhotoBankAlbumThumbnailImage` - Album thumbnail image
- `PhotoBankAlbumImage` - Individual images in an album
- `PhotoBankProjectFormData` - Form data for creating/updating projects
- `PhotoBankAlbumFormData` - Form data for creating/updating albums
- `ImageUploadProgress` - Upload progress tracking
- `BulkUploadResult` - Result of bulk image uploads

## API Functions

### Projects

- `fetchPhotoBankProjects(userId)` - Fetch all projects for a user
- `fetchPhotoBankProject(projectId)` - Fetch a single project
- `createPhotoBankProject(userId, projectData)` - Create a new project
- `updatePhotoBankProject(projectId, projectData)` - Update a project
- `deletePhotoBankProject(projectId)` - Delete a project
- `uploadProjectThumbnail(projectId, file)` - Upload project thumbnail
- `deleteProjectThumbnail(thumbnailId)` - Delete project thumbnail

### Albums

- `fetchPhotoBankAlbums(projectId)` - Fetch all albums for a project
- `createPhotoBankAlbum(albumData)` - Create a new album
- `updatePhotoBankAlbum(albumId, albumData)` - Update an album
- `deletePhotoBankAlbum(albumId)` - Delete an album
- `uploadAlbumThumbnail(albumId, file)` - Upload album thumbnail
- `deleteAlbumThumbnail(thumbnailId)` - Delete album thumbnail

### Images

- `uploadAlbumImages(albumId, files, onProgress)` - Upload multiple images concurrently with progress tracking
- `deleteAlbumImage(imageId)` - Delete an album image
- `getPublicUrl(storagePath)` - Get public URL for a storage path

## React Query Hooks

### `usePhotoBankProjects()`

Hook for managing PhotoBank projects.

```typescript
const {
  projects,           // Array of projects
  isLoading,          // Loading state
  error,              // Error state
  refetch,            // Refetch function
  createProject,      // Create mutation
  updateProject,      // Update mutation
  deleteProject,      // Delete mutation
  isCreating,         // Creating state
  isUpdating,         // Updating state
  isDeleting,         // Deleting state
} = usePhotoBankProjects();
```

### `usePhotoBankProject(projectId)`

Hook for fetching a single project.

```typescript
const {
  project,            // Project data
  isLoading,         // Loading state
  error,             // Error state
  refetch,           // Refetch function
} = usePhotoBankProject(projectId);
```

### `usePhotoBankAlbums(projectId)`

Hook for managing PhotoBank albums.

```typescript
const {
  albums,             // Array of albums
  isLoading,          // Loading state
  error,              // Error state
  refetch,            // Refetch function
  createAlbum,        // Create mutation
  updateAlbum,        // Update mutation
  deleteAlbum,        // Delete mutation
  isCreating,         // Creating state
  isUpdating,         // Updating state
  isDeleting,         // Deleting state
} = usePhotoBankAlbums(projectId);
```

### `useUploadAlbumImages()`

Hook for uploading images with progress tracking.

```typescript
const {
  uploadImages,       // Upload mutation function
  deleteImage,       // Delete mutation function
  uploadProgress,     // Progress state { [imageId]: ImageUploadProgress }
  isUploading,        // Uploading state
  isDeleting,         // Deleting state
  uploadResult,        // Upload result (BulkUploadResult)
} = useUploadAlbumImages();

// Usage
uploadImages({
  albumId: 'album-id',
  files: [file1, file2, file3],
  onProgress: (progress) => {
    console.log(`${progress.fileName}: ${progress.progress}%`);
  }
});
```

### `usePhotoBankData(projectId?)`

Combined hook providing all PhotoBank operations.

```typescript
const {
  projects,           // Projects hook
  project,            // Single project hook
  albums,             // Albums hook
  imageUploads,       // Image uploads hook
} = usePhotoBankData(projectId);
```

## Usage Examples

### Creating a Project with Thumbnail

```typescript
import { usePhotoBankProjects } from '@/hooks/photobank/usePhotoBankData';

function CreateProjectForm() {
  const { createProject, isCreating } = usePhotoBankProjects();

  const handleSubmit = async (formData: PhotoBankProjectFormData) => {
    createProject({
      title: formData.title,
      main_event_name: formData.main_event_name,
      main_event_description: formData.main_event_description,
      short_description: formData.short_description,
      sub_event_name: formData.sub_event_name,
      custom_sub_event_name: formData.custom_sub_event_name,
      thumbnail_file: formData.thumbnail_file,
    });
  };

  return (
    // Form JSX
  );
}
```

### Uploading Images with Progress

```typescript
import { useUploadAlbumImages } from '@/hooks/photobank/usePhotoBankData';

function ImageUploader({ albumId }: { albumId: string }) {
  const { uploadImages, uploadProgress, isUploading } = useUploadAlbumImages();

  const handleUpload = (files: File[]) => {
    uploadImages({
      albumId,
      files,
      onProgress: (progress) => {
        console.log(`${progress.fileName}: ${progress.progress}% - ${progress.status}`);
      }
    });
  };

  return (
    <div>
      {Object.values(uploadProgress).map((progress) => (
        <div key={progress.imageId}>
          <p>{progress.fileName}</p>
          <progress value={progress.progress} max={100} />
          <span>{progress.status}</span>
        </div>
      ))}
    </div>
  );
}
```

## Storage Bucket

The PhotoBank module uses a Supabase Storage bucket named `photobank`. Make sure this bucket exists and is configured:

1. Create the bucket in Supabase Dashboard
2. Set it as public if you want public URLs
3. Configure RLS policies if needed

## Database Schema

The PhotoBank tables are created via migration: `supabase/migrations/20250115000000_create_photobank_tables.sql`

Tables:
- `photobank_projects` - Main projects
- `photobank_project_thumbnail_images` - Project thumbnails
- `photobank_albums` - Albums within projects
- `photobank_album_thumbnail_images` - Album thumbnails
- `photobank_album_images` - Images in albums

All tables have Row Level Security (RLS) enabled with policies ensuring users can only access their own data.

## Concurrent Uploads

The `uploadAlbumImages` function supports concurrent uploads using `Promise.allSettled()`. This allows multiple images to be uploaded simultaneously, improving performance. Progress is tracked individually for each image.

## Error Handling

All API functions throw errors that can be caught and handled. The React Query hooks automatically handle errors and display toast notifications. You can also access error states from the hooks.

## Notes

- Maximum file size: 10MB per image
- Storage bucket: `photobank`
- Images are stored in organized paths: `projects/{projectId}/thumbnails/` and `albums/{albumId}/images/`
- Thumbnail images have a UNIQUE constraint (one per project/album)
- Display order is maintained for album images


/**
 * PhotoBank Project Thumbnail Image
 * Represents the thumbnail image for a PhotoBank project
 */
export interface PhotoBankProjectThumbnailImage {
  id: string;
  project_id: string;
  storage_path: string; // Supabase storage path
  public_url: string; // Public URL for the thumbnail
  file_name: string;
  file_size: number; // in bytes
  mime_type: string; // e.g., 'image/jpeg', 'image/png'
  width?: number; // Image dimensions
  height?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * PhotoBank Project
 * Main project entity containing project metadata and thumbnail
 */
export interface PhotoBankProject {
  id: string;
  user_id: string;
  title: string; // "Click and Edit Project Title"
  main_event_name: string;
  main_event_description: string;
  short_description: string;
  sub_event_name: string; // Selected from dropdown or custom
  custom_sub_event_name?: string; // If "Other Sub-Event" is selected
  thumbnail_image?: PhotoBankProjectThumbnailImage | null; // Relationship to thumbnail
  thumbnail_image_id?: string | null; // Foreign key reference
  created_at?: string;
  updated_at?: string;
}

/**
 * PhotoBank Album Image
 * Individual image within an album
 */
export interface PhotoBankAlbumImage {
  id: string;
  album_id: string;
  storage_path: string;
  public_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  display_order: number; // For ordering images in album
  created_at?: string;
  updated_at?: string;
}

/**
 * PhotoBank Album Thumbnail Image
 * Thumbnail image for an album
 */
export interface PhotoBankAlbumThumbnailImage {
  id: string;
  album_id: string;
  storage_path: string;
  public_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * PhotoBank Album
 * Album within a project, can have multiple images and a thumbnail
 */
export interface PhotoBankAlbum {
  id: string;
  project_id: string;
  name: string; // "Click and Edit Project Title"
  main_event_name: string;
  main_event_description: string;
  short_description: string;
  sub_event_name: string;
  custom_sub_event_name?: string;
  thumbnail_image?: PhotoBankAlbumThumbnailImage | null;
  thumbnail_image_id?: string | null;
  images: PhotoBankAlbumImage[]; // Array of images in the album
  is_new_project_album: boolean; // Track if created via "New Project Album"
  created_at?: string;
  updated_at?: string;
}

/**
 * Form Data Interfaces for Create/Update Operations
 */

/**
 * PhotoBank Project Form Data
 * Used when creating or updating a project
 */
export interface PhotoBankProjectFormData {
  title: string;
  main_event_name: string;
  main_event_description: string;
  short_description: string;
  sub_event_name: string;
  custom_sub_event_name?: string;
  thumbnail_file?: File; // For upload operations
}

/**
 * PhotoBank Album Form Data
 * Used when creating or updating an album
 */
export interface PhotoBankAlbumFormData {
  project_id: string;
  name: string;
  main_event_name: string;
  main_event_description: string;
  short_description: string;
  sub_event_name: string;
  custom_sub_event_name?: string;
  thumbnail_file?: File;
  image_files?: File[]; // For bulk upload
}

/**
 * Image Upload Progress
 * Tracks upload progress for individual images
 */
export interface ImageUploadProgress {
  imageId: string;
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  storage_path?: string;
  public_url?: string;
}

/**
 * Bulk Upload Result
 * Result of uploading multiple images
 */
export interface BulkUploadResult {
  successful: Array<{
    imageId: string;
    fileName: string;
    storage_path: string;
    public_url: string;
  }>;
  failed: Array<{
    fileName: string;
    error: string;
  }>;
  total: number;
  successCount: number;
  failureCount: number;
}

/**
 * Upload Progress Callback
 * Callback function to track upload progress
 */
export type UploadProgressCallback = (progress: ImageUploadProgress) => void;


/**
 * Preview Service Types
 * Types for album preview functionality
 */

export interface AlbumPreviewImage {
  image_uuid: string;
  image_access_url: string;
  file_name?: string;
}

export interface AlbumPreviewData {
  album_id: string;
  album_name: string;
  thumbnail_url?: string;
  images: AlbumPreviewImage[];
  image_count: number;
  is_linked: boolean;
  sub_event_name?: string;
}

export interface PreviewLoadOptions {
  maxImages?: number; // Maximum number of images to load for preview
  includeThumbnail?: boolean; // Whether to include thumbnail in preview
}

export interface PreviewLoadResult {
  success: boolean;
  data?: AlbumPreviewData;
  error?: string;
  loadingTime?: number; // Time taken to load in milliseconds
}

export interface ProjectPreviewData {
  project_id: string;
  project_title: string;
  main_event_name: string;
  thumbnail_url?: string;
  albums: AlbumPreviewData[];
  album_count: number;
  total_images: number;
  sub_event_name?: string;
}

export interface ProjectPreviewLoadResult {
  success: boolean;
  data?: ProjectPreviewData;
  error?: string;
  loadingTime?: number;
}


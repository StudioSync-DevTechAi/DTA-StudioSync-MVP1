/**
 * Preview Service
 * Handles loading and caching of album preview data
 */

import { fetchAlbumById, fetchProjectDetails, fetchAlbumsStorage, fetchLinkedAlbums } from '@/hooks/photobank/api/photobankApi';
import type { AlbumPreviewData, AlbumPreviewImage, PreviewLoadOptions, PreviewLoadResult, ProjectPreviewData, ProjectPreviewLoadResult } from './types';

// In-memory cache for preview data
const previewCache = new Map<string, {
  data: AlbumPreviewData;
  timestamp: number;
  expiresIn: number; // Cache expiration time in milliseconds
}>();

// Default cache expiration: 5 minutes
const DEFAULT_CACHE_EXPIRY = 5 * 60 * 1000;

// Default preview options
const DEFAULT_OPTIONS: PreviewLoadOptions = {
  maxImages: 4,
  includeThumbnail: true,
};

/**
 * Check if cached data is still valid
 */
function isCacheValid(albumId: string): boolean {
  const cached = previewCache.get(albumId);
  if (!cached) return false;
  
  const now = Date.now();
  return (now - cached.timestamp) < cached.expiresIn;
}

/**
 * Load album preview data
 */
export async function loadAlbumPreview(
  albumId: string,
  albumName: string,
  options: PreviewLoadOptions = {}
): Promise<PreviewLoadResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // Check cache first
    if (isCacheValid(albumId)) {
      const cached = previewCache.get(albumId)!;
      return {
        success: true,
        data: cached.data,
        loadingTime: Date.now() - startTime,
      };
    }

    // Fetch album data from database
    const albumData = await fetchAlbumById(albumId);
    
    if (!albumData) {
      return {
        success: false,
        error: 'Album not found',
        loadingTime: Date.now() - startTime,
      };
    }

    // Extract images
    const allImages: AlbumPreviewImage[] = albumData.album_photos_kv_json?.images || [];
    const previewImages = allImages.slice(0, opts.maxImages || 4);

    // Build preview data
    const previewData: AlbumPreviewData = {
      album_id: albumId,
      album_name: albumName || albumData.album_name || 'Untitled Album',
      thumbnail_url: albumData.album_photos_kv_json?.album_thumbnail_url,
      images: previewImages,
      image_count: allImages.length,
      is_linked: false, // This would need to be determined from context
      sub_event_name: albumData.sub_event_name,
    };

    // Cache the data
    previewCache.set(albumId, {
      data: previewData,
      timestamp: Date.now(),
      expiresIn: DEFAULT_CACHE_EXPIRY,
    });

    return {
      success: true,
      data: previewData,
      loadingTime: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error('Error loading album preview:', error);
    return {
      success: false,
      error: error.message || 'Failed to load album preview',
      loadingTime: Date.now() - startTime,
    };
  }
}

/**
 * Load preview for local album (not yet saved to database)
 */
export function loadLocalAlbumPreview(
  albumId: string,
  albumName: string,
  images: Array<{ imageUuid?: string; url?: string }>,
  thumbnailUrl?: string
): AlbumPreviewData {
  const previewImages: AlbumPreviewImage[] = images
    .filter(img => img.imageUuid && img.url)
    .slice(0, 4)
    .map(img => ({
      image_uuid: img.imageUuid!,
      image_access_url: img.url!,
    }));

  return {
    album_id: albumId,
    album_name: albumName || 'Untitled Album',
    thumbnail_url: thumbnailUrl,
    images: previewImages,
    image_count: images.length,
    is_linked: false,
  };
}

/**
 * Clear preview cache for a specific album
 */
export function clearPreviewCache(albumId: string): void {
  previewCache.delete(albumId);
}

/**
 * Clear all preview cache
 */
export function clearAllPreviewCache(): void {
  previewCache.clear();
}

/**
 * Get cached preview data without loading
 */
export function getCachedPreview(albumId: string): AlbumPreviewData | null {
  if (isCacheValid(albumId)) {
    return previewCache.get(albumId)!.data;
  }
  return null;
}

// In-memory cache for project previews
const projectPreviewCache = new Map<string, {
  data: ProjectPreviewData;
  timestamp: number;
  expiresIn: number;
}>();

/**
 * Check if cached project preview data is still valid
 */
function isProjectCacheValid(projectId: string): boolean {
  const cached = projectPreviewCache.get(projectId);
  if (!cached) return false;
  
  const now = Date.now();
  return (now - cached.timestamp) < cached.expiresIn;
}

/**
 * Load project preview data
 */
export async function loadProjectPreview(
  projectId: string,
  options: PreviewLoadOptions = {}
): Promise<ProjectPreviewLoadResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // Check cache first
    if (isProjectCacheValid(projectId)) {
      const cached = projectPreviewCache.get(projectId)!;
      return {
        success: true,
        data: cached.data,
        loadingTime: Date.now() - startTime,
      };
    }

    // Fetch project data
    const projectData = await fetchProjectDetails(projectId);
    
    if (!projectData) {
      return {
        success: false,
        error: 'Project not found',
        loadingTime: Date.now() - startTime,
      };
    }

    // Fetch albums for this project
    const savedAlbums = await fetchAlbumsStorage(projectId);
    const linkedAlbums = await fetchLinkedAlbums(projectId);

    // Build album previews
    const albumPreviews: AlbumPreviewData[] = [];
    let totalImages = 0;

    // Process saved albums
    for (const album of savedAlbums) {
      const images = album.album_photos_kv_json?.images || [];
      totalImages += images.length;
      
      albumPreviews.push({
        album_id: album.album_id,
        album_name: album.album_name || 'Untitled Album',
        thumbnail_url: album.album_photos_kv_json?.album_thumbnail_url,
        images: images.slice(0, opts.maxImages || 4).map((img: any) => ({
          image_uuid: img.image_uuid,
          image_access_url: img.image_access_url,
        })),
        image_count: images.length,
        is_linked: false,
        sub_event_name: album.sub_event_name,
      });
    }

    // Process linked albums
    for (const album of linkedAlbums) {
      albumPreviews.push({
        album_id: album.album_id,
        album_name: album.album_name || 'Untitled Album',
        thumbnail_url: album.album_thumbnail_url,
        images: [], // Linked albums may not have images loaded
        image_count: 0,
        is_linked: true,
        sub_event_name: album.sub_event_name,
      });
    }

    // Build project preview data
    const previewData: ProjectPreviewData = {
      project_id: projectId,
      project_title: projectData.project_title || 'Untitled Project',
      main_event_name: projectData.main_event_name || '',
      thumbnail_url: projectData.project_thumbnail_image_link,
      albums: albumPreviews.slice(0, 6), // Show max 6 albums in preview
      album_count: albumPreviews.length,
      total_images: totalImages,
      sub_event_name: projectData.sub_event_name,
    };

    // Cache the data
    projectPreviewCache.set(projectId, {
      data: previewData,
      timestamp: Date.now(),
      expiresIn: DEFAULT_CACHE_EXPIRY,
    });

    return {
      success: true,
      data: previewData,
      loadingTime: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error('Error loading project preview:', error);
    return {
      success: false,
      error: error.message || 'Failed to load project preview',
      loadingTime: Date.now() - startTime,
    };
  }
}


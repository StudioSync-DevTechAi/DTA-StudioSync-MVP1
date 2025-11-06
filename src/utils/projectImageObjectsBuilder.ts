/**
 * Helper functions to construct Project_ImageObjects_JSON
 */

import { ProjectImageObjectsJSON, AlbumData, AlbumImage } from '@/types/projectImageObjects';

/**
 * Construct Project_ImageObjects_JSON from project data
 * 
 * @param params - Parameters for constructing the JSON
 * @returns Complete Project_ImageObjects_JSON object
 */
export function buildProjectImageObjectsJSON(params: {
  projectId: string;
  thumbnailLink: string | null;
  albums: Array<{
    albumId: string; // Database album_id or temporary ID
    thumbnailUrl?: string | null;
    images: Array<{
      imageUuid?: string; // Image_UUID from image_obj_storage_table
      url?: string; // Image_AccessURL
    }>;
  }>;
  inputFields: {
    project_title: string;
    main_event_name: string;
    main_event_desc: string;
    short_description: string;
    sub_event_name: string;
    custom_sub_event_name?: string;
  };
  stateStatuses: {
    has_thumbnail: boolean;
    has_images: boolean;
    albums_count: number;
    is_other_sub_event: boolean;
    linked_albums_count?: number;
  };
}): ProjectImageObjectsJSON {
  const {
    projectId,
    thumbnailLink,
    albums,
    inputFields,
    stateStatuses,
  } = params;

  // Build albums object with Album_ID as keys
  const albumsObject: Record<string, AlbumData> = {};
  
  albums.forEach((album) => {
    // Only include albums that have at least one uploaded image
    const uploadedImages = album.images.filter(
      img => img.imageUuid && img.url
    );

    if (uploadedImages.length > 0 || album.thumbnailUrl) {
      const albumImages: AlbumImage[] = uploadedImages.map(img => ({
        ImageId: img.imageUuid!,
        Image_URL: img.url!,
      }));

      albumsObject[album.albumId] = {
        thumbnail: album.thumbnailUrl || null,
        Album_Images: albumImages,
      };
    }
  });

  // Construct the complete JSON object
  const jsonObject: ProjectImageObjectsJSON = {
    Project_ID: projectId,
    thumbnail_link: thumbnailLink,
    
    // Add all albums as dynamic keys
    ...albumsObject,
    
    // Add input fields
    project_title: inputFields.project_title,
    main_event_name: inputFields.main_event_name,
    main_event_desc: inputFields.main_event_desc,
    short_description: inputFields.short_description,
    sub_event_name: inputFields.sub_event_name,
    ...(inputFields.custom_sub_event_name && {
      custom_sub_event_name: inputFields.custom_sub_event_name,
    }),
    
    // Add state statuses
    state_statuses: stateStatuses,
  };

  return jsonObject;
}

/**
 * Validate Project_ImageObjects_JSON structure
 * 
 * @param json - JSON object to validate
 * @returns true if valid, false otherwise
 */
export function validateProjectImageObjectsJSON(json: any): boolean {
  if (!json || typeof json !== 'object') {
    return false;
  }

  // Check required fields
  if (!json.Project_ID || typeof json.Project_ID !== 'string') {
    return false;
  }

  if (!json.project_title || typeof json.project_title !== 'string') {
    return false;
  }

  if (!json.state_statuses || typeof json.state_statuses !== 'object') {
    return false;
  }

  return true;
}



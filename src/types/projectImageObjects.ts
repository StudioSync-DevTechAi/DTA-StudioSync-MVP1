/**
 * Type definitions for Project_ImageObjects_JSON structure
 * This JSON object is stored in project_details_table.project_imageobjects_json
 */

/**
 * Album Image structure
 */
export interface AlbumImage {
  ImageId: string; // Image_UUID from image_obj_storage_table
  Image_URL: string; // Image_AccessURL from image_obj_storage_table
}

/**
 * Album data structure (value for Album_ID key)
 */
export interface AlbumData {
  thumbnail: string | null; // Album thumbnail URL
  Album_Images: AlbumImage[]; // Array of album images
}

/**
 * State statuses for tracking project state
 */
export interface ProjectStateStatuses {
  has_thumbnail: boolean;
  has_images: boolean;
  albums_count: number;
  is_other_sub_event: boolean;
  linked_albums_count?: number; // Count of linked albums
}

/**
 * Complete Project_ImageObjects_JSON structure
 * 
 * Structure:
 * {
 *   Project_ID: string,
 *   thumbnail_link: string | null,
 *   [Album_ID]: AlbumData,  // Dynamic keys for each album
 *   project_title: string,
 *   main_event_name: string,
 *   main_event_desc: string,
 *   short_description: string,
 *   sub_event_name: string,
 *   custom_sub_event_name?: string,
 *   state_statuses: ProjectStateStatuses
 * }
 */
export interface ProjectImageObjectsJSON {
  Project_ID: string; // project_main_event_id
  thumbnail_link: string | null; // Project thumbnail URL
  
  // Dynamic album keys: Album_ID -> AlbumData
  // These are added dynamically, so we use an index signature
  [albumId: string]: 
    | string 
    | string | null 
    | AlbumData 
    | AlbumImage[] 
    | ProjectStateStatuses 
    | undefined;
  
  // Input fields
  project_title: string;
  main_event_name: string;
  main_event_desc: string;
  short_description: string;
  sub_event_name: string;
  custom_sub_event_name?: string;
  
  // State statuses
  state_statuses: ProjectStateStatuses;
}

/**
 * Helper type for constructing the JSON object
 * This separates albums from other fields for easier construction
 */
export interface ProjectImageObjectsData {
  projectId: string;
  thumbnailLink: string | null;
  albums: Record<string, AlbumData>; // Album_ID -> AlbumData
  inputFields: {
    project_title: string;
    main_event_name: string;
    main_event_desc: string;
    short_description: string;
    sub_event_name: string;
    custom_sub_event_name?: string;
  };
  stateStatuses: ProjectStateStatuses;
}



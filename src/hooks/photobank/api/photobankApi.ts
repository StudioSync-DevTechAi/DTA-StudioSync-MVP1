import { supabase } from "@/integrations/supabase/client";
import {
  PhotoBankProject,
  PhotoBankProjectFormData,
  PhotoBankProjectThumbnailImage,
  PhotoBankAlbum,
  PhotoBankAlbumFormData,
  PhotoBankAlbumImage,
  PhotoBankAlbumThumbnailImage,
  ImageUploadProgress,
  BulkUploadResult,
  UploadProgressCallback,
} from "@/types/photobank";
import { uploadImageDirect, ImageUploadResponse } from "@/services/imageUpload/imageUploadService";

const STORAGE_BUCKET = 'photobank'; // Supabase storage bucket name (legacy, now using 'images')
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Helper function to get image dimensions
 */
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
};

/**
 * Upload a single image using unified image storage service
 * This now uses the image_obj_storage_table for all image uploads
 */
const uploadImageToStorage = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<{ path: string; publicUrl: string; imageUuid: string }> => {
  // Use unified image upload service
  const result: ImageUploadResponse = await uploadImageDirect({
    file,
    onProgress,
  });

  // Get the storage path from the database record
  const { data: imageRecord } = await supabase
    .from('image_obj_storage_table')
    .select('image_obj')
    .eq('image_uuid', result.Image_UUID)
    .single();

  return {
    path: imageRecord?.image_obj || path, // Use path from DB or fallback to provided path
    publicUrl: result.Image_AccessURL,
    imageUuid: result.Image_UUID,
  };
};

/**
 * Fetch all PhotoBank projects for a user
 */
export const fetchPhotoBankProjects = async (userId: string): Promise<PhotoBankProject[]> => {
  try {
    const { data, error } = await supabase
      .from('photobank_projects')
      .select(`
        *,
        thumbnail_image:photobank_project_thumbnail_images(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching PhotoBank projects:", error);
      throw error;
    }

    return (data || []).map((project: any) => ({
      ...project,
      thumbnail_image: project.thumbnail_image?.[0] || null,
      thumbnail_image_id: project.thumbnail_image_id || null,
    })) as PhotoBankProject[];
  } catch (error) {
    console.error("Error fetching PhotoBank projects:", error);
    throw error;
  }
};

/**
 * Fetch a single PhotoBank project by ID
 */
export const fetchPhotoBankProject = async (projectId: string): Promise<PhotoBankProject | null> => {
  try {
    const { data, error } = await supabase
      .from('photobank_projects')
      .select(`
        *,
        thumbnail_image:photobank_project_thumbnail_images(*)
      `)
      .eq('id', projectId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching PhotoBank project:", error);
      throw error;
    }

    if (!data) return null;

    return {
      ...data,
      thumbnail_image: data.thumbnail_image?.[0] || null,
      thumbnail_image_id: data.thumbnail_image_id || null,
    } as PhotoBankProject;
  } catch (error) {
    console.error("Error fetching PhotoBank project:", error);
    throw error;
  }
};

/**
 * Create a new PhotoBank project
 */
export const createPhotoBankProject = async (
  userId: string,
  projectData: PhotoBankProjectFormData
): Promise<PhotoBankProject> => {
  try {
    // First, create the project record
    const projectRecord = {
      user_id: userId,
      title: projectData.title,
      main_event_name: projectData.main_event_name,
      main_event_description: projectData.main_event_description,
      short_description: projectData.short_description,
      sub_event_name: projectData.sub_event_name,
      custom_sub_event_name: projectData.custom_sub_event_name || null,
      thumbnail_image_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: project, error: projectError } = await supabase
      .from('photobank_projects')
      .insert([projectRecord])
      .select()
      .single();

    if (projectError) {
      throw projectError;
    }

    // Upload thumbnail if provided
    let thumbnailImageId: string | null = null;
    if (projectData.thumbnail_file) {
      const thumbnail = await uploadProjectThumbnail(
        project.id,
        projectData.thumbnail_file
      );
      thumbnailImageId = thumbnail.id;

      // Update project with thumbnail_image_id
      await supabase
        .from('photobank_projects')
        .update({ thumbnail_image_id: thumbnailImageId })
        .eq('id', project.id);
    }

    // Fetch the complete project with thumbnail
    const completeProject = await fetchPhotoBankProject(project.id);
    return completeProject!;
  } catch (error) {
    console.error("Error creating PhotoBank project:", error);
    throw error;
  }
};

/**
 * Update an existing PhotoBank project
 */
export const updatePhotoBankProject = async (
  projectId: string,
  projectData: PhotoBankProjectFormData
): Promise<PhotoBankProject> => {
  try {
    const updateData: any = {
      title: projectData.title,
      main_event_name: projectData.main_event_name,
      main_event_description: projectData.main_event_description,
      short_description: projectData.short_description,
      sub_event_name: projectData.sub_event_name,
      custom_sub_event_name: projectData.custom_sub_event_name || null,
      updated_at: new Date().toISOString(),
    };

    // Update project record
    const { error: updateError } = await supabase
      .from('photobank_projects')
      .update(updateData)
      .eq('id', projectId);

    if (updateError) {
      throw updateError;
    }

    // Upload new thumbnail if provided
    if (projectData.thumbnail_file) {
      // Delete old thumbnail if exists
      const existingProject = await fetchPhotoBankProject(projectId);
      if (existingProject?.thumbnail_image_id) {
        await deleteProjectThumbnail(existingProject.thumbnail_image_id);
      }

      // Upload new thumbnail
      const thumbnail = await uploadProjectThumbnail(projectId, projectData.thumbnail_file);
      
      // Update project with new thumbnail_image_id
      await supabase
        .from('photobank_projects')
        .update({ thumbnail_image_id: thumbnail.id })
        .eq('id', projectId);
    }

    // Fetch updated project
    const updatedProject = await fetchPhotoBankProject(projectId);
    return updatedProject!;
  } catch (error) {
    console.error("Error updating PhotoBank project:", error);
    throw error;
  }
};

/**
 * Delete a PhotoBank project
 */
export const deletePhotoBankProject = async (projectId: string): Promise<void> => {
  try {
    // Delete project (cascade will handle related records)
    const { error } = await supabase
      .from('photobank_projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error deleting PhotoBank project:", error);
    throw error;
  }
};

/**
 * Upload project thumbnail image
 */
export const uploadProjectThumbnail = async (
  projectId: string,
  file: File
): Promise<PhotoBankProjectThumbnailImage> => {
  try {
    const timestamp = Date.now();
    const fileName = `thumbnail-${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `projects/${projectId}/thumbnails/${fileName}`;

    // Get image dimensions
    const dimensions = await getImageDimensions(file);

    // Upload to storage
    const { path, publicUrl } = await uploadImageToStorage(file, storagePath);

    // Create thumbnail record
    const thumbnailData = {
      project_id: projectId,
      storage_path: path,
      public_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      width: dimensions.width,
      height: dimensions.height,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('photobank_project_thumbnail_images')
      .insert([thumbnailData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as PhotoBankProjectThumbnailImage;
  } catch (error) {
    console.error("Error uploading project thumbnail:", error);
    throw error;
  }
};

/**
 * Delete project thumbnail image
 */
export const deleteProjectThumbnail = async (thumbnailId: string): Promise<void> => {
  try {
    // Fetch thumbnail to get storage path
    const { data: thumbnail, error: fetchError } = await supabase
      .from('photobank_project_thumbnail_images')
      .select('storage_path')
      .eq('id', thumbnailId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Delete from storage
    if (thumbnail?.storage_path) {
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([thumbnail.storage_path]);
    }

    // Delete database record
    const { error: deleteError } = await supabase
      .from('photobank_project_thumbnail_images')
      .delete()
      .eq('id', thumbnailId);

    if (deleteError) {
      throw deleteError;
    }
  } catch (error) {
    console.error("Error deleting project thumbnail:", error);
    throw error;
  }
};

/**
 * Fetch albums for a project
 */
export const fetchPhotoBankAlbums = async (projectId: string): Promise<PhotoBankAlbum[]> => {
  try {
    const { data, error } = await supabase
      .from('photobank_albums')
      .select(`
        *,
        thumbnail_image:photobank_album_thumbnail_images(*),
        images:photobank_album_images(*)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching PhotoBank albums:", error);
      throw error;
    }

    return (data || []).map((album: any) => ({
      ...album,
      thumbnail_image: album.thumbnail_image?.[0] || null,
      thumbnail_image_id: album.thumbnail_image_id || null,
      images: (album.images || []).sort((a: PhotoBankAlbumImage, b: PhotoBankAlbumImage) => 
        a.display_order - b.display_order
      ),
    })) as PhotoBankAlbum[];
  } catch (error) {
    console.error("Error fetching PhotoBank albums:", error);
    throw error;
  }
};

/**
 * Create a new PhotoBank album
 */
export const createPhotoBankAlbum = async (
  albumData: PhotoBankAlbumFormData
): Promise<PhotoBankAlbum> => {
  try {
    // Create album record
    const albumRecord = {
      project_id: albumData.project_id,
      name: albumData.name,
      main_event_name: albumData.main_event_name,
      main_event_description: albumData.main_event_description,
      short_description: albumData.short_description,
      sub_event_name: albumData.sub_event_name,
      custom_sub_event_name: albumData.custom_sub_event_name || null,
      thumbnail_image_id: null,
      is_new_project_album: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: album, error: albumError } = await supabase
      .from('photobank_albums')
      .insert([albumRecord])
      .select()
      .single();

    if (albumError) {
      throw albumError;
    }

    // Upload thumbnail if provided
    if (albumData.thumbnail_file) {
      const thumbnail = await uploadAlbumThumbnail(album.id, albumData.thumbnail_file);
      await supabase
        .from('photobank_albums')
        .update({ thumbnail_image_id: thumbnail.id })
        .eq('id', album.id);
    }

    // Upload images if provided
    if (albumData.image_files && albumData.image_files.length > 0) {
      await uploadAlbumImages(album.id, albumData.image_files);
    }

    // Fetch complete album
    const albums = await fetchPhotoBankAlbums(albumData.project_id);
    return albums.find(a => a.id === album.id)!;
  } catch (error) {
    console.error("Error creating PhotoBank album:", error);
    throw error;
  }
};

/**
 * Update a PhotoBank album
 */
export const updatePhotoBankAlbum = async (
  albumId: string,
  albumData: PhotoBankAlbumFormData
): Promise<PhotoBankAlbum> => {
  try {
    const updateData: any = {
      name: albumData.name,
      main_event_name: albumData.main_event_name,
      main_event_description: albumData.main_event_description,
      short_description: albumData.short_description,
      sub_event_name: albumData.sub_event_name,
      custom_sub_event_name: albumData.custom_sub_event_name || null,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('photobank_albums')
      .update(updateData)
      .eq('id', albumId);

    if (updateError) {
      throw updateError;
    }

    // Update thumbnail if provided
    if (albumData.thumbnail_file) {
      const existingAlbum = await fetchPhotoBankAlbums(albumData.project_id);
      const album = existingAlbum.find(a => a.id === albumId);
      
      if (album?.thumbnail_image_id) {
        await deleteAlbumThumbnail(album.thumbnail_image_id);
      }

      const thumbnail = await uploadAlbumThumbnail(albumId, albumData.thumbnail_file);
      await supabase
        .from('photobank_albums')
        .update({ thumbnail_image_id: thumbnail.id })
        .eq('id', albumId);
    }

    // Upload new images if provided
    if (albumData.image_files && albumData.image_files.length > 0) {
      await uploadAlbumImages(albumId, albumData.image_files);
    }

    // Fetch updated album
    const albums = await fetchPhotoBankAlbums(albumData.project_id);
    return albums.find(a => a.id === albumId)!;
  } catch (error) {
    console.error("Error updating PhotoBank album:", error);
    throw error;
  }
};

/**
 * Delete a PhotoBank album
 */
export const deletePhotoBankAlbum = async (albumId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('photobank_albums')
      .delete()
      .eq('id', albumId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error deleting PhotoBank album:", error);
    throw error;
  }
};

/**
 * Upload album thumbnail image
 */
export const uploadAlbumThumbnail = async (
  albumId: string,
  file: File
): Promise<PhotoBankAlbumThumbnailImage> => {
  try {
    const timestamp = Date.now();
    const fileName = `thumbnail-${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `albums/${albumId}/thumbnails/${fileName}`;

    const dimensions = await getImageDimensions(file);
    const { path, publicUrl } = await uploadImageToStorage(file, storagePath);

    const thumbnailData = {
      album_id: albumId,
      storage_path: path,
      public_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      width: dimensions.width,
      height: dimensions.height,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('photobank_album_thumbnail_images')
      .insert([thumbnailData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as PhotoBankAlbumThumbnailImage;
  } catch (error) {
    console.error("Error uploading album thumbnail:", error);
    throw error;
  }
};

/**
 * Delete album thumbnail image
 */
export const deleteAlbumThumbnail = async (thumbnailId: string): Promise<void> => {
  try {
    const { data: thumbnail, error: fetchError } = await supabase
      .from('photobank_album_thumbnail_images')
      .select('storage_path')
      .eq('id', thumbnailId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (thumbnail?.storage_path) {
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([thumbnail.storage_path]);
    }

    const { error: deleteError } = await supabase
      .from('photobank_album_thumbnail_images')
      .delete()
      .eq('id', thumbnailId);

    if (deleteError) {
      throw deleteError;
    }
  } catch (error) {
    console.error("Error deleting album thumbnail:", error);
    throw error;
  }
};

/**
 * Upload multiple images to an album concurrently
 * Returns progress updates via callback
 */
export const uploadAlbumImages = async (
  albumId: string,
  files: File[],
  onProgress?: UploadProgressCallback
): Promise<BulkUploadResult> => {
  const results: BulkUploadResult = {
    successful: [],
    failed: [],
    total: files.length,
    successCount: 0,
    failureCount: 0,
  };

  // Get existing images to determine display_order
  const existingImages = await supabase
    .from('photobank_album_images')
    .select('display_order')
    .eq('album_id', albumId)
    .order('display_order', { ascending: false })
    .limit(1);

  let nextDisplayOrder = existingImages.data?.[0]?.display_order || 0;

  // Create upload promises for concurrent execution
  const uploadPromises = files.map(async (file, index) => {
    const imageId = `temp-${Date.now()}-${index}`;
    const displayOrder = nextDisplayOrder + index + 1;

    // Initialize progress
    if (onProgress) {
      onProgress({
        imageId,
        fileName: file.name,
        progress: 0,
        status: 'pending',
      });
    }

    try {
      // Update progress to uploading
      if (onProgress) {
        onProgress({
          imageId,
          fileName: file.name,
          progress: 10,
          status: 'uploading',
        });
      }

      const timestamp = Date.now();
      const fileName = `image-${timestamp}-${index}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storagePath = `albums/${albumId}/images/${fileName}`;

      // Get dimensions
      const dimensions = await getImageDimensions(file);

      // Upload to storage using unified service
      const { path, publicUrl, imageUuid } = await uploadImageToStorage(file, storagePath, (progress) => {
        if (onProgress) {
          onProgress({
            imageId,
            fileName: file.name,
            progress: 10 + (progress * 0.7), // 10-80% for upload
            status: 'uploading',
          });
        }
      });

      // Update progress
      if (onProgress) {
        onProgress({
          imageId,
          fileName: file.name,
          progress: 90,
          status: 'uploading',
        });
      }

      // Create database record
      const imageData = {
        album_id: albumId,
        storage_path: path,
        public_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        width: dimensions.width,
        height: dimensions.height,
        display_order: displayOrder,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('photobank_album_images')
        .insert([imageData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Success
      if (onProgress) {
        onProgress({
          imageId: data.id,
          fileName: file.name,
          progress: 100,
          status: 'success',
          storage_path: path,
          public_url: publicUrl,
        });
      }

      results.successful.push({
        imageId: data.id,
        fileName: file.name,
        storage_path: path,
        public_url: publicUrl,
      });
      
      // Store the imageUuid in the album image record for reference
      // Note: The image_obj_storage_table already has the imageUuid
      results.successCount++;

      return data as PhotoBankAlbumImage;
    } catch (error: any) {
      const errorMessage = error.message || 'Upload failed';
      
      if (onProgress) {
        onProgress({
          imageId,
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: errorMessage,
        });
      }

      results.failed.push({
        fileName: file.name,
        error: errorMessage,
      });
      results.failureCount++;

      throw error;
    }
  });

  // Execute all uploads concurrently
  await Promise.allSettled(uploadPromises);

  return results;
};

/**
 * Delete an album image
 */
export const deleteAlbumImage = async (imageId: string): Promise<void> => {
  try {
    // Fetch image to get storage path
    const { data: image, error: fetchError } = await supabase
      .from('photobank_album_images')
      .select('storage_path')
      .eq('id', imageId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Delete from storage
    if (image?.storage_path) {
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([image.storage_path]);
    }

    // Delete database record
    const { error: deleteError } = await supabase
      .from('photobank_album_images')
      .delete()
      .eq('id', imageId);

    if (deleteError) {
      throw deleteError;
    }
  } catch (error) {
    console.error("Error deleting album image:", error);
    throw error;
  }
};

/**
 * Get public URL for a storage path
 */
export const getPublicUrl = (storagePath: string): string => {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl;
};

/**
 * Create Project in Project_Details_Table
 * Returns: { project_main_event_id, main_event_name }
 */
export const createProjectDetails = async (
  userId: string,
  projectData: {
    project_title: string;
    project_thumbnail_image_link?: string; // Image_AccessURL from image_obj_storage_table
    main_event_name: string;
    main_event_desc: string;
    short_description: string;
    sub_event_name: string;
    custom_sub_event_name?: string;
    project_last_modified_by: string; // Person name
  }
): Promise<{ project_main_event_id: string; main_event_name: string }> => {
  try {
    const { data, error } = await supabase
      .from('project_details_table')
      .insert([{
        ...projectData,
        user_id: userId,
      }])
      .select('project_main_event_id, main_event_name')
      .single();

    if (error) {
      console.error("Error creating project details:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error creating project details:", error);
    throw error;
  }
};

/**
 * Update Project in Project_Details_Table
 */
export const updateProjectDetails = async (
  projectMainEventId: string,
  projectData: {
    project_title?: string;
    project_thumbnail_image_link?: string;
    main_event_name?: string;
    main_event_desc?: string;
    short_description?: string;
    sub_event_name?: string;
    custom_sub_event_name?: string;
    project_last_modified_by: string;
  }
): Promise<{ project_main_event_id: string; main_event_name: string }> => {
  try {
    const { data, error } = await supabase
      .from('project_details_table')
      .update({
        ...projectData,
      })
      .eq('project_main_event_id', projectMainEventId)
      .select('project_main_event_id, main_event_name')
      .single();

    if (error) {
      console.error("Error updating project details:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error updating project details:", error);
    throw error;
  }
};

/**
 * Create/Update Album in Albums_Storage_Table
 */
export const saveAlbumStorage = async (
  projectMainEventId: string,
  albumData: {
    album_photos_kv_json: {
      album_thumbnail_url?: string;
      thumbnail_image_uuid?: string;
      images: Array<{
        image_uuid: string;
        image_access_url: string;
      }>;
    };
    album_last_modified_by: string;
  },
  albumId?: string // If updating existing album
): Promise<{ album_id: string }> => {
  try {
    if (albumId) {
      // Update existing album
      const { data, error } = await supabase
        .from('albums_storage_table')
        .update({
          album_photos_kv_json: albumData.album_photos_kv_json,
          album_last_modified_by: albumData.album_last_modified_by,
        })
        .eq('album_id', albumId)
        .select('album_id')
        .single();

      if (error) {
        console.error("Error updating album storage:", error);
        throw error;
      }

      return data;
    } else {
      // Create new album
      const { data, error } = await supabase
        .from('albums_storage_table')
        .insert([{
          project_main_event_id: projectMainEventId,
          album_photos_kv_json: albumData.album_photos_kv_json,
          album_last_modified_by: albumData.album_last_modified_by,
        }])
        .select('album_id')
        .single();

      if (error) {
        console.error("Error creating album storage:", error);
        throw error;
      }

      return data;
    }
  } catch (error) {
    console.error("Error saving album storage:", error);
    throw error;
  }
};

/**
 * Fetch albums for a project from Albums_Storage_Table
 */
export const fetchAlbumsStorage = async (
  projectMainEventId: string
): Promise<Array<{
  album_id: string;
  project_main_event_id: string;
  album_photos_kv_json: {
    album_thumbnail_url?: string;
    thumbnail_image_uuid?: string;
    images: Array<{
      image_uuid: string;
      image_access_url: string;
    }>;
  };
  album_last_modified: string;
  album_last_modified_by: string;
  created_at: string;
  updated_at: string;
}>> => {
  try {
    const { data, error } = await supabase
      .from('albums_storage_table')
      .select('*')
      .eq('project_main_event_id', projectMainEventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching albums storage:", error);
      throw error;
    }

    return (data || []) as any[];
  } catch (error) {
    console.error("Error fetching albums storage:", error);
    throw error;
  }
};

/**
 * Sub-Event List Types
 */
export interface SubEvent {
  sub_event_id: string;
  sub_event_name: string;
  display_order: number;
}

/**
 * Fetch active sub-events from SubEvents_List_Table
 * Returns list of sub-events ordered by display_order
 * Falls back through multiple methods: table -> view -> function -> defaults
 */
export const fetchSubEventsList = async (): Promise<SubEvent[]> => {
  try {
    // Method 1: Try direct table access first
    const { data: tableData, error: tableError } = await supabase
      .from('sub_events_list_table')
      .select('sub_event_id, sub_event_name, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('sub_event_name', { ascending: true });

    if (!tableError && tableData) {
      return tableData as SubEvent[];
    }

    // Method 2: Try using the view (if table access fails)
    console.warn("Table access failed, trying view:", tableError?.message);
    const { data: viewData, error: viewError } = await supabase
      .from('sub_events_list_view')
      .select('sub_event_id, sub_event_name, display_order')
      .order('display_order', { ascending: true })
      .order('sub_event_name', { ascending: true });

    if (!viewError && viewData) {
      return viewData as SubEvent[];
    }

    // Method 3: Try using the database function
    console.warn("View access failed, trying function:", viewError?.message);
    const { data: functionData, error: functionError } = await supabase
      .rpc('get_active_sub_events');

    if (!functionError && functionData) {
      return functionData as SubEvent[];
    }

    // If all methods fail, throw the last error
    console.error("All access methods failed. Last error:", functionError || viewError || tableError);
    throw functionError || viewError || tableError;
  } catch (error) {
    console.error("Error fetching sub-events list:", error);
    throw error;
  }
};


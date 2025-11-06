import { supabase } from "@/integrations/supabase/client";

export interface ImageUploadResponse {
  Image_UUID: string;
  Image_AccessURL: string;
}

export interface ImageUploadOptions {
  file: File;
  onProgress?: (progress: number) => void;
}

/**
 * Upload image using Supabase Edge Function
 * Returns { Image_UUID, Image_AccessURL }
 */
export async function uploadImageViaEdgeFunction(
  options: ImageUploadOptions
): Promise<ImageUploadResponse> {
  const { file, onProgress } = options;

  // Validate file
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Update progress
  if (onProgress) {
    onProgress(10);
  }

  // Convert file to base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  if (onProgress) {
    onProgress(30);
  }

  // Get auth token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (!session || sessionError) {
    throw new Error('Not authenticated. Please log in to upload images.');
  }

  if (onProgress) {
    onProgress(50);
  }

  // Call Edge Function
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Supabase URL not configured');
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: base64,
        fileName: file.name,
        contentType: file.type,
      }),
    });

    if (onProgress) {
      onProgress(80);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `Upload failed: ${response.status} ${response.statusText}`);
    }

    const result: ImageUploadResponse = await response.json();

    if (onProgress) {
      onProgress(100);
    }

    return result;
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      // Fallback to direct upload if Edge Function is not available
      console.warn('Edge Function not available, falling back to direct upload');
      return uploadImageDirect(options);
    }
    throw error;
  }
}

/**
 * Upload image directly via Supabase Storage (client-side)
 * Alternative method if Edge Function is not available
 * Returns { Image_UUID, Image_AccessURL }
 */
export async function uploadImageDirect(
  options: ImageUploadOptions
): Promise<ImageUploadResponse> {
  const { file, onProgress } = options;

  // Validate file
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  if (onProgress) {
    onProgress(10);
  }

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) {
    throw new Error('Not authenticated. Please log in to upload images.');
  }

  if (onProgress) {
    onProgress(20);
  }

  // Generate storage path
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `images/${user.id}/${timestamp}-${randomString}-${sanitizedFileName}`;

  if (onProgress) {
    onProgress(30);
  }

  // Upload to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('images')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    // If bucket doesn't exist, provide helpful error
    if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
      throw new Error('Storage bucket "images" not found. Please create it in Supabase Dashboard > Storage.');
    }
    throw uploadError;
  }

  if (onProgress) {
    onProgress(60);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('images')
    .getPublicUrl(storagePath);

  if (onProgress) {
    onProgress(70);
  }

  // Generate UUID
  const imageUuid = crypto.randomUUID();

  // Insert into database
  const { data: dbData, error: dbError } = await supabase
    .from('image_obj_storage_table')
    .insert({
      image_uuid: imageUuid,
      image_obj: storagePath,
      image_access_url: urlData.publicUrl,
      image_create_datetime: new Date().toISOString(),
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      user_id: user.id,
    })
    .select()
    .single();

  if (dbError) {
    // If table doesn't exist, provide helpful error
    if (dbError.message.includes('relation') && dbError.message.includes('does not exist')) {
      throw new Error('Image storage table not found. Please run the migration: 20250115000001_create_image_obj_storage_table.sql');
    }
    throw dbError;
  }

  if (onProgress) {
    onProgress(100);
  }

  return {
    Image_UUID: imageUuid,
    Image_AccessURL: urlData.publicUrl,
  };
}

/**
 * Get image by UUID
 */
export async function getImageByUuid(imageUuid: string): Promise<{
  image_uuid: string;
  image_obj: string;
  image_access_url: string;
  image_create_datetime: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
} | null> {
  const { data, error } = await supabase
    .from('image_obj_storage_table')
    .select('*')
    .eq('image_uuid', imageUuid)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw error;
  }

  return data;
}

/**
 * Delete image by UUID
 */
export async function deleteImageByUuid(imageUuid: string): Promise<void> {
  // Get image record first
  const image = await getImageByUuid(imageUuid);
  if (!image) {
    throw new Error('Image not found');
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('images')
    .remove([image.image_obj]);

  // Delete from database (even if storage deletion fails)
  const { error: dbError } = await supabase
    .from('image_obj_storage_table')
    .delete()
    .eq('image_uuid', imageUuid);

  if (dbError) {
    throw dbError;
  }

  // Log storage error but don't fail if it's already deleted
  if (storageError && !storageError.message.includes('not found')) {
    console.warn('Storage deletion warning:', storageError);
  }
}


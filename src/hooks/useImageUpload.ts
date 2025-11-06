import { useState } from 'react';
import { 
  uploadImageViaEdgeFunction, 
  uploadImageDirect, 
  ImageUploadResponse,
  getImageByUuid,
  deleteImageByUuid,
} from '@/services/imageUpload/imageUploadService';
import { useToast } from '@/hooks/use-toast';

export interface UseImageUploadReturn {
  uploadImage: (file: File, useEdgeFunction?: boolean) => Promise<ImageUploadResponse | null>;
  uploadMultipleImages: (files: File[], useEdgeFunction?: boolean) => Promise<ImageUploadResponse[]>;
  getImage: (imageUuid: string) => Promise<any>;
  deleteImage: (imageUuid: string) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
}

export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadImage = async (
    file: File,
    useEdgeFunction: boolean = true
  ): Promise<ImageUploadResponse | null> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = useEdgeFunction
        ? await uploadImageViaEdgeFunction({
            file,
            onProgress: setUploadProgress,
          })
        : await uploadImageDirect({
            file,
            onProgress: setUploadProgress,
          });

      toast({
        title: 'Upload successful',
        description: 'Image uploaded successfully',
      });

      return result;
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadMultipleImages = async (
    files: File[],
    useEdgeFunction: boolean = true
  ): Promise<ImageUploadResponse[]> => {
    setIsUploading(true);
    setUploadProgress(0);

    const results: ImageUploadResponse[] = [];
    const total = files.length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileProgress = (i / total) * 100;

        try {
          const result = useEdgeFunction
            ? await uploadImageViaEdgeFunction({
                file,
                onProgress: (progress) => {
                  setUploadProgress(fileProgress + (progress / total));
                },
              })
            : await uploadImageDirect({
                file,
                onProgress: (progress) => {
                  setUploadProgress(fileProgress + (progress / total));
                },
              });

          if (result) {
            results.push(result);
          }
        } catch (error: any) {
          console.error(`Failed to upload ${file.name}:`, error);
          toast({
            title: 'Upload failed',
            description: `Failed to upload ${file.name}: ${error.message}`,
            variant: 'destructive',
          });
        }
      }

      if (results.length > 0) {
        toast({
          title: 'Upload complete',
          description: `${results.length} of ${total} image(s) uploaded successfully`,
        });
      }

      return results;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getImage = async (imageUuid: string) => {
    try {
      const image = await getImageByUuid(imageUuid);
      return image;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch image',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteImage = async (imageUuid: string) => {
    try {
      await deleteImageByUuid(imageUuid);
      toast({
        title: 'Image deleted',
        description: 'Image has been deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete image',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    uploadImage,
    uploadMultipleImages,
    getImage,
    deleteImage,
    isUploading,
    uploadProgress,
  };
}


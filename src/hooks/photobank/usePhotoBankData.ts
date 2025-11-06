import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchPhotoBankProjects,
  fetchPhotoBankProject,
  createPhotoBankProject,
  updatePhotoBankProject,
  deletePhotoBankProject,
  fetchPhotoBankAlbums,
  createPhotoBankAlbum,
  updatePhotoBankAlbum,
  deletePhotoBankAlbum,
  uploadAlbumImages,
  deleteAlbumImage,
} from "./api/photobankApi";
import {
  PhotoBankProject,
  PhotoBankProjectFormData,
  PhotoBankAlbum,
  PhotoBankAlbumFormData,
  ImageUploadProgress,
  BulkUploadResult,
  UploadProgressCallback,
} from "@/types/photobank";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook for managing PhotoBank projects
 */
export function usePhotoBankProjects() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all projects
  const {
    data: projects = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['photobank-projects', user?.id],
    queryFn: () => (user ? fetchPhotoBankProjects(user.id) : []),
    enabled: !!user,
    onError: (error: any) => {
      console.error("Error fetching PhotoBank projects:", error);
      toast({
        title: "Error",
        description: "Failed to load PhotoBank projects",
        variant: "destructive",
      });
    },
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (projectData: PhotoBankProjectFormData) =>
      user
        ? createPhotoBankProject(user.id, projectData)
        : Promise.reject("No user authenticated"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photobank-projects'] });
      toast({
        title: "Project Created",
        description: "Your PhotoBank project has been created successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: ({
      projectId,
      projectData,
    }: {
      projectId: string;
      projectData: PhotoBankProjectFormData;
    }) => updatePhotoBankProject(projectId, projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photobank-projects'] });
      queryClient.invalidateQueries({ queryKey: ['photobank-project'] });
      toast({
        title: "Project Updated",
        description: "Your PhotoBank project has been updated successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update project",
        variant: "destructive",
      });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: string) => deletePhotoBankProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photobank-projects'] });
      toast({
        title: "Project Deleted",
        description: "Your PhotoBank project has been deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete project",
        variant: "destructive",
      });
    },
  });

  return {
    projects,
    isLoading,
    error,
    refetch,
    createProject: createProjectMutation.mutate,
    updateProject: updateProjectMutation.mutate,
    deleteProject: deleteProjectMutation.mutate,
    isCreating: createProjectMutation.isPending,
    isUpdating: updateProjectMutation.isPending,
    isDeleting: deleteProjectMutation.isPending,
  };
}

/**
 * Hook for managing a single PhotoBank project
 */
export function usePhotoBankProject(projectId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: project,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['photobank-project', projectId],
    queryFn: () => (projectId ? fetchPhotoBankProject(projectId) : null),
    enabled: !!projectId,
    onError: (error: any) => {
      console.error("Error fetching PhotoBank project:", error);
      toast({
        title: "Error",
        description: "Failed to load PhotoBank project",
        variant: "destructive",
      });
    },
  });

  return {
    project,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for managing PhotoBank albums
 */
export function usePhotoBankAlbums(projectId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch albums for a project
  const {
    data: albums = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['photobank-albums', projectId],
    queryFn: () => (projectId ? fetchPhotoBankAlbums(projectId) : []),
    enabled: !!projectId,
    onError: (error: any) => {
      console.error("Error fetching PhotoBank albums:", error);
      toast({
        title: "Error",
        description: "Failed to load PhotoBank albums",
        variant: "destructive",
      });
    },
  });

  // Create album mutation
  const createAlbumMutation = useMutation({
    mutationFn: (albumData: PhotoBankAlbumFormData) =>
      createPhotoBankAlbum(albumData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photobank-albums'] });
      toast({
        title: "Album Created",
        description: "Your PhotoBank album has been created successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error creating album:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create album",
        variant: "destructive",
      });
    },
  });

  // Update album mutation
  const updateAlbumMutation = useMutation({
    mutationFn: ({
      albumId,
      albumData,
    }: {
      albumId: string;
      albumData: PhotoBankAlbumFormData;
    }) => updatePhotoBankAlbum(albumId, albumData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photobank-albums'] });
      toast({
        title: "Album Updated",
        description: "Your PhotoBank album has been updated successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error updating album:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update album",
        variant: "destructive",
      });
    },
  });

  // Delete album mutation
  const deleteAlbumMutation = useMutation({
    mutationFn: (albumId: string) => deletePhotoBankAlbum(albumId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photobank-albums'] });
      toast({
        title: "Album Deleted",
        description: "Your PhotoBank album has been deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting album:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete album",
        variant: "destructive",
      });
    },
  });

  return {
    albums,
    isLoading,
    error,
    refetch,
    createAlbum: createAlbumMutation.mutate,
    updateAlbum: updateAlbumMutation.mutate,
    deleteAlbum: deleteAlbumMutation.mutate,
    isCreating: createAlbumMutation.isPending,
    isUpdating: updateAlbumMutation.isPending,
    isDeleting: deleteAlbumMutation.isPending,
  };
}

/**
 * Hook for uploading images to an album with progress tracking
 */
export function useUploadAlbumImages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: ImageUploadProgress;
  }>({});

  const uploadImagesMutation = useMutation({
    mutationFn: ({
      albumId,
      files,
      onProgress,
    }: {
      albumId: string;
      files: File[];
      onProgress?: UploadProgressCallback;
    }) => {
      // Create combined progress callback
      const combinedProgressCallback: UploadProgressCallback = (progress) => {
        setUploadProgress((prev) => ({
          ...prev,
          [progress.imageId]: progress,
        }));
        if (onProgress) {
          onProgress(progress);
        }
      };

      return uploadAlbumImages(albumId, files, combinedProgressCallback);
    },
    onSuccess: (result: BulkUploadResult) => {
      queryClient.invalidateQueries({ queryKey: ['photobank-albums'] });
      
      if (result.successCount > 0) {
        toast({
          title: "Upload Successful",
          description: `${result.successCount} image(s) uploaded successfully${
            result.failureCount > 0 ? `, ${result.failureCount} failed` : ""
          }`,
        });
      } else {
        toast({
          title: "Upload Failed",
          description: "All images failed to upload",
          variant: "destructive",
        });
      }

      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress({});
      }, 3000);
    },
    onError: (error: any) => {
      console.error("Error uploading images:", error);
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
      setUploadProgress({});
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => deleteAlbumImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photobank-albums'] });
      toast({
        title: "Image Deleted",
        description: "Image has been deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting image:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete image",
        variant: "destructive",
      });
    },
  });

  return {
    uploadImages: uploadImagesMutation.mutate,
    deleteImage: deleteImageMutation.mutate,
    uploadProgress,
    isUploading: uploadImagesMutation.isPending,
    isDeleting: deleteImageMutation.isPending,
    uploadResult: uploadImagesMutation.data,
  };
}

/**
 * Combined hook for PhotoBank data management
 * Provides all PhotoBank operations in one hook
 */
export function usePhotoBankData(projectId?: string | null) {
  const projects = usePhotoBankProjects();
  const project = usePhotoBankProject(projectId || null);
  const albums = usePhotoBankAlbums(projectId || null);
  const imageUploads = useUploadAlbumImages();

  return {
    projects: {
      ...projects,
    },
    project: {
      ...project,
    },
    albums: {
      ...albums,
    },
    imageUploads: {
      ...imageUploads,
    },
  };
}


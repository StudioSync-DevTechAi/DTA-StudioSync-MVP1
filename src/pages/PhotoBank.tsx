import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Upload, X, Plus, ArrowLeft, ChevronDown, ChevronUp, Check, Image, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PortfolioSidebar } from "@/components/portfolio/PortfolioSidebar";
import { uploadImageDirect, uploadImageViaEdgeFunction, ImageUploadResponse, deleteImageByUuid } from "@/services/imageUpload/imageUploadService";
import { createProjectDetails, updateProjectDetails, fetchProjectDetails, saveAlbumStorage, fetchAlbumsStorage, fetchSubEventsList, SubEvent, fetchAlbumsForLinking, linkAlbumToProject, AlbumLinkInfo, fetchLinkedAlbums, unlinkAlbumFromProject, deleteAlbumStorage, fetchAlbumById } from "@/hooks/photobank/api/photobankApi";
import { buildProjectImageObjectsJSON } from "@/utils/projectImageObjectsBuilder";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  url?: string;
  imageUuid?: string; // UUID from image_obj_storage_table
}

interface Album {
  id: string;
  name: string;
  images: UploadedImage[];
  isEditingTitle?: boolean;
  mainEventName?: string;
  mainEventDescription?: string;
  shortDescription?: string;
  subEventName?: string;
  customSubEventName?: string;
  isOtherSubEvent?: boolean;
  isNewProjectAlbum?: boolean; // Track if created via "New Project Album"
  thumbnailUrl?: string; // Thumbnail URL for display
  albumId?: string; // Database album ID
}

export default function PhotoBank() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Project state - stores the project_main_event_id after project creation
  const [projectMainEventId, setProjectMainEventId] = useState<string | null>(null);
  const [projectTitleFromDB, setProjectTitleFromDB] = useState<string | null>(null);
  
  // Load linked albums when project is created/loaded
  useEffect(() => {
    const loadLinkedAlbums = async () => {
      if (!projectMainEventId) return;
      
      try {
        const linkedAlbums = await fetchLinkedAlbums(projectMainEventId);
        
        // Convert AlbumLinkInfo to Album format and add to albums state
        const albumsToAdd: Album[] = linkedAlbums.map(linkedAlbum => ({
          id: `linked-${linkedAlbum.album_id}`,
          name: linkedAlbum.album_name || "Click and Edit Project Title",
          images: [], // Images would need to be loaded separately if needed
          thumbnailUrl: linkedAlbum.album_thumbnail_url || undefined,
          albumId: linkedAlbum.album_id,
          isEditingTitle: false,
          mainEventName: "",
          mainEventDescription: "",
          shortDescription: "",
          subEventName: linkedAlbum.sub_event_name || "",
          customSubEventName: "",
          isOtherSubEvent: false,
          isNewProjectAlbum: false,
        }));
        
        // Only add albums that aren't already in the state (check by albumId)
        setAlbums(prev => {
          const existingAlbumIds = new Set(prev.map(a => a.albumId).filter(Boolean));
          const newAlbums = albumsToAdd.filter(a => a.albumId && !existingAlbumIds.has(a.albumId));
          if (newAlbums.length > 0) {
            setAlbumsExpanded(true);
            return [...prev, ...newAlbums];
          }
          return prev;
        });
      } catch (error: any) {
        console.error('Error loading linked albums:', error);
        // Don't show error toast as this is a background operation
      }
    };
    
    loadLinkedAlbums();
  }, [projectMainEventId]);
  
  // Sub-events list state - loaded from database
  const [subEventsList, setSubEventsList] = useState<SubEvent[]>([]);
  const [isLoadingSubEvents, setIsLoadingSubEvents] = useState(true);
  
  // Load theme CSS only for PhotoBank page (part of portfolio module)
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/theme-styles.css';
    link.id = 'photobank-theme-styles';
    document.head.appendChild(link);

    return () => {
      // Remove theme CSS when component unmounts
      const themeLink = document.getElementById('photobank-theme-styles');
      if (themeLink) {
        themeLink.remove();
      }
    };
  }, []);

  // Load sub-events list on component mount
  useEffect(() => {
    const loadSubEvents = async () => {
      try {
        setIsLoadingSubEvents(true);
        const events = await fetchSubEventsList();
        setSubEventsList(events);
      } catch (error: any) {
        console.error('Error loading sub-events:', error);
        toast({
          title: "Warning",
          description: "Failed to load sub-events list. Using default values.",
          variant: "default"
        });
        // Fallback to default values if database fetch fails
        setSubEventsList([
          { sub_event_id: '1', sub_event_name: 'Engagement', display_order: 1 },
          { sub_event_id: '2', sub_event_name: 'Bridal Shower', display_order: 2 },
          { sub_event_id: '3', sub_event_name: 'Reception', display_order: 3 },
          { sub_event_id: '4', sub_event_name: 'Mehendi and Sangeet', display_order: 4 },
        ]);
      } finally {
        setIsLoadingSubEvents(false);
      }
    };

    loadSubEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount
  
  // Form state
  const [projectTitle, setProjectTitle] = useState("Click and Edit Project Title");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [mainEventDescription, setMainEventDescription] = useState("");
  const [mainEventName, setMainEventName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [subEventName, setSubEventName] = useState("");
  const [customSubEventName, setCustomSubEventName] = useState("");
  const [isOtherSubEvent, setIsOtherSubEvent] = useState(false);
  
  // Thumbnail state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [projectThumbnailUuid, setProjectThumbnailUuid] = useState<string | null>(null);
  const [projectThumbnailUrl, setProjectThumbnailUrl] = useState<string | null>(null);
  const [projectThumbnailUploadStatus, setProjectThumbnailUploadStatus] = useState<'pending' | 'uploading' | 'success' | 'error'>('pending');
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  
  // Images state
  const [images, setImages] = useState<UploadedImage[]>([]);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  
  // Albums state
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumsExpanded, setAlbumsExpanded] = useState(false);
  const albumTitleInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Create Album Modal state
  const [createAlbumModalOpen, setCreateAlbumModalOpen] = useState(false);
  const [albumImages, setAlbumImages] = useState<UploadedImage[]>([]);
  const [albumThumbnailFile, setAlbumThumbnailFile] = useState<File | null>(null);
  const [albumThumbnailPreview, setAlbumThumbnailPreview] = useState<string | null>(null);
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  const albumImagesInputRef = useRef<HTMLInputElement>(null);
  const albumThumbnailInputRef = useRef<HTMLInputElement>(null);
  
  // Sub-Event Album Modal refs
  const subEventAlbumImagesInputRef = useRef<HTMLInputElement>(null);
  const subEventAlbumThumbnailInputRef = useRef<HTMLInputElement>(null);

  // Upload progress tracking
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'pending' | 'uploading' | 'success' | 'error'>>({});
  const [thumbnailUploadProgress, setThumbnailUploadProgress] = useState(0);
  const [thumbnailUploadStatus, setThumbnailUploadStatus] = useState<'pending' | 'uploading' | 'success' | 'error'>('pending');
  const [thumbnailUuid, setThumbnailUuid] = useState<string | null>(null);

  // Link Album Modal state
  const [linkAlbumModalOpen, setLinkAlbumModalOpen] = useState(false);
  const [availableAlbums, setAvailableAlbums] = useState<AlbumLinkInfo[]>([]);
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(false);
  const [linkedAlbumIds, setLinkedAlbumIds] = useState<Set<string>>(new Set()); // Track already linked albums

  // Album Gallery Modal state
  const [albumGalleryModalOpen, setAlbumGalleryModalOpen] = useState(false);
  const [selectedAlbumForGallery, setSelectedAlbumForGallery] = useState<Album | null>(null);
  const [albumGalleryImages, setAlbumGalleryImages] = useState<Array<{ image_uuid: string; image_access_url: string }>>([]);
  const [isLoadingAlbumGallery, setIsLoadingAlbumGallery] = useState(false);

  // Created Projects state
  const [createdProjects, setCreatedProjects] = useState<Array<{
    project_main_event_id: string;
    project_title: string;
    project_thumbnail_image_link?: string;
    main_event_name: string;
    created_at?: string;
  }>>([]);
  const [showProjectForm, setShowProjectForm] = useState(true); // Show form by default
  const [isEditingProject, setIsEditingProject] = useState(false); // Track if editing existing project
  
  // Sub-Event Album Modal state
  const [subEventAlbumModalOpen, setSubEventAlbumModalOpen] = useState(false);
  const [subEventAlbumSubEventName, setSubEventAlbumSubEventName] = useState("");
  const [subEventAlbumCustomSubEventName, setSubEventAlbumCustomSubEventName] = useState("");
  const [subEventAlbumIsOtherSubEvent, setSubEventAlbumIsOtherSubEvent] = useState(false);
  const [subEventAlbumImages, setSubEventAlbumImages] = useState<UploadedImage[]>([]);
  const [subEventAlbumThumbnailFile, setSubEventAlbumThumbnailFile] = useState<File | null>(null);
  const [subEventAlbumThumbnailPreview, setSubEventAlbumThumbnailPreview] = useState<string | null>(null);
  const [subEventAlbumThumbnailUuid, setSubEventAlbumThumbnailUuid] = useState<string | null>(null);
  const [subEventAlbumUploadProgress, setSubEventAlbumUploadProgress] = useState<Record<string, number>>({});
  const [subEventAlbumUploadStatus, setSubEventAlbumUploadStatus] = useState<Record<string, 'pending' | 'uploading' | 'success' | 'error'>>({});
  const [subEventAlbumThumbnailUploadProgress, setSubEventAlbumThumbnailUploadProgress] = useState(0);
  const [subEventAlbumThumbnailUploadStatus, setSubEventAlbumThumbnailUploadStatus] = useState<'pending' | 'uploading' | 'success' | 'error'>('pending');
  const [subEventAlbumIsUploadComplete, setSubEventAlbumIsUploadComplete] = useState(false);

  // Check if there's an unsaved new project album
  const hasUnsavedNewProjectAlbum = albums.some(album => album.isNewProjectAlbum === true);
  
  // Get the unsaved new project album to show its Main Event Name in tooltip
  const unsavedNewProjectAlbum = albums.find(album => album.isNewProjectAlbum === true);
  const unsavedAlbumMainEventName = unsavedNewProjectAlbum?.mainEventName?.trim() || "this project";
  
  // Drag and drop handlers for thumbnail
  const handleThumbnailDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleThumbnailDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleThumbnailSelect(file);
    }
  }, []);

  const handleThumbnailSelect = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Thumbnail must be less than 10MB",
        variant: "destructive"
      });
      return;
    }

    // Set file and preview immediately
    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setThumbnailPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload thumbnail immediately to Supabase
    try {
      setProjectThumbnailUploadStatus('uploading');
      
      // Check authentication
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error("Not authenticated. Please log in to upload images.");
      }

      const thumbnailResult: ImageUploadResponse = await uploadImageDirect({
        file: file
      });

      // Store UUID and URL in state
      setProjectThumbnailUuid(thumbnailResult.Image_UUID);
      setProjectThumbnailUrl(thumbnailResult.Image_AccessURL);
      setProjectThumbnailUploadStatus('success');
      
      // Update preview with the uploaded URL
      setThumbnailPreview(thumbnailResult.Image_AccessURL);

      toast({
        title: "Thumbnail uploaded",
        description: "Project thumbnail uploaded successfully",
        duration: 1500 // Auto-dismiss after 1.5 seconds to avoid obstructing input fields
      });
    } catch (error: any) {
      console.error('Thumbnail upload error:', error);
      setProjectThumbnailUploadStatus('error');
      setProjectThumbnailUuid(null);
      setProjectThumbnailUrl(null);
      
      toast({
        title: "Thumbnail upload failed",
        description: error.message || "Failed to upload thumbnail. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleThumbnailSelect(file);
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setProjectThumbnailUuid(null);
    setProjectThumbnailUrl(null);
    setProjectThumbnailUploadStatus('pending');
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  // Image upload handlers
  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;

    const currentImageCount = images.length;
    const maxImages = 20;
    const filesToAdd = Array.from(files);

    // Check if adding these files would exceed the limit
    if (currentImageCount + filesToAdd.length > maxImages) {
      const remainingSlots = maxImages - currentImageCount;
      if (remainingSlots <= 0) {
        toast({
          title: "Image limit reached",
          description: `You can only upload a maximum of ${maxImages} images. You currently have ${currentImageCount} image${currentImageCount !== 1 ? 's' : ''}.`,
          variant: "destructive"
        });
        return;
      } else {
        toast({
          title: "Too many images selected",
          description: `You can only add ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''}. Only the first ${remainingSlots} will be added.`,
          variant: "destructive"
        });
        // Only process the files that fit within the limit
        filesToAdd.splice(remainingSlots);
      }
    }

    filesToAdd.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select image files only",
          variant: "destructive"
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 10MB",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: UploadedImage = {
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview: e.target?.result as string
        };
        setImages(prev => {
          // Double-check we haven't exceeded the limit (in case of race conditions)
          if (prev.length >= maxImages) {
            return prev;
          }
          return [...prev, newImage];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageSelect(e.target.files);
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  // Check if required project fields are filled
  const isProjectFieldsValid = () => {
    const isTitleValid = projectTitle && projectTitle.trim() !== "" && projectTitle !== "Click and Edit Project Title";
    const isMainEventNameValid = mainEventName && mainEventName.trim() !== "";
    const isMainEventDescValid = mainEventDescription && mainEventDescription.trim() !== "";
    // Short Description is optional, so we don't validate it
    const isSubEventValid = subEventName && subEventName.trim() !== "" || (isOtherSubEvent && customSubEventName && customSubEventName.trim() !== "");
    
    return isTitleValid && isMainEventNameValid && isMainEventDescValid && isSubEventValid;
  };

  // Create Album Modal handlers
  const handleOpenCreateAlbumModal = async () => {
    // Check if required fields are filled
    if (!isProjectFieldsValid()) {
      toast({
        title: "Project details required",
        description: "Please fill in all required project fields (Title, Main Event Name, Main Event Description, and Sub Event Name) before creating an album",
        variant: "destructive"
      });
      return;
    }

    // If project doesn't exist, create it first
    if (!projectMainEventId) {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to create a project",
          variant: "destructive"
        });
        return;
      }

      try {
        // Get user info for project_last_modified_by
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const userName = currentUser?.user_metadata?.full_name || currentUser?.email || 'Unknown';

        // Create project in Project_Details_Table
        // Use already uploaded thumbnail UUID and URL (uploaded immediately on selection)
        const projectResult = await createProjectDetails(user.id, {
          project_title: projectTitle,
          project_thumbnail_image_link: projectThumbnailUrl || undefined,
          main_event_name: mainEventName,
          main_event_desc: mainEventDescription,
          short_description: shortDescription,
          sub_event_name: isOtherSubEvent ? customSubEventName : subEventName,
          custom_sub_event_name: isOtherSubEvent ? customSubEventName : undefined,
          project_last_modified_by: userName,
        });

        // Store project ID and title in state
        setProjectMainEventId(projectResult.project_main_event_id);
        setProjectTitleFromDB(projectResult.main_event_name || projectTitle);

        toast({
          title: "Project created",
          description: `Project "${projectResult.main_event_name || projectTitle}" created successfully. You can now upload albums.`
        });
      } catch (error: any) {
        console.error('Project creation error:', error);
        toast({
          title: "Project creation failed",
          description: error.message || "Failed to create project. Please try again.",
          variant: "destructive"
        });
        return;
      }
    }

    // Open the modal
    setCreateAlbumModalOpen(true);
    setIsUploadComplete(false);
  };

  const handleCloseCreateAlbumModal = () => {
    setCreateAlbumModalOpen(false);
    setAlbumImages([]);
    setAlbumThumbnailFile(null);
    setAlbumThumbnailPreview(null);
    setIsUploadComplete(false);
    setUploadProgress({});
    setUploadStatus({});
    setThumbnailUploadProgress(0);
    setThumbnailUploadStatus('pending');
    setThumbnailUuid(null);
    if (albumImagesInputRef.current) {
      albumImagesInputRef.current.value = '';
    }
    if (albumThumbnailInputRef.current) {
      albumThumbnailInputRef.current.value = '';
    }
  };

  const handleAlbumImageSelect = (files: FileList | null) => {
    if (!files) return;

    const currentImageCount = albumImages.length;
    const maxImages = 20;
    const filesToAdd = Array.from(files);

    // Check if adding these files would exceed the limit
    if (currentImageCount + filesToAdd.length > maxImages) {
      const remainingSlots = maxImages - currentImageCount;
      if (remainingSlots <= 0) {
        toast({
          title: "Image limit reached",
          description: `You can only upload a maximum of ${maxImages} images. You currently have ${currentImageCount} image${currentImageCount !== 1 ? 's' : ''}.`,
          variant: "destructive"
        });
        return;
      } else {
        toast({
          title: "Too many images selected",
          description: `You can only add ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''}. Only the first ${remainingSlots} will be added.`,
          variant: "destructive"
        });
        filesToAdd.splice(remainingSlots);
      }
    }

    // Reset upload complete status when new images are added
    setIsUploadComplete(false);
    
    filesToAdd.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select image files only",
          variant: "destructive"
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 10MB",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: UploadedImage = {
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview: e.target?.result as string
        };
        setAlbumImages(prev => {
          if (prev.length >= maxImages) {
            return prev;
          }
          return [...prev, newImage];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAlbumImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleAlbumImageSelect(e.target.files);
  };

  const removeAlbumImage = (id: string) => {
    setAlbumImages(prev => prev.filter(img => img.id !== id));
    setIsUploadComplete(false);
  };

  const handleRemoveAlbumImage = async (imageId: string, imageUuid?: string) => {
    try {
      // If image is uploaded (has UUID), delete from image storage
      if (imageUuid) {
        try {
          await deleteImageByUuid(imageUuid);
          
          toast({
            title: "Image removed",
            description: "Image has been deleted from storage"
          });
        } catch (error: any) {
          console.error('Error deleting image:', error);
          toast({
            title: "Error deleting image",
            description: error.message || "Failed to delete image from storage",
            variant: "destructive"
          });
          // Still remove from UI even if deletion fails
        }
      }
      
      // Check remaining images before removing
      const remainingImages = albumImages.filter(img => img.id !== imageId);
      const hasUploadedImages = remainingImages.some(img => img.imageUuid);
      
      // Remove from UI state
      setAlbumImages(prev => prev.filter(img => img.id !== imageId));
      
      // Remove from upload progress/status
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[imageId];
        return newProgress;
      });
      setUploadStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[imageId];
        return newStatus;
      });
      
      // Only reset upload complete if there are no uploaded images left
      // Otherwise, keep it as complete (don't require re-upload)
      if (!hasUploadedImages) {
        setIsUploadComplete(false);
      }
      
    } catch (error: any) {
      console.error('Error removing album image:', error);
      toast({
        title: "Error removing image",
        description: error.message || "Failed to remove image",
        variant: "destructive"
      });
    }
  };

  const handleAlbumThumbnailSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Thumbnail must be less than 10MB",
        variant: "destructive"
      });
      return;
    }

    setAlbumThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAlbumThumbnailPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAlbumThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAlbumThumbnailSelect(file);
    }
  };

  const removeAlbumThumbnail = () => {
    setAlbumThumbnailFile(null);
    setAlbumThumbnailPreview(null);
    if (albumThumbnailInputRef.current) {
      albumThumbnailInputRef.current.value = '';
    }
    setIsUploadComplete(false);
  };

  const handleAlbumUpload = async () => {
    // Filter to only upload images that haven't been uploaded yet
    const imagesToUpload = albumImages.filter(img => !img.imageUuid);
    
    if (imagesToUpload.length === 0 && !albumThumbnailFile && !thumbnailUuid) {
      toast({
        title: "No new files to upload",
        description: "All images are already uploaded. Click Submit to save the album.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Reset upload states only for new uploads
      setUploadProgress({});
      setUploadStatus({});
      
      // Only reset thumbnail states if we're uploading a new thumbnail
      if (albumThumbnailFile && !thumbnailUuid) {
        setThumbnailUploadProgress(0);
        setThumbnailUploadStatus('pending');
      }

      // Upload thumbnail if present and not already uploaded
      if (albumThumbnailFile && !thumbnailUuid) {
        setThumbnailUploadStatus('uploading');
        try {
          const thumbnailResult: ImageUploadResponse = await uploadImageDirect({
            file: albumThumbnailFile,
            onProgress: (progress) => {
              setThumbnailUploadProgress(progress);
            }
          });
          setThumbnailUuid(thumbnailResult.Image_UUID);
          // Update thumbnail preview with the uploaded URL
          setAlbumThumbnailPreview(thumbnailResult.Image_AccessURL);
          setThumbnailUploadStatus('success');
        } catch (error: any) {
          console.error('Thumbnail upload error:', error);
          setThumbnailUploadStatus('error');
          toast({
            title: "Thumbnail upload failed",
            description: error.message || "Failed to upload thumbnail",
            variant: "destructive"
          });
        }
      }

      // Upload only NEW images (those without UUID)
      if (imagesToUpload.length > 0) {
        const imageUploadPromises = imagesToUpload.map(async (image) => {
          setUploadStatus(prev => ({ ...prev, [image.id]: 'uploading' }));
          try {
            const result: ImageUploadResponse = await uploadImageDirect({
              file: image.file,
              onProgress: (progress) => {
                setUploadProgress(prev => ({ ...prev, [image.id]: progress }));
              }
            });
            setUploadStatus(prev => ({ ...prev, [image.id]: 'success' }));
            return {
              ...image,
              imageUuid: result.Image_UUID,
              url: result.Image_AccessURL
            };
          } catch (error: any) {
            console.error(`Image upload error for ${image.id}:`, error);
            setUploadStatus(prev => ({ ...prev, [image.id]: 'error' }));
            throw { imageId: image.id, error };
          }
        });

        const uploadedResults = await Promise.allSettled(imageUploadPromises);
        
        // Check for failures
        const failures = uploadedResults.filter(result => result.status === 'rejected');
        const successfulUploads = uploadedResults
          .filter((result): result is PromiseFulfilledResult<UploadedImage> => result.status === 'fulfilled')
          .map(result => result.value);

        // Update albumImages: keep existing uploaded images, add newly uploaded ones
        setAlbumImages(prev => {
          const existingUploaded = prev.filter(img => img.imageUuid); // Keep already uploaded
          const newUploaded = successfulUploads; // Add newly uploaded
          return [...existingUploaded, ...newUploaded];
        });

        if (failures.length > 0) {
          toast({
            title: "Some uploads failed",
            description: `${failures.length} image(s) failed to upload. ${successfulUploads.length} uploaded successfully.`,
            variant: "destructive"
          });
        } else if (successfulUploads.length > 0) {
          toast({
            title: "Upload successful",
            description: `Uploaded ${successfulUploads.length} new image(s)${albumThumbnailFile && !thumbnailUuid ? ' and thumbnail' : ''}`
          });
        }

        // Mark as complete if we have any uploaded images or thumbnail
        const allImagesAfterUpload = albumImages.filter(img => img.imageUuid).length + successfulUploads.length;
        if (allImagesAfterUpload > 0 || thumbnailUuid || (albumThumbnailFile && !thumbnailUuid)) {
          setIsUploadComplete(true);
        }
      } else if (thumbnailUuid || (albumThumbnailFile && !thumbnailUuid)) {
        // Only thumbnail uploaded/uploading
        setIsUploadComplete(true);
        if (albumThumbnailFile && !thumbnailUuid) {
          toast({
            title: "Upload successful",
            description: "Thumbnail uploaded successfully"
          });
        }
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images",
        variant: "destructive"
      });
    }
  };

  const handleAlbumSubmit = async () => {
    if (!isUploadComplete) {
      toast({
        title: "Upload required",
        description: "Please complete the upload before submitting",
        variant: "destructive"
      });
      return;
    }

    if (!projectMainEventId) {
      toast({
        title: "Project required",
        description: "Please create or save the project first before creating an album",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create an album",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get user info for album_last_modified_by
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userName = currentUser?.user_metadata?.full_name || currentUser?.email || 'Unknown';

      // Prepare album_photos_kv_json
      const albumPhotosJson = {
        album_thumbnail_url: thumbnailUuid ? albumThumbnailPreview || undefined : undefined,
        thumbnail_image_uuid: thumbnailUuid || undefined,
        images: albumImages
          .filter(img => img.imageUuid) // Only uploaded images
          .map(img => ({
            image_uuid: img.imageUuid!,
            image_access_url: img.url!
          }))
      };

      // Save album to Albums_Storage_Table
      const albumResult = await saveAlbumStorage(
        projectMainEventId,
        {
          album_photos_kv_json: albumPhotosJson,
          album_last_modified_by: userName,
        }
      );

      // Add the created album to the albums state so it appears in the project window
      const newAlbum: Album = {
        id: `${Date.now()}-${Math.random()}`,
        name: "Click and Edit Project Title",
        images: albumImages.filter(img => img.imageUuid && img.url), // Only uploaded images
        thumbnailUrl: albumThumbnailPreview || undefined, // Thumbnail URL
        albumId: albumResult.album_id, // Database album ID
        isEditingTitle: false,
        mainEventName: "",
        mainEventDescription: "",
        shortDescription: "",
        subEventName: "",
        customSubEventName: "",
        isOtherSubEvent: false,
        isNewProjectAlbum: false, // Already saved, so not a new project album
      };

      // Add to albums state and make it visible
      setAlbums(prev => [...prev, newAlbum]);
      setAlbumsExpanded(true);

      toast({
        title: "Album created",
        description: `Album created successfully. Album ID: ${albumResult.album_id}`
      });

      handleCloseCreateAlbumModal();
    } catch (error: any) {
      console.error('Album submit error:', error);
      toast({
        title: "Album submission failed",
        description: error.message || "Failed to create album",
        variant: "destructive"
      });
    }
  };

  // Sub-Event Album Modal handlers
  const handleSubEventAlbumImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleSubEventAlbumImageSelect(files);
    }
  };

  const handleSubEventAlbumImageSelect = (files: FileList) => {
    const currentImageCount = subEventAlbumImages.length;
    const maxImages = 20;
    const filesToAdd = Array.from(files);

    if (currentImageCount + filesToAdd.length > maxImages) {
      const remainingSlots = maxImages - currentImageCount;
      if (remainingSlots <= 0) {
        toast({
          title: "Image limit reached",
          description: `You can only upload a maximum of ${maxImages} images.`,
          variant: "destructive"
        });
        return;
      } else {
        filesToAdd.splice(remainingSlots);
      }
    }

    setSubEventAlbumIsUploadComplete(false);
    
    filesToAdd.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select image files only",
          variant: "destructive"
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 10MB",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: UploadedImage = {
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview: e.target?.result as string
        };
        setSubEventAlbumImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubEventAlbumThumbnailSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Thumbnail must be less than 10MB",
        variant: "destructive"
      });
      return;
    }

    setSubEventAlbumThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setSubEventAlbumThumbnailPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubEventAlbumThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSubEventAlbumThumbnailSelect(file);
    }
  };

  const handleSubEventAlbumUpload = async () => {
    const imagesToUpload = subEventAlbumImages.filter(img => !img.imageUuid);
    
    if (imagesToUpload.length === 0 && !subEventAlbumThumbnailFile && !subEventAlbumThumbnailUuid) {
      toast({
        title: "No new files to upload",
        description: "All images are already uploaded. Click Submit to save the album.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubEventAlbumUploadProgress({});
      setSubEventAlbumUploadStatus({});
      
      if (subEventAlbumThumbnailFile && !subEventAlbumThumbnailUuid) {
        setSubEventAlbumThumbnailUploadProgress(0);
        setSubEventAlbumThumbnailUploadStatus('uploading');
        try {
          const thumbnailResult: ImageUploadResponse = await uploadImageDirect({
            file: subEventAlbumThumbnailFile,
            onProgress: (progress) => {
              setSubEventAlbumThumbnailUploadProgress(progress);
            }
          });
          setSubEventAlbumThumbnailUuid(thumbnailResult.Image_UUID);
          setSubEventAlbumThumbnailPreview(thumbnailResult.Image_AccessURL);
          setSubEventAlbumThumbnailUploadStatus('success');
        } catch (error: any) {
          console.error('Thumbnail upload error:', error);
          setSubEventAlbumThumbnailUploadStatus('error');
          toast({
            title: "Thumbnail upload failed",
            description: error.message || "Failed to upload thumbnail",
            variant: "destructive"
          });
        }
      }

      if (imagesToUpload.length > 0) {
        const imageUploadPromises = imagesToUpload.map(async (image) => {
          setSubEventAlbumUploadStatus(prev => ({ ...prev, [image.id]: 'uploading' }));
          try {
            const result: ImageUploadResponse = await uploadImageDirect({
              file: image.file,
              onProgress: (progress) => {
                setSubEventAlbumUploadProgress(prev => ({ ...prev, [image.id]: progress }));
              }
            });
            setSubEventAlbumUploadStatus(prev => ({ ...prev, [image.id]: 'success' }));
            return {
              ...image,
              imageUuid: result.Image_UUID,
              url: result.Image_AccessURL
            };
          } catch (error: any) {
            console.error(`Image upload error for ${image.id}:`, error);
            setSubEventAlbumUploadStatus(prev => ({ ...prev, [image.id]: 'error' }));
            throw { imageId: image.id, error };
          }
        });

        const uploadedResults = await Promise.allSettled(imageUploadPromises);
        const failures = uploadedResults.filter(result => result.status === 'rejected');
        const successfulUploads = uploadedResults
          .filter((result): result is PromiseFulfilledResult<UploadedImage> => result.status === 'fulfilled')
          .map(result => result.value);

        setSubEventAlbumImages(prev => {
          const existingUploaded = prev.filter(img => img.imageUuid);
          return [...existingUploaded, ...successfulUploads];
        });

        if (failures.length > 0) {
          toast({
            title: "Some uploads failed",
            description: `${failures.length} image(s) failed to upload. ${successfulUploads.length} uploaded successfully.`,
            variant: "destructive"
          });
        } else if (successfulUploads.length > 0) {
          toast({
            title: "Upload successful",
            description: `Uploaded ${successfulUploads.length} new image(s)${subEventAlbumThumbnailFile && !subEventAlbumThumbnailUuid ? ' and thumbnail' : ''}`
          });
        }

        const allImagesAfterUpload = subEventAlbumImages.filter(img => img.imageUuid).length + successfulUploads.length;
        if (allImagesAfterUpload > 0 || subEventAlbumThumbnailUuid || (subEventAlbumThumbnailFile && !subEventAlbumThumbnailUuid)) {
          setSubEventAlbumIsUploadComplete(true);
        }
      } else if (subEventAlbumThumbnailUuid || (subEventAlbumThumbnailFile && !subEventAlbumThumbnailUuid)) {
        setSubEventAlbumIsUploadComplete(true);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images",
        variant: "destructive"
      });
    }
  };

  const handleSubEventAlbumSubmit = async () => {
    if (!subEventAlbumIsUploadComplete) {
      toast({
        title: "Upload required",
        description: "Please complete the upload before submitting",
        variant: "destructive"
      });
      return;
    }

    if (!projectMainEventId) {
      toast({
        title: "Project required",
        description: "Please create or save the project first",
        variant: "destructive"
      });
      return;
    }

    if (!subEventAlbumSubEventName && !(subEventAlbumIsOtherSubEvent && subEventAlbumCustomSubEventName)) {
      toast({
        title: "Sub-event required",
        description: "Please select or enter a sub-event name",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create an album",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userName = currentUser?.user_metadata?.full_name || currentUser?.email || 'Unknown';

      const albumPhotosJson = {
        album_thumbnail_url: subEventAlbumThumbnailUuid ? subEventAlbumThumbnailPreview || undefined : undefined,
        thumbnail_image_uuid: subEventAlbumThumbnailUuid || undefined,
        images: subEventAlbumImages
          .filter(img => img.imageUuid)
          .map(img => ({
            image_uuid: img.imageUuid!,
            image_access_url: img.url!
          }))
      };

      const albumResult = await saveAlbumStorage(
        projectMainEventId,
        {
          album_photos_kv_json: albumPhotosJson,
          album_last_modified_by: userName,
        }
      );

      const newAlbum: Album = {
        id: `${Date.now()}-${Math.random()}`,
        name: "Click and Edit Project Title",
        images: subEventAlbumImages.filter(img => img.imageUuid && img.url),
        thumbnailUrl: subEventAlbumThumbnailPreview || undefined,
        albumId: albumResult.album_id,
        isEditingTitle: false,
        mainEventName: mainEventName,
        mainEventDescription: mainEventDescription,
        shortDescription: shortDescription,
        subEventName: subEventAlbumIsOtherSubEvent ? subEventAlbumCustomSubEventName : subEventAlbumSubEventName,
        customSubEventName: subEventAlbumIsOtherSubEvent ? subEventAlbumCustomSubEventName : "",
        isOtherSubEvent: subEventAlbumIsOtherSubEvent,
        isNewProjectAlbum: false,
      };

      setAlbums(prev => [...prev, newAlbum]);
      setAlbumsExpanded(true);

      toast({
        title: "Sub-event album created",
        description: `Album created successfully for ${subEventAlbumIsOtherSubEvent ? subEventAlbumCustomSubEventName : subEventAlbumSubEventName}`
      });

      // Reset and close modal
      setSubEventAlbumSubEventName("");
      setSubEventAlbumCustomSubEventName("");
      setSubEventAlbumIsOtherSubEvent(false);
      setSubEventAlbumImages([]);
      setSubEventAlbumThumbnailFile(null);
      setSubEventAlbumThumbnailPreview(null);
      setSubEventAlbumThumbnailUuid(null);
      setSubEventAlbumUploadProgress({});
      setSubEventAlbumUploadStatus({});
      setSubEventAlbumThumbnailUploadProgress(0);
      setSubEventAlbumThumbnailUploadStatus('pending');
      setSubEventAlbumIsUploadComplete(false);
      setSubEventAlbumModalOpen(false);
    } catch (error: any) {
      console.error('Sub-event album submit error:', error);
      toast({
        title: "Album submission failed",
        description: error.message || "Failed to create album",
        variant: "destructive"
      });
    }
  };

  const handleAddNewProjectAlbum = () => {
    const newAlbum: Album = {
      id: `${Date.now()}-${Math.random()}`,
      name: "Click and Edit Project Title",
      images: [],
      isEditingTitle: false,
      mainEventName: "",
      mainEventDescription: "",
      shortDescription: "",
      subEventName: "",
      customSubEventName: "",
      isOtherSubEvent: false,
      isNewProjectAlbum: true // Mark as created via "New Project Album"
    };
    setAlbums(prev => [...prev, newAlbum]);
    setAlbumsExpanded(true);
    toast({
      title: "New album added",
      description: "You can now edit the album title and add images"
    });
  };

  const handleAddCurrentProjectAlbum = () => {
    // Get the last album or use main project values if no albums exist
    const lastAlbum = albums.length > 0 ? albums[albums.length - 1] : null;
    
    const newAlbum: Album = {
      id: `${Date.now()}-${Math.random()}`,
      name: "Click and Edit Project Title",
      images: [],
      isEditingTitle: false,
      // Copy from last album, or from main project if no albums exist
      mainEventName: lastAlbum?.mainEventName || mainEventName,
      mainEventDescription: lastAlbum?.mainEventDescription || mainEventDescription,
      shortDescription: lastAlbum?.shortDescription || shortDescription,
      // Don't copy subEventName - leave it empty
      subEventName: "",
      customSubEventName: "",
      isOtherSubEvent: false,
      isNewProjectAlbum: false // Not created via "New Project Album"
    };
    setAlbums(prev => [...prev, newAlbum]);
    setAlbumsExpanded(true);
    toast({
      title: "Current project album added",
      description: "Form fields copied from previous album (except Sub-Event Name)"
    });
  };

  const handleAlbumCreate = (albumId: string) => {
    const album = albums.find(a => a.id === albumId);
    if (album) {
      console.log('Creating album:', album);
      toast({
        title: "Album created",
        description: "The album has been created successfully"
      });
      // TODO: Implement actual album creation logic (save to Supabase)
    }
  };

  const handleAlbumCancel = (albumId: string) => {
    handleRemoveAlbum(albumId);
  };

  // Link Album handlers
  const handleOpenLinkAlbumModal = async () => {
    // Check if required fields are filled
    if (!isProjectFieldsValid()) {
      toast({
        title: "Project details required",
        description: "Please fill in all required project fields (Title, Main Event Name, Main Event Description, and Sub Event Name) before linking an album",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to link albums",
        variant: "destructive"
      });
      return;
    }

    // If project doesn't exist, create it first
    if (!projectMainEventId) {
      try {
        // Get user info for project_last_modified_by
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const userName = currentUser?.user_metadata?.full_name || currentUser?.email || 'Unknown';

        // Create project in Project_Details_Table
        // Use already uploaded thumbnail UUID and URL (uploaded immediately on selection)
        const projectResult = await createProjectDetails(user.id, {
          project_title: projectTitle,
          project_thumbnail_image_link: projectThumbnailUrl || undefined,
          main_event_name: mainEventName,
          main_event_desc: mainEventDescription,
          short_description: shortDescription,
          sub_event_name: isOtherSubEvent ? customSubEventName : subEventName,
          custom_sub_event_name: isOtherSubEvent ? customSubEventName : undefined,
          project_last_modified_by: userName,
        });

        // Store project ID and title in state
        setProjectMainEventId(projectResult.project_main_event_id);
        setProjectTitleFromDB(projectResult.main_event_name || projectTitle);

        toast({
          title: "Project created",
          description: `Project "${projectResult.main_event_name || projectTitle}" created successfully. You can now link albums.`
        });
      } catch (error: any) {
        console.error('Project creation error:', error);
        toast({
          title: "Project creation failed",
          description: error.message || "Failed to create project. Please try again.",
          variant: "destructive"
        });
        return;
      }
    }

    setLinkAlbumModalOpen(true);
    setIsLoadingAlbums(true);

    try {
      const fetchedAlbums = await fetchAlbumsForLinking(user.id);
      
      // Get current project's album IDs (both from database and local state)
      const currentProjectAlbumIds = new Set<string>();
      
      // Add albums from local state (created/linked in this session)
      albums.forEach(album => {
        if (album.albumId) {
          currentProjectAlbumIds.add(album.albumId);
        }
      });
      
      // Fetch project's album_ids from database
      const { data: project } = await supabase
        .from('project_details_table')
        .select('album_ids')
        .eq('project_main_event_id', projectMainEventId)
        .single();

      if (project?.album_ids) {
        project.album_ids.forEach((id: string) => currentProjectAlbumIds.add(id));
        setLinkedAlbumIds(new Set(project.album_ids));
      }
      
      // Filter out albums that are already part of the current project
      const filteredAlbums = fetchedAlbums.filter(album => 
        !currentProjectAlbumIds.has(album.album_id)
      );
      
      setAvailableAlbums(filteredAlbums);
    } catch (error: any) {
      console.error('Error loading albums:', error);
      toast({
        title: "Failed to load albums",
        description: error.message || "Could not fetch available albums",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAlbums(false);
    }
  };

  const handleCloseLinkAlbumModal = () => {
    setLinkAlbumModalOpen(false);
    setAvailableAlbums([]);
    setLinkedAlbumIds(new Set());
  };

  const handleLinkAlbum = async (albumId: string) => {
    if (!projectMainEventId) {
      toast({
        title: "Project required",
        description: "Project ID is missing",
        variant: "destructive"
      });
      return;
    }

    try {
      await linkAlbumToProject(projectMainEventId, albumId);
      
      // Update local state
      setLinkedAlbumIds(prev => new Set([...prev, albumId]));
      
      // Find the linked album from available albums and add it to albums state
      const linkedAlbumInfo = availableAlbums.find(a => a.album_id === albumId);
      if (linkedAlbumInfo) {
        const newLinkedAlbum: Album = {
          id: `linked-${linkedAlbumInfo.album_id}`,
          name: linkedAlbumInfo.album_name || "Click and Edit Project Title",
          images: [], // Images would need to be loaded separately if needed
          thumbnailUrl: linkedAlbumInfo.album_thumbnail_url || undefined,
          albumId: linkedAlbumInfo.album_id,
          isEditingTitle: false,
          mainEventName: "",
          mainEventDescription: "",
          shortDescription: "",
          subEventName: linkedAlbumInfo.sub_event_name || "",
          customSubEventName: "",
          isOtherSubEvent: false,
          isNewProjectAlbum: false,
        };
        
        // Add to albums state and make it visible
        setAlbums(prev => {
          // Check if album already exists
          const exists = prev.some(a => a.albumId === albumId);
          if (!exists) {
            setAlbumsExpanded(true);
            return [...prev, newLinkedAlbum];
          }
          return prev;
        });
      }
      
      toast({
        title: "Album linked",
        description: "Album has been successfully linked to this project"
      });
    } catch (error: any) {
      console.error('Error linking album:', error);
      toast({
        title: "Failed to link album",
        description: error.message || "Could not link album to project",
        variant: "destructive"
      });
    }
  };

  const handleAlbumSave = async (albumId: string) => {
    const album = albums.find(a => a.id === albumId);
    if (!album) {
      return;
    }

    if (!projectMainEventId) {
      toast({
        title: "Project required",
        description: "Please create or save the project first before saving an album",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save an album",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get user info for album_last_modified_by
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userName = currentUser?.user_metadata?.full_name || currentUser?.email || 'Unknown';

      // Prepare album_photos_kv_json from album data
      // Note: This assumes album images have been uploaded and have UUIDs
      // For now, we'll save what we have in the album state
      const albumPhotosJson = {
        album_thumbnail_url: undefined, // Will be set when thumbnail is uploaded
        thumbnail_image_uuid: undefined,
        images: album.images
          .filter(img => img.imageUuid) // Only images with UUIDs
          .map(img => ({
            image_uuid: img.imageUuid!,
            image_access_url: img.url || ''
          }))
      };

      // Save album to Albums_Storage_Table
      // Note: We need to track album_id from database, for now we'll create new
      // In a full implementation, you'd want to store the database album_id in the Album interface
      await saveAlbumStorage(
        projectMainEventId,
        {
          album_photos_kv_json: albumPhotosJson,
          album_last_modified_by: userName,
        }
        // albumId would go here if we had it stored
      );

      // Mark as saved (remove isNewProjectAlbum flag)
      setAlbums(prev => prev.map(a => 
        a.id === albumId ? { ...a, isNewProjectAlbum: false } : a
      ));

      toast({
        title: "Album saved",
        description: "The album has been saved successfully"
      });
    } catch (error: any) {
      console.error('Album save error:', error);
      toast({
        title: "Album save failed",
        description: error.message || "Failed to save album",
        variant: "destructive"
      });
    }
  };

  const handleSubmitAlbum = (albumId: string) => {
    const album = albums.find(a => a.id === albumId);
    if (album) {
      console.log('Submitting album:', album);
      // Mark as saved/submitted (remove isNewProjectAlbum flag)
      setAlbums(prev => prev.map(a => 
        a.id === albumId ? { ...a, isNewProjectAlbum: false } : a
      ));
      toast({
        title: "Album submitted",
        description: "The album has been submitted successfully"
      });
      // TODO: Implement actual album submission logic (save to Supabase and mark as submitted)
    }
  };

  const handleAlbumTitleClick = (albumId: string) => {
    setAlbums(prev => prev.map(album => 
      album.id === albumId ? { ...album, isEditingTitle: true } : album
    ));
  };

  const handleAlbumTitleSave = (albumId: string) => {
    setAlbums(prev => prev.map(album => 
      album.id === albumId ? { ...album, isEditingTitle: false } : album
    ));
  };

  const handleAlbumTitleChange = (albumId: string, newName: string) => {
    setAlbums(prev => prev.map(album => 
      album.id === albumId ? { ...album, name: newName } : album
    ));
  };

  const handleAlbumTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, albumId: string) => {
    if (e.key === 'Enter') {
      handleAlbumTitleSave(albumId);
    } else if (e.key === 'Escape') {
      setAlbums(prev => prev.map(album => 
        album.id === albumId ? { ...album, name: "Click and Edit Project Title", isEditingTitle: false } : album
      ));
    }
  };

  const handleAlbumFieldChange = (albumId: string, field: keyof Album, value: string | boolean) => {
    setAlbums(prev => prev.map(album => 
      album.id === albumId ? { ...album, [field]: value } : album
    ));
  };

  const handleOpenAlbumGallery = async (album: Album) => {
    // Set the selected album
    setSelectedAlbumForGallery(album);
    setAlbumGalleryModalOpen(true);
    setIsLoadingAlbumGallery(true);
    setAlbumGalleryImages([]);

    try {
      // If album has an albumId (saved to database), fetch images from database
      if (album.albumId) {
        const albumData = await fetchAlbumById(album.albumId);
        if (albumData && albumData.album_photos_kv_json?.images) {
          setAlbumGalleryImages(albumData.album_photos_kv_json.images);
        } else {
          // Fallback to local images if available
          const localImages = album.images
            .filter(img => img.imageUuid && img.url)
            .map(img => ({
              image_uuid: img.imageUuid!,
              image_access_url: img.url!
            }));
          setAlbumGalleryImages(localImages);
        }
      } else {
        // For unsaved albums, use local images
        const localImages = album.images
          .filter(img => img.imageUuid && img.url)
          .map(img => ({
            image_uuid: img.imageUuid!,
            image_access_url: img.url!
          }));
        setAlbumGalleryImages(localImages);
      }
    } catch (error: any) {
      console.error('Error loading album gallery:', error);
      toast({
        title: "Error loading album",
        description: error.message || "Failed to load album images",
        variant: "destructive"
      });
      // Fallback to local images if available
      const localImages = album.images
        .filter(img => img.imageUuid && img.url)
        .map(img => ({
          image_uuid: img.imageUuid!,
          image_access_url: img.url!
        }));
      setAlbumGalleryImages(localImages);
    } finally {
      setIsLoadingAlbumGallery(false);
    }
  };

  const handleCancel = () => {
    // If editing an existing project, just close the form
    if (isEditingProject) {
      setShowProjectForm(false);
      setIsEditingProject(false);
      return;
    }

    // Check if there's any data to clean up
    const hasNewAlbums = albums.some(album => {
      const isLinkedAlbum = album.id.startsWith('linked-');
      return !isLinkedAlbum; // Any non-linked album means there's data to clean up
    });
    const hasUploadedThumbnail = !!projectThumbnailUuid;
    const hasUploadedImages = images.some(img => img.imageUuid);
    const hasUnsavedAlbumImages = albumImages.some(img => img.imageUuid);
    const hasUnsavedAlbumThumbnail = !!thumbnailUuid;
    const hasCreatedProject = !!projectMainEventId && !isEditingProject;

    const hasDataToCleanup = hasNewAlbums || hasUploadedThumbnail || hasUploadedImages || 
                              hasUnsavedAlbumImages || hasUnsavedAlbumThumbnail || hasCreatedProject;

    // If there's no data to clean up, just close the form
    if (!hasDataToCleanup) {
      setShowProjectForm(false);
      return;
    }

    // If creating a new project with data, show confirmation and cleanup
    const confirmed = window.confirm(
      "Are you sure you want to cancel? This will delete all newly created albums and uploaded images."
    );
    
    if (!confirmed) {
      return;
    }

    // Cleanup logic for new project cancellation
    handleCancelCleanup();
  };

  const handleCancelCleanup = async () => {
    try {
      // Get all newly created albums (not linked ones)
      // This includes both saved albums (with albumId) and unsaved albums (without albumId but with uploaded images)
      const newAlbums = albums.filter(album => {
        const isLinkedAlbum = album.id.startsWith('linked-');
        return !isLinkedAlbum; // All non-linked albums need cleanup
      });

      // Delete each newly created album and its images
      const albumDeletionPromises = newAlbums.map(async (album) => {
        try {
          if (album.albumId) {
            // Album is saved to database - delete from database and storage
            const albumData = await deleteAlbumStorage(album.albumId);
            
            // Delete thumbnail image if exists
            if (albumData.album_photos_kv_json.thumbnail_image_uuid) {
              try {
                await deleteImageByUuid(albumData.album_photos_kv_json.thumbnail_image_uuid);
              } catch (error: any) {
                console.warn('Error deleting thumbnail image:', error);
              }
            }
            
            // Delete all album images
            const imageDeletionPromises = albumData.album_photos_kv_json.images.map(img => 
              deleteImageByUuid(img.image_uuid).catch((error: any) => {
                console.warn(`Error deleting image ${img.image_uuid}:`, error);
                return null;
              })
            );
            
            await Promise.allSettled(imageDeletionPromises);
          } else {
            // Album not yet saved - delete uploaded images from storage
            // Delete all uploaded images in this unsaved album
            const uploadedImages = album.images.filter(img => img.imageUuid);
            const imageDeletionPromises = uploadedImages.map(img => 
              img.imageUuid ? deleteImageByUuid(img.imageUuid).catch((error: any) => {
                console.warn(`Error deleting unsaved album image ${img.imageUuid}:`, error);
                return null;
              }) : Promise.resolve()
            );
            
            await Promise.allSettled(imageDeletionPromises);
          }
        } catch (error: any) {
          console.error(`Error deleting album ${album.albumId || album.id}:`, error);
        }
      });

      await Promise.allSettled(albumDeletionPromises);

      // Delete project thumbnail if uploaded
      if (projectThumbnailUuid) {
        try {
          await deleteImageByUuid(projectThumbnailUuid);
        } catch (error: any) {
          console.warn('Error deleting project thumbnail:', error);
        }
      }

      // Delete any images in the create album modal that were uploaded but not saved
      const unsavedUploadedImages = albumImages.filter(img => img.imageUuid);
      const unsavedImageDeletionPromises = unsavedUploadedImages.map(img => 
        img.imageUuid ? deleteImageByUuid(img.imageUuid).catch((error: any) => {
          console.warn(`Error deleting unsaved image ${img.imageUuid}:`, error);
          return null;
        }) : Promise.resolve()
      );
      await Promise.allSettled(unsavedImageDeletionPromises);

      // Delete album thumbnail if uploaded but not saved
      if (thumbnailUuid) {
        try {
          await deleteImageByUuid(thumbnailUuid);
        } catch (error: any) {
          console.warn('Error deleting unsaved album thumbnail:', error);
        }
      }

      // Delete project if it was created
      if (projectMainEventId && !isEditingProject) {
        try {
          const { error } = await supabase
            .from('project_details_table')
            .delete()
            .eq('project_main_event_id', projectMainEventId);
          
          if (error) {
            console.warn('Error deleting project:', error);
          }
        } catch (error: any) {
          console.warn('Error deleting project:', error);
        }
      }

      toast({
        title: "Cancelled",
        description: "All newly created albums and uploaded images have been deleted."
      });

      // Navigate back to portfolio
      navigate('/portfolio');
    } catch (error: any) {
      console.error('Error during cancel cleanup:', error);
      toast({
        title: "Error during cleanup",
        description: error.message || "Some items may not have been deleted. Please check manually.",
        variant: "destructive"
      });
      // Still navigate even if cleanup had errors
      navigate('/portfolio');
    }
  };

  const handleRemoveAlbumThumbnail = async (albumId: string) => {
    const album = albums.find(a => a.id === albumId);
    if (!album) {
      return;
    }

    try {
      // Check if it's a linked album (id starts with "linked-") or a newly created album
      const isLinkedAlbum = albumId.startsWith('linked-');
      
      if (isLinkedAlbum && album.albumId && projectMainEventId) {
        // It's a linked album - just unlink from project and remove from UI
        await unlinkAlbumFromProject(projectMainEventId, album.albumId);
        setAlbums(prev => prev.filter(a => a.id !== albumId));
        setLinkedAlbumIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(album.albumId!);
          return newSet;
        });
        
        toast({
          title: "Album unlinked",
          description: "Album has been unlinked from this project"
        });
      } else if (album.albumId) {
        // It's a newly created album - delete from database and image storage
        const albumData = await deleteAlbumStorage(album.albumId);
        
        // Delete thumbnail image if exists
        if (albumData.album_photos_kv_json.thumbnail_image_uuid) {
          try {
            await deleteImageByUuid(albumData.album_photos_kv_json.thumbnail_image_uuid);
          } catch (error: any) {
            console.warn('Error deleting thumbnail image:', error);
            // Continue even if thumbnail deletion fails
          }
        }
        
        // Delete all album images
        const imageDeletionPromises = albumData.album_photos_kv_json.images.map(img => 
          deleteImageByUuid(img.image_uuid).catch((error: any) => {
            console.warn(`Error deleting image ${img.image_uuid}:`, error);
            return null; // Continue even if some images fail
          })
        );
        
        await Promise.allSettled(imageDeletionPromises);
        
        // Remove from UI
        setAlbums(prev => prev.filter(a => a.id !== albumId));
        
        toast({
          title: "Album deleted",
          description: "Album and its images have been deleted"
        });
      } else {
        // Album not yet saved to database - just remove from UI
        setAlbums(prev => prev.filter(a => a.id !== albumId));
        
        toast({
          title: "Album removed",
          description: "Album has been removed from this project"
        });
      }
    } catch (error: any) {
      console.error('Error removing album:', error);
      toast({
        title: "Error removing album",
        description: error.message || "Failed to remove album",
        variant: "destructive"
      });
    }
  };

  const handleRemoveAlbum = (albumId: string) => {
    console.log('handleRemoveAlbum called with albumId:', albumId);
    console.log('Current albums before removal:', albums.length);
    
    setAlbums(prev => {
      const filtered = prev.filter(album => album.id !== albumId);
      console.log('Albums after removal:', filtered.length);
      return filtered;
    });
    
    toast({
      title: "Album removed",
      description: "The album has been removed. You can add a new one if needed."
    });
  };

  // Focus input when editing starts
  useEffect(() => {
    albums.forEach(album => {
      if (album.isEditingTitle && albumTitleInputRefs.current[album.id]) {
        albumTitleInputRefs.current[album.id]?.focus();
        albumTitleInputRefs.current[album.id]?.select();
      }
    });
  }, [albums]);

  const handleTitleSave = () => {
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setProjectTitle("Click and Edit Project Title");
      setIsEditingTitle(false);
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Auto-resize textarea function
  const autoResizeTextarea = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    // Calculate available height based on parent container (300px total)
    const parentHeight = 300;
    const labelHeight = 20; // Approximate label height  
    const gap = 8; // gap-2 = 8px
    const availableHeight = (parentHeight - (4 * labelHeight) - (3 * gap)) / 4;
    const maxHeight = Math.max(40, availableHeight - 10); // Add some padding
    element.style.height = `${Math.min(element.scrollHeight, maxHeight)}px`;
    element.style.maxHeight = `${maxHeight}px`;
  };

  // Refs for auto-resizing textareas
  const mainEventNameRef = useRef<HTMLTextAreaElement>(null);
  const shortDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const mainEventDescriptionRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize on value change
  useEffect(() => {
    if (mainEventNameRef.current) {
      autoResizeTextarea(mainEventNameRef.current);
    }
  }, [mainEventName]);

  useEffect(() => {
    if (shortDescriptionRef.current) {
      autoResizeTextarea(shortDescriptionRef.current);
    }
  }, [shortDescription]);

  useEffect(() => {
    if (mainEventDescriptionRef.current) {
      autoResizeTextarea(mainEventDescriptionRef.current);
    }
  }, [mainEventDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a project",
        variant: "destructive"
      });
      return;
    }

    try {
      // Use already uploaded thumbnail UUID and URL (uploaded immediately on selection)
      // If thumbnail exists but hasn't been uploaded yet, show error
      if (thumbnailFile && (!projectThumbnailUuid || !projectThumbnailUrl)) {
        toast({
          title: "Thumbnail upload pending",
          description: "Please wait for the thumbnail to finish uploading before submitting",
          variant: "destructive"
        });
        return;
      }

      const thumbnailUuid = projectThumbnailUuid;
      const thumbnailUrl = projectThumbnailUrl;

      // Upload images concurrently (for main project)
      let imageUuids: string[] = [];
      let imageUrls: string[] = [];
      if (images.length > 0) {
        const imageUploadPromises = images.map(async (image) => {
          try {
            const result: ImageUploadResponse = await uploadImageDirect({
              file: image.file
            });
            return {
              image_uuid: result.Image_UUID,
              image_access_url: result.Image_AccessURL
            };
          } catch (error: any) {
            console.error(`Image upload error for ${image.id}:`, error);
            throw error;
          }
        });

        const uploadedResults = await Promise.allSettled(imageUploadPromises);
        const failures = uploadedResults.filter(result => result.status === 'rejected');
        
        const successful = uploadedResults
          .filter((result): result is PromiseFulfilledResult<{image_uuid: string; image_access_url: string}> => result.status === 'fulfilled')
          .map(result => result.value);

        imageUuids = successful.map(img => img.image_uuid);
        imageUrls = successful.map(img => img.image_access_url);

        if (failures.length > 0) {
          toast({
            title: "Some uploads failed",
            description: `${failures.length} image(s) failed to upload. ${successful.length} uploaded successfully.`,
            variant: "destructive"
          });
          if (successful.length === 0) {
            return; // Don't proceed if all uploads failed
          }
        }
      }

      // Get user info for project_last_modified_by
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userName = currentUser?.user_metadata?.full_name || currentUser?.email || 'Unknown';

      // Collect all album IDs (both saved albums and linked albums)
      const albumIds: string[] = [];
      const albumsWithImages: Array<{
        albumId: string;
        thumbnailUrl?: string | null;
        images: Array<{ imageUuid: string; url: string }>;
      }> = [];

      // Process all albums (both newly created and linked)
      for (const album of albums) {
        // Get album ID (database ID for saved/linked albums, or temporary ID for unsaved)
        const albumId = album.albumId || album.id;
        
        // If album has albumId (saved to database), add to album_ids array
        if (album.albumId && !albumIds.includes(album.albumId)) {
          albumIds.push(album.albumId);
        }

        // Check if it's a linked album (id starts with "linked-")
        const isLinkedAlbum = album.id.startsWith('linked-');

        if (isLinkedAlbum && album.albumId) {
          // For linked albums, fetch images from database
          try {
            const albumData = await fetchAlbumById(album.albumId);
            if (albumData && albumData.album_photos_kv_json?.images) {
              albumsWithImages.push({
                albumId: album.albumId,
                thumbnailUrl: albumData.album_photos_kv_json.album_thumbnail_url || album.thumbnailUrl || null,
                images: albumData.album_photos_kv_json.images.map(img => ({
                  imageUuid: img.image_uuid,
                  url: img.image_access_url,
                })),
              });
            } else if (album.thumbnailUrl) {
              // If no images but has thumbnail, still include it
              albumsWithImages.push({
                albumId: album.albumId,
                thumbnailUrl: album.thumbnailUrl,
                images: [],
              });
            }
          } catch (error: any) {
            console.warn(`Error fetching linked album ${album.albumId} for project JSON:`, error);
            // Fallback to local data if available
            const uploadedImages = album.images.filter(img => img.imageUuid && img.url);
            if (uploadedImages.length > 0 || album.thumbnailUrl) {
              albumsWithImages.push({
                albumId: album.albumId,
                thumbnailUrl: album.thumbnailUrl || null,
                images: uploadedImages.map(img => ({
                  imageUuid: img.imageUuid!,
                  url: img.url!,
                })),
              });
            }
          }
        } else {
          // For newly created albums, use local images
          const uploadedImages = album.images.filter(img => img.imageUuid && img.url);
          
          // Include album if it has uploaded images or thumbnail
          if (uploadedImages.length > 0 || album.thumbnailUrl) {
            albumsWithImages.push({
              albumId: album.albumId || album.id,
              thumbnailUrl: album.thumbnailUrl || null,
              images: uploadedImages.map(img => ({
                imageUuid: img.imageUuid!,
                url: img.url!,
              })),
            });
          } else if (album.albumId) {
            // Even if no images yet, if album is saved, fetch its images from database
            try {
              const albumData = await fetchAlbumById(album.albumId);
              if (albumData && albumData.album_photos_kv_json?.images) {
                albumsWithImages.push({
                  albumId: album.albumId,
                  thumbnailUrl: albumData.album_photos_kv_json.album_thumbnail_url || null,
                  images: albumData.album_photos_kv_json.images.map(img => ({
                    imageUuid: img.image_uuid,
                    url: img.image_access_url,
                  })),
                });
              }
            } catch (error: any) {
              console.warn(`Error fetching album ${album.albumId} for project JSON:`, error);
            }
          }
        }
      }

      // Check if we're editing an existing project or creating a new one
      if (isEditingProject && projectMainEventId) {
        // Update existing project
        // Build Project_ImageObjects_JSON with the actual Project_ID
        const projectImageObjectsJSON = buildProjectImageObjectsJSON({
          projectId: projectMainEventId,
          thumbnailLink: thumbnailUrl,
          albums: albumsWithImages,
          inputFields: {
            project_title: projectTitle,
            main_event_name: mainEventName,
            main_event_desc: mainEventDescription,
            short_description: shortDescription,
            sub_event_name: isOtherSubEvent ? customSubEventName : subEventName,
            custom_sub_event_name: isOtherSubEvent ? customSubEventName : undefined,
          },
          stateStatuses: {
            has_thumbnail: !!thumbnailFile || !!projectThumbnailUrl,
            has_images: images.length > 0,
            albums_count: albums.length,
            is_other_sub_event: isOtherSubEvent,
            linked_albums_count: linkedAlbumIds.size,
          },
        });

        const projectResult = await updateProjectDetails(projectMainEventId, {
          project_title: projectTitle,
          project_thumbnail_image_link: thumbnailUrl || undefined,
          main_event_name: mainEventName,
          main_event_desc: mainEventDescription,
          short_description: shortDescription,
          sub_event_name: isOtherSubEvent ? customSubEventName : subEventName,
          custom_sub_event_name: isOtherSubEvent ? customSubEventName : undefined,
          project_last_modified_by: userName,
          album_ids: albumIds.length > 0 ? albumIds : undefined,
          project_imageobjects_json: projectImageObjectsJSON,
        });

        // Update the project in the createdProjects list
        setCreatedProjects(prev => prev.map(p => 
          p.project_main_event_id === projectMainEventId
            ? {
                ...p,
                project_title: projectTitle,
                project_thumbnail_image_link: thumbnailUrl || undefined,
                main_event_name: mainEventName,
              }
            : p
        ));

        toast({
          title: "Project updated",
          description: `Project "${projectResult.main_event_name}" updated successfully.`
        });

        // Hide the form after update
        setIsEditingProject(false);
        setShowProjectForm(false);
        return;
      }

      // Build temporary Project_ImageObjects_JSON (will be updated with actual Project_ID after creation)
      const tempProjectImageObjectsJSON = buildProjectImageObjectsJSON({
        projectId: '', // Will be set after project creation
        thumbnailLink: thumbnailUrl,
        albums: albumsWithImages,
        inputFields: {
          project_title: projectTitle,
          main_event_name: mainEventName,
          main_event_desc: mainEventDescription,
          short_description: shortDescription,
          sub_event_name: isOtherSubEvent ? customSubEventName : subEventName,
          custom_sub_event_name: isOtherSubEvent ? customSubEventName : undefined,
        },
        stateStatuses: {
          has_thumbnail: !!thumbnailFile,
          has_images: images.length > 0,
          albums_count: albums.length,
          is_other_sub_event: isOtherSubEvent,
          linked_albums_count: linkedAlbumIds.size,
        },
      });

      // Create new project in Project_Details_Table with album_ids and initial JSON
      const projectResult = await createProjectDetails(user.id, {
        project_title: projectTitle,
        project_thumbnail_image_link: thumbnailUrl || undefined,
        main_event_name: mainEventName,
        main_event_desc: mainEventDescription,
        short_description: shortDescription,
        sub_event_name: isOtherSubEvent ? customSubEventName : subEventName,
        custom_sub_event_name: isOtherSubEvent ? customSubEventName : undefined,
        project_last_modified_by: userName,
        album_ids: albumIds.length > 0 ? albumIds : undefined, // Include album_ids array
        project_imageobjects_json: tempProjectImageObjectsJSON, // Include initial JSON
      });

      // Now build the complete JSON with the actual Project_ID
      const projectImageObjectsJSON = buildProjectImageObjectsJSON({
        projectId: projectResult.project_main_event_id,
        thumbnailLink: thumbnailUrl,
        albums: albumsWithImages,
        inputFields: {
          project_title: projectTitle,
          main_event_name: mainEventName,
          main_event_desc: mainEventDescription,
          short_description: shortDescription,
          sub_event_name: isOtherSubEvent ? customSubEventName : subEventName,
          custom_sub_event_name: isOtherSubEvent ? customSubEventName : undefined,
        },
        stateStatuses: {
          has_thumbnail: !!thumbnailFile,
          has_images: images.length > 0,
          albums_count: albums.length,
          is_other_sub_event: isOtherSubEvent,
          linked_albums_count: linkedAlbumIds.size,
        },
      });

      // Update the project with the complete JSON including Project_ID
      await supabase
        .from('project_details_table')
        .update({ 
          project_imageobjects_json: projectImageObjectsJSON 
        })
        .eq('project_main_event_id', projectResult.project_main_event_id);

      // Store project_main_event_id and title for album creation
      setProjectMainEventId(projectResult.project_main_event_id);
      setProjectTitleFromDB(projectResult.main_event_name || projectTitle);

      // Add created project to the projects list
      const newProject = {
        project_main_event_id: projectResult.project_main_event_id,
        project_title: projectTitle,
        project_thumbnail_image_link: thumbnailUrl || undefined,
        main_event_name: projectResult.main_event_name || mainEventName,
        created_at: new Date().toISOString(),
      };
      setCreatedProjects(prev => [...prev, newProject]);
      
      // Reset editing mode and hide the form
      setIsEditingProject(false);
      setShowProjectForm(false);

      toast({
        title: "Project created",
        description: `Project "${projectResult.main_event_name}" created successfully. Project ID: ${projectResult.project_main_event_id}`
      });

      console.log({
        project_main_event_id: projectResult.project_main_event_id,
        main_event_name: projectResult.main_event_name,
        projectTitle,
        mainEventDescription,
        mainEventName,
        shortDescription,
        subEventName,
        thumbnailUuid,
        thumbnailUrl,
        imageUuids,
        imageUrls,
        albums
      });
    } catch (error: any) {
      console.error('Submit error:', error);
      toast({
        title: "Submission failed",
        description: error.message || "Failed to create project",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="page-wrapper portfolio-theme-wrapper">
      <PortfolioSidebar onToggle={setSidebarCollapsed} />
      <div 
        className="body-wrapper transition-all duration-300 lg:ml-64"
        style={{
          marginLeft: !isMobile 
            ? (sidebarCollapsed ? 'calc(256px * 0.2)' : '256px')
            : '0px'
        }}
      >
        <div className="body-wrapper-inner" style={{ paddingTop: 0 }}>
          <div className="container-fluid" style={{ paddingTop: 0 }}>
            <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 pt-4 pb-6">
        <div className="mb-6 flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/portfolio')}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Portfolio
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              // Reset form for new project
              setProjectTitle("");
              setMainEventName("");
              setMainEventDescription("");
              setShortDescription("");
              setSubEventName("");
              setCustomSubEventName("");
              setIsOtherSubEvent(false);
              setThumbnailFile(null);
              setThumbnailPreview(null);
              setImages([]);
              setAlbums([]);
              setProjectMainEventId(null);
              setProjectThumbnailUuid(null);
              setProjectThumbnailUrl(null);
              setProjectThumbnailUploadStatus('pending');
              setIsEditingProject(false); // Reset editing mode
              setShowProjectForm(true);
            }}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            <Plus className="h-4 w-4" />
            {createdProjects.length === 0 ? "Add Projects" : "Add More Projects"}
          </Button>
          
          {projectMainEventId && (
            <Button
              variant="outline"
              onClick={() => {
                setShowProjectForm(true);
                handleOpenCreateAlbumModal();
              }}
              className="inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add more albums
            </Button>
          )}
        </div>

        {/* Created Projects Grid */}
        {createdProjects.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Your Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {createdProjects.map((project) => (
                <Card 
                  key={project.project_main_event_id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={async () => {
                    try {
                      // Fetch full project details
                      const projectData = await fetchProjectDetails(project.project_main_event_id);
                      if (projectData) {
                        // Set this project as active and populate form
                        setProjectMainEventId(project.project_main_event_id);
                        setProjectTitle(projectData.project_title);
                        setMainEventName(projectData.main_event_name);
                        setMainEventDescription(projectData.main_event_desc || "");
                        setShortDescription(projectData.short_description || "");
                        setSubEventName(projectData.sub_event_name || "");
                        setCustomSubEventName(projectData.custom_sub_event_name || "");
                        setIsOtherSubEvent(!!projectData.custom_sub_event_name);
                        setProjectThumbnailUrl(projectData.project_thumbnail_image_link || null);
                        setThumbnailPreview(projectData.project_thumbnail_image_link || null);
                        
                        // Load albums for this project
                        try {
                          // Fetch saved albums from database
                          const savedAlbums = await fetchAlbumsStorage(project.project_main_event_id);
                          const albumsFromDB: Album[] = savedAlbums.map((album: any) => ({
                            id: album.album_id,
                            name: album.album_name || "Click and Edit Project Title",
                            images: (album.album_photos_kv_json?.images || []).map((img: any) => ({
                              id: img.image_uuid,
                              file: new File([], ''), // Dummy file for display
                              preview: img.image_access_url,
                              url: img.image_access_url,
                              imageUuid: img.image_uuid,
                            })),
                            thumbnailUrl: album.album_photos_kv_json?.album_thumbnail_url || undefined,
                            albumId: album.album_id,
                            isEditingTitle: false,
                            mainEventName: projectData.main_event_name,
                            mainEventDescription: projectData.main_event_desc || "",
                            shortDescription: projectData.short_description || "",
                            subEventName: projectData.sub_event_name || "",
                            customSubEventName: projectData.custom_sub_event_name || "",
                            isOtherSubEvent: !!projectData.custom_sub_event_name,
                            isNewProjectAlbum: false,
                          }));
                          
                          // Fetch linked albums
                          const linkedAlbums = await fetchLinkedAlbums(project.project_main_event_id);
                          const linkedAlbumsFormatted: Album[] = linkedAlbums.map(linkedAlbum => ({
                            id: `linked-${linkedAlbum.album_id}`,
                            name: linkedAlbum.album_name || "Click and Edit Project Title",
                            images: [],
                            thumbnailUrl: linkedAlbum.album_thumbnail_url || undefined,
                            albumId: linkedAlbum.album_id,
                            isEditingTitle: false,
                            mainEventName: projectData.main_event_name,
                            mainEventDescription: projectData.main_event_desc || "",
                            shortDescription: projectData.short_description || "",
                            subEventName: linkedAlbum.sub_event_name || "",
                            customSubEventName: "",
                            isOtherSubEvent: false,
                            isNewProjectAlbum: false,
                          }));
                          
                          // Combine saved and linked albums
                          setAlbums([...albumsFromDB, ...linkedAlbumsFormatted]);
                          setLinkedAlbumIds(new Set(linkedAlbums.map(a => a.album_id)));
                        } catch (albumError: any) {
                          console.warn('Error loading albums:', albumError);
                          // Continue even if albums fail to load
                        }
                        
                        // Set editing mode
                        setIsEditingProject(true);
                        setShowProjectForm(true);
                      }
                    } catch (error: any) {
                      console.error('Error loading project:', error);
                      toast({
                        title: "Error loading project",
                        description: error.message || "Failed to load project details",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <div className="aspect-video overflow-hidden bg-gray-100">
                    {project.project_thumbnail_image_link ? (
                      <img
                        src={project.project_thumbnail_image_link}
                        alt={project.project_title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1 truncate">{project.project_title}</h3>
                    <p className="text-sm text-gray-600 truncate">{project.main_event_name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Project Form */}
        {showProjectForm && (
        <Card className="bg-white">
          <CardHeader>
            {isEditingTitle ? (
              <Input
                ref={titleInputRef}
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="text-2xl font-bold border-0 border-b-2 border-blue-500 focus-visible:ring-0 focus-visible:border-blue-600 px-0 py-1 h-auto"
                placeholder="Enter project title..."
              />
            ) : (
              <CardTitle 
                className="text-2xl font-bold cursor-pointer text-blue-600 hover:text-blue-700 transition-colors"
                onClick={() => setIsEditingTitle(true)}
              >
                {projectTitle || "Click and Edit Project Title"}
              </CardTitle>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Thumbnail Upload */}
                <div className="flex flex-col">
                  <Label>Thumbnail Upload</Label>
                  <div
                    onDragOver={handleThumbnailDragOver}
                    onDrop={handleThumbnailDrop}
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 hover:bg-gray-100 h-[300px] flex items-center justify-center max-w-[90%]"
                  >
                    {thumbnailPreview ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="max-h-full max-w-full rounded-lg object-contain"
                        />
                        {/* Upload Status Indicator */}
                        {projectThumbnailUploadStatus === 'uploading' && (
                          <div className="absolute top-2 left-2 bg-blue-500 rounded-full p-2 z-10">
                            <Loader2 className="h-4 w-4 text-white animate-spin" />
                          </div>
                        )}
                        {projectThumbnailUploadStatus === 'success' && (
                          <div className="absolute top-2 left-2 bg-green-500 rounded-full p-2 z-10">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                        {projectThumbnailUploadStatus === 'error' && (
                          <div className="absolute top-2 left-2 bg-red-500 rounded-full p-2 z-10">
                            <X className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeThumbnail();
                          }}
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Upload a file or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    )}
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif"
                      onChange={handleThumbnailFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Right Column - Text Inputs */}
                <div className="flex flex-col w-full min-w-0">
                  <div className="flex flex-col h-[300px] gap-2 w-full min-w-0">
                    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
                      <Label htmlFor="main-event-name" className="text-sm mb-1 flex-shrink-0">Main Event Name</Label>
                      <Textarea
                        ref={mainEventNameRef}
                        id="main-event-name"
                        value={mainEventName}
                        onChange={(e) => {
                          setMainEventName(e.target.value);
                          autoResizeTextarea(e.target);
                        }}
                        onInput={(e) => autoResizeTextarea(e.target as HTMLTextAreaElement)}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden"
                        placeholder="Enter main event name..."
                        style={{ height: 'auto', minHeight: '40px' }}
                      />
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
                      <Label htmlFor="main-event-description" className="text-sm mb-1 flex-shrink-0">Main Event Description</Label>
                      <Textarea
                        ref={mainEventDescriptionRef}
                        id="main-event-description"
                        value={mainEventDescription}
                        onChange={(e) => {
                          setMainEventDescription(e.target.value);
                          autoResizeTextarea(e.target);
                        }}
                        onInput={(e) => autoResizeTextarea(e.target as HTMLTextAreaElement)}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden"
                        placeholder="Enter main event description..."
                        style={{ height: 'auto', minHeight: '40px' }}
                      />
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
                      <Label htmlFor="short-description" className="text-sm mb-1 flex-shrink-0">Short Description (Optional)</Label>
                      <Textarea
                        ref={shortDescriptionRef}
                        id="short-description"
                        value={shortDescription}
                        onChange={(e) => {
                          setShortDescription(e.target.value);
                          autoResizeTextarea(e.target);
                        }}
                        onInput={(e) => autoResizeTextarea(e.target as HTMLTextAreaElement)}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden"
                        placeholder="Enter short description..."
                        style={{ height: 'auto', minHeight: '40px' }}
                      />
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 min-w-0">
                      <Label htmlFor="sub-event-name" className="text-sm mb-1 flex-shrink-0">Sub Event Name</Label>
                      <div className="flex flex-col w-full">
                        <Select 
                          value={isOtherSubEvent ? "Other" : subEventName} 
                          onValueChange={(value) => {
                            if (value === "Other") {
                              setIsOtherSubEvent(true);
                              setSubEventName("");
                            } else {
                              setIsOtherSubEvent(false);
                              setSubEventName(value);
                              setCustomSubEventName("");
                            }
                          }}
                        >
                          <SelectTrigger 
                            id="sub-event-name"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <SelectValue placeholder="Select sub event name..." />
                          </SelectTrigger>
                          <SelectContent>
                            {subEventsList.map((event) => (
                              <SelectItem key={event.sub_event_id} value={event.sub_event_name}>
                                {event.sub_event_name}
                              </SelectItem>
                            ))}
                            <SelectItem value="Other">Other Sub-Event</SelectItem>
                          </SelectContent>
                        </Select>
                        {isOtherSubEvent && (
                          <Input
                            value={customSubEventName}
                            onChange={(e) => {
                              setCustomSubEventName(e.target.value);
                              setSubEventName(e.target.value);
                            }}
                            placeholder="Enter other sub event name..."
                            className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Images Section */}
              <div className="mt-8">
                <Label className="text-base font-semibold mb-4 block">
                  Upload Images {images.length > 0 && <span className="text-sm font-normal text-muted-foreground">({images.length}/20)</span>}
                </Label>
                <div className="flex flex-wrap gap-4">
                  {/* Add Image Button - Hide if 20 images reached */}
                  {images.length < 20 && (
                    <>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              onClick={isProjectFieldsValid() ? handleOpenCreateAlbumModal : undefined}
                              className={`w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${
                                isProjectFieldsValid()
                                  ? "border-gray-300 cursor-pointer hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
                                  : "border-gray-200 cursor-not-allowed bg-gray-100 opacity-60"
                              }`}
                            >
                              <Plus className={`h-8 w-8 mb-2 ${isProjectFieldsValid() ? "text-gray-400" : "text-gray-300"}`} />
                              <span className={`text-sm ${isProjectFieldsValid() ? "text-gray-600" : "text-gray-400"}`}>Create Album</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Click for album upload after providing project Title and Events Inputs details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              onClick={isProjectFieldsValid() ? handleOpenLinkAlbumModal : undefined}
                              className={`w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${
                                isProjectFieldsValid()
                                  ? "border-gray-300 cursor-pointer hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
                                  : "border-gray-200 cursor-not-allowed bg-gray-100 opacity-60"
                              }`}
                            >
                              <Plus className={`h-8 w-8 mb-2 ${isProjectFieldsValid() ? "text-gray-400" : "text-gray-300"}`} />
                              <span className={`text-sm ${isProjectFieldsValid() ? "text-gray-600" : "text-gray-400"}`}>link an album</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Click for album upload after providing project Title and Events Inputs details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}

                  {/* Image Previews */}
                  {images.map((image) => (
                    <div key={image.id} className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden group">
                      <img
                        src={image.preview}
                        alt={`Preview ${image.id}`}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeImage(image.id)}
                        className="absolute top-1 right-1 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {/* Album Thumbnails - Show created/linked albums on new row below action buttons */}
                {albums.filter(album => album.thumbnailUrl).length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-4">
                      {albums
                        .filter(album => album.thumbnailUrl) // Only show albums with thumbnails
                        .map((album, index) => {
                          const albumsWithThumbnails = albums.filter(a => a.thumbnailUrl);
                          const isLinkedAlbum = album.id.startsWith('linked-');
                          const isLatestAlbum = index === albumsWithThumbnails.length - 1;
                          const isNewAlbum = !isLinkedAlbum && album.albumId;
                      
                      return (
                        <div 
                          key={album.id} 
                          className="relative w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden group bg-white cursor-pointer"
                          title={album.name || "Album"}
                          onDoubleClick={() => handleOpenAlbumGallery(album)}
                        >
                          <img
                            src={album.thumbnailUrl}
                            alt={album.name || "Album thumbnail"}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Status label overlay - Always visible */}
                          <div className="absolute top-0 left-0 right-0 bg-black/70 text-white text-xs font-semibold px-2 py-1 text-center">
                            {isLinkedAlbum ? "Linked" : isNewAlbum ? "New Album" : "Album"}
                          </div>
                          
                          {/* Double-click hint overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-2 py-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                            Double-click to view gallery
                          </div>
                          
                          {/* X button to remove album - Always visible */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveAlbumThumbnail(album.id);
                            }}
                            className="absolute top-1 right-1 bg-white/90 hover:bg-red-50 transition-colors p-1 h-auto z-10 shadow-sm"
                          >
                            <X className="h-4 w-4 text-gray-700 hover:text-red-600" />
                          </Button>
                          
                          {/* + button on latest album to add more photos */}
                          {isLatestAlbum && !isLinkedAlbum && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCreateAlbumModal();
                              }}
                              className="absolute bottom-1 right-1 bg-blue-500/90 hover:bg-blue-600 text-white transition-colors p-1 h-auto z-10 shadow-sm rounded-full"
                              title="Add more photos to this album"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Album name overlay on hover */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                            <p className="text-white text-xs text-center font-medium line-clamp-2">
                              {album.name || "Album"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                )}
                <input
                  ref={imagesInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif"
                  multiple
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                {projectMainEventId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      // Pre-fill project data and open sub-event album modal
                      setSubEventAlbumSubEventName("");
                      setSubEventAlbumCustomSubEventName("");
                      setSubEventAlbumIsOtherSubEvent(false);
                      setSubEventAlbumImages([]);
                      setSubEventAlbumThumbnailFile(null);
                      setSubEventAlbumThumbnailPreview(null);
                      setSubEventAlbumThumbnailUuid(null);
                      setSubEventAlbumUploadProgress({});
                      setSubEventAlbumUploadStatus({});
                      setSubEventAlbumThumbnailUploadProgress(0);
                      setSubEventAlbumThumbnailUploadStatus('pending');
                      setSubEventAlbumIsUploadComplete(false);
                      setSubEventAlbumModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Sub-Event Album
                  </Button>
                )}
                <Button type="submit">
                  {isEditingProject ? "Edit Project" : "Create Project"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        )}
      </div>

      {/* Create Album Modal */}
      <Dialog open={createAlbumModalOpen} onOpenChange={setCreateAlbumModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Album</DialogTitle>
            <DialogDescription>
              Upload images and set a thumbnail for your album. Maximum 20 images allowed per upload.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Two boxes side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload Images Box */}
              <div className="flex flex-col">
                <Label className="mb-2">Select Images+ {albumImages.length > 0 && <span className="text-sm font-normal text-muted-foreground">({albumImages.length}/20)</span>}</Label>
                <div
                  onClick={() => albumImagesInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 hover:bg-gray-100 min-h-[200px] flex items-center justify-center"
                >
                {albumImages.length === 0 ? (
                  <div>
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Select Images+
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB (Max 20)
                    </p>
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {albumImages.slice(0, 4).map((image) => (
                        <div key={image.id} className="relative w-16 h-16 border-2 border-gray-200 rounded overflow-hidden">
                          <img
                            src={image.preview}
                            alt={`Preview ${image.id}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {albumImages.length > 4 && (
                        <div className="w-16 h-16 border-2 border-gray-200 rounded flex items-center justify-center bg-gray-100">
                          <span className="text-xs text-gray-600">+{albumImages.length - 4}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <input
                  ref={albumImagesInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif"
                  multiple
                  onChange={handleAlbumImageFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Set Thumbnail Box */}
            <div className="flex flex-col">
              <Label className="mb-2">Set Thumbnail</Label>
              <div
                onClick={() => albumThumbnailInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 hover:bg-gray-100 min-h-[200px] flex items-center justify-center"
              >
                {albumThumbnailPreview ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={albumThumbnailPreview}
                      alt="Thumbnail preview"
                      className="max-h-full max-w-full rounded-lg object-contain"
                    />
                    {/* Thumbnail progress bar overlay */}
                    {thumbnailUploadStatus === 'uploading' && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2">
                        <div className="w-full bg-gray-600 rounded-full h-1 mb-1">
                          <div 
                            className="bg-blue-400 h-1 rounded-full transition-all" 
                            style={{ width: `${thumbnailUploadProgress}%` }}
                          />
                        </div>
                        <div className="text-center">{Math.round(thumbnailUploadProgress)}%</div>
                      </div>
                    )}
                    {/* Success indicator */}
                    {thumbnailUploadStatus === 'success' && (
                      <div className="absolute top-2 left-2 bg-green-500 rounded-full p-1 z-10">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {/* Error indicator */}
                    {thumbnailUploadStatus === 'error' && (
                      <div className="absolute top-2 left-2 bg-red-500 rounded-full p-1 z-10">
                        <X className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAlbumThumbnail();
                      }}
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white z-10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Set Thumbnail +
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                )}
                <input
                  ref={albumThumbnailInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif"
                  onChange={handleAlbumThumbnailFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Image Previews Section - Keep Upload Images + button visible */}
          {albumImages.length > 0 && (
            <div>
              <Label className="text-base font-semibold mb-4 block">
                Selected Images ({albumImages.length}/20)
              </Label>
              <div className="flex flex-wrap gap-4">
                {/* Upload Images + Button - Always visible when images exist */}
                {albumImages.length < 20 && (
                  <div
                    onClick={() => albumImagesInputRef.current?.click()}
                    className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 hover:bg-gray-100"
                  >
                    <Plus className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Select Images+</span>
                  </div>
                )}

                {/* Image Previews */}
                {albumImages.map((image) => (
                  <div key={image.id} className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden group">
                    <img
                      src={image.preview}
                      alt={`Preview ${image.id}`}
                      className="w-full h-full object-cover"
                    />
                    {/* X button to remove image */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAlbumImage(image.id, image.imageUuid);
                      }}
                      className="absolute top-1 right-1 bg-white/90 hover:bg-red-50 transition-colors p-1 h-auto z-20 shadow-sm"
                      disabled={uploadStatus[image.id] === 'uploading'}
                    >
                      <X className="h-4 w-4 text-gray-700 hover:text-red-600" />
                    </Button>
                    {/* Progress bar overlay */}
                    {uploadStatus[image.id] === 'uploading' && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1">
                        <div className="w-full bg-gray-600 rounded-full h-1 mb-1">
                          <div 
                            className="bg-blue-400 h-1 rounded-full transition-all" 
                            style={{ width: `${uploadProgress[image.id] || 0}%` }}
                          />
                        </div>
                        <div className="text-center">{Math.round(uploadProgress[image.id] || 0)}%</div>
                      </div>
                    )}
                    {/* Success indicator */}
                    {uploadStatus[image.id] === 'success' && (
                      <div className="absolute top-1 left-1 bg-green-500 rounded-full p-1 z-10">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {/* Error indicator */}
                    {uploadStatus[image.id] === 'error' && (
                      <div className="absolute top-1 left-1 bg-red-500 rounded-full p-1 z-10">
                        <X className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row justify-center sm:justify-center sm:space-x-2">
            {(() => {
              // Check if there are any unuploaded images
              const hasUnuploadedImages = albumImages.some(img => !img.imageUuid);
              const hasUnuploadedThumbnail = albumThumbnailFile && !thumbnailUuid;
              const hasNewFilesToUpload = hasUnuploadedImages || hasUnuploadedThumbnail;
              
              // Hide Upload button if all images are uploaded
              if (!hasNewFilesToUpload && isUploadComplete) {
                return null; // Don't show Upload button
              }
              
              // Show Upload button only if there are new files to upload
              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div style={{ pointerEvents: 'auto' }}>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAlbumUpload}
                          disabled={!hasNewFilesToUpload}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                        >
                          Upload
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{hasNewFilesToUpload ? "Upload new images" : "All images uploaded"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })()}
            <Button
              type="button"
              onClick={handleAlbumSubmit}
              disabled={!isUploadComplete}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Album Gallery Modal */}
      <Dialog open={albumGalleryModalOpen} onOpenChange={setAlbumGalleryModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-4xl md:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAlbumForGallery?.name || "Album Gallery"}</DialogTitle>
            <DialogDescription>
              View all photos in this album. Double-click an album thumbnail to open this gallery.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {isLoadingAlbumGallery ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600">Loading album images...</p>
                </div>
              </div>
            ) : albumGalleryImages.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Image className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">No images in this album yet.</p>
                  <p className="text-xs text-gray-500">Add images to this album to see them here.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {albumGalleryImages.map((image, index) => (
                  <div 
                    key={image.image_uuid || index} 
                    className="relative aspect-square border-2 border-gray-200 rounded-lg overflow-hidden group bg-gray-50"
                  >
                    <img
                      src={image.image_access_url}
                      alt={`Album image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Image number overlay */}
                    <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (selectedAlbumForGallery) {
                  handleRemoveAlbumThumbnail(selectedAlbumForGallery.id);
                }
                setAlbumGalleryModalOpen(false);
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Remove Album
            </Button>
            <Button
              type="button"
              onClick={() => setAlbumGalleryModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Album Modal */}
      <Dialog open={linkAlbumModalOpen} onOpenChange={setLinkAlbumModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Link an Album</DialogTitle>
            <DialogDescription>
              Select an album from your existing albums to link to this project.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {isLoadingAlbums ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Loading albums...</p>
                </div>
              </div>
            ) : availableAlbums.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">No albums available to link.</p>
                  <p className="text-xs text-gray-500">Create an album first to link it to this project.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
                {availableAlbums.map((album) => {
                  const isLinked = linkedAlbumIds.has(album.album_id);
                  
                  return (
                    <Card 
                      key={album.album_id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isLinked ? 'border-green-500 bg-green-50' : ''
                      }`}
                      onClick={() => !isLinked && handleLinkAlbum(album.album_id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Thumbnail */}
                          <div className="flex-shrink-0">
                            {album.album_thumbnail_url ? (
                              <img
                                src={album.album_thumbnail_url}
                                alt={album.album_name}
                                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Image className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Album Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-gray-900 mb-1 truncate">
                              {album.album_name || 'Untitled Album'}
                            </h3>
                            <p className="text-xs text-gray-600 mb-1">
                              Project: {album.project_main_event_name || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Sub-Event: {album.sub_event_name || 'N/A'}
                            </p>
                            {isLinked && (
                              <div className="mt-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Linked
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-Event Album Modal */}
      <Dialog open={subEventAlbumModalOpen} onOpenChange={setSubEventAlbumModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Sub-Event Album</DialogTitle>
            <DialogDescription>
              Create an album for a different sub-event. Project details are pre-filled from the current project.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Project Details (Read-only) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-xs text-gray-500">Project Title</Label>
                <p className="text-sm font-medium">{projectTitle}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Main Event Name</Label>
                <p className="text-sm font-medium">{mainEventName}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Main Event Description</Label>
                <p className="text-sm">{mainEventDescription}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Short Description</Label>
                <p className="text-sm">{shortDescription || "N/A"}</p>
              </div>
            </div>

            {/* Sub-Event Selection */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="sub-event-album-sub-event">Sub Event Name *</Label>
                <Select
                  value={subEventAlbumSubEventName}
                  onValueChange={(value) => {
                    setSubEventAlbumSubEventName(value);
                    if (value === "Other") {
                      setSubEventAlbumIsOtherSubEvent(true);
                    } else {
                      setSubEventAlbumIsOtherSubEvent(false);
                      setSubEventAlbumCustomSubEventName("");
                    }
                  }}
                >
                  <SelectTrigger id="sub-event-album-sub-event">
                    <SelectValue placeholder="Select sub-event" />
                  </SelectTrigger>
                  <SelectContent>
                    {subEventsList.map((subEvent) => (
                      <SelectItem key={subEvent.sub_event_id} value={subEvent.sub_event_name}>
                        {subEvent.sub_event_name}
                      </SelectItem>
                    ))}
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {subEventAlbumIsOtherSubEvent && (
                <div>
                  <Label htmlFor="sub-event-album-custom">Custom Sub-Event Name *</Label>
                  <Input
                    id="sub-event-album-custom"
                    value={subEventAlbumCustomSubEventName}
                    onChange={(e) => setSubEventAlbumCustomSubEventName(e.target.value)}
                    placeholder="Enter custom sub-event name"
                  />
                </div>
              )}
            </div>

            {/* Image Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload Images Box */}
              <div className="flex flex-col">
                <Label className="mb-2">Select Images+ {subEventAlbumImages.length > 0 && <span className="text-sm font-normal text-muted-foreground">({subEventAlbumImages.length}/20)</span>}</Label>
                <div
                  onClick={() => subEventAlbumImagesInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 hover:bg-gray-100 min-h-[200px] flex items-center justify-center"
                >
                  {subEventAlbumImages.length === 0 ? (
                    <div>
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-sm font-medium text-gray-700 mb-1">Select Images+</p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB (Max 20)</p>
                    </div>
                  ) : (
                    <div className="w-full">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {subEventAlbumImages.slice(0, 4).map((image) => (
                          <div key={image.id} className="relative w-16 h-16 border-2 border-gray-200 rounded overflow-hidden">
                            <img src={image.preview} alt={`Preview ${image.id}`} className="w-full h-full object-cover" />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSubEventAlbumImages(prev => prev.filter(img => img.id !== image.id));
                              }}
                              className="absolute top-0 right-0 bg-red-500/90 hover:bg-red-600 text-white p-1 h-auto"
                              disabled={subEventAlbumUploadStatus[image.id] === 'uploading'}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {subEventAlbumImages.length > 4 && (
                          <div className="w-16 h-16 border-2 border-gray-200 rounded flex items-center justify-center bg-gray-100">
                            <span className="text-xs text-gray-600">+{subEventAlbumImages.length - 4}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={subEventAlbumImagesInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif"
                  multiple
                  onChange={handleSubEventAlbumImageFileChange}
                  className="hidden"
                />
              </div>

              {/* Set Thumbnail Box */}
              <div className="flex flex-col">
                <Label className="mb-2">Set Thumbnail+</Label>
                <div
                  onClick={() => subEventAlbumThumbnailInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 hover:bg-gray-100 min-h-[200px] flex items-center justify-center"
                >
                  {subEventAlbumThumbnailPreview ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img src={subEventAlbumThumbnailPreview} alt="Thumbnail preview" className="max-h-full max-w-full rounded-lg object-contain" />
                      {subEventAlbumThumbnailUploadStatus === 'uploading' && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2">
                          <div className="w-full bg-gray-600 rounded-full h-1 mb-1">
                            <div className="bg-blue-400 h-1 rounded-full transition-all" style={{ width: `${subEventAlbumThumbnailUploadProgress}%` }} />
                          </div>
                          <div className="text-center">{Math.round(subEventAlbumThumbnailUploadProgress)}%</div>
                        </div>
                      )}
                      {subEventAlbumThumbnailUploadStatus === 'success' && (
                        <div className="absolute top-2 left-2 bg-green-500 rounded-full p-1 z-10">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      {subEventAlbumThumbnailUploadStatus === 'error' && (
                        <div className="absolute top-2 left-2 bg-red-500 rounded-full p-1 z-10">
                          <X className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSubEventAlbumThumbnailFile(null);
                          setSubEventAlbumThumbnailPreview(null);
                          setSubEventAlbumThumbnailUuid(null);
                          if (subEventAlbumThumbnailInputRef.current) {
                            subEventAlbumThumbnailInputRef.current.value = '';
                          }
                        }}
                        className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-sm font-medium text-gray-700 mb-1">Set Thumbnail+</p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={subEventAlbumThumbnailInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif"
                  onChange={handleSubEventAlbumThumbnailFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row justify-center sm:justify-center sm:space-x-2">
            {(() => {
              const hasUnuploadedImages = subEventAlbumImages.some(img => !img.imageUuid);
              const hasUnuploadedThumbnail = subEventAlbumThumbnailFile && !subEventAlbumThumbnailUuid;
              const hasNewFilesToUpload = hasUnuploadedImages || hasUnuploadedThumbnail;
              
              if (!hasNewFilesToUpload && subEventAlbumIsUploadComplete) {
                return null;
              }
              
              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div style={{ pointerEvents: 'auto' }}>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSubEventAlbumUpload}
                          disabled={!hasNewFilesToUpload}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                        >
                          Upload
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{hasNewFilesToUpload ? "Upload new images" : "All images uploaded"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })()}
            <Button
              type="button"
              onClick={handleSubEventAlbumSubmit}
              disabled={!subEventAlbumIsUploadComplete}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

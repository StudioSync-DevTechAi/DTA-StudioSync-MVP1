import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Plus, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PortfolioSidebar } from "@/components/portfolio/PortfolioSidebar";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  url?: string;
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
}

export default function PhotoBank() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
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
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  
  // Images state
  const [images, setImages] = useState<UploadedImage[]>([]);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  
  // Albums state
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumsExpanded, setAlbumsExpanded] = useState(false);
  const albumTitleInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
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

  const handleThumbnailSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Thumbnail must be less than 10MB",
        variant: "destructive"
      });
      return;
    }

    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setThumbnailPreview(e.target?.result as string);
    reader.readAsDataURL(file);
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
      isOtherSubEvent: false
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
      isOtherSubEvent: false
    };
    setAlbums(prev => [...prev, newAlbum]);
    setAlbumsExpanded(true);
    toast({
      title: "Current project album added",
      description: "Form fields copied from previous album (except Sub-Event Name)"
    });
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
    
    // TODO: Implement actual form submission logic
    toast({
      title: "Project created",
      description: "Your project has been saved successfully"
    });
    
    // Navigate back or show success message
    console.log({
      projectTitle,
      mainEventDescription,
      mainEventName,
      shortDescription,
      subEventName,
      thumbnailFile,
      images,
      albums
    });
  };

  return (
    <div className="page-wrapper portfolio-theme-wrapper">
      <PortfolioSidebar onToggle={setSidebarCollapsed} />
      <div 
        className="body-wrapper transition-all duration-300"
        style={{
          marginLeft: sidebarCollapsed ? 'calc(256px * 0.2)' : '256px'
        }}
      >
        <div className="body-wrapper-inner" style={{ paddingTop: 0 }}>
          <div className="container-fluid" style={{ paddingTop: 0 }}>
            <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-100 border-b px-4 py-2">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <p className="text-sm text-gray-600">Desktop Project/Event Form</p>
          <h1 className="">PhotoBank</h1>
          <div className="w-[120px]"></div> {/* Spacer for centering */}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-4 pb-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/portfolio')}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Portfolio
          </Button>
        </div>

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
                      <Label htmlFor="short-description" className="text-sm mb-1 flex-shrink-0">Short Description</Label>
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
                            <SelectItem value="Engagement">Engagement</SelectItem>
                            <SelectItem value="Bridal shower">Bridal shower</SelectItem>
                            <SelectItem value="Reception">Reception</SelectItem>
                            <SelectItem value="Mehendi and Sangeet">Mehendi and Sangeet</SelectItem>
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
                      <div
                        onClick={() => imagesInputRef.current?.click()}
                        className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 hover:bg-gray-100"
                      >
                        <Plus className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Create Album</span>
                      </div>
                      <div
                        onClick={() => {/* TODO: Handle link album functionality */}}
                        className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 hover:bg-gray-100"
                      >
                        <Plus className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">link an album</span>
                      </div>
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
                <input
                  ref={imagesInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif"
                  multiple
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </div>

              {/* Albums Section - Placeholder inside form */}

              {/* Form Actions */}
              <div className="flex gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/portfolio')}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create Project
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Albums Section - Collapsible */}
        <div className="mt-6 max-w-6xl mx-auto px-6 pt-4 pb-6">
          {/* Collapsible Header - Toggle Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setAlbumsExpanded(!albumsExpanded)}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 w-full border-2 border-dashed py-6"
          >
            {albumsExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
            <Plus className="h-5 w-5" />
            Add More Albums
          </Button>

          {/* Expanded Albums Content */}
          {albumsExpanded && (
            <div className="mt-6 space-y-6">
              {albums.map((album) => (
                <Card key={album.id} className="bg-white">
                  <CardHeader>
                    {album.isEditingTitle ? (
                      <Input
                        ref={(el) => {
                          albumTitleInputRefs.current[album.id] = el;
                        }}
                        value={album.name}
                        onChange={(e) => handleAlbumTitleChange(album.id, e.target.value)}
                        onBlur={() => handleAlbumTitleSave(album.id)}
                        onKeyDown={(e) => handleAlbumTitleKeyDown(e, album.id)}
                        className="text-2xl font-bold border-0 border-b-2 border-blue-500 focus-visible:ring-0 focus-visible:border-blue-600 px-0 py-1 h-auto"
                        placeholder="Enter album title..."
                      />
                    ) : (
                      <CardTitle 
                        className="text-2xl font-bold cursor-pointer text-blue-600 hover:text-blue-700 transition-colors"
                        onClick={() => handleAlbumTitleClick(album.id)}
                      >
                        {album.name || "Click and Edit Project Title"}
                      </CardTitle>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Same form fields as main project card */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Thumbnail Upload */}
                        <div className="flex flex-col">
                          <Label>Thumbnail Upload</Label>
                          <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 hover:bg-gray-100 h-[300px] flex items-center justify-center max-w-[90%]">
                            <div>
                              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                              <p className="text-sm font-medium text-gray-700 mb-1">
                                Upload a file or drag and drop
                              </p>
                              <p className="text-xs text-gray-500">
                                PNG, JPG, GIF up to 10MB
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Right Column - Text Inputs */}
                        <div className="flex flex-col w-full min-w-0">
                          <div className="flex flex-col h-[300px] gap-2 w-full min-w-0">
                            <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
                              <Label htmlFor={`main-event-name-${album.id}`} className="text-sm mb-1 flex-shrink-0">Main Event Name</Label>
                              <Textarea
                                id={`main-event-name-${album.id}`}
                                value={album.mainEventName || ""}
                                onChange={(e) => {
                                  handleAlbumFieldChange(album.id, 'mainEventName', e.target.value);
                                  autoResizeTextarea(e.target);
                                }}
                                onInput={(e) => autoResizeTextarea(e.target as HTMLTextAreaElement)}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden"
                                placeholder="Enter main event name..."
                                style={{ height: 'auto', minHeight: '40px' }}
                              />
                            </div>

                            <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
                              <Label htmlFor={`main-event-description-${album.id}`} className="text-sm mb-1 flex-shrink-0">Main Event Description</Label>
                              <Textarea
                                id={`main-event-description-${album.id}`}
                                value={album.mainEventDescription || ""}
                                onChange={(e) => {
                                  handleAlbumFieldChange(album.id, 'mainEventDescription', e.target.value);
                                  autoResizeTextarea(e.target);
                                }}
                                onInput={(e) => autoResizeTextarea(e.target as HTMLTextAreaElement)}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden"
                                placeholder="Enter main event description..."
                                style={{ height: 'auto', minHeight: '40px' }}
                              />
                            </div>

                            <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
                              <Label htmlFor={`short-description-${album.id}`} className="text-sm mb-1 flex-shrink-0">Short Description</Label>
                              <Textarea
                                id={`short-description-${album.id}`}
                                value={album.shortDescription || ""}
                                onChange={(e) => {
                                  handleAlbumFieldChange(album.id, 'shortDescription', e.target.value);
                                  autoResizeTextarea(e.target);
                                }}
                                onInput={(e) => autoResizeTextarea(e.target as HTMLTextAreaElement)}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden"
                                placeholder="Enter short description..."
                                style={{ height: 'auto', minHeight: '40px' }}
                              />
                            </div>

                            <div className="flex-1 flex flex-col min-h-0 min-w-0">
                              <Label htmlFor={`sub-event-name-${album.id}`} className="text-sm mb-1 flex-shrink-0">Sub Event Name</Label>
                              <div className="flex flex-col w-full">
                                <Select 
                                  value={album.isOtherSubEvent ? "Other" : album.subEventName || ""} 
                                  onValueChange={(value) => {
                                    if (value === "Other") {
                                      handleAlbumFieldChange(album.id, 'isOtherSubEvent', true);
                                      handleAlbumFieldChange(album.id, 'subEventName', "");
                                    } else {
                                      handleAlbumFieldChange(album.id, 'isOtherSubEvent', false);
                                      handleAlbumFieldChange(album.id, 'subEventName', value);
                                      handleAlbumFieldChange(album.id, 'customSubEventName', "");
                                    }
                                  }}
                                >
                                  <SelectTrigger 
                                    id={`sub-event-name-${album.id}`}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <SelectValue placeholder="Select sub event name..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Engagement">Engagement</SelectItem>
                                    <SelectItem value="Bridal shower">Bridal shower</SelectItem>
                                    <SelectItem value="Reception">Reception</SelectItem>
                                    <SelectItem value="Mehendi and Sangeet">Mehendi and Sangeet</SelectItem>
                                    <SelectItem value="Other">Other Sub-Event</SelectItem>
                                  </SelectContent>
                                </Select>
                                {album.isOtherSubEvent && (
                                  <Input
                                    value={album.customSubEventName || ""}
                                    onChange={(e) => {
                                      handleAlbumFieldChange(album.id, 'customSubEventName', e.target.value);
                                      handleAlbumFieldChange(album.id, 'subEventName', e.target.value);
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

                      {/* Upload Images Section for Album */}
                      <div className="mt-8">
                        <Label className="text-base font-semibold mb-4 block">
                          Upload Images
                        </Label>
                        <div className="flex flex-wrap gap-4">
                          {/* Create Album Box */}
                          <div
                            onClick={() => {/* TODO: Handle image upload for album */}}
                            className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 hover:bg-gray-100"
                          >
                            <Plus className="h-8 w-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-600">Create Album</span>
                          </div>
                          {/* Link an Album Box */}
                          <div
                            onClick={() => {/* TODO: Handle link album functionality */}}
                            className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 hover:bg-gray-100"
                          >
                            <Plus className="h-8 w-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-600">link an album</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add More Albums Buttons - Below all albums */}
              <div className="flex gap-4 mt-6">
                {/* Left Button - Current Project Album */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCurrentProjectAlbum}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 flex-1 border-2 border-dashed py-6"
                >
                  <Plus className="h-5 w-5" />
                  Current Project Album
                </Button>

                {/* Right Button - New Project Album */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddNewProjectAlbum}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 flex-1 border-2 border-dashed py-6"
                >
                  <Plus className="h-5 w-5" />
                  New Project Album
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


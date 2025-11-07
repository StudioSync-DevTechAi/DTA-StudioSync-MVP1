import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Plus, 
  Check, 
  Upload,
  Image as ImageIcon,
  Calendar,
  Folder,
  X,
  Eye,
  Loader2,
  HardDrive,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface S3Image {
  id: string;
  url: string;
  name: string;
  size: number;
  lastModified: string;
  category: string;
  tags: string[];
  isSelected: boolean;
  album?: string;
  folder?: string;
}

interface ImageSelectorProps {
  onImagesSelect: (images: S3Image[]) => void;
  selectedImages: S3Image[];
  onClose?: () => void;
}

export function ImageSelector({ 
  onImagesSelect, 
  selectedImages, 
  onClose 
}: ImageSelectorProps) {
  const { user } = useAuth();
  const [images, setImages] = useState<S3Image[]>([]);
  const [filteredImages, setFilteredImages] = useState<S3Image[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoadStatus, setImageLoadStatus] = useState<Record<string, 'loading' | 'loaded' | 'error'>>({});
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<{url: string, name: string} | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(true);
  const [localImages, setLocalImages] = useState<S3Image[]>([]);
  const [viewByAlbum, setViewByAlbum] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<string>("all");
  const { toast } = useToast();

  // High-quality mock images from Unsplash for demonstration
  const mockS3Images: S3Image[] = [
    {
      id: "1",
      url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop&q=80",
      name: "wedding-ceremony-001.jpg",
      size: 2048576,
      lastModified: "2024-01-15T10:30:00Z",
      category: "Wedding",
      tags: ["ceremony", "bride", "groom", "romantic"],
      isSelected: false,
      album: "Wedding Ceremony",
      folder: "ceremony-photos"
    },
    {
      id: "2", 
      url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&h=600&fit=crop&q=80",
      name: "wedding-reception-002.jpg",
      size: 1536000,
      lastModified: "2024-01-14T15:45:00Z",
      category: "Wedding",
      tags: ["reception", "dancing", "celebration", "party"],
      isSelected: false,
      album: "Wedding Reception",
      folder: "reception-photos"
    },
    {
      id: "3",
      url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop&q=80",
      name: "bridal-portrait-003.jpg", 
      size: 3072000,
      lastModified: "2024-01-13T09:20:00Z",
      category: "Portrait",
      tags: ["bride", "portrait", "elegant", "beauty"],
      isSelected: false,
      album: "Bridal Portraits",
      folder: "portrait-photos"
    },
    {
      id: "4",
      url: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&h=600&fit=crop&q=80",
      name: "engagement-session-004.jpg",
      size: 2560000,
      lastModified: "2024-01-12T14:10:00Z", 
      category: "Engagement",
      tags: ["engagement", "couple", "love", "romantic"],
      isSelected: false,
      album: "Engagement Session",
      folder: "engagement-photos"
    },
    {
      id: "5",
      url: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&h=600&fit=crop&q=80",
      name: "wedding-details-005.jpg",
      size: 1800000,
      lastModified: "2024-01-11T11:30:00Z",
      category: "Details",
      tags: ["details", "flowers", "decorations", "rings"],
      isSelected: false,
      album: "Wedding Details",
      folder: "detail-photos"
    },
    {
      id: "6",
      url: "https://images.unsplash.com/photo-1500916407571-36574104777b?w=800&h=600&fit=crop&q=80",
      name: "family-photos-006.jpg",
      size: 2200000,
      lastModified: "2024-01-10T16:45:00Z",
      category: "Family",
      tags: ["family", "group", "portrait", "generations"],
      isSelected: false,
      album: "Family Photos",
      folder: "family-photos"
    },
    {
      id: "7",
      url: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&h=600&fit=crop&q=80",
      name: "wedding-rings-007.jpg",
      size: 1850000,
      lastModified: "2024-01-09T12:15:00Z",
      category: "Details",
      tags: ["rings", "jewelry", "wedding", "details"],
      isSelected: false,
      album: "Wedding Details",
      folder: "detail-photos"
    },
    {
      id: "8",
      url: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&h=600&fit=crop&q=80",
      name: "wedding-bouquet-008.jpg",
      size: 2100000,
      lastModified: "2024-01-08T14:30:00Z",
      category: "Details",
      tags: ["bouquet", "flowers", "bride", "wedding"],
      isSelected: false,
      album: "Wedding Details",
      folder: "detail-photos"
    },
    {
      id: "9",
      url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&h=600&fit=crop&q=80",
      name: "wedding-cake-009.jpg",
      size: 1950000,
      lastModified: "2024-01-07T16:20:00Z",
      category: "Details",
      tags: ["cake", "dessert", "celebration", "wedding"],
      isSelected: false,
      album: "Wedding Details",
      folder: "detail-photos"
    },
    {
      id: "10",
      url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop&q=80",
      name: "wedding-venue-010.jpg",
      size: 2400000,
      lastModified: "2024-01-06T11:45:00Z",
      category: "Venue",
      tags: ["venue", "location", "wedding", "ceremony"],
      isSelected: false,
      album: "Wedding Venue",
      folder: "venue-photos"
    },
    {
      id: "11",
      url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop&q=80",
      name: "bridal-preparation-011.jpg",
      size: 2750000,
      lastModified: "2024-01-05T09:30:00Z",
      category: "Wedding",
      tags: ["bride", "preparation", "getting-ready", "wedding"],
      isSelected: false,
      album: "Bridal Preparation",
      folder: "preparation-photos"
    },
    {
      id: "12",
      url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&h=600&fit=crop&q=80",
      name: "wedding-dance-012.jpg",
      size: 2300000,
      lastModified: "2024-01-04T20:15:00Z",
      category: "Wedding",
      tags: ["dance", "first-dance", "couple", "romantic"],
      isSelected: false,
      album: "Wedding Reception",
      folder: "reception-photos"
    },
    {
      id: "13",
      url: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&h=600&fit=crop&q=80",
      name: "wedding-guest-013.jpg",
      size: 1650000,
      lastModified: "2024-01-03T18:00:00Z",
      category: "Wedding",
      tags: ["guests", "celebration", "wedding", "party"],
      isSelected: false,
      album: "Wedding Reception",
      folder: "reception-photos"
    },
    {
      id: "14",
      url: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&h=600&fit=crop&q=80",
      name: "wedding-decoration-014.jpg",
      size: 1900000,
      lastModified: "2024-01-02T13:25:00Z",
      category: "Details",
      tags: ["decoration", "flowers", "venue", "wedding"],
      isSelected: false,
      album: "Wedding Details",
      folder: "detail-photos"
    },
    {
      id: "15",
      url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop&q=80",
      name: "wedding-kiss-015.jpg",
      size: 2500000,
      lastModified: "2024-01-01T15:40:00Z",
      category: "Wedding",
      tags: ["kiss", "ceremony", "couple", "romantic"],
      isSelected: false,
      album: "Wedding Ceremony",
      folder: "ceremony-photos"
    }
  ];

  // Pre-check image loading function
  const preloadImage = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Enable CORS
      img.onload = () => resolve(true);
      img.onerror = (error) => {
        console.error('Image load error:', error, 'URL:', url);
        resolve(false);
      };
      // Add timeout to prevent hanging
      setTimeout(() => {
        if (!img.complete) {
          console.warn('Image load timeout:', url);
          resolve(false);
        }
      }, 10000); // 10 second timeout
      img.src = url;
    });
  };

  // Load images from Supabase Remote Image Storage filtered by user ID
  useEffect(() => {
    const loadImages = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch images from Supabase image_obj_storage_table filtered by user_id
        const { data: supabaseImages, error } = await supabase
          .from('image_obj_storage_table')
          .select('image_uuid, image_access_url, file_name, file_size, mime_type, image_create_datetime')
          .eq('user_id', user.id)
          .order('image_create_datetime', { ascending: false });

        if (error) {
          throw error;
        }

        // Transform Supabase images to S3Image format
        const transformedImages: S3Image[] = (supabaseImages || []).map((img) => ({
          id: img.image_uuid,
          url: img.image_access_url,
          name: img.file_name || `Image ${img.image_uuid.substring(0, 8)}`,
          size: img.file_size || 0,
          lastModified: img.image_create_datetime || new Date().toISOString(),
          category: "Remote Image Storage",
          tags: [],
          isSelected: false,
        }));

        // Pre-check all images before displaying
        const imagePromises = transformedImages.map(async (image) => {
          setImageLoadStatus(prev => ({ ...prev, [image.id]: 'loading' }));
          const isLoaded = await preloadImage(image.url);
          setImageLoadStatus(prev => ({ ...prev, [image.id]: isLoaded ? 'loaded' : 'error' }));
          return { ...image, isLoaded };
        });

        const checkedImages = await Promise.all(imagePromises);
        const validImages = checkedImages.filter(img => img.isLoaded);
        const failedImages = checkedImages.filter(img => !img.isLoaded);

        if (failedImages.length > 0) {
          console.warn('Failed to load images:', failedImages.map(img => img.name));
        }

        setImages(validImages);
        setFilteredImages(validImages);

        toast({
          title: "Images Loaded",
          description: `${validImages.length} images loaded from Remote Image Storage`,
        });
      } catch (error) {
        console.error('Error loading images from Supabase:', error);
        // Fallback to empty array if error
        setImages([]);
        setFilteredImages([]);
        
        toast({
          title: "Error loading images",
          description: "Failed to load images from Remote Image Storage",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadImages();
  }, [user?.id, toast]);

  // Filter images based on search, category, and album
  useEffect(() => {
    let filtered = images;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(img => 
        img.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (img.album && img.album.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(img => img.category === selectedCategory);
    }

    // Filter by album when viewByAlbum is enabled
    if (viewByAlbum && selectedAlbum !== "all") {
      filtered = filtered.filter(img => img.album === selectedAlbum);
    }

    setFilteredImages(filtered);
  }, [images, searchTerm, selectedCategory, viewByAlbum, selectedAlbum]);

  // Get unique categories (including dynamic ones from URL images)
  const categories = ["all", ...Array.from(new Set(images.map(img => img.category)))];
  
  // Get unique albums
  const albums = ["all", ...Array.from(new Set(images.map(img => img.album).filter(Boolean)))];

  // Handle image selection
  const handleImageSelect = (imageId: string) => {
    const updatedImages = images.map(img => 
      img.id === imageId ? { ...img, isSelected: !img.isSelected } : img
    );
    setImages(updatedImages);
  };

  // Handle adding selected images to portfolio
  const handleAddToPortfolio = () => {
    const selectedImages = images.filter(img => img.isSelected);
    onImagesSelect(selectedImages);
    
    toast({
      title: "Images added to portfolio",
      description: `${selectedImages.length} images have been added to your portfolio`
    });
  };

  // Handle preview image from URL
  const handlePreviewImage = async () => {
    if (!imageUrl.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a valid image URL",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      // Check if it's a Google Images URL and extract the actual image URL
      let actualImageUrl = imageUrl;
      
      if (imageUrl.includes('google.com/imgres') && imageUrl.includes('imgurl=')) {
        const urlParams = new URLSearchParams(imageUrl.split('?')[1]);
        const extractedUrl = urlParams.get('imgurl');
        if (extractedUrl) {
          actualImageUrl = decodeURIComponent(extractedUrl);
          toast({
            title: "Google Images URL detected",
            description: "Extracted direct image URL from Google Images link"
          });
        } else {
          throw new Error('Could not extract image URL from Google Images link');
        }
      }

      // Validate URL
      const url = new URL(actualImageUrl);
      if (!url.protocol.startsWith('http')) {
        throw new Error('Invalid URL protocol. Please use http:// or https://');
      }

      // Check if URL looks like an image
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
      const hasImageExtension = imageExtensions.some(ext => 
        url.pathname.toLowerCase().includes(ext)
      );
      
      if (!hasImageExtension && !url.searchParams.has('format') && !url.searchParams.has('fm')) {
        console.warn('URL does not appear to be a direct image link');
      }

      // Test if image loads
      console.log('Testing image URL:', actualImageUrl);
      const isImageValid = await preloadImage(actualImageUrl);
      console.log('Image load result:', isImageValid);
      
      if (!isImageValid) {
        // Try without CORS as fallback
        console.log('Trying without CORS...');
        const img = new Image();
        const fallbackResult = await new Promise<boolean>((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          setTimeout(() => resolve(false), 5000);
          img.src = actualImageUrl;
        });
        
        if (!fallbackResult) {
          throw new Error(`Image could not be loaded from URL: ${actualImageUrl}. This might be due to CORS restrictions or the URL not being a direct image link.`);
        }
      }

      // Extract filename from URL or create default name
      const urlPath = url.pathname;
      const filename = urlPath.split('/').pop() || 'image';
      const imageName = filename.includes('.') ? filename : `${filename}.jpg`;

      // Set preview data
      setPreviewImage({
        url: actualImageUrl,
        name: imageName
      });
      setShowPreview(true);

      toast({
        title: "Image preview ready",
        description: "Please review the image and confirm to add it to your collection"
      });

    } catch (error) {
      console.error('Error previewing image from URL:', error);
      toast({
        title: "Failed to preview image",
        description: error instanceof Error ? error.message : "Invalid image URL. Please use a direct link to an image file.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle confirming image upload
  const handleConfirmUpload = () => {
    if (!previewImage) return;

    // Create new image object
    const newImage: S3Image = {
      id: `url-${Date.now()}`,
      url: previewImage.url,
      name: previewImage.name,
      size: 0, // Unknown size for URL images
      lastModified: new Date().toISOString(),
      category: "Custom",
      tags: ["url", "custom", "uploaded"],
      isSelected: false
    };

    // Add to images list
    const updatedImages = [...images, newImage];
    setImages(updatedImages);
    setFilteredImages(updatedImages);
    setImageLoadStatus(prev => ({ ...prev, [newImage.id]: 'loaded' }));

    // Reset form and close preview
    setImageUrl("");
    setShowUrlInput(false);
    setShowPreview(false);
    setPreviewImage(null);

    toast({
      title: "Image added successfully",
      description: "Image from URL has been added to your collection"
    });
  };

  // Handle canceling preview
  const handleCancelPreview = () => {
    setShowPreview(false);
    setPreviewImage(null);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            const newImage: S3Image = {
              id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              url: result,
              name: file.name,
              size: file.size,
              lastModified: new Date().toISOString(),
              category: "Local Upload",
              tags: ["local", "uploaded", "file"],
              isSelected: false
            };

            setLocalImages(prev => [...prev, newImage]);
            setImages(prev => [...prev, newImage]);
            setFilteredImages(prev => [...prev, newImage]);
            setImageLoadStatus(prev => ({ ...prev, [newImage.id]: 'loaded' }));

            toast({
              title: "Image uploaded successfully",
              description: `${file.name} has been added to your collection`
            });
          }
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
      }
    });

    // Reset file input
    event.target.value = '';
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Select Images from S3
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
                      {/* Search and Filter Controls */}
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-1">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search images by name, tags, or album..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <select
                              value={selectedCategory}
                              onChange={(e) => setSelectedCategory(e.target.value)}
                              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                            >
                              {categories.map(category => (
                                <option key={category} value={category}>
                                  {category === "all" ? "All Categories" : category}
                                </option>
                              ))}
                            </select>
                            <div className="flex border border-input rounded-md">
                              <Button
                                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                              >
                                <Grid3X3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={viewMode === 'list' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                              >
                                <List className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Album View Toggle */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Folder className="h-5 w-5 text-gray-600" />
                            <div>
                              <p className="text-sm font-medium">View by Album</p>
                              <p className="text-xs text-gray-500">Organize images by album folders</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setViewByAlbum(!viewByAlbum);
                              if (!viewByAlbum) {
                                setSelectedAlbum("all");
                              }
                            }}
                            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                          >
                            {viewByAlbum ? (
                              <>
                                <ToggleRight className="h-5 w-5 text-blue-600" />
                                <span className="text-blue-600">Album View</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-5 w-5 text-gray-400" />
                                <span>All Images</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Album Selector */}
                        {viewByAlbum && (
                          <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">Select Album:</label>
                            <select
                              value={selectedAlbum}
                              onChange={(e) => setSelectedAlbum(e.target.value)}
                              className="px-3 py-2 border border-input bg-background rounded-md text-sm flex-1"
                            >
                              {albums.map(album => (
                                <option key={album} value={album}>
                                  {album === "all" ? "All Albums" : album}
                                </option>
                              ))}
                            </select>
                            <Badge variant="secondary" className="text-xs">
                              {images.filter(img => selectedAlbum === "all" ? true : img.album === selectedAlbum).length} images
                            </Badge>
                          </div>
                        )}
                      </div>

          {/* Upload Options Section */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Add Images</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFileUpload(!showFileUpload)}
                >
                  {showFileUpload ? 'Hide' : 'Show'} File Upload
                </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowUrlInput(!showUrlInput)}
                            >
                              Image from Link
                            </Button>
              </div>
            </div>

            {/* File Upload Section */}
            {showFileUpload && (
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Choose Images
                  </label>
                  <span className="text-sm text-muted-foreground">
                    Select multiple images from your device
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload images directly from your computer. Supported formats: JPG, PNG, GIF, WebP
                </p>
              </div>
            )}

                        {/* URL Input Section */}
                        {showUrlInput && (
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Paste image URL here (e.g., https://example.com/image.jpg)"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="flex-1"
                                disabled={isUploading}
                              />
                              <Button
                                onClick={handlePreviewImage}
                                disabled={isUploading || !imageUrl.trim()}
                              >
                                {isUploading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Previewing...
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview Image
                                  </>
                                )}
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">
                                Paste any image URL to preview it. You'll be able to confirm before adding it to your collection.
                              </p>
                              <div className="text-xs text-blue-600">
                                <strong>Test URLs:</strong>
                                <br />
                                • <button 
                                  className="underline hover:text-blue-800"
                                  onClick={() => setImageUrl('https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop&q=80')}
                                >
                                  Unsplash Wedding Photo
                                </button>
                                <br />
                                • <button 
                                  className="underline hover:text-blue-800"
                                  onClick={() => setImageUrl('https://cdn0.weddingwire.in/article/8612/3_2/960/jpg/122168-plushaffairs-cover.jpeg')}
                                >
                                  Wedding Wire Sample
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
          </div>

          {/* Image Preview Modal */}
          {showPreview && previewImage && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Preview Image</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCancelPreview}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Image Preview */}
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={previewImage.url}
                        alt={previewImage.name}
                        className="w-full h-64 object-contain"
                      />
                    </div>
                    
                    {/* Image Details */}
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Image Name:</label>
                        <p className="text-sm text-gray-600">{previewImage.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">URL:</label>
                        <p className="text-sm text-gray-600 break-all">{previewImage.url}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Category:</label>
                        <p className="text-sm text-gray-600">Custom</p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleConfirmUpload}
                        className="flex-1"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Collection
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelPreview}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selected Images Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {images.filter(img => img.isSelected).length} of {images.length} images selected
            </p>
            <Button 
              onClick={handleAddToPortfolio}
              disabled={images.filter(img => img.isSelected).length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Portfolio
            </Button>
          </div>

          {/* Images Grid/List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading images from S3...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Local Uploads Section */}
              {localImages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    Local Uploads
                  </h3>
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" 
                    : "space-y-2"
                  }>
                    {localImages.map((image) => {
                      const loadStatus = imageLoadStatus[image.id];
                      return (
                        <div
                          key={image.id}
                          className={`relative cursor-pointer transition-all duration-200 ${
                            viewMode === 'grid' ? 'group' : 'flex items-center gap-4 p-3 border rounded-lg'
                          } ${image.isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                          onClick={() => loadStatus === 'loaded' ? handleImageSelect(image.id) : undefined}
                        >
                          {viewMode === 'grid' ? (
                            <>
                              <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 relative">
                                {loadStatus === 'loading' && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                  </div>
                                )}
                                {loadStatus === 'error' && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                                    <div className="text-center">
                                      <X className="h-8 w-8 text-red-400 mx-auto mb-1" />
                                      <p className="text-xs text-red-600">Failed to load</p>
                                    </div>
                                  </div>
                                )}
                                {loadStatus === 'loaded' && (
                                  <img
                                    src={image.url}
                                    alt={image.name}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                  />
                                )}
                              </div>
                              
                              {/* Selection Indicator */}
                              {image.isSelected && loadStatus === 'loaded' && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                  <Check className="h-4 w-4 text-white" />
                                </div>
                              )}

                              {/* Image Info Overlay */}
                              {loadStatus === 'loaded' && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                  <p className="text-xs truncate">{image.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {image.category}
                                    </Badge>
                                    <span className="text-xs">{image.size > 0 ? formatFileSize(image.size) : 'Unknown size'}</span>
                                    {loadStatus === 'error' && (
                                      <Badge variant="destructive" className="text-xs">Failed</Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="w-16 h-16 overflow-hidden rounded-lg bg-gray-100 flex-shrink-0 relative">
                                {loadStatus === 'loading' && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                  </div>
                                )}
                                {loadStatus === 'error' && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                                    <X className="h-6 w-6 text-red-400" />
                                  </div>
                                )}
                                {loadStatus === 'loaded' && (
                                  <img
                                    src={image.url}
                                    alt={image.name}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{image.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {image.category}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {image.size > 0 ? formatFileSize(image.size) : 'Unknown size'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(image.lastModified)}
                                  </span>
                                  {loadStatus === 'error' && (
                                    <Badge variant="destructive" className="text-xs">Failed</Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {image.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {image.isSelected && loadStatus === 'loaded' && (
                                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                  <Check className="h-4 w-4 text-white" />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* S3 Images Section */}
              {filteredImages.filter(img => img.category !== "Local Upload").length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Remote Image Storage
                  </h3>
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" 
                    : "space-y-2"
                  }>
                    {filteredImages.filter(img => img.category !== "Local Upload").map((image) => {
                      const loadStatus = imageLoadStatus[image.id];
                      return (
                        <div
                          key={image.id}
                          className={`relative cursor-pointer transition-all duration-200 ${
                            viewMode === 'grid' ? 'group' : 'flex items-center gap-4 p-3 border rounded-lg'
                          } ${image.isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                          onClick={() => loadStatus === 'loaded' ? handleImageSelect(image.id) : undefined}
                        >
                          {viewMode === 'grid' ? (
                            <>
                              <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 relative">
                                {loadStatus === 'loading' && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                  </div>
                                )}
                                {loadStatus === 'error' && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                                    <div className="text-center">
                                      <X className="h-8 w-8 text-red-400 mx-auto mb-1" />
                                      <p className="text-xs text-red-600">Failed to load</p>
                                    </div>
                                  </div>
                                )}
                                {loadStatus === 'loaded' && (
                                  <img
                                    src={image.url}
                                    alt={image.name}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                  />
                                )}
                              </div>
                              
                              {/* Selection Indicator */}
                              {image.isSelected && loadStatus === 'loaded' && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                  <Check className="h-4 w-4 text-white" />
                                </div>
                              )}

                              {/* Image Info Overlay */}
                              {loadStatus === 'loaded' && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                  <p className="text-xs truncate">{image.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {image.category}
                                    </Badge>
                                    <span className="text-xs">{image.size > 0 ? formatFileSize(image.size) : 'Unknown size'}</span>
                                    {loadStatus === 'error' && (
                                      <Badge variant="destructive" className="text-xs">Failed</Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="w-16 h-16 overflow-hidden rounded-lg bg-gray-100 flex-shrink-0 relative">
                                {loadStatus === 'loading' && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                  </div>
                                )}
                                {loadStatus === 'error' && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                                    <X className="h-6 w-6 text-red-400" />
                                  </div>
                                )}
                                {loadStatus === 'loaded' && (
                                  <img
                                    src={image.url}
                                    alt={image.name}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{image.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {image.category}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {image.size > 0 ? formatFileSize(image.size) : 'Unknown size'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(image.lastModified)}
                                  </span>
                                  {loadStatus === 'error' && (
                                    <Badge variant="destructive" className="text-xs">Failed</Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {image.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {image.isSelected && loadStatus === 'loaded' && (
                                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                  <Check className="h-4 w-4 text-white" />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredImages.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 mb-2">No images found</p>
              <p className="text-sm text-gray-400">
                {searchTerm || selectedCategory !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "Upload some images to get started"
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

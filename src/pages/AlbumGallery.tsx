import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Image, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchAlbumById, fetchProjectDetails } from "@/hooks/photobank/api/photobankApi";
import { useAuth } from "@/contexts/AuthContext";
import { PortfolioSidebar } from "@/components/portfolio/PortfolioSidebar";

export default function AlbumGallery() {
  const navigate = useNavigate();
  const { projectId, albumId } = useParams<{ projectId: string; albumId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [albumName, setAlbumName] = useState<string>("");
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [images, setImages] = useState<Array<{ image_uuid: string; image_access_url: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gridColumns, setGridColumns] = useState<number>(3); // 2, 3, or 4 columns
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [visibleThumbnails, setVisibleThumbnails] = useState<Set<number>>(new Set());
  const thumbnailStripRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!projectId || !albumId) {
      toast({
        title: "Error",
        description: "Project ID or Album ID is missing",
        variant: "destructive"
      });
      navigate("/photobank");
      return;
    }

    loadAlbumData();
  }, [projectId, albumId]);

  const scrollToThumbnail = useCallback((index: number) => {
    if (thumbnailStripRef.current && images.length > 0) {
      const container = thumbnailStripRef.current;
      const thumbnailElement = container.children[index] as HTMLElement;
      if (thumbnailElement) {
        // Get container and thumbnail dimensions
        const containerRect = container.getBoundingClientRect();
        const thumbnailRect = thumbnailElement.getBoundingClientRect();
        
        // Calculate the position to center the thumbnail
        const thumbnailLeft = thumbnailElement.offsetLeft;
        const thumbnailWidth = thumbnailRect.width;
        const containerWidth = containerRect.width;
        
        // Calculate scroll position to center the thumbnail
        const scrollLeft = thumbnailLeft - (containerWidth / 2) + (thumbnailWidth / 2);
        
        // Ensure we don't scroll beyond boundaries
        const maxScroll = container.scrollWidth - containerWidth;
        const finalScrollLeft = Math.max(0, Math.min(scrollLeft, maxScroll));
        
        container.scrollTo({ left: finalScrollLeft, behavior: 'smooth' });
      }
    }
  }, [images.length]);

  const handlePreviousImage = useCallback(() => {
    setSelectedImageIndex((prev) => {
      if (prev === null || images.length === 0) return prev;
      setSlideDirection('right'); // Moving to previous = sliding from right
      return prev === 0 ? images.length - 1 : prev - 1;
    });
  }, [images.length]);

  const handleNextImage = useCallback(() => {
    setSelectedImageIndex((prev) => {
      if (prev === null || images.length === 0) return prev;
      setSlideDirection('left'); // Moving to next = sliding from left
      return (prev + 1) % images.length;
    });
  }, [images.length]);

  // Intersection Observer for lazy loading thumbnails
  useEffect(() => {
    if (images.length === 0 || !thumbnailStripRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-thumbnail-index') || '0', 10);
            setVisibleThumbnails((prev) => new Set([...prev, index]));
          }
        });
      },
      {
        root: thumbnailStripRef.current.parentElement, // Use the scrollable container
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0.01
      }
    );

    // Observe all thumbnail elements that are currently in the refs map
    const observeElements = () => {
      thumbnailRefs.current.forEach((element) => {
        if (element) {
          observer.observe(element);
        }
      });
    };

    // Initial observation
    observeElements();

    // Re-observe when refs change (using a small delay to ensure DOM is updated)
    const timeoutId = setTimeout(observeElements, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [images.length, visibleThumbnails]);

  // Auto-scroll thumbnail strip when selected image changes and preload nearby thumbnails
  useEffect(() => {
    if (selectedImageIndex !== null && images.length > 0) {
      // Ensure selected thumbnail and nearby thumbnails are visible
      const preloadRange = 5; // Preload 5 thumbnails on each side
      const indicesToLoad = new Set<number>();
      
      for (let i = -preloadRange; i <= preloadRange; i++) {
        let index = selectedImageIndex + i;
        if (index < 0) index = images.length + index;
        if (index >= images.length) index = index % images.length;
        indicesToLoad.add(index);
      }
      
      setVisibleThumbnails((prev) => new Set([...prev, ...indicesToLoad]));
      
      // Small delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        scrollToThumbnail(selectedImageIndex);
      }, 150);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedImageIndex, images.length, scrollToThumbnail]);

  // Keyboard navigation for photo viewer
  useEffect(() => {
    if (selectedImageIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePreviousImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      } else if (e.key === 'Escape') {
        setSelectedImageIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, handlePreviousImage, handleNextImage]);

  const handleImageClick = (index: number) => {
    if (selectedImageIndex !== null && index > selectedImageIndex) {
      setSlideDirection('left'); // Moving forward
    } else if (selectedImageIndex !== null && index < selectedImageIndex) {
      setSlideDirection('right'); // Moving backward
    }
    setSelectedImageIndex(index);
  };

  const handleGridChange = (value: number) => {
    // Map slider value (0-100) to columns (2-4)
    // 0-33 = 2 columns, 34-66 = 3 columns, 67-100 = 4 columns
    if (value <= 33) {
      setGridColumns(2);
    } else if (value <= 66) {
      setGridColumns(3);
    } else {
      setGridColumns(4);
    }
  };

  const handleGridChangeEnd = (value: number) => {
    // Snap to nearest value when released - smooth snapping
    // Calculate distance to each option and choose nearest
    const distances = [
      { cols: 2, position: 0 },
      { cols: 3, position: 50 },
      { cols: 4, position: 100 }
    ];
    
    const nearest = distances.reduce((prev, curr) => {
      const prevDist = Math.abs(value - prev.position);
      const currDist = Math.abs(value - curr.position);
      return currDist < prevDist ? curr : prev;
    });
    
    setGridColumns(nearest.cols);
  };

  const getSliderValue = () => {
    // Convert columns back to slider value for smooth positioning
    if (gridColumns === 2) return 0;
    if (gridColumns === 3) return 50;
    return 100;
  };

  const loadAlbumData = async () => {
    if (!projectId || !albumId) return;

    setIsLoading(true);
    try {
      // Fetch project details for the title
      const projectData = await fetchProjectDetails(projectId);
      if (projectData) {
        setProjectTitle(projectData.project_title || "Project");
      }

      // Fetch album data
      const albumData = await fetchAlbumById(albumId);
      if (albumData) {
        setAlbumName(albumData.album_name || "Album");
        
        // Extract images from album data
        if (albumData.album_photos_kv_json?.images) {
          setImages(albumData.album_photos_kv_json.images);
        } else {
          setImages([]);
        }
      } else {
        toast({
          title: "Error",
          description: "Album not found",
          variant: "destructive"
        });
        navigate(`/photobank/project/${projectId}/edit`);
      }
    } catch (error: any) {
      console.error('Error loading album data:', error);
      toast({
        title: "Error loading album",
        description: error.message || "Failed to load album details",
        variant: "destructive"
      });
      navigate(`/photobank/project/${projectId}/edit`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
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
              <div className="min-h-screen bg-white">
                <div className="max-w-6xl mx-auto px-6 pt-4 pb-6">
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-gray-600">Loading album...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/photobank/project/${projectId}/edit`)}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <div>
                      <h1 className="text-2xl font-bold">{albumName}</h1>
                      <p className="text-sm text-gray-600">{projectTitle}</p>
                    </div>
                  </div>
                </div>

                {/* Grid View Selector - Volume Bar Style */}
                {images.length > 0 && (
                  <div className="mb-6 flex items-center gap-4">
                    <span className="text-sm text-gray-600 whitespace-nowrap">Grid View:</span>
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                      {/* Volume bar style indicator */}
                      <div className="flex items-end gap-1 h-8 flex-1">
                        {[2, 3, 4].map((cols) => {
                          const isActive = gridColumns === cols;
                          const height = cols === 2 ? 'h-3' : cols === 3 ? 'h-5' : 'h-8';
                          return (
                            <div
                              key={cols}
                              className={`flex-1 rounded-t transition-all duration-200 ${
                                isActive 
                                  ? 'bg-blue-500' 
                                  : 'bg-gray-300 hover:bg-gray-400'
                              } ${height} cursor-pointer`}
                              onClick={() => setGridColumns(cols)}
                            />
                          );
                        })}
                      </div>
                      {/* Slider for smooth control */}
                      <div className="flex items-center gap-2 flex-1 max-w-xs">
                        <span className="text-xs text-gray-500 font-medium">2</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={getSliderValue()}
                          onChange={(e) => handleGridChange(Number(e.target.value))}
                          onMouseUp={(e) => handleGridChangeEnd(Number((e.target as HTMLInputElement).value))}
                          onTouchEnd={(e) => handleGridChangeEnd(Number((e.target as HTMLInputElement).value))}
                          className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${getSliderValue()}%, #e5e7eb ${getSliderValue()}%, #e5e7eb 100%)`
                          }}
                        />
                        <span className="text-xs text-gray-500 font-medium">4</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700 min-w-[70px] text-right">
                        {gridColumns} per row
                      </span>
                    </div>
                  </div>
                )}

                {/* Images Grid */}
                {images.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Image className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">No images in this album</p>
                    </div>
                  </div>
                ) : (
                  <div className={`grid gap-4 ${
                    gridColumns === 2 ? 'grid-cols-2' : 
                    gridColumns === 3 ? 'grid-cols-3' : 
                    'grid-cols-4'
                  }`}>
                    {images.map((image, index) => (
                      <div
                        key={image.image_uuid}
                        className="aspect-square overflow-hidden rounded-lg bg-gray-100 group cursor-pointer"
                        onClick={() => handleImageClick(index)}
                      >
                        <img
                          src={image.image_access_url}
                          alt={`Image ${image.image_uuid}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Photo Viewer Modal - Mac Photo Viewer Style */}
                {selectedImageIndex !== null && images[selectedImageIndex] && (
                  <div 
                    className="fixed inset-0 z-50 bg-black/95 flex flex-col"
                    onClick={() => setSelectedImageIndex(null)}
                  >
                    {/* Top Bar - Album Name and Close Button */}
                    <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4">
                      <div className="flex-1"></div>
                      <div className="flex-1 flex items-center justify-center">
                        <h2 className="text-white text-xl font-semibold">{albumName}</h2>
                      </div>
                      <div className="flex-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white hover:bg-white/20 h-10 w-10"
                          onClick={() => setSelectedImageIndex(null)}
                        >
                          <X className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>

                    {/* Main Image Area - Center 90% with Side Previews */}
                    <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
                      {/* Previous Button */}
                      {images.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-4 text-white hover:bg-white/20 z-10 h-12 w-12"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviousImage();
                          }}
                        >
                          <ChevronLeft className="h-8 w-8" />
                        </Button>
                      )}

                      {/* Next Button */}
                      {images.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-4 text-white hover:bg-white/20 z-10 h-12 w-12"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNextImage();
                          }}
                        >
                          <ChevronRight className="h-8 w-8" />
                        </Button>
                      )}

                      {/* Three Image Layout with Sliding Effect */}
                      <div 
                        className="w-full h-full flex items-center justify-center relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Previous Image Preview (Left - 10% width) */}
                        {images.length > 1 && (
                          <div 
                            key={`prev-${selectedImageIndex}`}
                            className="absolute left-0 h-full w-[10%] flex items-center justify-start overflow-hidden opacity-70 transition-opacity duration-300"
                            style={{
                              boxShadow: 'inset 15px 0 30px -10px rgba(0, 0, 0, 0.9)'
                            }}
                          >
                            <img
                              src={images[selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1].image_access_url}
                              alt="Previous"
                              className="h-[90vh] w-auto object-contain transition-transform duration-300 ease-in-out"
                              style={{ transform: 'translateX(-90%)' }}
                            />
                          </div>
                        )}

                        {/* Main Image (Center - 80% visible) with Slide Animation */}
                        <div 
                          key={`main-${selectedImageIndex}`}
                          className={`flex-1 h-full flex items-center justify-center ${
                            slideDirection === 'left' 
                              ? 'animate-slide-in-from-left' 
                              : slideDirection === 'right' 
                              ? 'animate-slide-in-from-right' 
                              : ''
                          }`}
                        >
                          <img
                            src={images[selectedImageIndex].image_access_url}
                            alt={`Image ${selectedImageIndex + 1}`}
                            className="max-w-[80vw] max-h-[90vh] object-contain"
                          />
                        </div>

                        {/* Next Image Preview (Right - 10% width) */}
                        {images.length > 1 && (
                          <div 
                            key={`next-${selectedImageIndex}`}
                            className="absolute right-0 h-full w-[10%] flex items-center justify-end overflow-hidden opacity-70 transition-opacity duration-300"
                            style={{
                              boxShadow: 'inset -15px 0 30px -10px rgba(0, 0, 0, 0.9)'
                            }}
                          >
                            <img
                              src={images[(selectedImageIndex + 1) % images.length].image_access_url}
                              alt="Next"
                              className="h-[90vh] w-auto object-contain transition-transform duration-300 ease-in-out"
                              style={{ transform: 'translateX(90%)' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom 10% - Thumbnail Strip */}
                    <div className="h-[10vh] bg-black/50 border-t border-white/10 overflow-x-auto">
                      <div ref={thumbnailStripRef} className="flex items-center h-full gap-2 px-4">
                        {images.map((image, index) => {
                          const isVisible = visibleThumbnails.has(index) || index === selectedImageIndex;
                          const thumbnailRef = (el: HTMLDivElement | null) => {
                            if (el) {
                              thumbnailRefs.current.set(index, el);
                              // Observe this element when it's added
                              if (thumbnailStripRef.current?.parentElement) {
                                const observer = new IntersectionObserver(
                                  (entries) => {
                                    entries.forEach((entry) => {
                                      if (entry.isIntersecting) {
                                        setVisibleThumbnails((prev) => new Set([...prev, index]));
                                        observer.unobserve(entry.target);
                                      }
                                    });
                                  },
                                  {
                                    root: thumbnailStripRef.current.parentElement,
                                    rootMargin: '100px',
                                    threshold: 0.01
                                  }
                                );
                                observer.observe(el);
                              }
                            } else {
                              thumbnailRefs.current.delete(index);
                            }
                          };

                          return (
                            <div
                              key={image.image_uuid}
                              ref={thumbnailRef}
                              data-thumbnail-index={index}
                              className={`flex-shrink-0 h-[80%] cursor-pointer rounded border-2 transition-all ${
                                index === selectedImageIndex
                                  ? 'border-white scale-110'
                                  : 'border-transparent opacity-60 hover:opacity-100'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (selectedImageIndex !== null && index > selectedImageIndex) {
                                  setSlideDirection('left'); // Moving forward
                                } else if (selectedImageIndex !== null && index < selectedImageIndex) {
                                  setSlideDirection('right'); // Moving backward
                                }
                                setSelectedImageIndex(index);
                              }}
                            >
                              {isVisible ? (
                                <img
                                  src={image.image_access_url}
                                  alt={`Thumbnail ${index + 1}`}
                                  className="h-full w-auto object-cover rounded"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="h-full w-20 bg-gray-800 rounded flex items-center justify-center">
                                  <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


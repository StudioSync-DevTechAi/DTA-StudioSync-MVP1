import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Image, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchProjectDetails, fetchAlbumsStorage, fetchLinkedAlbums } from "@/hooks/photobank/api/photobankApi";
import { useAuth } from "@/contexts/AuthContext";
import { PortfolioSidebar } from "@/components/portfolio/PortfolioSidebar";

interface Album {
  id: string;
  name: string;
  thumbnailUrl?: string;
  albumId?: string;
  images?: Array<{ image_uuid: string; image_access_url: string }>;
}


export default function ProjectEdit() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
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

  const [projectTitle, setProjectTitle] = useState<string>("");
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      toast({
        title: "Error",
        description: "Project ID is missing",
        variant: "destructive"
      });
      navigate("/photobank");
      return;
    }

    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      // Fetch project details
      const projectData = await fetchProjectDetails(projectId);
      if (projectData) {
        setProjectTitle(projectData.project_title || "Project");
      }

      // Fetch saved albums
      const savedAlbums = await fetchAlbumsStorage(projectId);
      const albumsFromDB: Album[] = savedAlbums.map((album: any) => ({
        id: album.album_id,
        name: album.album_name || "Untitled Album",
        thumbnailUrl: album.album_photos_kv_json?.album_thumbnail_url || undefined,
        albumId: album.album_id,
      }));

      // Fetch linked albums
      const linkedAlbums = await fetchLinkedAlbums(projectId);
      const linkedAlbumsFormatted: Album[] = linkedAlbums.map((linkedAlbum: any) => ({
        id: `linked-${linkedAlbum.album_id}`,
        name: linkedAlbum.album_name || "Untitled Album",
        thumbnailUrl: linkedAlbum.album_thumbnail_url || undefined,
        albumId: linkedAlbum.album_id,
      }));

      // Combine saved and linked albums
      setAlbums([...albumsFromDB, ...linkedAlbumsFormatted]);
    } catch (error: any) {
      console.error('Error loading project data:', error);
      toast({
        title: "Error loading project",
        description: error.message || "Failed to load project details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAlbumGallery = (album: Album) => {
    // Navigate to album gallery page
    // For linked albums, the id is "linked-{albumId}", so extract the actual albumId
    // For regular albums, use albumId directly
    const actualAlbumId = album.albumId || (album.id.startsWith('linked-') ? album.id.replace('linked-', '') : album.id);
    
    if (actualAlbumId && projectId) {
      navigate(`/photobank/project/${projectId}/album/${actualAlbumId}`);
    } else {
      toast({
        title: "Error",
        description: "Album ID or Project ID is missing",
        variant: "destructive"
      });
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
              <div className="min-h-screen bg-gray-50">
                <div className="max-w-6xl mx-auto px-6 pt-4 pb-6">
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-gray-600">Loading project...</span>
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
                      onClick={() => navigate("/photobank")}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <h1 className="text-2xl font-bold">{projectTitle}</h1>
                  </div>
                </div>

      {/* Albums Grid */}
      {albums.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Image className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No albums found for this project</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {albums.map((album) => {
              const isLinkedAlbum = album.id.startsWith('linked-');

              return (
                <Card
                  key={album.id}
                  className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleOpenAlbumGallery(album)}
                >
                  <div className="aspect-video overflow-hidden bg-gray-100 relative">
                    {album.thumbnailUrl ? (
                      <img
                        src={album.thumbnailUrl}
                        alt={album.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    {/* Album title overlay at the top */}
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-3">
                      <h3 className="font-semibold text-lg text-white truncate">{album.name}</h3>
                    </div>
                    {/* Status badge */}
                    {isLinkedAlbum && (
                      <div className="absolute top-3 right-3 bg-blue-500/90 text-white text-xs font-semibold px-2 py-1 rounded">
                        Linked
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


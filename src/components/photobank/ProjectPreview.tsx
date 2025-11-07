/**
 * Project Preview Component
 * Displays a preview of project details on hover
 */

import { Card, CardContent } from '@/components/ui/card';
import { Image, Folder } from 'lucide-react';
import type { ProjectPreviewData } from '@/services/preview/types';
import { useState, useEffect } from 'react';

interface ProjectPreviewProps {
  project: ProjectPreviewData | null;
  isLoading?: boolean;
}

export function ProjectPreview({ project, isLoading }: ProjectPreviewProps) {
  const [hoveredAlbumIndex, setHoveredAlbumIndex] = useState<number | null>(null);

  if (isLoading || !project) {
    return (
      <div className="fixed bg-white rounded-lg shadow-2xl border border-gray-300 p-4 pointer-events-auto" style={{ zIndex: 1000, width: '480px', minHeight: '320px' }}>
        <div className="w-full">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-gray-700 text-sm text-center mt-3">Loading preview...</p>
        </div>
      </div>
    );
  }

  // Determine which image to show in the main section
  const getMainImage = () => {
    if (hoveredAlbumIndex !== null && project.albums[hoveredAlbumIndex]) {
      const album = project.albums[hoveredAlbumIndex];
      if (album.thumbnail_url) {
        return album.thumbnail_url;
      } else if (album.images.length > 0) {
        return album.images[0].image_access_url;
      }
    }
    
    // Default: show project thumbnail or first album image
    if (project.thumbnail_url) {
      return project.thumbnail_url;
    } else if (project.albums.length > 0 && project.albums[0]?.images.length > 0) {
      return project.albums[0].images[0].image_access_url;
    }
    
    return null;
  };

  const currentMainImage = getMainImage();

  return (
    <div className="fixed bg-white rounded-lg shadow-2xl border border-gray-300 overflow-hidden pointer-events-auto" style={{ zIndex: 1000, width: '480px', maxHeight: '600px' }}>
      <div className="w-full h-full bg-white flex flex-col">
        {/* Top Section - Title only with white background */}
        <div className="px-4 py-3 bg-white flex-shrink-0">
          <h3 className="text-gray-900 text-lg font-semibold truncate">
            {project.project_title}
          </h3>
        </div>

        {/* Main Image Section - Occupies upper section, changes on hover */}
        <div className="flex-shrink-0 h-64 overflow-hidden bg-gray-100">
          {currentMainImage ? (
            <img
              src={currentMainImage}
              alt={project.project_title}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          ) : (
            <div className="h-full bg-gray-100 flex items-center justify-center">
              <Image className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Albums Grid - Bottom Section */}
        <div className="p-4 flex-1 overflow-auto bg-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-gray-400" />
              <span className="text-white text-sm font-medium">
                {project.album_count} {project.album_count === 1 ? 'Album' : 'Albums'}
              </span>
            </div>
            {project.total_images > 0 && (
              <span className="text-gray-400 text-xs">
                {project.total_images} images
              </span>
            )}
          </div>

          {project.albums.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {project.albums.map((album, index) => (
                <div
                  key={album.album_id}
                  className="relative aspect-square rounded overflow-hidden border border-gray-700 bg-gray-900 cursor-pointer transition-transform hover:scale-105"
                  onMouseEnter={() => setHoveredAlbumIndex(index)}
                  onMouseLeave={() => setHoveredAlbumIndex(null)}
                >
                  {album.thumbnail_url ? (
                    <img
                      src={album.thumbnail_url}
                      alt={album.album_name}
                      className="w-full h-full object-cover"
                    />
                  ) : album.images.length > 0 ? (
                    <div className="w-full h-full grid grid-cols-2 gap-0.5 p-0.5">
                      {album.images.slice(0, 4).map((img, idx) => (
                        <img
                          key={img.image_uuid || idx}
                          src={img.image_access_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-6 w-6 text-gray-600" />
                    </div>
                  )}
                  {album.is_linked && (
                    <div className="absolute top-1 right-1 bg-blue-500/80 text-white text-xs px-1 rounded">
                      L
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-1 py-1 truncate">
                    {album.album_name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              No albums in this project
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/**
 * Album Preview Component
 * Displays a preview of album cards on hover
 */

import { Card, CardContent } from '@/components/ui/card';
import { Image } from 'lucide-react';
import type { AlbumPreviewData } from '@/services/preview/types';

interface AlbumPreviewProps {
  albums: AlbumPreviewData[];
  isLoading?: boolean;
}

export function AlbumPreview({ albums, isLoading }: AlbumPreviewProps) {
  console.log('🎨 AlbumPreview rendered:', { albumsCount: albums.length, isLoading, hasData: albums.length > 0 });
  
  // Always show loading state if isLoading is true OR if we have no data yet
  if (isLoading || albums.length === 0) {
    return (
      <div className="fixed bg-black/95 rounded-lg shadow-2xl border border-gray-700 p-4 pointer-events-auto" style={{ zIndex: 1000, width: '360px', minHeight: '240px' }}>
        <div className="w-full">
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-white text-sm text-center mt-3">
            {isLoading ? 'Loading preview...' : 'Preparing preview...'}
          </p>
        </div>
      </div>
    );
  }

  // For single album preview, show a compact card view
  if (albums.length === 1) {
    const album = albums[0];
    return (
      <div className="fixed bg-black/95 rounded-lg shadow-2xl border border-gray-700 overflow-hidden pointer-events-auto" style={{ zIndex: 1000, width: '360px', maxHeight: '480px' }}>
        <div className="w-full h-full bg-gray-800 flex flex-col">
          {album.thumbnail_url ? (
            <div className="h-64 overflow-hidden bg-gray-900">
              <img
                src={album.thumbnail_url}
                alt={album.album_name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : album.images.length > 0 ? (
            <div className="h-64 grid grid-cols-2 gap-1 bg-gray-900 p-1">
              {album.images.slice(0, 4).map((img, idx) => (
                <img
                  key={img.image_uuid || idx}
                  src={img.image_access_url}
                  alt={`${album.album_name} ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              ))}
            </div>
          ) : (
            <div className="h-64 bg-gray-900 flex items-center justify-center">
              <Image className="h-12 w-12 text-gray-600" />
            </div>
          )}
          <div className="p-4 flex-shrink-0 border-t border-gray-700">
            <p className="text-white text-base font-semibold truncate mb-2">
              {album.album_name}
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{album.image_count} images</span>
              {album.is_linked && (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                  Linked
                </span>
              )}
              {album.sub_event_name && (
                <span className="text-gray-500 truncate ml-2 text-xs">{album.sub_event_name}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For multiple albums, show grid
  return (
    <div className="fixed bg-black/95 rounded-lg shadow-2xl border border-gray-700 p-4 overflow-auto pointer-events-auto" style={{ zIndex: 1000, width: '480px', maxHeight: '600px' }}>
      <div className="w-full grid grid-cols-2 gap-3">
        {albums.map((album) => (
          <div
            key={album.album_id}
            className="bg-gray-800 border border-gray-700 rounded overflow-hidden flex flex-col"
          >
            {album.thumbnail_url ? (
              <div className="flex-1 overflow-hidden bg-gray-900">
                <img
                  src={album.thumbnail_url}
                  alt={album.album_name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : album.images.length > 0 ? (
              <div className="flex-1 grid grid-cols-2 gap-0.5 bg-gray-900 p-0.5">
                {album.images.slice(0, 4).map((img, idx) => (
                  <img
                    key={img.image_uuid || idx}
                    src={img.image_access_url}
                    alt={`${album.album_name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ))}
              </div>
            ) : (
              <div className="flex-1 bg-gray-900 flex items-center justify-center">
                <Image className="h-6 w-6 text-gray-600" />
              </div>
            )}
            <div className="p-3 flex-shrink-0 border-t border-gray-700">
              <p className="text-white text-sm font-medium truncate mb-1">
                {album.album_name}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{album.image_count} images</span>
                {album.is_linked && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                    Linked
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Integration tests for Image Upload Service
 * Tests the unified image storage functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  uploadImageDirect, 
  uploadImageViaEdgeFunction,
  getImageByUuid,
  deleteImageByUuid,
  ImageUploadResponse 
} from '../imageUploadService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    storage: {
      from: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('Image Upload Service Integration Tests', () => {
  const mockFile = new File(['test image content'], 'test.jpg', { type: 'image/jpeg' });
  const mockUserId = 'test-user-id';
  const mockImageUuid = '550e8400-e29b-41d4-a716-446655440000';
  const mockStoragePath = `images/${mockUserId}/1234567890-abc123-test.jpg`;
  const mockPublicUrl = `https://test.supabase.co/storage/v1/object/public/images/${mockStoragePath}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadImageDirect', () => {
    it('should upload image and return Image_UUID and Image_AccessURL', async () => {
      // Mock user authentication
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      // Mock storage upload
      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: mockStoragePath },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: mockPublicUrl },
        }),
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      // Mock database insert
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                image_uuid: mockImageUuid,
                image_obj: mockStoragePath,
                image_access_url: mockPublicUrl,
                file_name: 'test.jpg',
                file_size: mockFile.size,
                mime_type: 'image/jpeg',
                user_id: mockUserId,
              },
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const result = await uploadImageDirect({ file: mockFile });

      expect(result).toEqual({
        Image_UUID: expect.any(String),
        Image_AccessURL: expect.stringContaining('https://'),
      });
      expect(result.Image_UUID).toBeTruthy();
      expect(result.Image_AccessURL).toBeTruthy();
    });

    it('should throw error if user is not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      await expect(uploadImageDirect({ file: mockFile })).rejects.toThrow('Not authenticated');
    });

    it('should throw error if file size exceeds limit', async () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      await expect(uploadImageDirect({ file: largeFile })).rejects.toThrow('File size exceeds');
    });

    it('should throw error if file is not an image', async () => {
      const textFile = new File(['not an image'], 'test.txt', { type: 'text/plain' });

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      await expect(uploadImageDirect({ file: textFile })).rejects.toThrow('File must be an image');
    });
  });

  describe('uploadImageViaEdgeFunction', () => {
    it('should upload via Edge Function and return Image_UUID and Image_AccessURL', async () => {
      const mockSession = {
        access_token: 'mock-token',
      };

      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock fetch for Edge Function
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          Image_UUID: mockImageUuid,
          Image_AccessURL: mockPublicUrl,
        }),
      });

      const result = await uploadImageViaEdgeFunction({ file: mockFile });

      expect(result).toEqual({
        Image_UUID: mockImageUuid,
        Image_AccessURL: mockPublicUrl,
      });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/upload-image'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
          }),
        })
      );
    });

    it('should fallback to direct upload if Edge Function fails', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: { access_token: 'mock-token' } },
        error: null,
      });

      // Mock fetch to fail
      global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      // Mock direct upload to succeed
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: mockStoragePath },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: mockPublicUrl },
        }),
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                image_uuid: mockImageUuid,
                image_obj: mockStoragePath,
                image_access_url: mockPublicUrl,
              },
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const result = await uploadImageViaEdgeFunction({ file: mockFile });

      expect(result).toEqual({
        Image_UUID: expect.any(String),
        Image_AccessURL: expect.stringContaining('https://'),
      });
    });
  });

  describe('getImageByUuid', () => {
    it('should retrieve image by UUID', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                image_uuid: mockImageUuid,
                image_obj: mockStoragePath,
                image_access_url: mockPublicUrl,
                image_create_datetime: new Date().toISOString(),
                file_name: 'test.jpg',
                file_size: 1024,
                mime_type: 'image/jpeg',
              },
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const result = await getImageByUuid(mockImageUuid);

      expect(result).toBeTruthy();
      expect(result?.image_uuid).toBe(mockImageUuid);
      expect(result?.image_access_url).toBe(mockPublicUrl);
    });

    it('should return null if image not found', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const result = await getImageByUuid('non-existent-uuid');

      expect(result).toBeNull();
    });
  });

  describe('deleteImageByUuid', () => {
    it('should delete image from storage and database', async () => {
      // Mock getImageByUuid
      const mockFrom = vi.fn().mockImplementation((table) => {
        if (table === 'image_obj_storage_table') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    image_uuid: mockImageUuid,
                    image_obj: mockStoragePath,
                    image_access_url: mockPublicUrl,
                  },
                  error: null,
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const mockStorageFrom = vi.fn().mockReturnValue({
        remove: vi.fn().mockResolvedValue({
          error: null,
        }),
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      await expect(deleteImageByUuid(mockImageUuid)).resolves.not.toThrow();
    });

    it('should throw error if image not found', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      (supabase.from as any).mockImplementation(mockFrom);

      await expect(deleteImageByUuid('non-existent-uuid')).rejects.toThrow('Image not found');
    });
  });

  describe('Response Format', () => {
    it('should return response in correct format: { Image_UUID, Image_AccessURL }', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: mockStoragePath },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: mockPublicUrl },
        }),
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                image_uuid: mockImageUuid,
                image_obj: mockStoragePath,
                image_access_url: mockPublicUrl,
              },
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const result = await uploadImageDirect({ file: mockFile });

      // Verify response format
      expect(result).toHaveProperty('Image_UUID');
      expect(result).toHaveProperty('Image_AccessURL');
      expect(typeof result.Image_UUID).toBe('string');
      expect(typeof result.Image_AccessURL).toBe('string');
      expect(result.Image_UUID.length).toBeGreaterThan(0);
      expect(result.Image_AccessURL.length).toBeGreaterThan(0);
      expect(result.Image_AccessURL).toMatch(/^https?:\/\//);
    });
  });
});


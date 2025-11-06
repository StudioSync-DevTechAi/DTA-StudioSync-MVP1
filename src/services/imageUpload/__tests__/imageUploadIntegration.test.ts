/**
 * End-to-End Integration Tests for Image Upload
 * These tests require a running Supabase instance
 * Run with: npm test -- imageUploadIntegration.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { 
  uploadImageDirect, 
  getImageByUuid,
  deleteImageByUuid,
} from '../imageUploadService';
import { supabase } from '@/integrations/supabase/client';

// Skip these tests if running in CI without Supabase credentials
const SKIP_INTEGRATION_TESTS = process.env.SKIP_INTEGRATION_TESTS === 'true' || !process.env.VITE_SUPABASE_URL;

describe.skipIf(SKIP_INTEGRATION_TESTS)('Image Upload Integration Tests (E2E)', () => {
  let testUserId: string;
  let uploadedImageUuid: string;
  let uploadedImageUrl: string;

  beforeAll(async () => {
    // Sign in or create test user
    // Note: In a real scenario, you'd use test credentials
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Try to sign in with test credentials if available
      const { data: { user: signedInUser } } = await supabase.auth.signInWithPassword({
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'testpassword',
      });
      testUserId = signedInUser?.id || '';
    } else {
      testUserId = user.id;
    }
  });

  it('should upload an image and return Image_UUID and Image_AccessURL', async () => {
    // Create a test image file
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, 0, 100, 100);
    }

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/jpeg');
    });

    const testFile = new File([blob], 'test-image.jpg', { type: 'image/jpeg' });

    // Upload image
    const result = await uploadImageDirect({ file: testFile });

    // Verify response format
    expect(result).toHaveProperty('Image_UUID');
    expect(result).toHaveProperty('Image_AccessURL');
    expect(result.Image_UUID).toBeTruthy();
    expect(result.Image_AccessURL).toBeTruthy();
    expect(result.Image_AccessURL).toMatch(/^https?:\/\//);

    // Store for cleanup
    uploadedImageUuid = result.Image_UUID;
    uploadedImageUrl = result.Image_AccessURL;
  }, 30000); // 30 second timeout

  it('should retrieve uploaded image by UUID', async () => {
    if (!uploadedImageUuid) {
      // Skip if previous test didn't run
      return;
    }

    const image = await getImageByUuid(uploadedImageUuid);

    expect(image).toBeTruthy();
    expect(image?.image_uuid).toBe(uploadedImageUuid);
    expect(image?.image_access_url).toBe(uploadedImageUrl);
    expect(image?.file_name).toBeTruthy();
  }, 10000);

  it('should delete uploaded image', async () => {
    if (!uploadedImageUuid) {
      return;
    }

    await expect(deleteImageByUuid(uploadedImageUuid)).resolves.not.toThrow();

    // Verify image is deleted
    const image = await getImageByUuid(uploadedImageUuid);
    expect(image).toBeNull();
  }, 10000);

  it('should handle multiple concurrent uploads', async () => {
    const files: File[] = [];
    
    // Create 3 test images
    for (let i = 0; i < 3; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 50;
      canvas.height = 50;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = `#${i.toString().repeat(6)}`;
        ctx.fillRect(0, 0, 50, 50);
      }
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg');
      });
      files.push(new File([blob], `test-${i}.jpg`, { type: 'image/jpeg' }));
    }

    // Upload all concurrently
    const uploadPromises = files.map(file => uploadImageDirect({ file }));
    const results = await Promise.all(uploadPromises);

    // Verify all uploads succeeded
    expect(results).toHaveLength(3);
    results.forEach(result => {
      expect(result).toHaveProperty('Image_UUID');
      expect(result).toHaveProperty('Image_AccessURL');
    });

    // Cleanup: delete all uploaded images
    await Promise.all(
      results.map(result => deleteImageByUuid(result.Image_UUID).catch(() => {}))
    );
  }, 60000);

  it('should reject files that are too large', async () => {
    // Create a large file (11MB)
    const largeBlob = new Blob(['x'.repeat(11 * 1024 * 1024)], { type: 'image/jpeg' });
    const largeFile = new File([largeBlob], 'large.jpg', { type: 'image/jpeg' });

    await expect(uploadImageDirect({ file: largeFile })).rejects.toThrow('File size exceeds');
  }, 10000);

  it('should reject non-image files', async () => {
    const textFile = new File(['not an image'], 'test.txt', { type: 'text/plain' });

    await expect(uploadImageDirect({ file: textFile })).rejects.toThrow('File must be an image');
  }, 10000);
});


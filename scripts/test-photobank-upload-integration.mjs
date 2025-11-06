#!/usr/bin/env node

/**
 * PhotoBank Image Upload Integration Test
 * Tests the complete flow: authentication -> upload -> database storage -> retrieval
 * 
 * Run with: node scripts/test-photobank-upload-integration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envFile = join(__dirname, '..', '.env');
let envVars = {};
try {
  const envContent = readFileSync(envFile, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
} catch (error) {
  console.warn('Could not read .env file, using process.env');
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || envVars.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || envVars.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test results
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'
  };
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${colors[type]}${icon} ${message}${colors.reset}`);
}

async function test(name, testFn) {
  try {
    log(`Testing: ${name}`, 'info');
    await testFn();
    results.passed++;
    log(`PASSED: ${name}`, 'success');
    return true;
  } catch (error) {
    results.failed++;
    results.errors.push({ test: name, error: error.message });
    log(`FAILED: ${name} - ${error.message}`, 'error');
    console.error(error);
    return false;
  }
}

async function main() {
  console.log('\n🧪 PhotoBank Image Upload Integration Test\n');
  console.log('='.repeat(60));
  console.log(`Supabase URL: ${SUPABASE_URL.substring(0, 30)}...`);
  console.log('='.repeat(60) + '\n');

  let testUserId = null;
  let testImageUuid = null;
  let testImageUrl = null;

  // Test 1: Check Supabase Connection
  await test('Supabase Connection', async () => {
    const { data, error } = await supabase.from('image_obj_storage_table').select('count').limit(1);
    if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
      throw new Error(`Connection failed: ${error.message}`);
    }
  });

  // Test 2: Check Storage Bucket Exists
  await test('Storage Bucket "images" Exists', async () => {
    const { data, error } = await supabase.storage.from('images').list('', { limit: 1 });
    if (error) {
      if (error.message.includes('Bucket not found') || error.message.includes('not found')) {
        throw new Error('Storage bucket "images" does not exist. Please run: supabase/migrations/20250115000002_create_images_storage_bucket.sql');
      }
      throw new Error(`Storage check failed: ${error.message}`);
    }
  });

  // Test 3: Check Authentication (if credentials provided)
  const testEmail = process.env.TEST_USER_EMAIL || envVars.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD || envVars.TEST_USER_PASSWORD;

  if (testEmail && testPassword) {
    await test('User Authentication', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      if (error) throw error;
      if (!data.user) throw new Error('No user returned');
      testUserId = data.user.id;
      log(`Authenticated as: ${data.user.email}`, 'success');
    });
  } else {
    log('Skipping authentication test (no TEST_USER_EMAIL/TEST_USER_PASSWORD)', 'warning');
    // Try to get current session
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      testUserId = user.id;
      log(`Using existing session: ${user.email}`, 'info');
    } else {
      log('No authenticated user. Some tests will be skipped.', 'warning');
    }
  }

  // Test 4: Check image_obj_storage_table exists
  await test('image_obj_storage_table Exists', async () => {
    const { error } = await supabase.from('image_obj_storage_table').select('image_uuid').limit(1);
    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        throw new Error('Table image_obj_storage_table does not exist. Please run: supabase/migrations/20250115000001_create_image_obj_storage_table.sql');
      }
      throw error;
    }
  });

  // Test 5: Mock Image Upload (if authenticated)
  if (testUserId) {
    await test('Image Upload Flow (Mock)', async () => {
      // Create a small test image blob
      const testImageData = Buffer.from(
        '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A',
        'base64'
      );
      
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const storagePath = `${testUserId}/${timestamp}-${randomString}-test.jpg`;
      
      // Try to upload
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(storagePath, testImageData, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        // Check if it's a permission error vs bucket error
        if (uploadError.message.includes('new row violates row-level security')) {
          throw new Error('Storage policies not configured. Please run storage policies from: supabase/migrations/20250115000002_create_images_storage_bucket.sql');
        }
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(storagePath);
      testImageUrl = urlData.publicUrl;

      // Insert into database
      const imageUuid = crypto.randomUUID();
      const { error: dbError } = await supabase
        .from('image_obj_storage_table')
        .insert({
          image_uuid: imageUuid,
          image_obj: storagePath,
          image_access_url: urlData.publicUrl,
          image_create_datetime: new Date().toISOString(),
          file_name: 'test.jpg',
          file_size: testImageData.length,
          mime_type: 'image/jpeg',
          user_id: testUserId,
        });

      if (dbError) throw dbError;

      testImageUuid = imageUuid;
      log(`Uploaded test image: ${imageUuid}`, 'success');
    });

    // Test 6: Retrieve Image from Database
    if (testImageUuid) {
      await test('Retrieve Image from Database', async () => {
        const { data, error } = await supabase
          .from('image_obj_storage_table')
          .select('*')
          .eq('image_uuid', testImageUuid)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Image not found in database');
        if (data.image_access_url !== testImageUrl) {
          throw new Error('Image URL mismatch');
        }
        log(`Retrieved image: ${data.image_uuid}`, 'success');
      });
    }
  } else {
    log('Skipping upload tests (not authenticated)', 'warning');
  }

  // Test 7: Check Project Details Table
  await test('project_details_table Exists', async () => {
    const { error } = await supabase.from('project_details_table').select('project_main_event_id').limit(1);
    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        throw new Error('Table project_details_table does not exist. Please create it first.');
      }
      throw error;
    }
  });

  // Test 8: Check Albums Storage Table
  await test('albums_storage_table Exists', async () => {
    const { error } = await supabase.from('albums_storage_table').select('album_id').limit(1);
    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        throw new Error('Table albums_storage_table does not exist. Please create it first.');
      }
      throw error;
    }
  });

  // Test 9: Check Sub Events Table
  await test('sub_events_list_table Exists', async () => {
    const { error } = await supabase.from('sub_events_list_table').select('sub_event_id').limit(1);
    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        throw new Error('Table sub_events_list_table does not exist. Please run: supabase/migrations/20250115000005_create_sub_events_list_table.sql');
      }
      throw error;
    }
  });

  // Cleanup
  if (testImageUuid && testUserId) {
    log('Cleaning up test data...', 'info');
    try {
      // Delete from database
      await supabase.from('image_obj_storage_table').delete().eq('image_uuid', testImageUuid);
      // Delete from storage
      const storagePath = `${testUserId}/${testImageUuid.split('-')[0]}-test.jpg`;
      await supabase.storage.from('images').remove([storagePath]);
      log('Cleanup completed', 'success');
    } catch (error) {
      log(`Cleanup warning: ${error.message}`, 'warning');
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('='.repeat(60) + '\n');

  if (results.errors.length > 0) {
    console.log('❌ Errors:');
    results.errors.forEach(({ test, error }) => {
      console.log(`  - ${test}: ${error}`);
    });
    console.log('');
  }

  if (results.failed === 0) {
    log('All tests passed! 🎉', 'success');
    process.exit(0);
  } else {
    log('Some tests failed. Please review errors above.', 'error');
    process.exit(1);
  }
}

main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});



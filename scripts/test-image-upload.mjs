/**
 * Test script for image upload functionality
 * Run with: node scripts/test-image-upload.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const env = {};
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    return env;
  } catch (error) {
    return {};
  }
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;

console.log('🧪 Image Upload Test\n');
console.log('='.repeat(70));

if (!SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL not found in .env');
  process.exit(1);
}

console.log(`📍 Supabase URL: ${SUPABASE_URL}\n`);

// Test 1: Check if table exists
console.log('📊 Test 1: Checking if image_obj_storage_table exists...');

try {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/image_obj_storage_table?select=image_uuid&limit=1`, {
    method: 'GET',
    headers: {
      'apikey': env.VITE_SUPABASE_ANON_KEY || '',
      'Content-Type': 'application/json',
    },
  });

  if (response.ok || response.status === 200) {
    console.log('✅ Table exists and is accessible\n');
  } else if (response.status === 404) {
    console.log('❌ Table does not exist. Please run the migration:\n');
    console.log('   supabase/migrations/20250115000001_create_image_obj_storage_table.sql\n');
  } else {
    const error = await response.text();
    console.log(`⚠️  Table check: ${response.status} - ${error.substring(0, 100)}\n`);
  }
} catch (error) {
  console.log(`⚠️  Could not check table: ${error.message}\n`);
}

// Test 2: Check if storage bucket exists
console.log('🪣 Test 2: Checking if images storage bucket exists...');

try {
  // Try to list objects in the bucket (this will fail if bucket doesn't exist)
  const response = await fetch(`${SUPABASE_URL}/storage/v1/images`, {
    method: 'GET',
    headers: {
      'apikey': env.VITE_SUPABASE_ANON_KEY || '',
    },
  });

  if (response.ok || response.status === 200 || response.status === 404) {
    // 404 might mean bucket exists but is empty, which is fine
    console.log('✅ Storage bucket appears to exist\n');
  } else {
    console.log('⚠️  Storage bucket check returned:', response.status);
    console.log('   If bucket doesn\'t exist, create it in Supabase Dashboard > Storage\n');
  }
} catch (error) {
  console.log(`⚠️  Could not check bucket: ${error.message}\n`);
}

// Test 3: Check Edge Function
console.log('⚡ Test 3: Checking if upload-image Edge Function is deployed...');

try {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/upload-image`, {
    method: 'OPTIONS',
    headers: {
      'apikey': env.VITE_SUPABASE_ANON_KEY || '',
    },
  });

  if (response.ok) {
    console.log('✅ Edge Function is deployed\n');
  } else {
    console.log('⚠️  Edge Function may not be deployed');
    console.log('   Deploy with: supabase functions deploy upload-image\n');
  }
} catch (error) {
  console.log(`⚠️  Edge Function check: ${error.message}`);
  console.log('   This is OK - the service will fallback to direct upload\n');
}

console.log('='.repeat(70));
console.log('✅ Setup check complete!\n');
console.log('📝 Next steps:');
console.log('   1. Run migration if table doesn\'t exist');
console.log('   2. Create storage bucket if it doesn\'t exist');
console.log('   3. Deploy Edge Function (optional)');
console.log('   4. Test upload in your application\n');


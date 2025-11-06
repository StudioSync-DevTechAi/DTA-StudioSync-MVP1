/**
 * Simple ES Module script to check Supabase schema
 * Run with: node scripts/check-schema.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file manually
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
    console.error('Error loading .env file:', error.message);
    return {};
  }
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

console.log('🔌 Connecting to Supabase...');
console.log(`📍 URL: ${SUPABASE_URL}`);
console.log(`🔑 Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...\n`);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkConnection() {
  console.log('📡 Testing connection...');
  
  try {
    // Test with a simple query
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      console.log('⚠️  Connection test:', error.message);
      return false;
    }
    
    console.log('✅ Connection successful!\n');
    return true;
  } catch (error) {
    console.log('⚠️  Connection test completed (some tables may not exist)\n');
    return true;
  }
}

async function getSchema() {
  console.log('📊 Checking database tables...\n');
  
  const tablesToCheck = [
    'profiles',
    'portfolios',
    'portfolio_gallery',
    'photobank_projects',
    'photobank_project_thumbnail_images',
    'photobank_albums',
    'photobank_album_thumbnail_images',
    'photobank_album_images',
    'scheduled_events',
    'invoices',
    'finance_transactions',
    'team_members',
    'accounts',
    'freelancers',
  ];

  const results = [];

  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (!error) {
        const columns = data && data.length > 0 
          ? Object.keys(data[0])
          : [];
        
        results.push({
          table_name: tableName,
          exists: true,
          columns: columns,
          column_count: columns.length,
          has_data: data && data.length > 0,
        });
      }
    } catch (error) {
      // Table doesn't exist
    }
  }

  return results;
}

async function main() {
  console.log('🚀 Supabase Schema Checker\n');
  console.log('='.repeat(70));

  const connected = await checkConnection();
  
  const tables = await getSchema();

  if (tables.length === 0) {
    console.log('⚠️  No accessible tables found.');
    console.log('This might be due to RLS policies or tables not existing.\n');
    process.exit(0);
  }

  console.log('='.repeat(70));
  console.log(`📊 Found ${tables.length} accessible table(s):\n`);

  tables.forEach((table, index) => {
    console.log(`${index + 1}. ${table.table_name}`);
    console.log(`   Status: ${table.has_data ? 'Has data' : 'Empty'}`);
    console.log(`   Columns (${table.column_count}):`);
    
    if (table.columns.length > 0) {
      table.columns.forEach((col, i) => {
        const isLast = i === table.columns.length - 1;
        const prefix = isLast ? '   └─' : '   ├─';
        console.log(`${prefix} ${col}`);
      });
    } else {
      console.log('   └─ (no columns detected - table may be empty)');
    }
    console.log('');
  });

  console.log('='.repeat(70));
  console.log(`📈 Summary: ${tables.length} tables, ${tables.reduce((sum, t) => sum + t.column_count, 0)} total columns`);
  console.log('='.repeat(70));
  console.log('✅ Check complete!\n');
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});


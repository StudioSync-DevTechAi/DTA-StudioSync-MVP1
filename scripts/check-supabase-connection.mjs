/**
 * Supabase Connection and Schema Checker
 * Uses Supabase REST API to query database schema
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
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
  process.exit(1);
}

console.log('🔌 Supabase Connection Test\n');
console.log('='.repeat(70));
console.log(`📍 URL: ${SUPABASE_URL}`);
console.log(`🔑 Key: ${SUPABASE_ANON_KEY.substring(0, 30)}...\n`);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// List of tables to check
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
  'finance_categories',
  'finance_subcategories',
  'team_members',
  'accounts',
  'freelancers',
  'vendors',
  'companies',
  'photo_galleries',
  'photos',
  'client_portal_access',
  'client_deliverables',
  'client_feedback',
  'roles',
  'permissions',
  'role_permissions',
  'user_roles',
];

async function testConnection() {
  console.log('📡 Testing connection...');
  
  try {
    // Test authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Test with a simple query - try profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('✅ Connection successful (profiles table not found, but connection works)');
      } else {
        console.log(`⚠️  Connection test: ${error.message}`);
        console.log(`   Code: ${error.code}`);
      }
    } else {
      console.log('✅ Connection successful!');
    }
    
    return true;
  } catch (error) {
    console.log(`⚠️  Connection test: ${error.message}`);
    return false;
  }
}

async function checkTables() {
  console.log('\n📊 Checking database tables...\n');
  
  const results = [];
  const found = [];
  const notFound = [];

  for (const tableName of tablesToCheck) {
    try {
      // Try to query the table
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (!error) {
        // Table exists
        const columns = data && data.length > 0 
          ? Object.keys(data[0])
          : [];
        
        const tableInfo = {
          table_name: tableName,
          exists: true,
          columns: columns,
          column_count: columns.length,
          has_data: data && data.length > 0,
          sample_data: data && data.length > 0 ? data[0] : null,
        };
        
        results.push(tableInfo);
        found.push(tableName);
      } else {
        notFound.push({ table: tableName, error: error.message });
      }
    } catch (error) {
      notFound.push({ table: tableName, error: error.message });
    }
  }

  return { results, found, notFound };
}

async function getColumnDetails(tableName, sampleData) {
  if (!sampleData) return [];
  
  return Object.keys(sampleData).map(key => {
    const value = sampleData[key];
    let dataType = 'unknown';
    let nullable = 'unknown';
    
    if (value === null) {
      dataType = 'nullable';
      nullable = 'YES';
    } else {
      const type = typeof value;
      if (type === 'string') {
        dataType = 'text';
        nullable = 'NO';
      } else if (type === 'number') {
        dataType = Number.isInteger(value) ? 'integer' : 'numeric';
        nullable = 'NO';
      } else if (type === 'boolean') {
        dataType = 'boolean';
        nullable = 'NO';
      } else if (Array.isArray(value)) {
        dataType = 'array';
        nullable = 'NO';
      } else if (type === 'object') {
        dataType = 'jsonb';
        nullable = 'NO';
      }
    }
    
    return {
      column_name: key,
      data_type: dataType,
      is_nullable: nullable,
      sample_value: value !== null && typeof value !== 'object' ? String(value).substring(0, 50) : null,
    };
  });
}

async function main() {
  const connected = await testConnection();
  
  if (!connected) {
    console.log('\n❌ Could not establish connection. Please check your credentials.');
    process.exit(1);
  }

  const { results, found, notFound } = await checkTables();

  console.log('='.repeat(70));
  
  if (results.length === 0) {
    console.log('⚠️  No accessible tables found.');
    console.log('\nPossible reasons:');
    console.log('  • Tables don\'t exist yet');
    console.log('  • RLS policies preventing access');
    console.log('  • Wrong database/project');
    console.log('\n💡 Check your Supabase Dashboard > Table Editor');
    process.exit(0);
  }

  console.log(`\n📊 Found ${results.length} accessible table(s):\n`);

  // Display found tables with details
  for (let i = 0; i < results.length; i++) {
    const table = results[i];
    console.log(`${i + 1}. ${table.table_name}`);
    console.log(`   Status: ${table.has_data ? '✅ Has data' : '📭 Empty'}`);
    console.log(`   Columns: ${table.column_count}`);
    
    if (table.columns.length > 0) {
      console.log('   Column Details:');
      const columnDetails = await getColumnDetails(table.table_name, table.sample_data);
      
      columnDetails.forEach((col, idx) => {
        const isLast = idx === columnDetails.length - 1;
        const prefix = isLast ? '   └─' : '   ├─';
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
        const sample = col.sample_value ? ` → "${col.sample_value}"` : '';
        console.log(`${prefix} ${col.column_name}: ${col.data_type} ${nullable}${sample}`);
      });
    } else {
      console.log('   └─ (no columns detected - table may be empty)');
    }
    console.log('');
  }

  // Summary
  const totalColumns = results.reduce((sum, t) => sum + t.column_count, 0);
  console.log('='.repeat(70));
  console.log(`📈 Summary:`);
  console.log(`   ✅ Found: ${found.length} tables`);
  console.log(`   ❌ Not Found: ${notFound.length} tables`);
  console.log(`   📊 Total Columns: ${totalColumns}`);
  
  if (notFound.length > 0 && notFound.length <= 5) {
    console.log(`\n   Tables not found: ${notFound.map(n => n.table).join(', ')}`);
  }
  
  console.log('='.repeat(70));
  console.log('✅ Schema check complete!\n');
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});


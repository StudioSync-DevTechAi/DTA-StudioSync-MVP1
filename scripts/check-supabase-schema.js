/**
 * Node.js script to check Supabase connection and retrieve schema
 * Can be run with: node scripts/check-supabase-schema.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

console.log('🔌 Connecting to Supabase...');
console.log(`📍 URL: ${SUPABASE_URL}`);
console.log(`🔑 Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...\n`);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('📡 Testing connection...');
  
  try {
    // Try to query a common table
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table not found
      throw error;
    }
    
    console.log('✅ Connection successful!\n');
    return true;
  } catch (error) {
    console.log('⚠️  Direct query failed, but connection may still work\n');
    return true; // Continue anyway
  }
}

async function getTablesAndColumns() {
  console.log('📊 Retrieving database schema...\n');
  
  // List of tables to check (common tables in the project)
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

  const results = [];

  for (const tableName of tablesToCheck) {
    try {
      // Try to query the table with limit 0 (just to check if it exists)
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

      if (!error) {
        // Table exists, try to get one row to infer structure
        const { data: sampleData, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (!sampleError && sampleData && sampleData.length > 0) {
          const columns = Object.keys(sampleData[0]).map(key => {
            const value = sampleData[0][key];
            let dataType = 'unknown';
            
            if (value === null) {
              dataType = 'nullable';
            } else if (typeof value === 'string') {
              dataType = 'text';
            } else if (typeof value === 'number') {
              dataType = Number.isInteger(value) ? 'integer' : 'numeric';
            } else if (typeof value === 'boolean') {
              dataType = 'boolean';
            } else if (Array.isArray(value)) {
              dataType = 'array';
            } else if (typeof value === 'object') {
              dataType = 'jsonb';
            }

            return {
              column_name: key,
              data_type: dataType,
              is_nullable: value === null ? 'YES' : 'NO',
            };
          });

          results.push({
            table_name: tableName,
            columns: columns,
            column_count: columns.length,
            exists: true,
          });
        } else {
          // Table exists but empty
          results.push({
            table_name: tableName,
            columns: [],
            column_count: 0,
            exists: true,
            empty: true,
          });
        }
      }
    } catch (error) {
      // Table doesn't exist or not accessible - skip it
    }
  }

  return results;
}

async function main() {
  console.log('🚀 Supabase Schema Checker\n');
  console.log('='.repeat(70));

  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Could not establish connection');
    process.exit(1);
  }

  // Get schema
  const tables = await getTablesAndColumns();

  if (tables.length === 0) {
    console.log('⚠️  No tables found.');
    console.log('This might be due to:');
    console.log('  - RLS policies preventing access');
    console.log('  - Tables not yet created');
    console.log('  - Wrong database/project');
    console.log('\n💡 Check your Supabase Dashboard > Table Editor');
    process.exit(0);
  }

  // Display results
  console.log('='.repeat(70));
  console.log(`📊 Found ${tables.length} table(s):\n`);

  tables.forEach((table, index) => {
    console.log(`${index + 1}. ${table.table_name}`);
    console.log(`   Status: ${table.empty ? 'Empty' : 'Has data'}`);
    console.log(`   Columns: ${table.column_count}`);
    
    if (table.columns.length > 0) {
      console.log('   Column Details:');
      table.columns.forEach((col) => {
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
        console.log(`     • ${col.column_name}: ${col.data_type} ${nullable}`);
      });
    }
    console.log('');
  });

  // Summary
  const totalColumns = tables.reduce((sum, table) => sum + table.column_count, 0);
  console.log('='.repeat(70));
  console.log(`📈 Summary:`);
  console.log(`   Total Tables: ${tables.length}`);
  console.log(`   Total Columns: ${totalColumns}`);
  console.log('='.repeat(70));
  console.log('✅ Schema check complete!\n');
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});


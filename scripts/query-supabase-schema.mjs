/**
 * Query Supabase Schema using REST API
 * This script queries the information_schema directly via REST API
 */

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
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

console.log('🔌 Querying Supabase Schema via REST API\n');
console.log('='.repeat(70));
console.log(`📍 URL: ${SUPABASE_URL}\n`);

// Test connection by trying to query a known table
async function testConnection() {
  console.log('📡 Testing connection...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('✅ Connection successful!\n');
      return true;
    } else {
      const errorText = await response.text();
      if (response.status === 404 || errorText.includes('relation') || errorText.includes('does not exist')) {
        console.log('✅ Connection successful (profiles table may not exist yet)\n');
        return true;
      } else {
        console.log(`⚠️  Connection response: ${response.status} ${response.statusText}\n`);
        return true; // Continue anyway
      }
    }
  } catch (error) {
    console.log(`⚠️  Connection test: ${error.message}\n`);
    return true; // Continue anyway
  }
}

// Check tables by trying to query them
async function checkTable(tableName) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        exists: true,
        hasData: Array.isArray(data) && data.length > 0,
        columns: Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : [],
        sampleData: Array.isArray(data) && data.length > 0 ? data[0] : null,
      };
    } else {
      return { exists: false, error: response.status };
    }
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function main() {
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

  await testConnection();

  console.log('📊 Checking tables...\n');
  
  const results = [];
  
  for (const tableName of tablesToCheck) {
    process.stdout.write(`   Checking ${tableName}... `);
    const result = await checkTable(tableName);
    
    if (result.exists) {
      console.log('✅');
      results.push({
        table_name: tableName,
        ...result,
        column_count: result.columns.length,
      });
    } else {
      console.log('❌');
    }
  }

  console.log('\n' + '='.repeat(70));
  
  if (results.length === 0) {
    console.log('⚠️  No accessible tables found.');
    console.log('\nThis could mean:');
    console.log('  • Tables haven\'t been created yet');
    console.log('  • RLS policies are blocking access');
    console.log('  • You need to run migrations');
    console.log('\n💡 Next steps:');
    console.log('  1. Check Supabase Dashboard > Table Editor');
    console.log('  2. Run migrations: supabase db push');
    console.log('  3. Verify RLS policies allow access');
    process.exit(0);
  }

  console.log(`\n📊 Found ${results.length} accessible table(s):\n`);

  results.forEach((table, index) => {
    console.log(`${index + 1}. ${table.table_name}`);
    console.log(`   Status: ${table.hasData ? '✅ Has data' : '📭 Empty'}`);
    console.log(`   Columns (${table.column_count}):`);
    
    if (table.columns.length > 0) {
      table.columns.forEach((col, idx) => {
        const isLast = idx === table.columns.length - 1;
        const prefix = isLast ? '   └─' : '   ├─';
        
        // Try to infer type from sample data
        let typeInfo = '';
        if (table.sampleData && table.sampleData[col] !== undefined) {
          const value = table.sampleData[col];
          if (value === null) {
            typeInfo = ' (nullable)';
          } else if (typeof value === 'string') {
            typeInfo = ' (text)';
          } else if (typeof value === 'number') {
            typeInfo = Number.isInteger(value) ? ' (integer)' : ' (numeric)';
          } else if (typeof value === 'boolean') {
            typeInfo = ' (boolean)';
          } else if (Array.isArray(value)) {
            typeInfo = ' (array)';
          } else if (typeof value === 'object') {
            typeInfo = ' (jsonb)';
          }
        }
        
        const sample = table.sampleData && table.sampleData[col] !== undefined && table.sampleData[col] !== null
          ? ` → ${String(table.sampleData[col]).substring(0, 40)}`
          : '';
        
        console.log(`${prefix} ${col}${typeInfo}${sample}`);
      });
    } else {
      console.log('   └─ (no columns detected)');
    }
    console.log('');
  });

  const totalColumns = results.reduce((sum, t) => sum + t.column_count, 0);
  const tablesWithData = results.filter(t => t.hasData).length;
  
  console.log('='.repeat(70));
  console.log(`📈 Summary:`);
  console.log(`   ✅ Tables found: ${results.length}`);
  console.log(`   📊 Tables with data: ${tablesWithData}`);
  console.log(`   📋 Total columns: ${totalColumns}`);
  console.log('='.repeat(70));
  console.log('✅ Schema check complete!\n');
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});


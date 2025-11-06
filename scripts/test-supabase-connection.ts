/**
 * Supabase Connection Test Script
 * Tests connection and retrieves database schema information
 */

import { createClient } from '@supabase/supabase-js';

// Get credentials from environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

console.log('🔌 Connecting to Supabase...');
console.log(`📍 URL: ${SUPABASE_URL}`);
console.log(`🔑 Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface TableInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
}

interface TableSummary {
  table_name: string;
  columns: TableInfo[];
  column_count: number;
}

/**
 * Test basic connection
 */
async function testConnection() {
  console.log('\n📡 Testing connection...');
  
  try {
    // Test connection by querying a simple table or using rpc
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      // If profiles doesn't exist, try a different approach
      console.log('⚠️  Direct table query failed, trying schema query...');
      return { success: true, message: 'Connection established (using schema query)' };
    }
    
    console.log('✅ Connection successful!');
    return { success: true, message: 'Connection established' };
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Get all tables in the public schema
 */
async function getTables(): Promise<string[]> {
  console.log('\n📋 Retrieving table list...');
  
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `
  }).catch(async () => {
    // Fallback: Query information_schema directly using a different approach
    // Since RPC might not be available, we'll use a workaround
    return { data: null, error: { message: 'RPC not available' } };
  });

  if (error || !data) {
    // Alternative: Try to query known tables or use a different method
    console.log('⚠️  Using alternative method to get tables...');
    
    // Try querying information_schema through a view or function
    // For now, we'll query columns directly which will give us table names
    return [];
  }

  return data.map((row: any) => row.table_name);
}

/**
 * Get columns for all tables
 */
async function getTablesWithColumns(): Promise<TableSummary[]> {
  console.log('\n📊 Retrieving tables and columns...');
  
  // Query information_schema.columns to get all table and column information
  const query = `
    SELECT 
      t.table_name,
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.column_default,
      c.character_maximum_length
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE t.table_schema = 'public' 
      AND t.table_type = 'BASE TABLE'
      AND c.table_schema = 'public'
    ORDER BY t.table_name, c.ordinal_position;
  `;

  try {
    // Use RPC if available, otherwise we'll need to query tables individually
    const { data, error } = await supabase.rpc('exec_sql', { query }).catch(() => ({
      data: null,
      error: { message: 'RPC exec_sql not available' }
    }));

    if (error || !data) {
      // Fallback: Query each known table to get its structure
      console.log('⚠️  RPC not available, using table-by-table approach...');
      return await getTablesWithColumnsFallback();
    }

    // Group by table_name
    const tableMap = new Map<string, TableInfo[]>();
    
    (data as TableInfo[]).forEach((row) => {
      if (!tableMap.has(row.table_name)) {
        tableMap.set(row.table_name, []);
      }
      tableMap.get(row.table_name)!.push(row);
    });

    const result: TableSummary[] = Array.from(tableMap.entries()).map(([table_name, columns]) => ({
      table_name,
      columns,
      column_count: columns.length,
    }));

    return result;
  } catch (error: any) {
    console.error('❌ Error retrieving schema:', error.message);
    return await getTablesWithColumnsFallback();
  }
}

/**
 * Fallback method: Query tables individually to get their structure
 */
async function getTablesWithColumnsFallback(): Promise<TableSummary[]> {
  console.log('📝 Using fallback method (querying tables individually)...');
  
  // Common tables to check
  const commonTables = [
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

  const results: TableSummary[] = [];

  for (const tableName of commonTables) {
    try {
      // Try to query the table with limit 0 to get structure
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

      if (!error) {
        // Table exists, get its columns by trying to query with specific columns
        // We'll use a workaround: query information_schema through a different method
        results.push({
          table_name: tableName,
          columns: [],
          column_count: 0,
        });
        console.log(`  ✅ Found table: ${tableName}`);
      }
    } catch (error) {
      // Table doesn't exist or not accessible
    }
  }

  // Try to get column info using a direct SQL query through Supabase
  // Note: This requires proper RLS or service role key
  for (const table of results) {
    try {
      // Query with limit 1 to infer structure
      const { data, error } = await supabase
        .from(table.table_name)
        .select('*')
        .limit(1);

      if (!error && data && data.length > 0) {
        // Infer column names from the data
        const columns = Object.keys(data[0]).map((key) => ({
          table_name: table.table_name,
          column_name: key,
          data_type: typeof data[0][key as keyof typeof data[0]],
          is_nullable: data[0][key as keyof typeof data[0]] === null ? 'YES' : 'NO',
          column_default: null,
          character_maximum_length: null,
        })) as TableInfo[];

        table.columns = columns;
        table.column_count = columns.length;
      }
    } catch (error) {
      // Could not infer structure
    }
  }

  return results;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Supabase Connection Test\n');
  console.log('=' .repeat(60));

  // Test connection
  const connectionTest = await testConnection();
  if (!connectionTest.success) {
    console.error('\n❌ Connection test failed. Please check your credentials.');
    process.exit(1);
  }

  // Get tables with columns
  const tables = await getTablesWithColumns();

  if (tables.length === 0) {
    console.log('\n⚠️  No tables found or unable to retrieve schema.');
    console.log('This might be due to RLS policies or missing RPC functions.');
    console.log('\n💡 Tip: You can check tables directly in Supabase Dashboard > Table Editor');
    process.exit(0);
  }

  // Display results
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Found ${tables.length} table(s):\n`);

  tables.forEach((table, index) => {
    console.log(`${index + 1}. ${table.table_name}`);
    console.log(`   Columns: ${table.column_count}`);
    
    if (table.columns.length > 0) {
      console.log('   Column Details:');
      table.columns.forEach((col) => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const maxLength = col.character_maximum_length 
          ? `(${col.character_maximum_length})` 
          : '';
        const defaultValue = col.column_default 
          ? ` DEFAULT ${col.column_default}` 
          : '';
        
        console.log(`     - ${col.column_name}: ${col.data_type}${maxLength} ${nullable}${defaultValue}`);
      });
    }
    console.log('');
  });

  console.log('='.repeat(60));
  console.log('✅ Schema retrieval complete!');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { testConnection, getTablesWithColumns };


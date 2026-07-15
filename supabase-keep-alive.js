import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Try to load .env file if running locally and environment variables are not set
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');

if (!process.env.VITE_SUPABASE_URL && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase URL or Anon Key.');
  process.exit(1);
}

const baseUrl = supabaseUrl.replace(/\/$/, '');

async function pingTable(tableName) {
  try {
    const response = await fetch(`${baseUrl}/rest/v1/${tableName}?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ Ping to ${tableName} failed: HTTP ${response.status} - ${text}`);
      return false;
    }

    const data = await response.json();
    console.log(`✅ Ping to ${tableName} successful. Records found:`, data.length);
    return true;
  } catch (error) {
    console.error(`❌ Ping to ${tableName} failed with error:`, error.message);
    return false;
  }
}

async function run() {
  console.log(`[${new Date().toISOString()}] Starting Supabase Keep-Alive...`);
  
  // Ping both wardrobe and profiles to ensure database activity
  const wardrobeSuccess = await pingTable('wardrobe');
  const profilesSuccess = await pingTable('profiles');

  if (wardrobeSuccess || profilesSuccess) {
    console.log('✅ Supabase Keep-Alive completed successfully.');
    process.exit(0);
  } else {
    console.error('❌ All keep-alive pings failed.');
    process.exit(1);
  }
}

run();

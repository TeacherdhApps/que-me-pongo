
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log('--- Supabase Connectivity Check ---');

    // 1. Check Auth
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
        console.error('❌ Auth Error:', authError.message);
    } else {
        console.log('✅ Auth Connection: OK');
    }

    // 2. Check Database (wardrobe table)
    const { data: dbData, error: dbError } = await supabase.from('wardrobe').select('id').limit(1);
    if (dbError) {
        console.error('❌ Database Error (wardrobe table):', dbError.message);
    } else {
        console.log('✅ Database Connection (wardrobe table): OK');
    }

    // 3. Check Database (profiles table)
    const { data: profData, error: profError } = await supabase.from('profiles').select('user_id').limit(1);
    if (profError) {
        console.error('❌ Database Error (profiles table):', profError.message);
        if (profError.code === '42P01') {
            console.log('   (Table does not exist yet - this is expected if first run)');
        }
    } else {
        console.log('✅ Database Connection (profiles table): OK');
    }

    // 4. Check Storage
    const { data: storageData, error: storageError } = await supabase.storage.getBucket('wardrobe-images');
    if (storageError) {
        console.error('❌ Storage Error (wardrobe-images bucket):', storageError.message);
    } else {
        console.log('✅ Storage Connection (wardrobe-images bucket): OK');
    }
}

check();

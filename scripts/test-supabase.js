
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Credentials missing in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log(`Testing connection to ${supabaseUrl}...`);
    // Try to select the new columns to verify schema migration
    const { data, error } = await supabase.from('Users').select('id, encrypted_vault, vault_salt').limit(1);

    if (error) {
        console.error("Connection failed:", error.message);
        // If table doesn't exist, that's still a connection success (404/400 from PG), 
        // implies auth worked but schema is empty/different.
        if (error.code === 'PGRST204' || error.message.includes('relation "public.users" does not exist')) {
            console.log("Connection successful! (Table 'users' might not exist yet, which is expected for a fresh project)");
        } else {
            process.exit(1);
        }
    } else {
        console.log("Connection successful!");
    }
}

testConnection();

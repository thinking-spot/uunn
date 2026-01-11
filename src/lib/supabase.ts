
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    // We don't want to crash build time if envs are missing, but runtime should warn
    if (typeof window !== 'undefined') {
        console.warn("Supabase credentials missing!");
    }
}

export const supabase = createClient(supabaseUrl, supabaseKey);

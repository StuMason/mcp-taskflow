import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_KEY environment variables are required');
}

// Create a single supabase client for interacting with your database
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export default supabase; 
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types.js';

// Local Supabase connection details (from npx supabase status)
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Create a single supabase client for interacting with your database
const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  }
});

// Test the connection silently
const testConnection = async (): Promise<void> => {
  try {
    await supabase.from('sessions').select('count').limit(0);
  } catch (error) {
    // Only log errors, not success
    console.error('Supabase connection error:', error instanceof Error ? error.message : 'Unknown error');
  }
};

// Run the connection test
testConnection();

export default supabase; 
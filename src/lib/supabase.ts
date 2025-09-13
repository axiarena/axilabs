import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://thewvbhdhlcqhjipxgxp.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoZXd2YmhkaGxjcWhqaXB4Z3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTYzOTUsImV4cCI6MjA2NTQzMjM5NX0.ky3LlCy681nB5mZIkpr_U6a_EBfbPeLJg5Rhanu88jg'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database type placeholder (should be generated from Supabase schema)
export type Database = {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
      }
    }
  }
}

// Ping database function
export const pingDatabase = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('user_profiles').select('id').limit(1)
    if (error) {
      console.error('Database ping failed:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Database ping error:', error)
    return false
  }
}
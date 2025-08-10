import { createClient } from '@supabase/supabase-js'

// Create Supabase client with anon key (for public queries)
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Create authenticated Supabase client for user-specific queries
export const sbForUser = (jwt: string) => createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { 
    global: { 
      headers: { 
        Authorization: `Bearer ${jwt}` 
      } 
    } 
  }
)

// =====================================================
// supabaseClient.js
// Campus Lost & Found System
// =====================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Your Supabase Project URL
const SUPABASE_URL = 'https://wyoohvwpfagyrzwqsfee.supabase.co'

// Your Supabase Publishable (Anon) Key
const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_0StjzyKVI3hJgU6BIIvqFw_9WEhkvES'

// Create Supabase client
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)

// Optional helper
export async function getCurrentUser() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error) {
    console.error(error)
    return null
  }

  return user
}
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createLocalClient } from './db-local'

export function createSupabaseServer() {
  // Check if running in local mode
  if (process.env.LOCAL_MODE === 'true') {
    return createLocalClient()
  }

  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component, ignore
          }
        },
      },
    }
  )
}

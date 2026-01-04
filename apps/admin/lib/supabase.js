import { createBrowserClient } from '@supabase/ssr'

let supabaseInstance = null

export function createClient() {
  // Only create client in browser environment with env vars
  if (typeof window === 'undefined') {
    // Return a dummy object for SSR/build time
    return {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signUp: async () => ({ error: new Error('Not available during SSR') }),
        signInWithPassword: async () => ({ error: new Error('Not available during SSR') }),
        signInWithOAuth: async () => ({ error: new Error('Not available during SSR') }),
        signOut: async () => ({ error: null }),
        exchangeCodeForSession: async () => ({ error: new Error('Not available during SSR') }),
        getUser: async () => ({ data: { user: null } }),
      },
      from: () => ({
        select: () => ({ data: null, error: null }),
        insert: () => ({ data: null, error: null }),
        update: () => ({ data: null, error: null }),
        delete: () => ({ data: null, error: null }),
      }),
    }
  }

  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      console.warn('Supabase URL or key not found, returning dummy client')
      return {
        auth: {
          getSession: async () => ({ data: { session: null } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signUp: async () => ({ error: new Error('Supabase not configured') }),
          signInWithPassword: async () => ({ error: new Error('Supabase not configured') }),
          signInWithOAuth: async () => ({ error: new Error('Supabase not configured') }),
          signOut: async () => ({ error: null }),
          exchangeCodeForSession: async () => ({ error: new Error('Supabase not configured') }),
          getUser: async () => ({ data: { user: null } }),
        },
        from: () => ({
          select: () => ({ data: null, error: null }),
          insert: () => ({ data: null, error: null }),
          update: () => ({ data: null, error: null }),
          delete: () => ({ data: null, error: null }),
        }),
      }
    }
    
    supabaseInstance = createBrowserClient(url, key)
  }
  
  return supabaseInstance
}

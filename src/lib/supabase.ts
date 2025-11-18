import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Custom storage implementation for better cookie handling
const customStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, value)
    
    // Also set cookies for middleware
    if (key.includes('access_token')) {
      document.cookie = `sb-access-token=${value}; path=/; max-age=3600; SameSite=Lax`
    }
    if (key.includes('refresh_token')) {
      document.cookie = `sb-refresh-token=${value}; path=/; max-age=604800; SameSite=Lax`
    }
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(key)
    
    // Also remove cookies
    if (key.includes('access_token')) {
      document.cookie = 'sb-access-token=; path=/; max-age=0'
    }
    if (key.includes('refresh_token')) {
      document.cookie = 'sb-refresh-token=; path=/; max-age=0'
    }
  },
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: customStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce',
  },
})

// Helper functions with better error handling
export async function signUp(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) {
      console.error('❌ SignUp error:', error)
      return { data: null, error }
    }
    
    console.log('✅ SignUp successful:', data.user?.email)
    return { data, error: null }
  } catch (err) {
    console.error('❌ SignUp exception:', err)
    return { data: null, error: err as Error }
  }
}

export async function signIn(email: string, password: string) {
  try {
    console.log('🔐 SignIn attempt:', { email, supabaseUrl })
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('❌ SignIn error:', {
        message: error.message,
        status: error.status,
        name: error.name,
      })
      return { data: null, error }
    }
    
    if (!data.session) {
      console.error('❌ No session created')
      return { data: null, error: new Error('No session created') }
    }
    
    console.log('✅ SignIn successful:', {
      email: data.user?.email,
      hasSession: !!data.session,
      hasAccessToken: !!data.session.access_token,
    })
    
    // Manually set cookies to ensure middleware can read them
    if (data.session) {
      document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=3600; SameSite=Lax`
      document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=604800; SameSite=Lax`
      console.log('🍪 Cookies set manually')
    }
    
    return { data, error: null }
  } catch (err) {
    console.error('❌ SignIn exception:', err)
    return { data: null, error: err as Error }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('❌ SignOut error:', error)
      return { error }
    }
    
    // Clear cookies
    document.cookie = 'sb-access-token=; path=/; max-age=0'
    document.cookie = 'sb-refresh-token=; path=/; max-age=0'
    
    console.log('✅ SignOut successful')
    return { error: null }
  } catch (err) {
    console.error('❌ SignOut exception:', err)
    return { error: err as Error }
  }
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

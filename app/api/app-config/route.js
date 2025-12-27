import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../lib/supabase-server'

// Default app config - used when database table doesn't exist
const DEFAULT_APP_CONFIG = {
  id: 'app_asweallare',
  slug: 'asweallare',
  name: 'AS WE ALL ARE',
  title: 'Unscripted Conversations',
  tagline: 'A therapeutic conversational card game',
  promise: 'Know more about each other without the need to ask any question',
  header_text: '## Welcome to AS WE ALL ARE\n\nA space for **authentic connection** and meaningful conversations.',
  body_text: `### How It Works

1. **Select your deck** — Choose from our curated card collections
2. **Draw a card** — Each card presents a thoughtful prompt
3. **Share openly** — Take turns sharing your thoughts and experiences
4. **Listen deeply** — Create space for others to be heard

> "The quality of our lives depends on the quality of our conversations."

### Why This Matters

In a world of constant distraction, we've created a tool to help you:
- Build deeper connections
- Practice vulnerability
- Discover new perspectives
- Create meaningful memories`,
  footer_text: 'Made with ❤️ for authentic human connection',
  build_version: '1.0.0',
  socials: []
}

// GET /api/app-config - Get app config by slug
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug') || 'asweallare'
    
    const supabase = createSupabaseServer()
    
    // Get app config
    const { data: appConfig, error: configError } = await supabase
      .from('app_config')
      .select('*')
      .eq('slug', slug)
      .single()
    
    if (configError || !appConfig) {
      // Table might not exist yet or no data - return default config
      console.log('[APP CONFIG] Using default config, error:', configError?.message)
      return NextResponse.json(DEFAULT_APP_CONFIG)
    }
    
    // Get socials for this app
    let socials = []
    try {
      const { data: socialsData, error: socialsError } = await supabase
        .from('app_socials')
        .select('*')
        .eq('app_id', appConfig.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      
      if (!socialsError && socialsData) {
        socials = socialsData
      }
    } catch (e) {
      // Table might not exist - continue without socials
      console.log('[APP CONFIG] Socials table may not exist yet')
    }
    
    return NextResponse.json({
      ...appConfig,
      socials
    })
    
  } catch (error) {
    console.error('[APP CONFIG] Unexpected error:', error)
    // Return default config on any error
    return NextResponse.json(DEFAULT_APP_CONFIG)
  }
}

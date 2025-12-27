import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../lib/supabase-server'

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
    
    if (configError) {
      // Table might not exist yet - return default config
      if (configError.code === '42P01' || configError.message?.includes('does not exist')) {
        return NextResponse.json({
          id: 'app_asweallare',
          slug: 'asweallare',
          name: 'AS WE ALL ARE',
          title: 'Unscripted Conversations',
          tagline: 'A therapeutic conversational card game',
          promise: 'Know more about each other without the need to ask any question',
          header_text: '## Welcome to AS WE ALL ARE\n\nA space for **authentic connection** and meaningful conversations.',
          body_text: '### How It Works\n\n1. **Select your deck** — Choose from our curated card collections\n2. **Draw a card** — Each card presents a thoughtful prompt\n3. **Share openly** — Take turns sharing your thoughts and experiences\n4. **Listen deeply** — Create space for others to be heard\n\n> "The quality of our lives depends on the quality of our conversations."\n\n### Why This Matters\n\nIn a world of constant distraction, we\'ve created a tool to help you:\n- Build deeper connections\n- Practice vulnerability\n- Discover new perspectives\n- Create meaningful memories',
          footer_text: 'Made with ❤️ for authentic human connection',
          socials: []
        })
      }
      console.error('[APP CONFIG] Error fetching config:', configError)
      return NextResponse.json({ error: 'Failed to fetch app config' }, { status: 500 })
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

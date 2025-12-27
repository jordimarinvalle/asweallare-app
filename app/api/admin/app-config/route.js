import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/supabase-server'
import { v4 as uuidv4 } from 'uuid'

// Default app config
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

// GET /api/admin/app-config - Get app config with socials
export async function GET(request) {
  try {
    const supabase = createSupabaseServer()
    
    // Get app config
    const { data: appConfig, error: configError } = await supabase
      .from('app_config')
      .select('*')
      .eq('slug', 'asweallare')
      .single()
    
    if (configError || !appConfig) {
      // Return default config if table doesn't exist
      return NextResponse.json(DEFAULT_APP_CONFIG)
    }
    
    // Get socials
    let socials = []
    try {
      const { data: socialsData } = await supabase
        .from('app_socials')
        .select('*')
        .eq('app_id', appConfig.id)
        .order('display_order', { ascending: true })
      
      if (socialsData) {
        socials = socialsData
      }
    } catch (e) {
      console.log('[ADMIN APP CONFIG] Socials table may not exist')
    }
    
    return NextResponse.json({
      ...appConfig,
      socials
    })
    
  } catch (error) {
    console.error('[ADMIN APP CONFIG] Error:', error)
    return NextResponse.json(DEFAULT_APP_CONFIG)
  }
}

// PUT /api/admin/app-config - Update app config
export async function PUT(request) {
  try {
    const body = await request.json()
    const { 
      id, slug, name, title, tagline, promise, 
      header_text, body_text, footer_text, build_version,
      admin_emails, primary_color, secondary_color, accent_color, danger_color 
    } = body
    
    const supabase = createSupabaseServer()
    
    // Try to update existing config
    const { data: existing } = await supabase
      .from('app_config')
      .select('id')
      .eq('slug', 'asweallare')
      .single()
    
    if (existing) {
      // Update
      const { error: updateError } = await supabase
        .from('app_config')
        .update({
          name,
          title,
          tagline,
          promise,
          header_text,
          body_text,
          footer_text,
          build_version,
          admin_emails,
          primary_color,
          secondary_color,
          accent_color,
          danger_color,
          updated_at: new Date().toISOString()
        })
        .eq('slug', 'asweallare')
      
      if (updateError) throw updateError
      
      // Fetch updated record
      const { data, error: selectError } = await supabase
        .from('app_config')
        .select('*')
        .eq('slug', 'asweallare')
        .single()
      
      if (selectError) throw selectError
      return NextResponse.json(data)
    } else {
      // Insert new
      const newId = id || 'app_asweallare'
      const { error: insertError } = await supabase
        .from('app_config')
        .insert({
          id: newId,
          slug: 'asweallare',
          name,
          title,
          tagline,
          promise,
          header_text,
          body_text,
          footer_text,
          build_version
        })
      
      if (insertError) throw insertError
      
      // Fetch inserted record
      const { data, error: selectError } = await supabase
        .from('app_config')
        .select('*')
        .eq('id', newId)
        .single()
      
      if (selectError) throw selectError
      return NextResponse.json(data)
    }
    
  } catch (error) {
    console.error('[ADMIN APP CONFIG] Update error:', error)
    return NextResponse.json({ error: 'Failed to update app config' }, { status: 500 })
  }
}

// POST /api/admin/app-config/socials - Add a social link
export async function POST(request) {
  try {
    const body = await request.json()
    const { app_id, platform, url } = body
    
    const supabase = createSupabaseServer()
    
    // Get max display order
    const { data: maxOrder } = await supabase
      .from('app_socials')
      .select('display_order')
      .eq('app_id', app_id || 'app_asweallare')
      .order('display_order', { ascending: false })
      .limit(1)
      .single()
    
    const newOrder = (maxOrder?.display_order || 0) + 1
    const newId = `social_${uuidv4().slice(0, 8)}`
    
    // Insert the social link
    const { error: insertError } = await supabase
      .from('app_socials')
      .insert({
        id: newId,
        app_id: app_id || 'app_asweallare',
        name: platform,
        url,
        display_order: newOrder,
        is_active: true
      })
    
    if (insertError) throw insertError
    
    // Fetch the inserted record
    const { data, error: selectError } = await supabase
      .from('app_socials')
      .select('*')
      .eq('id', newId)
      .single()
    
    if (selectError) throw selectError
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('[ADMIN APP CONFIG] Add social error:', error)
    return NextResponse.json({ error: 'Failed to add social link' }, { status: 500 })
  }
}

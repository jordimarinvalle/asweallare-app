import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// Log failed admin access attempt
async function logAccessAttempt(email) {
  try {
    // Check if attempt already exists
    const { data: existing } = await supabaseAdmin
      .from('admin_access_attempts')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      // Update existing record
      await supabaseAdmin
        .from('admin_access_attempts')
        .update({
          last_attempt_at: new Date().toISOString(),
          attempts_count: (existing.attempts_count || 1) + 1
        })
        .eq('email', email.toLowerCase())
    } else {
      // Insert new record
      await supabaseAdmin
        .from('admin_access_attempts')
        .insert({
          email: email.toLowerCase(),
          first_attempt_at: new Date().toISOString(),
          last_attempt_at: new Date().toISOString(),
          attempts_count: 1
        })
    }
  } catch (error) {
    console.error('Error logging access attempt:', error)
  }
}

// Check if email is an admin
async function isAdminEmail(email) {
  if (!email) return false
  
  try {
    // Get admin emails from app_config
    const { data: config } = await supabaseAdmin
      .from('app_config')
      .select('admin_emails')
      .eq('slug', 'asweallare')
      .single()

    if (!config?.admin_emails) return false

    const adminEmails = config.admin_emails
      .split('\n')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)

    return adminEmails.includes(email.toLowerCase())
  } catch (error) {
    console.error('Error checking admin email:', error)
    return false
  }
}

// POST - Check admin access
export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const isAdmin = await isAdminEmail(email)

    if (!isAdmin) {
      // Log the failed attempt
      await logAccessAttempt(email)
      
      return NextResponse.json({
        allowed: false,
        message: 'Registration as an admin is not allowed.'
      }, { status: 403 })
    }

    return NextResponse.json({
      allowed: true,
      message: 'Admin access granted'
    })

  } catch (error) {
    console.error('Admin access check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - List access attempts (for admin review)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const { data, error } = await supabaseAdmin
      .from('admin_access_attempts')
      .select('*')
      .order('last_attempt_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ attempts: data || [] })

  } catch (error) {
    console.error('Error fetching access attempts:', error)
    return NextResponse.json({ error: 'Failed to fetch access attempts' }, { status: 500 })
  }
}

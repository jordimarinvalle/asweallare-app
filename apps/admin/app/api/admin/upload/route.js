import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const BUCKET_NAME = 'assets'

// Helper to get authenticated user and check admin status
async function getAuthenticatedUserAndCheckAdmin() {
  // In local mode, check the auth-token cookie
  if (process.env.LOCAL_MODE === 'true') {
    const { cookies } = await import('next/headers')
    const { getUserFromToken } = await import('../../../../lib/auth-local')
    
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (token) {
      const user = await getUserFromToken(token)
      if (user) {
        return { user, isAdmin: true, error: null }
      }
    }
    return { user: null, isAdmin: false, error: 'Not authenticated' }
  }
  
  // Supabase mode
  const { createSupabaseServer } = await import('../../../../lib/supabase-server')
  
  const supabase = createSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return { user: null, isAdmin: false, error: error?.message || 'Not authenticated' }
  }
  
  // Check if user is admin by querying app_config admin_emails
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    const { data: config } = await supabaseAdmin
      .from('app_config')
      .select('admin_emails')
      .single()
    
    const adminEmails = config?.admin_emails || []
    const isAdmin = adminEmails.includes(user.email)
    
    return { user, isAdmin, error: null }
  } catch (dbError) {
    console.error('[UPLOAD] Error checking admin status:', dbError)
    return { user, isAdmin: false, error: null }
  }
}

// Get Supabase admin client for storage operations
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function POST(request) {
  try {
    // Check auth and admin status
    const { user, isAdmin, error: authError } = await getAuthenticatedUserAndCheckAdmin()
    
    if (authError || !user) {
      console.log('[UPLOAD] Auth failed:', { authError, user: user?.email })
      return NextResponse.json({ error: 'Unauthorized - Not authenticated' }, { status: 401 })
    }
    
    if (!isAdmin) {
      console.log('[UPLOAD] Admin check failed:', { user: user?.email, isAdmin })
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }
    
    console.log('[UPLOAD] Auth passed for admin:', user?.email)
    
    const formData = await request.formData()
    const file = formData.get('file')
    const folder = formData.get('folder') || 'uploads' // e.g., collections/unscripted_conversations/piles
    const customFilename = formData.get('filename') // Optional custom filename
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Get file buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Determine file extension from original filename or mime type
    const originalName = file.name || 'file'
    const extension = originalName.includes('.') 
      ? '.' + originalName.split('.').pop()
      : ''
    
    // Generate filename
    let filename
    if (customFilename) {
      // Use custom filename if provided, ensure extension
      filename = customFilename.includes('.') ? customFilename : `${customFilename}${extension}`
    } else {
      // Generate MD5 hash for unique filename
      const md5Hash = crypto.createHash('md5').update(buffer).digest('hex')
      filename = `${md5Hash}${extension}`
    }
    
    // Build storage path: folder/filename
    const storagePath = folder ? `${folder}/${filename}` : filename
    
    console.log(`[UPLOAD] Uploading to Supabase Storage: ${BUCKET_NAME}/${storagePath}`)
    
    // Upload to Supabase Storage
    const supabase = getSupabaseAdmin()
    
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true // Overwrite if exists
      })
    
    if (uploadError) {
      console.error('[UPLOAD] Supabase Storage error:', uploadError)
      return NextResponse.json({ 
        error: `Storage upload failed: ${uploadError.message}` 
      }, { status: 500 })
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath)
    
    console.log(`[UPLOAD] File uploaded successfully: ${publicUrl}`)
    
    return NextResponse.json({ 
      success: true, 
      path: publicUrl,
      imagePath: publicUrl,
      image_path: publicUrl,
      url: publicUrl,
      filename,
      storagePath,
      message: 'File uploaded successfully to Supabase Storage'
    })
    
  } catch (error) {
    console.error('[UPLOAD] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to upload files to Supabase Storage',
    bucket: BUCKET_NAME,
    fields: {
      file: 'File to upload (required)',
      folder: 'Folder path within bucket (e.g., collections/unscripted_conversations/piles)',
      filename: 'Optional custom filename'
    }
  })
}

import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

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
        return { user, isAdmin: true, error: null } // Local mode: all authenticated users are admins
      }
    }
    return { user: null, isAdmin: false, error: 'Not authenticated' }
  }
  
  // Supabase mode
  const { createSupabaseServer } = await import('../../../../lib/supabase-server')
  const { createClient } = await import('@supabase/supabase-js')
  
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
    const folder = formData.get('folder') // Generic folder path (e.g., collections/unscripted_conversations/piles)
    const boxFolder = formData.get('boxFolder') || 'uploads'
    const cardColor = formData.get('cardColor') || 'black'
    const customFilename = formData.get('filename') // Optional custom filename
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Get file buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Generate filename
    const extension = path.extname(file.name) || '.png'
    let filename
    
    if (customFilename) {
      // Use custom filename if provided
      filename = customFilename.endsWith(extension) ? customFilename : `${customFilename}${extension}`
    } else {
      // Generate MD5 hash for unique filename
      const md5Hash = crypto.createHash('md5').update(buffer).digest('hex')
      filename = `${md5Hash}${extension}`
    }
    
    let folderPath, imagePath
    
    if (folder) {
      // Generic folder upload (for piles, etc.)
      folderPath = path.join(process.cwd(), 'public', folder)
      imagePath = `/${folder}/${filename}`
    } else {
      // Card-specific upload (legacy behavior)
      const colorFolder = cardColor === 'black' ? `${boxFolder}-blacks` : `${boxFolder}-whites`
      folderPath = path.join(process.cwd(), 'public', 'cards', boxFolder, colorFolder)
      imagePath = `/cards/${boxFolder}/${colorFolder}/${filename}`
    }
    
    // Create directory if it doesn't exist
    await mkdir(folderPath, { recursive: true })
    
    // Write file
    const filePath = path.join(folderPath, filename)
    await writeFile(filePath, buffer)
    
    console.log(`[UPLOAD] File uploaded: ${filePath}`)
    
    return NextResponse.json({ 
      success: true, 
      path: imagePath,
      imagePath,
      image_path: imagePath,
      filename,
      message: 'Image uploaded successfully'
    })
    
  } catch (error) {
    console.error('[UPLOAD] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to upload images',
    fields: {
      file: 'Image file (required)',
      folder: 'Generic folder path (e.g., collections/unscripted_conversations/piles)',
      filename: 'Optional custom filename',
      boxFolder: 'Box folder name for cards (e.g., white-box-108)',
      cardColor: 'Card color: black or white'
    }
  })
}

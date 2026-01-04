import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../../lib/supabase-server'
import { readFile } from 'fs/promises'
import path from 'path'
import AdmZip from 'adm-zip'

// Helper to get authenticated user (supports both local and Supabase)
async function getAuthenticatedUser() {
  if (process.env.LOCAL_MODE === 'true') {
    const { cookies } = await import('next/headers')
    const { getUserFromToken } = await import('../../../../../lib/auth-local')
    
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (token) {
      const user = await getUserFromToken(token)
      if (user) {
        return { user, error: null }
      }
    }
    return { user: null, error: 'Not authenticated' }
  }
  
  const supabase = createSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Admin email (for Supabase mode)
const ADMIN_EMAIL = 'mocasin@gmail.com'

function isAuthorized(user) {
  const isLocalMode = process.env.LOCAL_MODE === 'true'
  return isLocalMode 
    ? (user !== null)
    : (user && (user.email === ADMIN_EMAIL || user.is_admin))
}

// POST - Download all mockup images for a box as ZIP
export async function POST(request) {
  const supabase = createSupabaseServer()
  
  try {
    const { user, error: authError } = await getAuthenticatedUser()
    
    if (authError || !isAuthorized(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { boxId } = await request.json()
    
    if (!boxId) {
      return NextResponse.json({ error: 'boxId required' }, { status: 400 })
    }
    
    // Get all mockup images for this box
    const { data: mockups, error } = await supabase
      .from('mockup_images')
      .select('*')
      .eq('box_id', boxId)
      .order('image_type', { ascending: true })
      .order('image_path', { ascending: true })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!mockups || mockups.length === 0) {
      return NextResponse.json({ error: 'No mockup images found for this box' }, { status: 404 })
    }
    
    // Create ZIP file
    const zip = new AdmZip()
    let addedCount = 0
    const errors = []
    
    for (const mockup of mockups) {
      if (!mockup.image_path) continue
      
      try {
        // Convert image path to filesystem path
        const filePath = path.join(process.cwd(), 'public', mockup.image_path.replace(/^\//, ''))
        const fileBuffer = await readFile(filePath)
        
        // Determine folder structure in ZIP
        let zipPath
        const fileName = path.basename(mockup.image_path)
        
        if (mockup.image_type === 'BOX_MAIN') {
          zipPath = `main/${fileName}`
        } else if (mockup.image_type === 'BOX_SECONDARY') {
          zipPath = `secondary/${fileName}`
        } else if (mockup.image_type === 'CARD') {
          zipPath = `cards/${fileName}`
        } else {
          zipPath = fileName
        }
        
        zip.addFile(zipPath, fileBuffer)
        addedCount++
      } catch (err) {
        errors.push({ path: mockup.image_path, error: err.message })
      }
    }
    
    if (addedCount === 0) {
      return NextResponse.json({ 
        error: 'No image files could be read', 
        details: errors 
      }, { status: 500 })
    }
    
    // Get ZIP buffer
    const zipBuffer = zip.toBuffer()
    
    // Generate filename
    const { data: box } = await supabase
      .from('boxes')
      .select('name')
      .eq('id', boxId)
      .single()
    
    const safeBoxName = (box?.name || boxId).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    const zipFilename = `${safeBoxName}_mockups.zip`
    
    console.log('[MOCKUPS DOWNLOAD] Created ZIP with', addedCount, 'files for box:', boxId)
    
    // Return ZIP file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Content-Length': zipBuffer.length.toString()
      }
    })
    
  } catch (error) {
    console.error('[MOCKUPS DOWNLOAD] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'POST with boxId to download all mockup images as ZIP',
    fields: {
      boxId: 'Box ID (required)'
    }
  })
}

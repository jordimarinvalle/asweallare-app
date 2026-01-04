import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import AdmZip from 'adm-zip'
import path from 'path'

const BUCKET_NAME = 'assets'

// Helper to get authenticated user and check admin status
async function getAuthenticatedUserAndCheckAdmin() {
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
  
  const supabase = createSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return { user: null, isAdmin: false, error: error?.message || 'Not authenticated' }
  }
  
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
    console.error('[UPLOAD-CARDS] Error checking admin status:', dbError)
    return { user, isAdmin: false, error: null }
  }
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function POST(request) {
  const supabase = createSupabaseServer()
  const supabaseAdmin = getSupabaseAdmin()
  
  try {
    const { user, isAdmin, error: authError } = await getAuthenticatedUserAndCheckAdmin()
    
    if (authError || !user) {
      console.log('[UPLOAD-CARDS] Auth failed:', { authError, user: user?.email })
      return NextResponse.json({ error: 'Unauthorized - Not authenticated' }, { status: 401 })
    }
    
    if (!isAdmin) {
      console.log('[UPLOAD-CARDS] Admin check failed:', { user: user?.email, isAdmin })
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }
    
    console.log('[UPLOAD-CARDS] Auth passed for admin:', user?.email)
    
    const formData = await request.formData()
    const zipFile = formData.get('file')
    const boxId = formData.get('boxId')
    const boxSlug = formData.get('boxSlug')
    const pileId = formData.get('pileId')
    const pileSlug = formData.get('pileSlug')
    
    if (!zipFile || !boxId || !boxSlug || !pileId || !pileSlug) {
      return NextResponse.json({ 
        error: 'Missing required fields: file, boxId, boxSlug, pileId, pileSlug' 
      }, { status: 400 })
    }
    
    console.log('[UPLOAD-CARDS] Processing ZIP for box:', boxSlug, 'pile:', pileSlug)
    
    const bytes = await zipFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Storage path: cards/{box_slug}/{pile_slug}/
    const storagePath = `cards/${boxSlug}/${pileSlug}`
    
    // Delete existing cards for this box+pile combination
    const { data: existingCards } = await supabase
      .from('cards')
      .select('*')
      .eq('box_id', boxId)
      .eq('pile_id', pileId)
    
    if (existingCards && existingCards.length > 0) {
      await supabase
        .from('cards')
        .delete()
        .eq('box_id', boxId)
        .eq('pile_id', pileId)
      
      // Try to remove existing files from storage
      try {
        const { data: files } = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .list(storagePath)
        
        if (files && files.length > 0) {
          const filePaths = files.map(f => `${storagePath}/${f.name}`)
          await supabaseAdmin.storage.from(BUCKET_NAME).remove(filePaths)
        }
      } catch (err) {
        console.log('[UPLOAD-CARDS] Could not remove old files:', err.message)
      }
    }
    
    let zip
    try {
      zip = new AdmZip(buffer)
    } catch (err) {
      return NextResponse.json({ error: 'Invalid ZIP file format' }, { status: 400 })
    }
    
    const zipEntries = zip.getEntries()
    
    const imageEntries = zipEntries.filter(entry => {
      const name = entry.entryName.toLowerCase()
      if (entry.isDirectory) return false
      if (name.includes('__macosx')) return false
      if (name.startsWith('.')) return false
      if (path.basename(name).startsWith('.')) return false
      return /\.(png|jpg|jpeg)$/i.test(name)
    })
    
    if (imageEntries.length === 0) {
      return NextResponse.json({ error: 'No PNG/JPG images found in ZIP file' }, { status: 400 })
    }
    
    console.log('[UPLOAD-CARDS] Found', imageEntries.length, 'images in ZIP')
    
    const createdCards = []
    const errors = []
    
    for (const entry of imageEntries) {
      try {
        const fileBuffer = entry.getData()
        const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex')
        const originalExt = path.extname(entry.entryName).toLowerCase() || '.png'
        const newFilename = `${md5Hash}${originalExt}`
        const fullStoragePath = `${storagePath}/${newFilename}`
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .upload(fullStoragePath, fileBuffer, {
            contentType: originalExt === '.png' ? 'image/png' : 'image/jpeg',
            upsert: true
          })
        
        if (uploadError) {
          errors.push({ file: entry.entryName, error: uploadError.message })
          continue
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fullStoragePath)
        
        const cardId = md5Hash
        
        const { error: dbError } = await supabase
          .from('cards')
          .insert({
            id: cardId,
            box_id: boxId,
            pile_id: pileId,
            text: null,
            image_path: publicUrl,
            is_active: true,
            created_at: new Date().toISOString()
          })
        
        if (dbError) {
          errors.push({ file: entry.entryName, error: dbError.message })
        } else {
          createdCards.push({
            id: cardId,
            originalFile: path.basename(entry.entryName),
            imagePath: publicUrl
          })
        }
      } catch (err) {
        errors.push({ file: entry.entryName, error: err.message })
      }
    }
    
    const deletedCount = existingCards?.length || 0
    
    console.log('[UPLOAD-CARDS] Created', createdCards.length, 'cards, deleted', deletedCount)
    
    return NextResponse.json({
      success: true,
      message: `Replaced ${deletedCount} existing cards with ${createdCards.length} new cards`,
      deleted: deletedCount,
      created: createdCards.length,
      cards: createdCards,
      errors: errors.length > 0 ? errors : undefined
    })
    
  } catch (error) {
    console.error('[UPLOAD-CARDS] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'POST a ZIP file to bulk upload cards to Supabase Storage',
    bucket: BUCKET_NAME,
    fields: {
      file: 'ZIP file containing PNG/JPG images (required)',
      boxId: 'Box ID (required)',
      boxSlug: 'Box slug/path for file storage (required)',
      pileId: 'Pile ID - black or white (required)',
      pileSlug: 'Pile slug for file storage (required)'
    }
  })
}

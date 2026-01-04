import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import crypto from 'crypto'
import AdmZip from 'adm-zip'

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
    console.error('[MOCKUPS] Error checking admin status:', dbError)
    return { user, isAdmin: false, error: null }
  }
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// GET - Fetch mockup images for a box
export async function GET(request) {
  const supabase = createSupabaseServer()
  
  try {
    const { user, isAdmin, error: authError } = await getAuthenticatedUserAndCheckAdmin()
    
    if (authError || !user || !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const boxId = searchParams.get('boxId')
    
    if (!boxId) {
      return NextResponse.json({ error: 'boxId required' }, { status: 400 })
    }
    
    const { data: mockups, error } = await supabase
      .from('mockup_images')
      .select('*')
      .eq('box_id', boxId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    const mainImage = mockups?.find(m => m.image_type === 'BOX_MAIN') || null
    const secondaryImage = mockups?.find(m => m.image_type === 'BOX_SECONDARY') || null
    const cardMockups = (mockups || []).filter(m => m.image_type === 'CARD')
    
    return NextResponse.json({
      boxId,
      mainImage,
      secondaryImage,
      cardMockups,
      totalCount: mockups?.length || 0
    })
    
  } catch (error) {
    console.error('[MOCKUPS GET] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Upload mockup image(s)
export async function POST(request) {
  const supabase = createSupabaseServer()
  const supabaseAdmin = getSupabaseAdmin()
  
  try {
    const { user, isAdmin, error: authError } = await getAuthenticatedUserAndCheckAdmin()
    
    if (authError || !user || !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const formData = await request.formData()
    const file = formData.get('file')
    const boxId = formData.get('boxId')
    const imageType = formData.get('imageType')
    
    if (!file || !boxId || !imageType) {
      return NextResponse.json({ 
        error: 'Missing required fields: file, boxId, imageType' 
      }, { status: 400 })
    }
    
    const validTypes = ['BOX_MAIN', 'BOX_SECONDARY', 'CARD_ZIP']
    if (!validTypes.includes(imageType)) {
      return NextResponse.json({ 
        error: `Invalid imageType. Must be one of: ${validTypes.join(', ')}` 
      }, { status: 400 })
    }
    
    console.log('[MOCKUPS POST] Processing:', { boxId, imageType, fileName: file.name })
    
    if (imageType === 'CARD_ZIP') {
      return handleCardMockupsZip(supabase, supabaseAdmin, file, boxId)
    }
    
    return handleSingleImageUpload(supabase, supabaseAdmin, file, boxId, imageType)
    
  } catch (error) {
    console.error('[MOCKUPS POST] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete mockup image(s)
export async function DELETE(request) {
  const supabase = createSupabaseServer()
  const supabaseAdmin = getSupabaseAdmin()
  
  try {
    const { user, isAdmin, error: authError } = await getAuthenticatedUserAndCheckAdmin()
    
    if (authError || !user || !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const boxId = searchParams.get('boxId')
    const imageId = searchParams.get('imageId')
    const deleteType = searchParams.get('type')
    
    if (!boxId) {
      return NextResponse.json({ error: 'boxId required' }, { status: 400 })
    }
    
    let deletedCount = 0
    
    if (imageId) {
      const { data: image } = await supabase
        .from('mockup_images')
        .select('*')
        .eq('id', imageId)
        .eq('box_id', boxId)
        .single()
      
      if (image) {
        await deleteStorageFile(supabaseAdmin, image.image_path)
        await supabaseAdmin.from('mockup_images').delete().eq('id', imageId)
        deletedCount = 1
      }
    } else if (deleteType === 'all') {
      deletedCount = await deleteAllMockupsForBox(supabaseAdmin, supabaseAdmin, boxId)
    } else if (deleteType === 'main') {
      deletedCount = await deleteMockupsByType(supabaseAdmin, supabaseAdmin, boxId, 'BOX_MAIN')
    } else if (deleteType === 'secondary') {
      deletedCount = await deleteMockupsByType(supabaseAdmin, supabaseAdmin, boxId, 'BOX_SECONDARY')
    } else if (deleteType === 'cards') {
      deletedCount = await deleteMockupsByType(supabaseAdmin, supabaseAdmin, boxId, 'CARD')
    } else {
      return NextResponse.json({ 
        error: 'Specify imageId or type (all, main, secondary, cards)' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ success: true, deleted: deletedCount })
    
  } catch (error) {
    console.error('[MOCKUPS DELETE] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update mockup image (display_order)
export async function PUT(request) {
  const supabaseAdmin = getSupabaseAdmin()
  
  try {
    const { user, isAdmin, error: authError } = await getAuthenticatedUserAndCheckAdmin()
    
    if (authError || !user || !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { id, displayOrder } = body
    
    if (!id || displayOrder === undefined) {
      return NextResponse.json({ error: 'id and displayOrder required' }, { status: 400 })
    }
    
    const { error } = await supabaseAdmin
      .from('mockup_images')
      .update({ display_order: parseInt(displayOrder) })
      .eq('id', id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('[MOCKUPS PUT] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Helper: Handle single image upload to Supabase Storage
async function handleSingleImageUpload(supabase, supabaseAdmin, file, boxId, imageType) {
  const validExtensions = ['.png', '.jpg', '.jpeg', '.webp']
  const ext = path.extname(file.name).toLowerCase()
  if (!validExtensions.includes(ext)) {
    return NextResponse.json({ 
      error: 'Invalid file type. Allowed: PNG, JPG, JPEG, WEBP' 
    }, { status: 400 })
  }
  
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const md5Hash = crypto.createHash('md5').update(buffer).digest('hex')
  const newFilename = `${md5Hash}${ext}`
  
  const storagePath = `boxes/${boxId}/mockups/${newFilename}`
  
  // Delete existing image of this type
  const { data: existing } = await supabase
    .from('mockup_images')
    .select('*')
    .eq('box_id', boxId)
    .eq('image_type', imageType)
  
  if (existing && existing.length > 0) {
    for (const img of existing) {
      await deleteStorageFile(supabaseAdmin, img.image_path)
    }
    await supabaseAdmin
      .from('mockup_images')
      .delete()
      .eq('box_id', boxId)
      .eq('image_type', imageType)
  }
  
  // Upload to Supabase Storage
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      contentType: file.type || 'image/png',
      upsert: true
    })
  
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }
  
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath)
  
  const newImageData = {
    id: md5Hash,
    box_id: boxId,
    image_path: publicUrl,
    image_type: imageType,
    display_order: imageType === 'BOX_MAIN' ? 1 : 2,
    created_at: new Date().toISOString()
  }
  
  const { error } = await supabase
    .from('mockup_images')
    .insert(newImageData)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  console.log('[MOCKUPS] Created', imageType, 'for box:', boxId)
  
  return NextResponse.json({
    success: true,
    image: newImageData,
    message: `${imageType} image uploaded successfully`
  })
}

// Helper: Handle ZIP upload for card mockups
async function handleCardMockupsZip(supabase, supabaseAdmin, zipFile, boxId) {
  const bytes = await zipFile.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  const maxSize = 50 * 1024 * 1024
  if (buffer.length > maxSize) {
    return NextResponse.json({ 
      error: 'ZIP file too large. Maximum size is 50MB' 
    }, { status: 400 })
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
    return /\.(png|jpg|jpeg|webp)$/i.test(name)
  })
  
  if (imageEntries.length === 0) {
    return NextResponse.json({ 
      error: 'No valid images found in ZIP (PNG, JPG, JPEG, WEBP)' 
    }, { status: 400 })
  }
  
  if (imageEntries.length > 300) {
    return NextResponse.json({ 
      error: `Too many images (${imageEntries.length}). Maximum is 300` 
    }, { status: 400 })
  }
  
  console.log('[MOCKUPS] Found', imageEntries.length, 'images in ZIP for box:', boxId)
  
  // Delete existing card mockups
  await deleteMockupsByType(supabase, supabaseAdmin, boxId, 'CARD')
  
  imageEntries.sort((a, b) => {
    const nameA = path.basename(a.entryName).toLowerCase()
    const nameB = path.basename(b.entryName).toLowerCase()
    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' })
  })
  
  const createdMockups = []
  const errors = []
  
  for (let i = 0; i < imageEntries.length; i++) {
    const entry = imageEntries[i]
    const displayOrder = i + 1
    
    try {
      const fileBuffer = entry.getData()
      const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex')
      const originalExt = path.extname(entry.entryName).toLowerCase() || '.png'
      const newFilename = `${md5Hash}${originalExt}`
      const storagePath = `boxes/${boxId}/mockups/cards/${newFilename}`
      
      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
          contentType: originalExt === '.png' ? 'image/png' : 'image/jpeg',
          upsert: true
        })
      
      if (uploadError) {
        errors.push({ file: entry.entryName, error: uploadError.message })
        continue
      }
      
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath)
      
      const { error: dbError } = await supabase
        .from('mockup_images')
        .insert({
          id: `${boxId}_card_${md5Hash}`,
          box_id: boxId,
          image_path: publicUrl,
          image_type: 'CARD',
          display_order: displayOrder,
          created_at: new Date().toISOString()
        })
      
      if (dbError) {
        errors.push({ file: entry.entryName, error: dbError.message })
      } else {
        createdMockups.push({
          id: `${boxId}_card_${md5Hash}`,
          originalFile: path.basename(entry.entryName),
          imagePath: publicUrl,
          displayOrder: displayOrder
        })
      }
    } catch (err) {
      errors.push({ file: entry.entryName, error: err.message })
    }
  }
  
  console.log('[MOCKUPS] Created', createdMockups.length, 'card mockups for box:', boxId)
  
  return NextResponse.json({
    success: true,
    message: `Uploaded ${createdMockups.length} card mockup images`,
    created: createdMockups.length,
    mockups: createdMockups,
    errors: errors.length > 0 ? errors : undefined
  })
}

// Helper: Delete mockups by type
async function deleteMockupsByType(supabase, supabaseAdmin, boxId, imageType) {
  const { data: mockups } = await supabase
    .from('mockup_images')
    .select('*')
    .eq('box_id', boxId)
    .eq('image_type', imageType)
  
  if (!mockups || mockups.length === 0) return 0
  
  for (const img of mockups) {
    await deleteStorageFile(supabaseAdmin, img.image_path)
  }
  
  await supabase
    .from('mockup_images')
    .delete()
    .eq('box_id', boxId)
    .eq('image_type', imageType)
  
  return mockups.length
}

// Helper: Delete all mockups for a box
async function deleteAllMockupsForBox(supabase, supabaseAdmin, boxId) {
  const { data: mockups } = await supabase
    .from('mockup_images')
    .select('*')
    .eq('box_id', boxId)
  
  if (!mockups || mockups.length === 0) return 0
  
  for (const img of mockups) {
    await deleteStorageFile(supabaseAdmin, img.image_path)
  }
  
  await supabase
    .from('mockup_images')
    .delete()
    .eq('box_id', boxId)
  
  return mockups.length
}

// Helper: Delete file from Supabase Storage
async function deleteStorageFile(supabaseAdmin, imageUrl) {
  if (!imageUrl) return
  
  try {
    // Extract path from URL if it's a full Supabase URL
    if (imageUrl.includes('supabase.co/storage')) {
      const match = imageUrl.match(/\/storage\/v1\/object\/public\/assets\/(.+)$/)
      if (match) {
        await supabaseAdmin.storage.from(BUCKET_NAME).remove([match[1]])
      }
    }
  } catch (err) {
    console.warn('[MOCKUPS] Could not delete storage file:', imageUrl, err.message)
  }
}

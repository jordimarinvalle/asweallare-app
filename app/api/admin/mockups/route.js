import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/supabase-server'
import { writeFile, mkdir, rm, readFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import AdmZip from 'adm-zip'
import { existsSync } from 'fs'

// Helper to get authenticated user (supports both local and Supabase)
async function getAuthenticatedUser() {
  if (process.env.LOCAL_MODE === 'true') {
    const { cookies } = await import('next/headers')
    const { getUserFromToken } = await import('../../../../lib/auth-local')
    
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

// GET - Fetch mockup images for a box
export async function GET(request) {
  const supabase = createSupabaseServer()
  
  try {
    const { user, error: authError } = await getAuthenticatedUser()
    
    if (authError || !isAuthorized(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const boxId = searchParams.get('boxId')
    
    if (!boxId) {
      return NextResponse.json({ error: 'boxId required' }, { status: 400 })
    }
    
    // Get all mockup images for this box, ordered by display_order then created_at
    const { data: mockups, error } = await supabase
      .from('mockup_images')
      .select('*')
      .eq('box_id', boxId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Separate by type
    const mainImage = mockups?.find(m => m.image_type === 'BOX_MAIN') || null
    const secondaryImage = mockups?.find(m => m.image_type === 'BOX_SECONDARY') || null
    const cardMockups = (mockups || [])
      .filter(m => m.image_type === 'CARD')
    
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
  
  try {
    const { user, error: authError } = await getAuthenticatedUser()
    
    if (authError || !isAuthorized(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const formData = await request.formData()
    const file = formData.get('file')
    const boxId = formData.get('boxId')
    const imageType = formData.get('imageType') // 'BOX_MAIN', 'BOX_SECONDARY', or 'CARD_ZIP'
    
    if (!file || !boxId || !imageType) {
      return NextResponse.json({ 
        error: 'Missing required fields: file, boxId, imageType' 
      }, { status: 400 })
    }
    
    // Validate imageType
    const validTypes = ['BOX_MAIN', 'BOX_SECONDARY', 'CARD_ZIP']
    if (!validTypes.includes(imageType)) {
      return NextResponse.json({ 
        error: `Invalid imageType. Must be one of: ${validTypes.join(', ')}` 
      }, { status: 400 })
    }
    
    console.log('[MOCKUPS POST] Processing:', { boxId, imageType, fileName: file.name })
    
    // Handle ZIP upload for card mockups
    if (imageType === 'CARD_ZIP') {
      return handleCardMockupsZip(supabase, file, boxId)
    }
    
    // Handle single image upload (BOX_MAIN or BOX_SECONDARY)
    return handleSingleImageUpload(supabase, file, boxId, imageType)
    
  } catch (error) {
    console.error('[MOCKUPS POST] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete mockup image(s)
export async function DELETE(request) {
  const supabase = createSupabaseServer()
  
  try {
    const { user, error: authError } = await getAuthenticatedUser()
    
    if (authError || !isAuthorized(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const boxId = searchParams.get('boxId')
    const imageId = searchParams.get('imageId')
    const deleteType = searchParams.get('type') // 'all', 'main', 'secondary', 'cards', or specific id
    
    if (!boxId) {
      return NextResponse.json({ error: 'boxId required' }, { status: 400 })
    }
    
    let deletedCount = 0
    
    if (imageId) {
      // Delete specific image by ID
      const { data: image } = await supabase
        .from('mockup_images')
        .select('*')
        .eq('id', imageId)
        .eq('box_id', boxId)
        .single()
      
      if (image) {
        await deleteImageFile(image.image_path)
        await supabase.from('mockup_images').delete().eq('id', imageId)
        deletedCount = 1
      }
    } else if (deleteType === 'all') {
      // Delete all mockups for box
      deletedCount = await deleteAllMockupsForBox(supabase, boxId)
    } else if (deleteType === 'main') {
      deletedCount = await deleteMockupsByType(supabase, boxId, 'BOX_MAIN')
    } else if (deleteType === 'secondary') {
      deletedCount = await deleteMockupsByType(supabase, boxId, 'BOX_SECONDARY')
    } else if (deleteType === 'cards') {
      deletedCount = await deleteMockupsByType(supabase, boxId, 'CARD')
    } else {
      return NextResponse.json({ 
        error: 'Specify imageId or type (all, main, secondary, cards)' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: true, 
      deleted: deletedCount 
    })
    
  } catch (error) {
    console.error('[MOCKUPS DELETE] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Helper: Handle single image upload (BOX_MAIN or BOX_SECONDARY)
async function handleSingleImageUpload(supabase, file, boxId, imageType) {
  // Validate file type
  const validExtensions = ['.png', '.jpg', '.jpeg', '.webp']
  const ext = path.extname(file.name).toLowerCase()
  if (!validExtensions.includes(ext)) {
    return NextResponse.json({ 
      error: 'Invalid file type. Allowed: PNG, JPG, JPEG, WEBP' 
    }, { status: 400 })
  }
  
  // Get file buffer and compute MD5
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const md5Hash = crypto.createHash('md5').update(buffer).digest('hex')
  const newFilename = `${md5Hash}${ext}`
  
  // Storage path: public/boxes/{box_id}/mockups/{md5}.{ext}
  const targetDir = path.join(process.cwd(), 'public', 'boxes', boxId, 'mockups')
  await mkdir(targetDir, { recursive: true })
  
  const targetPath = path.join(targetDir, newFilename)
  const relativePath = `/boxes/${boxId}/mockups/${newFilename}`
  
  // Delete existing image of this type for this box
  const { data: existing } = await supabase
    .from('mockup_images')
    .select('*')
    .eq('box_id', boxId)
    .eq('image_type', imageType)
  
  if (existing && existing.length > 0) {
    for (const img of existing) {
      await deleteImageFile(img.image_path)
    }
    await supabase
      .from('mockup_images')
      .delete()
      .eq('box_id', boxId)
      .eq('image_type', imageType)
  }
  
  // Write new file
  await writeFile(targetPath, buffer)
  
  // Create DB record
  const { data: newImage, error } = await supabase
    .from('mockup_images')
    .insert({
      id: md5Hash,
      box_id: boxId,
      image_path: relativePath,
      image_type: imageType,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  console.log('[MOCKUPS] Created', imageType, 'for box:', boxId)
  
  return NextResponse.json({
    success: true,
    image: newImage,
    message: `${imageType} image uploaded successfully`
  })
}

// Helper: Handle ZIP upload for card mockups
async function handleCardMockupsZip(supabase, zipFile, boxId) {
  // Get ZIP buffer
  const bytes = await zipFile.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024
  if (buffer.length > maxSize) {
    return NextResponse.json({ 
      error: 'ZIP file too large. Maximum size is 50MB' 
    }, { status: 400 })
  }
  
  // Extract ZIP
  let zip
  try {
    zip = new AdmZip(buffer)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid ZIP file format' }, { status: 400 })
  }
  
  const zipEntries = zip.getEntries()
  
  // Filter for image files only
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
  
  // Check max image count (300)
  if (imageEntries.length > 300) {
    return NextResponse.json({ 
      error: `Too many images (${imageEntries.length}). Maximum is 300` 
    }, { status: 400 })
  }
  
  console.log('[MOCKUPS] Found', imageEntries.length, 'images in ZIP for box:', boxId)
  
  // Delete existing card mockups for this box
  await deleteMockupsByType(supabase, boxId, 'CARD')
  
  // Target directory: public/boxes/{box_id}/mockups/cards/
  const targetDir = path.join(process.cwd(), 'public', 'boxes', boxId, 'mockups', 'cards')
  
  // Clean and recreate directory
  try {
    await rm(targetDir, { recursive: true, force: true })
  } catch (err) {
    // Directory might not exist
  }
  await mkdir(targetDir, { recursive: true })
  
  // Sort entries by filename (natural sort) - this determines display_order
  imageEntries.sort((a, b) => {
    const nameA = path.basename(a.entryName).toLowerCase()
    const nameB = path.basename(b.entryName).toLowerCase()
    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' })
  })
  
  // Process each image with display_order based on sorted position
  const createdMockups = []
  const errors = []
  
  for (let i = 0; i < imageEntries.length; i++) {
    const entry = imageEntries[i]
    const displayOrder = i + 1  // 1-based display order
    
    try {
      const fileBuffer = entry.getData()
      const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex')
      const originalExt = path.extname(entry.entryName).toLowerCase() || '.png'
      const newFilename = `${md5Hash}${originalExt}`
      
      const targetPath = path.join(targetDir, newFilename)
      const relativePath = `/boxes/${boxId}/mockups/cards/${newFilename}`
      
      // Write file
      await writeFile(targetPath, fileBuffer)
      
      // Create DB record with display_order
      const { error: dbError } = await supabase
        .from('mockup_images')
        .insert({
          id: `${boxId}_card_${md5Hash}`,
          box_id: boxId,
          image_path: relativePath,
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
          imagePath: relativePath,
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
async function deleteMockupsByType(supabase, boxId, imageType) {
  const { data: mockups } = await supabase
    .from('mockup_images')
    .select('*')
    .eq('box_id', boxId)
    .eq('image_type', imageType)
  
  if (!mockups || mockups.length === 0) return 0
  
  // Delete files
  for (const img of mockups) {
    await deleteImageFile(img.image_path)
  }
  
  // Delete from DB
  await supabase
    .from('mockup_images')
    .delete()
    .eq('box_id', boxId)
    .eq('image_type', imageType)
  
  return mockups.length
}

// Helper: Delete all mockups for a box
async function deleteAllMockupsForBox(supabase, boxId) {
  const { data: mockups } = await supabase
    .from('mockup_images')
    .select('*')
    .eq('box_id', boxId)
  
  if (!mockups || mockups.length === 0) return 0
  
  // Delete files
  for (const img of mockups) {
    await deleteImageFile(img.image_path)
  }
  
  // Delete directory
  const boxDir = path.join(process.cwd(), 'public', 'boxes', boxId, 'mockups')
  try {
    await rm(boxDir, { recursive: true, force: true })
  } catch (err) {
    // Directory might not exist
  }
  
  // Delete from DB
  await supabase
    .from('mockup_images')
    .delete()
    .eq('box_id', boxId)
  
  return mockups.length
}

// Helper: Delete a single image file
async function deleteImageFile(imagePath) {
  if (!imagePath) return
  
  try {
    const filePath = path.join(process.cwd(), 'public', imagePath.replace(/^\//, ''))
    if (existsSync(filePath)) {
      await rm(filePath, { force: true })
    }
  } catch (err) {
    console.warn('[MOCKUPS] Could not delete file:', imagePath, err.message)
  }
}

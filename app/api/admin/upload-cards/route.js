import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/supabase-server'
import { writeFile, mkdir, rm } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import AdmZip from 'adm-zip'

// Admin email restriction
const ADMIN_EMAIL = 'mocasin@gmail.com'

export async function POST(request) {
  const supabase = createSupabaseServer()
  
  try {
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const formData = await request.formData()
    const zipFile = formData.get('file')
    const boxId = formData.get('boxId')
    const boxSlug = formData.get('boxSlug') // e.g., "white-box-108"
    const pileId = formData.get('pileId')
    const pileSlug = formData.get('pileSlug') // e.g., "black" or "white"
    
    if (!zipFile || !boxId || !boxSlug || !pileId || !pileSlug) {
      return NextResponse.json({ 
        error: 'Missing required fields: file, boxId, boxSlug, pileId, pileSlug' 
      }, { status: 400 })
    }
    
    // Get ZIP file buffer
    const bytes = await zipFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Create target directory
    // Path: /public/cards/{box_slug}/{pile_slug}/
    const targetDir = path.join(process.cwd(), 'public', 'cards', boxSlug, pileSlug)
    await mkdir(targetDir, { recursive: true })
    
    // Extract ZIP using adm-zip
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
      // Skip directories, __MACOSX files, and hidden files
      if (entry.isDirectory) return false
      if (name.includes('__macosx')) return false
      if (name.startsWith('.')) return false
      if (path.basename(name).startsWith('.')) return false
      // Only allow image files
      return /\.(png|jpg|jpeg)$/i.test(name)
    })
    
    if (imageEntries.length === 0) {
      return NextResponse.json({ error: 'No PNG/JPG images found in ZIP file' }, { status: 400 })
    }
    
    // Process each image file
    const createdCards = []
    const errors = []
    
    for (const entry of imageEntries) {
      try {
        // Get file buffer
        const fileBuffer = entry.getData()
        
        // Generate MD5 hash as filename
        const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex')
        
        // Keep original extension
        const originalExt = path.extname(entry.entryName).toLowerCase() || '.png'
        const newFilename = `${md5Hash}${originalExt}`
        
        // Write file to target directory
        const targetPath = path.join(targetDir, newFilename)
        await writeFile(targetPath, fileBuffer)
        
        // Relative path for database (without /public prefix)
        const relativeImagePath = `cards/${boxSlug}/${pileSlug}/${newFilename}`
        
        // Create card record in database
        // Use MD5 as the card ID
        const cardId = md5Hash
        
        const { data: card, error: dbError } = await supabase
          .from('cards')
          .upsert({
            id: cardId,
            box_id: boxId,
            pile_id: pileId,
            text: null,
            image_path: relativeImagePath,
            is_active: true,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })
          .select()
          .single()
        
        if (dbError) {
          errors.push({ file: entry.entryName, error: dbError.message })
        } else {
          createdCards.push({
            id: cardId,
            originalFile: path.basename(entry.entryName),
            imagePath: relativeImagePath
          })
        }
      } catch (err) {
        errors.push({ file: entry.entryName, error: err.message })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${imageEntries.length} images`,
      created: createdCards.length,
      cards: createdCards,
      errors: errors.length > 0 ? errors : undefined
    })
    
  } catch (error) {
    console.error('Upload cards error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'POST a ZIP file to bulk upload cards',
    fields: {
      file: 'ZIP file containing PNG/JPG images (required)',
      boxId: 'Box ID (required)',
      boxSlug: 'Box slug/path for file storage (required)',
      pileId: 'Pile ID - black or white (required)',
      pileSlug: 'Pile slug for file storage (required)'
    }
  })
}

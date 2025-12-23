import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/supabase-server'
import { writeFile, mkdir, readdir, unlink, rm } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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
    
    // Create temp directory for extraction
    const tempDir = path.join(process.cwd(), 'temp', `upload_${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
    
    // Save ZIP file temporarily
    const zipPath = path.join(tempDir, 'upload.zip')
    await writeFile(zipPath, buffer)
    
    // Extract ZIP file
    try {
      await execAsync(`unzip -o "${zipPath}" -d "${tempDir}"`)
    } catch (err) {
      await rm(tempDir, { recursive: true, force: true })
      return NextResponse.json({ error: 'Failed to extract ZIP file' }, { status: 400 })
    }
    
    // Create target directory
    // Path: /public/cards/{box_slug}/{pile_slug}/
    const targetDir = path.join(process.cwd(), 'public', 'cards', boxSlug, pileSlug)
    await mkdir(targetDir, { recursive: true })
    
    // Find all PNG files in extracted content (including subdirectories)
    const findPngFiles = async (dir) => {
      const files = []
      const entries = await readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          // Skip __MACOSX folder
          if (entry.name !== '__MACOSX') {
            const subFiles = await findPngFiles(fullPath)
            files.push(...subFiles)
          }
        } else if (entry.isFile() && /\.(png|jpg|jpeg)$/i.test(entry.name)) {
          files.push(fullPath)
        }
      }
      return files
    }
    
    const imageFiles = await findPngFiles(tempDir)
    
    if (imageFiles.length === 0) {
      await rm(tempDir, { recursive: true, force: true })
      return NextResponse.json({ error: 'No PNG/JPG images found in ZIP file' }, { status: 400 })
    }
    
    // Process each image file
    const createdCards = []
    const errors = []
    
    for (const imagePath of imageFiles) {
      try {
        // Read file content
        const { readFile } = await import('fs/promises')
        const fileBuffer = await readFile(imagePath)
        
        // Generate MD5 hash as filename
        const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex')
        const extension = path.extname(imagePath).toLowerCase() || '.png'
        const newFilename = `${md5Hash}${extension}`
        
        // Copy file to target directory
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
          errors.push({ file: path.basename(imagePath), error: dbError.message })
        } else {
          createdCards.push({
            id: cardId,
            originalFile: path.basename(imagePath),
            imagePath: relativeImagePath
          })
        }
      } catch (err) {
        errors.push({ file: path.basename(imagePath), error: err.message })
      }
    }
    
    // Cleanup temp directory
    await rm(tempDir, { recursive: true, force: true })
    
    return NextResponse.json({
      success: true,
      message: `Processed ${imageFiles.length} images`,
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
      file: 'ZIP file containing PNG images (required)',
      boxId: 'Box ID (required)',
      boxSlug: 'Box slug/path for file storage (required)',
      pileId: 'Pile ID - black or white (required)',
      pileSlug: 'Pile slug for file storage (required)'
    }
  })
}

import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/supabase-server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

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
      imagePath = `${folder}/${filename}`
    } else {
      // Card-specific upload (legacy behavior)
      const colorFolder = cardColor === 'black' ? `${boxFolder}-blacks` : `${boxFolder}-whites`
      folderPath = path.join(process.cwd(), 'public', 'cards', boxFolder, colorFolder)
      imagePath = `${boxFolder}/${colorFolder}/${filename}`
    }
    
    // Create directory if it doesn't exist
    await mkdir(folderPath, { recursive: true })
    
    // Write file
    const filePath = path.join(folderPath, filename)
    await writeFile(filePath, buffer)
    
    console.log(`File uploaded: ${filePath}`)
    
    return NextResponse.json({ 
      success: true, 
      path: imagePath,
      imagePath,
      filename,
      message: 'Image uploaded successfully'
    })
    
  } catch (error) {
    console.error('Upload error:', error)
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

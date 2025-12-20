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
    const boxFolder = formData.get('boxFolder') || 'uploads'
    const cardColor = formData.get('cardColor') || 'black'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Get file buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Generate MD5 hash for unique filename
    const md5Hash = crypto.createHash('md5').update(buffer).digest('hex')
    const extension = path.extname(file.name) || '.png'
    const filename = `${md5Hash}${extension}`
    
    // Determine folder path
    const colorFolder = cardColor === 'black' ? `${boxFolder}-blacks` : `${boxFolder}-whites`
    const folderPath = path.join(process.cwd(), 'public', 'cards', boxFolder, colorFolder)
    
    // Create directory if it doesn't exist
    await mkdir(folderPath, { recursive: true })
    
    // Write file
    const filePath = path.join(folderPath, filename)
    await writeFile(filePath, buffer)
    
    // Return the relative path for database storage
    const imagePath = `${boxFolder}/${colorFolder}/${filename}`
    
    return NextResponse.json({ 
      success: true, 
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
      boxFolder: 'Box folder name (e.g., white-box-108)',
      cardColor: 'Card color: black or white'
    }
  })
}

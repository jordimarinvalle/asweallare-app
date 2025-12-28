import { NextResponse } from 'next/server'
import { writeFile, mkdir, readdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const FONTS_DIR = path.join(process.cwd(), 'public', 'fonts', 'custom')

// Ensure fonts directory exists
async function ensureFontsDir() {
  if (!existsSync(FONTS_DIR)) {
    await mkdir(FONTS_DIR, { recursive: true })
  }
}

// GET /api/admin/fonts - List uploaded custom fonts
export async function GET() {
  try {
    await ensureFontsDir()
    
    const files = await readdir(FONTS_DIR)
    const fonts = files
      .filter(f => /\.(ttf|woff|woff2|otf)$/i.test(f))
      .map(filename => {
        // Extract font name from filename (e.g., "Roboto-Bold.ttf" -> "Roboto")
        const baseName = filename.replace(/\.(ttf|woff|woff2|otf)$/i, '')
        const parts = baseName.split('-')
        const family = parts[0] || baseName
        const weight = parts[1] || 'Regular'
        
        return {
          filename,
          family,
          weight,
          url: `/fonts/custom/${filename}`,
          format: filename.split('.').pop().toLowerCase()
        }
      })
    
    // Group by family
    const grouped = fonts.reduce((acc, font) => {
      if (!acc[font.family]) {
        acc[font.family] = {
          name: font.family,
          files: []
        }
      }
      acc[font.family].files.push(font)
      return acc
    }, {})
    
    return NextResponse.json({
      fonts: Object.values(grouped),
      allFiles: fonts
    })
    
  } catch (error) {
    console.error('[FONTS API] Error listing fonts:', error)
    return NextResponse.json({ error: 'Failed to list fonts' }, { status: 500 })
  }
}

// POST /api/admin/fonts - Upload a new font file
export async function POST(request) {
  try {
    await ensureFontsDir()
    
    const formData = await request.formData()
    const file = formData.get('font')
    const fontFamily = formData.get('family') || 'CustomFont'
    const fontWeight = formData.get('weight') || 'Regular'
    
    if (!file) {
      return NextResponse.json({ error: 'No font file provided' }, { status: 400 })
    }
    
    // Validate file type
    const validExtensions = ['.ttf', '.woff', '.woff2', '.otf']
    const ext = path.extname(file.name).toLowerCase()
    if (!validExtensions.includes(ext)) {
      return NextResponse.json({ 
        error: `Invalid file type. Allowed: ${validExtensions.join(', ')}` 
      }, { status: 400 })
    }
    
    // Create filename: FontFamily-Weight.ext
    const sanitizedFamily = fontFamily.replace(/[^a-zA-Z0-9]/g, '')
    const sanitizedWeight = fontWeight.replace(/[^a-zA-Z0-9]/g, '')
    const filename = `${sanitizedFamily}-${sanitizedWeight}${ext}`
    const filepath = path.join(FONTS_DIR, filename)
    
    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)
    
    console.log(`[FONTS API] Uploaded font: ${filename}`)
    
    return NextResponse.json({
      success: true,
      font: {
        filename,
        family: sanitizedFamily,
        weight: sanitizedWeight,
        url: `/fonts/custom/${filename}`,
        format: ext.slice(1)
      }
    })
    
  } catch (error) {
    console.error('[FONTS API] Upload error:', error)
    return NextResponse.json({ error: 'Failed to upload font' }, { status: 500 })
  }
}

// DELETE /api/admin/fonts - Delete a font file
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename required' }, { status: 400 })
    }
    
    // Security: ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }
    
    const filepath = path.join(FONTS_DIR, filename)
    
    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'Font not found' }, { status: 404 })
    }
    
    await unlink(filepath)
    console.log(`[FONTS API] Deleted font: ${filename}`)
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('[FONTS API] Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete font' }, { status: 500 })
  }
}

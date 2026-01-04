import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/supabase-server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const CUSTOM_FONTS_DIR = path.join(process.cwd(), 'public', 'fonts', 'custom')

// Ensure custom fonts directory exists
async function ensureCustomFontsDir() {
  if (!existsSync(CUSTOM_FONTS_DIR)) {
    await mkdir(CUSTOM_FONTS_DIR, { recursive: true })
  }
}

// Default fonts (when database is not available)
const DEFAULT_FONTS = [
  {
    id: 'font_manrope',
    app_id: 'app_asweallare',
    name: 'Manrope',
    slug: 'manrope',
    font_type: 'system',
    file_path: '/fonts/manrope/',
    file_format: 'variable',
    weights: '400,500,600,700',
    styles: 'normal',
    is_variable: true,
    default_line_height: '1.5',
    default_letter_spacing: '-0.02em',
    description: 'A modern geometric sans-serif with excellent readability',
    usage_hint: 'Navigation, Buttons, Headlines, Body, Forms, UI',
    display_order: 1,
    is_default: true,
    is_active: true
  },
  {
    id: 'font_lora',
    app_id: 'app_asweallare',
    name: 'Lora',
    slug: 'lora',
    font_type: 'system',
    file_path: '/fonts/lora/',
    file_format: 'variable',
    weights: '400,500',
    styles: 'normal,italic',
    is_variable: true,
    default_line_height: '1.65',
    default_letter_spacing: '0',
    description: 'An elegant serif font for thoughtful, reflective content',
    usage_hint: 'Explanations, Quotes, Why sections, Helper text',
    display_order: 2,
    is_default: true,
    is_active: true
  }
]

// GET /api/admin/fonts - List all fonts for the app
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const appId = searchParams.get('app_id') || 'app_asweallare'
    
    const supabase = createSupabaseServer()
    
    // Try to get fonts from database
    const { data: fonts, error } = await supabase
      .from('app_fonts')
      .select('*')
      .eq('app_id', appId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    
    if (error) {
      console.log('[FONTS API] Database error, using defaults:', error.message)
      return NextResponse.json({ 
        fonts: DEFAULT_FONTS,
        source: 'defaults'
      })
    }
    
    // If no fonts in database, return defaults
    if (!fonts || fonts.length === 0) {
      return NextResponse.json({ 
        fonts: DEFAULT_FONTS,
        source: 'defaults'
      })
    }
    
    return NextResponse.json({ 
      fonts,
      source: 'database'
    })
    
  } catch (error) {
    console.error('[FONTS API] Error:', error)
    return NextResponse.json({ 
      fonts: DEFAULT_FONTS,
      source: 'defaults',
      error: error.message
    })
  }
}

// POST /api/admin/fonts - Upload a new custom font
export async function POST(request) {
  try {
    await ensureCustomFontsDir()
    
    const formData = await request.formData()
    const file = formData.get('font')
    const fontName = formData.get('name') || 'CustomFont'
    const fontWeight = formData.get('weight') || '400'
    const fontStyle = formData.get('style') || 'normal'
    const appId = formData.get('app_id') || 'app_asweallare'
    const description = formData.get('description') || ''
    const usageHint = formData.get('usage_hint') || ''
    const lineHeight = formData.get('line_height') || '1.5'
    const letterSpacing = formData.get('letter_spacing') || '0'
    
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
    
    // Create slug from font name
    const slug = fontName.toLowerCase().replace(/[^a-z0-9]/g, '-')
    
    // Create filename: fontslug-weight-style.ext
    const styleStr = fontStyle === 'italic' ? '-italic' : ''
    const filename = `${slug}-${fontWeight}${styleStr}${ext}`
    const filepath = path.join(CUSTOM_FONTS_DIR, filename)
    
    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)
    
    console.log(`[FONTS API] Uploaded font file: ${filename}`)
    
    // Generate font ID
    const fontId = `font_${slug}_${uuidv4().slice(0, 8)}`
    
    // Try to save to database
    const supabase = createSupabaseServer()
    
    // Check if this font family already exists
    const { data: existingFont } = await supabase
      .from('app_fonts')
      .select('id, weights, styles')
      .eq('app_id', appId)
      .eq('slug', slug)
      .single()
    
    let savedFont
    
    if (existingFont) {
      // Update existing font with new weight/style
      const existingWeights = existingFont.weights ? existingFont.weights.split(',') : []
      const existingStyles = existingFont.styles ? existingFont.styles.split(',') : []
      
      if (!existingWeights.includes(fontWeight)) {
        existingWeights.push(fontWeight)
      }
      if (!existingStyles.includes(fontStyle)) {
        existingStyles.push(fontStyle)
      }
      
      const { data, error: updateError } = await supabase
        .from('app_fonts')
        .update({
          weights: existingWeights.sort((a, b) => parseInt(a) - parseInt(b)).join(','),
          styles: [...new Set(existingStyles)].join(','),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingFont.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('[FONTS API] Update error:', updateError)
      }
      savedFont = data || existingFont
    } else {
      // Insert new font family
      const { data, error: insertError } = await supabase
        .from('app_fonts')
        .insert({
          id: fontId,
          app_id: appId,
          name: fontName,
          slug,
          font_type: 'custom',
          file_path: `/fonts/custom/`,
          file_format: ext.slice(1),
          weights: fontWeight,
          styles: fontStyle,
          is_variable: false,
          default_line_height: lineHeight,
          default_letter_spacing: letterSpacing,
          description,
          usage_hint: usageHint,
          display_order: 99,
          is_default: false,
          is_active: true
        })
        .select()
        .single()
      
      if (insertError) {
        console.error('[FONTS API] Insert error:', insertError)
        // Return success anyway since file was uploaded
        savedFont = {
          id: fontId,
          name: fontName,
          slug,
          weights: fontWeight,
          styles: fontStyle
        }
      } else {
        savedFont = data
      }
    }
    
    return NextResponse.json({
      success: true,
      font: savedFont,
      file: {
        filename,
        path: `/fonts/custom/${filename}`,
        format: ext.slice(1),
        weight: fontWeight,
        style: fontStyle
      }
    })
    
  } catch (error) {
    console.error('[FONTS API] Upload error:', error)
    return NextResponse.json({ error: 'Failed to upload font: ' + error.message }, { status: 500 })
  }
}

// PUT /api/admin/fonts - Update font settings
export async function PUT(request) {
  try {
    const body = await request.json()
    const { 
      id, 
      name, 
      description, 
      usage_hint, 
      default_line_height, 
      default_letter_spacing,
      display_order,
      is_active 
    } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Font ID required' }, { status: 400 })
    }
    
    const supabase = createSupabaseServer()
    
    const updateData = {
      updated_at: new Date().toISOString()
    }
    
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (usage_hint !== undefined) updateData.usage_hint = usage_hint
    if (default_line_height !== undefined) updateData.default_line_height = default_line_height
    if (default_letter_spacing !== undefined) updateData.default_letter_spacing = default_letter_spacing
    if (display_order !== undefined) updateData.display_order = display_order
    if (is_active !== undefined) updateData.is_active = is_active
    
    const { data, error } = await supabase
      .from('app_fonts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('[FONTS API] Update error:', error)
      return NextResponse.json({ error: 'Failed to update font' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, font: data })
    
  } catch (error) {
    console.error('[FONTS API] Update error:', error)
    return NextResponse.json({ error: 'Failed to update font' }, { status: 500 })
  }
}

// DELETE /api/admin/fonts - Delete a font
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const fontId = searchParams.get('id')
    const filename = searchParams.get('filename')
    
    const supabase = createSupabaseServer()
    
    // If deleting by filename (specific file)
    if (filename) {
      // Security: ensure filename doesn't contain path traversal
      if (filename.includes('..') || filename.includes('/')) {
        return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
      }
      
      const filepath = path.join(CUSTOM_FONTS_DIR, filename)
      
      if (existsSync(filepath)) {
        await unlink(filepath)
        console.log(`[FONTS API] Deleted font file: ${filename}`)
      }
      
      return NextResponse.json({ success: true, deleted: filename })
    }
    
    // If deleting by font ID (entire font family)
    if (fontId) {
      // Don't allow deleting system fonts
      const { data: font } = await supabase
        .from('app_fonts')
        .select('font_type, slug')
        .eq('id', fontId)
        .single()
      
      if (font?.font_type === 'system') {
        return NextResponse.json({ error: 'Cannot delete system fonts' }, { status: 400 })
      }
      
      // Delete from database
      const { error } = await supabase
        .from('app_fonts')
        .delete()
        .eq('id', fontId)
      
      if (error) {
        console.error('[FONTS API] Delete error:', error)
        return NextResponse.json({ error: 'Failed to delete font' }, { status: 500 })
      }
      
      // Try to delete associated files (best effort)
      if (font?.slug) {
        try {
          const { readdir } = await import('fs/promises')
          const files = await readdir(CUSTOM_FONTS_DIR)
          for (const file of files) {
            if (file.startsWith(font.slug + '-')) {
              await unlink(path.join(CUSTOM_FONTS_DIR, file))
              console.log(`[FONTS API] Deleted font file: ${file}`)
            }
          }
        } catch (e) {
          // Ignore file deletion errors
        }
      }
      
      return NextResponse.json({ success: true, deletedId: fontId })
    }
    
    return NextResponse.json({ error: 'Font ID or filename required' }, { status: 400 })
    
  } catch (error) {
    console.error('[FONTS API] Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete font' }, { status: 500 })
  }
}

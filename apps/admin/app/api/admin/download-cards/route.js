import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/supabase-server'
import { readFile } from 'fs/promises'
import path from 'path'
import AdmZip from 'adm-zip'

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

export async function POST(request) {
  const supabase = createSupabaseServer()
  
  try {
    const { user, error: authError } = await getAuthenticatedUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { boxId, pileId } = await request.json()
    
    if (!boxId) {
      return NextResponse.json({ error: 'boxId required' }, { status: 400 })
    }
    
    // Get cards
    let query = supabase.from('cards').select('*').eq('box_id', boxId)
    if (pileId) {
      query = query.eq('pile_id', pileId)
    }
    
    const { data: cards, error } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!cards || cards.length === 0) {
      return NextResponse.json({ error: 'No cards found' }, { status: 404 })
    }
    
    // Create ZIP file
    const zip = new AdmZip()
    let addedCount = 0
    const errors = []
    
    for (const card of cards) {
      if (!card.image_path) continue
      
      try {
        // Convert image path to filesystem path
        // image_path is like "/cards/box_id/pile_slug/filename.png"
        const filePath = path.join(process.cwd(), 'public', card.image_path.replace(/^\//, ''))
        const fileBuffer = await readFile(filePath)
        
        // Add to ZIP with just the filename
        const fileName = path.basename(card.image_path)
        zip.addFile(fileName, fileBuffer)
        addedCount++
      } catch (err) {
        errors.push({ path: card.image_path, error: err.message })
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
    const { data: box } = await supabase.from('boxes').select('*').eq('id', boxId).single()
    const { data: pile } = pileId ? await supabase.from('piles').select('*').eq('id', pileId).single() : { data: null }
    
    const zipFilename = pile 
      ? `${box?.id || boxId}_${pile.slug}_cards.zip`
      : `${box?.id || boxId}_all_cards.zip`
    
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
    console.error('[DOWNLOAD-CARDS] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'POST with boxId and optional pileId to download cards as ZIP',
    fields: {
      boxId: 'Box ID (required)',
      pileId: 'Pile ID (optional, to filter by pile)'
    }
  })
}

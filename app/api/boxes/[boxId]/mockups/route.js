import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/supabase-server'

// GET - Fetch mockup images for a box (public endpoint)
export async function GET(request, { params }) {
  const supabase = createSupabaseServer()
  
  try {
    const boxId = params.boxId
    
    if (!boxId) {
      return NextResponse.json({ error: 'boxId required' }, { status: 400 })
    }
    
    // Get all mockup images for this box, ordered by display_order
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
    const cardMockups = (mockups || []).filter(m => m.image_type === 'CARD')
    
    return NextResponse.json({
      boxId,
      mainImage: mainImage ? { 
        id: mainImage.id,
        imagePath: mainImage.image_path,
        displayOrder: mainImage.display_order
      } : null,
      secondaryImage: secondaryImage ? {
        id: secondaryImage.id,
        imagePath: secondaryImage.image_path,
        displayOrder: secondaryImage.display_order
      } : null,
      cardMockups: cardMockups.map(m => ({
        id: m.id,
        imagePath: m.image_path,
        displayOrder: m.display_order
      })),
      totalMockups: cardMockups.length
    })
    
  } catch (error) {
    console.error('[BOX MOCKUPS] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../../lib/supabase-server'

// DELETE /api/admin/app-config/socials?id=xxx - Delete a social link
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Social ID required' }, { status: 400 })
    }
    
    const supabase = createSupabaseServer()
    
    const { error } = await supabase
      .from('app_socials')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('[ADMIN SOCIALS] Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete social link' }, { status: 500 })
  }
}

// PUT /api/admin/app-config/socials - Update a social link
export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, url, display_order, is_active } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Social ID required' }, { status: 400 })
    }
    
    const supabase = createSupabaseServer()
    
    const updateData = { updated_at: new Date().toISOString() }
    if (url !== undefined) updateData.url = url
    if (display_order !== undefined) updateData.display_order = display_order
    if (is_active !== undefined) updateData.is_active = is_active
    
    const { data, error } = await supabase
      .from('app_socials')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('[ADMIN SOCIALS] Update error:', error)
    return NextResponse.json({ error: 'Failed to update social link' }, { status: 500 })
  }
}

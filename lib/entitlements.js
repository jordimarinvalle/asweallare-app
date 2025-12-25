// Entitlements Helper - Single source of truth for user access
// Determines which boxes a user can access based on their purchases and memberships

import { createSupabaseServer } from './supabase-server'

/**
 * Get all box IDs that a user is entitled to access
 * @param {string|null} userId - The user's ID (null for unauthenticated users)
 * @returns {Promise<{boxIds: string[], hasMembership: boolean, membershipExpiry: Date|null}>}
 */
export async function getUserEntitledBoxIds(userId) {
  const supabase = createSupabaseServer()
  const entitledBoxIds = new Set()
  let hasMembership = false
  let membershipExpiry = null
  
  // Sample boxes are always accessible to everyone
  const { data: sampleBoxes } = await supabase
    .from('boxes')
    .select('id')
    .eq('is_sample', true)
    .eq('is_active', true)
  
  if (sampleBoxes) {
    sampleBoxes.forEach(box => entitledBoxIds.add(box.id))
  }
  
  // If no user, only sample boxes are accessible
  if (!userId) {
    return {
      boxIds: Array.from(entitledBoxIds),
      hasMembership: false,
      membershipExpiry: null
    }
  }
  
  // Check user_products for direct box purchases
  const { data: userProducts } = await supabase
    .from('user_products')
    .select('box_id, expires_at')
    .eq('user_id', userId)
    .eq('is_active', true)
  
  if (userProducts) {
    const now = new Date()
    userProducts.forEach(product => {
      // Check if not expired (null expires_at means permanent access)
      if (!product.expires_at || new Date(product.expires_at) > now) {
        if (product.box_id) {
          entitledBoxIds.add(product.box_id)
        }
      }
    })
  }
  
  // Check user_memberships for bundle/membership access
  const { data: userMemberships } = await supabase
    .from('user_memberships')
    .select('bundle_id, price_id, expires_at')
    .eq('user_id', userId)
    .eq('is_active', true)
  
  if (userMemberships) {
    const now = new Date()
    
    for (const membership of userMemberships) {
      // Check if not expired
      if (membership.expires_at && new Date(membership.expires_at) > now) {
        hasMembership = true
        
        // Track the latest expiry
        const expiryDate = new Date(membership.expires_at)
        if (!membershipExpiry || expiryDate > membershipExpiry) {
          membershipExpiry = expiryDate
        }
        
        // Get boxes from bundle
        if (membership.bundle_id) {
          const { data: bundle } = await supabase
            .from('bundles')
            .select('box_ids')
            .eq('id', membership.bundle_id)
            .single()
          
          if (bundle?.box_ids) {
            bundle.box_ids.forEach(boxId => entitledBoxIds.add(boxId))
          }
        }
        
        // If membership has a price with all-access, add all active boxes
        if (membership.price_id) {
          const { data: price } = await supabase
            .from('prices')
            .select('membership_days')
            .eq('id', membership.price_id)
            .single()
          
          // If it's a membership price, it grants all-access
          if (price?.membership_days) {
            const { data: allBoxes } = await supabase
              .from('boxes')
              .select('id')
              .eq('is_active', true)
            
            if (allBoxes) {
              allBoxes.forEach(box => entitledBoxIds.add(box.id))
            }
          }
        }
      }
    }
  }
  
  return {
    boxIds: Array.from(entitledBoxIds),
    hasMembership,
    membershipExpiry
  }
}

/**
 * Check if a user has access to a specific box
 * @param {string|null} userId - The user's ID
 * @param {string} boxId - The box ID to check
 * @returns {Promise<boolean>}
 */
export async function userHasBoxAccess(userId, boxId) {
  const { boxIds } = await getUserEntitledBoxIds(userId)
  return boxIds.includes(boxId)
}

/**
 * Get boxes with visibility rules applied
 * Hide sample boxes if user owns the related full box (via full_box_id)
 * @param {string|null} userId - The user's ID
 * @returns {Promise<{boxes: any[], entitledBoxIds: string[], hasMembership: boolean}>}
 */
export async function getBoxesWithVisibility(userId) {
  const supabase = createSupabaseServer()
  
  // Get user entitlements
  const { boxIds: entitledBoxIds, hasMembership, membershipExpiry } = await getUserEntitledBoxIds(userId)
  
  // Get all active boxes
  const { data: boxes } = await supabase
    .from('boxes')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
  
  if (!boxes) {
    return { boxes: [], entitledBoxIds, hasMembership, membershipExpiry }
  }
  
  // Build a set of full box IDs that user owns
  const ownedFullBoxIds = new Set()
  boxes.forEach(box => {
    if (!box.is_sample && entitledBoxIds.includes(box.id)) {
      ownedFullBoxIds.add(box.id)
    }
  })
  
  // Filter boxes based on visibility rules:
  // Hide sample box if user owns its related full box (full_box_id)
  const visibleBoxes = boxes.filter(box => {
    // Non-sample boxes are always visible
    if (!box.is_sample) return true
    
    // Sample boxes: hide if user owns the related full box
    if (box.full_box_id && ownedFullBoxIds.has(box.full_box_id)) {
      return false
    }
    
    return true
  })
  
  // Mark boxes with access info
  const boxesWithAccess = visibleBoxes.map(box => ({
    ...box,
    hasAccess: entitledBoxIds.includes(box.id)
  }))
  
  return {
    boxes: boxesWithAccess,
    entitledBoxIds,
    hasMembership,
    membershipExpiry
  }
}

export default {
  getUserEntitledBoxIds,
  userHasBoxAccess,
  getBoxesWithVisibility
}

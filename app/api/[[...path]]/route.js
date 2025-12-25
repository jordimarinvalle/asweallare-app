import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../lib/supabase-server'
import { getStripe } from '../../../lib/stripe'
import { v4 as uuidv4 } from 'uuid'

// CORS helper
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Helper to get authenticated user
async function getAuthenticatedUser() {
  // In local mode, check the auth-token cookie
  if (process.env.LOCAL_MODE === 'true') {
    const { cookies } = await import('next/headers')
    const { getUserFromToken } = await import('../../../lib/auth-local')
    
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (token) {
      const user = await getUserFromToken(token)
      if (user) {
        return { user, error: null }
      }
    }
    return { user: null, error: null }
  }
  
  // Supabase mode
  const supabase = createSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Import entitlements helper
import { getUserEntitledBoxIds, getBoxesWithVisibility } from '../../../lib/entitlements'

// Helper to get user's accessible boxes - uses entitlements as source of truth
async function getUserAccessibleBoxes(userId) {
  const supabase = createSupabaseServer()
  
  // Get all active boxes
  const { data: boxes, error: boxError } = await supabase
    .from('boxes')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
  
  if (boxError || !boxes) {
    return { boxes: [], accessibleBoxIds: [] }
  }
  
  // Use entitlements helper as the single source of truth
  const { boxIds: accessibleBoxIds, hasMembership } = await getUserEntitledBoxIds(userId)
  
  return { 
    boxes, 
    accessibleBoxIds, 
    hasAllAccess: hasMembership 
  }
}

// Helper to check if user has paid access
async function checkUserAccess(userId) {
  const { accessibleBoxIds, hasAllAccess } = await getUserAccessibleBoxes(userId)
  
  // User has paid access if they have access to any non-sample box
  const supabase = createSupabaseServer()
  const { data: sampleBoxes } = await supabase
    .from('boxes')
    .select('id')
    .eq('is_sample', true)
  
  const sampleBoxIds = (sampleBoxes || []).map(b => b.id)
  const hasPaidAccess = hasAllAccess || accessibleBoxIds.some(id => !sampleBoxIds.includes(id))
  
  return { hasPaidAccess, accessibleBoxIds, hasAllAccess }
}

// Main request handler
export async function GET(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/', '')
  const supabase = createSupabaseServer()

  try {
    // AUTH ROUTES
    if (path === 'auth/user') {
      const { user, error } = await getAuthenticatedUser()
      
      if (error || !user) {
        return handleCORS(NextResponse.json({ user: null }, { status: 200 }))
      }
      
      // Check user access
      const { hasPaidAccess, accessibleBoxIds, hasAllAccess } = await checkUserAccess(user.id)
      
      return handleCORS(NextResponse.json({ 
        user: {
          id: user.id,
          email: user.email,
          hasPaidAccess,
          accessibleBoxIds,
          hasAllAccess
        }
      }))
    }

    // BOXES ROUTES - Get all boxes with user access info
    if (path === 'boxes') {
      const { user } = await getAuthenticatedUser()
      const userId = user?.id || null
      
      const { boxes, accessibleBoxIds, hasAllAccess } = await getUserAccessibleBoxes(userId)
      
      // Add hasAccess flag to each box
      const boxesWithAccess = boxes.map(box => ({
        ...box,
        hasAccess: accessibleBoxIds.includes(box.id)
      }))
      
      return handleCORS(NextResponse.json({ 
        boxes: boxesWithAccess,
        hasAllAccess
      }))
    }

    // CARDS ROUTES - Now supports box filtering
    if (path === 'cards') {
      const { user } = await getAuthenticatedUser()
      const boxIds = url.searchParams.get('box_ids')?.split(',').filter(Boolean) || []
      
      // Get user's accessible boxes
      const { accessibleBoxIds } = await getUserAccessibleBoxes(user?.id || null)
      
      // Determine which boxes to query
      let queryBoxIds = []
      if (boxIds.length > 0) {
        queryBoxIds = boxIds.filter(id => accessibleBoxIds.includes(id))
        if (queryBoxIds.length === 0) {
          return handleCORS(NextResponse.json({ cards: [], message: 'No accessible boxes' }))
        }
      } else if (accessibleBoxIds.length > 0) {
        queryBoxIds = accessibleBoxIds
      } else {
        return handleCORS(NextResponse.json({ cards: [], message: 'No accessible boxes' }))
      }
      
      // Query cards
      const { data: cards, error } = await supabase
        .from('cards')
        .select('*')
        .in('box_id', queryBoxIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('[CARDS API] Error fetching cards:', error)
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      // If we have cards, fetch piles separately for card back images
      let pilesMap = {}
      if (cards && cards.length > 0) {
        const pileIds = [...new Set(cards.map(c => c.pile_id).filter(Boolean))]
        if (pileIds.length > 0) {
          const { data: piles } = await supabase
            .from('piles')
            .select('*')
            .in('id', pileIds)
          
          if (piles) {
            piles.forEach(p => { pilesMap[p.id] = p })
          }
        }
      }
      
      // Transform cards to include pile info for the frontend
      const transformedCards = (cards || []).map(card => {
        const pile = pilesMap[card.pile_id] || {}
        return {
          id: card.id,
          box_id: card.box_id,
          pile_id: card.pile_id,
          text: card.text,
          image_path: card.image_path,
          is_active: card.is_active,
          created_at: card.created_at,
          // Add pile info for card back images
          color: pile.slug || 'black', // 'black' or 'white' from pile slug
          pile_name: pile.name,
          pile_image: pile.image_path,
          // Legacy fields for compatibility
          title: card.text,
          imagePath: card.image_path
        }
      })
      
      return handleCORS(NextResponse.json({ cards: transformedCards }))
    }

    // SUBSCRIPTION PLANS
    if (path === 'plans') {
      const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ plans: plans || [] }))
    }

    // USER PURCHASES - Get user's purchase history
    if (path === 'purchases') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const { data: purchases, error } = await supabase
        .from('user_products')
        .select('*, boxes(name, color, price)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ purchases: purchases || [] }))
    }

    // SAVED DRAWS ROUTES
    if (path === 'draws') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const { data: draws, error } = await supabase
        .from('saved_draws')
        .select('*')
        .eq('userid', user.id)
        .order('timestamp', { ascending: false })
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ draws: draws || [] }))
    }

    // ADMIN ROUTES - Get all cards
    if (path === 'admin/cards') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      // Get cards
      const { data: cards, error } = await supabase
        .from('cards')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      // Get boxes and piles for enrichment
      const { data: boxes } = await supabase.from('boxes').select('*')
      const { data: piles } = await supabase.from('piles').select('*')
      const { data: series } = await supabase.from('collection_series').select('*')
      
      const boxMap = {}
      const pileMap = {}
      const seriesMap = {}
      
      if (boxes) boxes.forEach(b => { boxMap[b.id] = b })
      if (piles) piles.forEach(p => { pileMap[p.id] = p })
      if (series) series.forEach(s => { seriesMap[s.id] = s })
      
      // Enrich cards with box/pile info
      const enrichedCards = (cards || []).map(card => {
        const box = boxMap[card.box_id]
        const pile = pileMap[card.pile_id]
        const collectionSeries = box ? seriesMap[box.collection_series_id] : null
        
        return {
          ...card,
          boxes: box ? {
            name: box.name,
            color: box.color,
            collection_series_id: box.collection_series_id,
            collection_series: collectionSeries ? { name: collectionSeries.name } : null
          } : null,
          piles: pile ? {
            name: pile.name,
            slug: pile.slug
          } : null
        }
      })
      
      return handleCORS(NextResponse.json({ cards: enrichedCards }))
    }

    // ADMIN ROUTES - Get all boxes
    if (path === 'admin/boxes') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      // Get boxes
      const { data: boxes, error } = await supabase
        .from('boxes')
        .select('*')
        .order('display_order', { ascending: true })
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      // Get all cards to count per box/pile
      const { data: cards } = await supabase.from('cards').select('*')
      const { data: piles } = await supabase.from('piles').select('*')
      const { data: series } = await supabase.from('collection_series').select('*')
      const { data: prices } = await supabase.from('prices').select('*')
      
      const seriesMap = {}
      const priceMap = {}
      const pileMap = {}
      
      if (series) series.forEach(s => { seriesMap[s.id] = s })
      if (prices) prices.forEach(p => { priceMap[p.id] = p })
      if (piles) piles.forEach(p => { pileMap[p.id] = p })
      
      // Count cards per box per pile
      const cardCounts = {}
      if (cards) {
        cards.forEach(card => {
          const key = `${card.box_id}`
          if (!cardCounts[key]) {
            cardCounts[key] = { total: 0, byPile: {} }
          }
          cardCounts[key].total++
          
          const pileId = card.pile_id
          if (!cardCounts[key].byPile[pileId]) {
            cardCounts[key].byPile[pileId] = { count: 0, pileName: pileMap[pileId]?.name || 'Unknown', pileSlug: pileMap[pileId]?.slug || '' }
          }
          cardCounts[key].byPile[pileId].count++
        })
      }
      
      // Enrich boxes with related data
      const enrichedBoxes = (boxes || []).map(box => ({
        ...box,
        collection_series: seriesMap[box.collection_series_id] || null,
        prices: priceMap[box.price_id] || null,
        cardStats: cardCounts[box.id] || { total: 0, byPile: {} }
      }))
      
      return handleCORS(NextResponse.json({ boxes: enrichedBoxes, piles: piles || [] }))
    }

    // ADMIN ROUTES - Get all collection series
    if (path === 'admin/collection-series') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const { data: series, error } = await supabase
        .from('collection_series')
        .select('*')
        .order('display_order', { ascending: true })
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ series: series || [] }))
    }

    // ADMIN ROUTES - Get all prices
    if (path === 'admin/prices') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const { data: prices, error } = await supabase
        .from('prices')
        .select('*')
        .order('display_order', { ascending: true })
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ prices: prices || [] }))
    }

    // ADMIN ROUTES - Get all piles
    if (path === 'admin/piles') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const { data: piles, error } = await supabase
        .from('piles')
        .select('*')
        .order('display_order', { ascending: true })
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      // Enrich with series names - with proper error handling
      const { data: series, error: seriesError } = await supabase.from('collection_series').select('*')
      const seriesMap = {}
      if (!seriesError && series) {
        series.forEach(s => { seriesMap[s.id] = s })
      } else if (seriesError) {
        console.error('Failed to load collection_series for piles:', seriesError)
      }
      
      const enrichedPiles = (piles || []).map(p => ({
        ...p,
        collection_series: seriesMap[p.collection_series_id] || null
      }))
      
      return handleCORS(NextResponse.json({ piles: enrichedPiles }))
    }

    // ADMIN ROUTES - Get all bundles
    if (path === 'admin/bundles') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const { data: bundles, error } = await supabase
        .from('bundles')
        .select('*')
        .order('display_order', { ascending: true })
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      // Enrich with price info
      const { data: prices } = await supabase.from('prices').select('*')
      const priceMap = {}
      if (prices) prices.forEach(p => { priceMap[p.id] = p })
      
      const enrichedBundles = (bundles || []).map(b => ({
        ...b,
        prices: priceMap[b.price_id] || null
      }))
      
      return handleCORS(NextResponse.json({ bundles: enrichedBundles }))
      
      return handleCORS(NextResponse.json({ bundles: bundles || [] }))
    }

    // PUBLIC ROUTES - Get active prices for store
    if (path === 'store/prices') {
      const { data: prices, error } = await supabase
        .from('prices')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ prices: prices || [] }))
    }

    // PUBLIC ROUTES - Get active bundles for store
    if (path === 'store/bundles') {
      const { data: bundles, error } = await supabase
        .from('bundles')
        .select('*, prices(id, label, amount, currency, is_membership, membership_days)')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ bundles: bundles || [] }))
    }

    return handleCORS(NextResponse.json({ error: 'Route not found' }, { status: 404 }))
    
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
  }
}

export async function POST(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/', '')
  const supabase = createSupabaseServer()

  try {
    const body = await request.json()

    // AUTH ROUTES
    if (path === 'auth/signup') {
      const { email, password } = body
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 400 }))
      }
      
      return handleCORS(NextResponse.json({ user: data.user }))
    }

    if (path === 'auth/signin') {
      const { email, password } = body
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 400 }))
      }
      
      return handleCORS(NextResponse.json({ user: data.user }))
    }

    if (path === 'auth/signout') {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 400 }))
      }
      
      // Create response and clear auth cookies
      const response = NextResponse.json({ success: true })
      
      // Clear Supabase auth cookies by setting them to expire
      const cookieOptions = {
        path: '/',
        expires: new Date(0),
        maxAge: 0
      }
      
      response.cookies.set('sb-access-token', '', cookieOptions)
      response.cookies.set('sb-refresh-token', '', cookieOptions)
      
      // Also try to clear any Supabase project-specific cookies
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1]
      if (projectRef) {
        response.cookies.set(`sb-${projectRef}-auth-token`, '', cookieOptions)
        response.cookies.set(`sb-${projectRef}-auth-token-code-verifier`, '', cookieOptions)
      }
      
      return handleCORS(response)
    }

    if (path === 'auth/google') {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
        }
      })
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 400 }))
      }
      
      return handleCORS(NextResponse.json({ url: data.url }))
    }

    // Password Reset Request
    if (path === 'auth/reset-password') {
      const { email } = body
      
      if (!email) {
        return handleCORS(NextResponse.json({ error: 'Email is required' }, { status: 400 }))
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-callback`
      })
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 400 }))
      }
      
      return handleCORS(NextResponse.json({ success: true, message: 'Password reset email sent' }))
    }

    // SAVED DRAWS
    if (path === 'draws/save') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const { blackCardId, whiteCardId, blackCardTitle, whiteCardTitle } = body
      
      const draw = {
        id: uuidv4(),
        userid: user.id,
        useremail: user.email,
        blackcardid: blackCardId,
        whitecardid: whiteCardId,
        blackcardtitle: blackCardTitle,
        whitecardtitle: whiteCardTitle,
        timestamp: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('saved_draws')
        .insert([draw])
        .select()
        .single()
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ draw: data }))
    }

    // PAYMENT ROUTES - Purchase a single box
    if (path === 'payment/purchase-box') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const { boxId } = body
      
      // Get box details
      const { data: box, error: boxError } = await supabase
        .from('boxes')
        .select('*')
        .eq('id', boxId)
        .single()
      
      if (boxError || !box) {
        return handleCORS(NextResponse.json({ error: 'Box not found' }, { status: 404 }))
      }
      
      if (box.is_sample) {
        return handleCORS(NextResponse.json({ error: 'Sample box is free' }, { status: 400 }))
      }
      
      const session = await getStripe().checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `AS WE ALL ARE - ${box.name}`,
              description: box.description || `Unlock the ${box.name} card collection`
            },
            unit_amount: Math.round(box.price * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}?payment=success&box=${boxId}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}?payment=cancelled`,
        client_reference_id: user.id,
        customer_email: user.email,
        metadata: {
          box_id: boxId,
          purchase_type: 'one_time'
        }
      })
      
      return handleCORS(NextResponse.json({ url: session.url }))
    }

    // PAYMENT ROUTES - Subscribe to all access
    if (path === 'payment/subscribe-all') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const { planId } = body
      
      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single()
      
      if (planError || !plan) {
        return handleCORS(NextResponse.json({ error: 'Plan not found' }, { status: 404 }))
      }
      
      // Calculate interval
      let interval = 'month'
      let intervalCount = 1
      if (plan.interval === 'quarter') {
        interval = 'month'
        intervalCount = 3
      } else if (plan.interval === 'year') {
        interval = 'year'
        intervalCount = 1
      }
      
      const session = await getStripe().checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `AS WE ALL ARE - ${plan.name}`,
              description: plan.description || 'Full access to all card boxes'
            },
            unit_amount: Math.round(plan.price * 100),
            recurring: {
              interval,
              interval_count: intervalCount,
            },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}?payment=success&subscription=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}?payment=cancelled`,
        client_reference_id: user.id,
        customer_email: user.email,
        metadata: {
          plan_id: planId,
          purchase_type: 'all_access'
        }
      })
      
      return handleCORS(NextResponse.json({ url: session.url }))
    }

    // CANCEL SUBSCRIPTION
    if (path === 'payment/cancel-subscription') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const { purchaseId } = body
      
      // Get the purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from('user_products')
        .select('*')
        .eq('id', purchaseId)
        .eq('user_id', user.id)
        .single()
      
      if (purchaseError || !purchase) {
        return handleCORS(NextResponse.json({ error: 'Purchase not found' }, { status: 404 }))
      }
      
      if (!purchase.stripe_subscription_id) {
        return handleCORS(NextResponse.json({ error: 'This is not a subscription' }, { status: 400 }))
      }
      
      try {
        // Cancel the subscription in Stripe
        await getStripe().subscriptions.cancel(purchase.stripe_subscription_id)
        
        // Update our database
        await supabase
          .from('user_products')
          .update({ is_active: false })
          .eq('id', purchaseId)
        
        return handleCORS(NextResponse.json({ success: true, message: 'Subscription cancelled' }))
      } catch (stripeError) {
        console.error('Stripe cancellation error:', stripeError)
        return handleCORS(NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 }))
      }
    }

    // Legacy payment route (for backward compatibility)
    if (path === 'payment/create-checkout') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const { paymentType, couponCode } = body
      
      let sessionConfig = {
        payment_method_types: ['card'],
        line_items: [],
        mode: paymentType === 'subscription' ? 'subscription' : 'payment',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}?payment=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}?payment=cancelled`,
        client_reference_id: user.id,
        customer_email: user.email,
        metadata: {
          purchase_type: paymentType === 'subscription' ? 'all_access' : 'legacy_full'
        }
      }
      
      if (paymentType === 'onetime') {
        sessionConfig.line_items.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AS WE ALL ARE - Full Access',
              description: 'One-time unlock of all cards'
            },
            unit_amount: 2000,
          },
          quantity: 1,
        })
      } else {
        sessionConfig.line_items.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AS WE ALL ARE - Subscription',
              description: 'Full access subscription'
            },
            unit_amount: 300,
            recurring: {
              interval: 'month',
              interval_count: 3,
            },
          },
          quantity: 1,
        })
      }
      
      if (couponCode) {
        try {
          const coupons = await getStripe().coupons.list({ limit: 100 })
          const validCoupon = coupons.data.find(c => c.id.toLowerCase() === couponCode.toLowerCase())
          
          if (validCoupon) {
            sessionConfig.discounts = [{ coupon: validCoupon.id }]
          }
        } catch (error) {
          console.error('Coupon validation error:', error)
        }
      }
      
      const session = await stripe.checkout.sessions.create(sessionConfig)
      
      return handleCORS(NextResponse.json({ url: session.url }))
    }

    // ADMIN ROUTES - Create card
    if (path === 'admin/cards') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const { boxId, pileId, text, imagePath, isActive } = body
      
      // Generate MD5 hash ID
      const crypto = await import('crypto')
      const cardId = crypto.createHash('md5').update(`${Date.now()}-${Math.random()}`).digest('hex')
      
      const card = {
        id: cardId,
        box_id: boxId,
        pile_id: pileId,
        text: text || null,
        image_path: imagePath || '',
        is_active: isActive !== false,
        created_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('cards')
        .insert([card])
        .select()
        .single()
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ card: data }))
    }

    // ADMIN ROUTES - Create box (enhanced with new fields)
    if (path === 'admin/boxes') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const { 
        id: boxId, name, description, descriptionShort, tagline, topics,
        priceId, color, colorPalette, path: boxPath, displayOrder, 
        isSample, fullBoxId, isActive, collectionSeriesId 
      } = body
      
      const box = {
        id: boxId || `box_${uuidv4().slice(0, 8)}`,
        name,
        description: description || '',
        description_short: descriptionShort || '',
        tagline: tagline || '',
        topics: topics || [],
        price_id: priceId || null,
        color: color || '#000000',
        color_palette: colorPalette || [],
        path: boxPath || '',
        display_order: displayOrder || 0,
        is_sample: isSample || false,
        full_box_id: isSample ? (fullBoxId || null) : null,  // Only set if sample
        is_active: isActive !== false,
        collection_series_id: collectionSeriesId || 'unscripted_conversations',
        created_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('boxes')
        .insert([box])
        .select()
        .single()
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ box: data }))
    }

    // ADMIN ROUTES - Create collection series
    if (path === 'admin/collection-series') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const { id, name, description, displayOrder, isActive } = body
      
      const series = {
        id: id || `series_${uuidv4().slice(0, 8)}`,
        name,
        description: description || '',
        display_order: displayOrder || 0,
        is_active: isActive !== false,
        created_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('collection_series')
        .insert([series])
        .select()
        .single()
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ series: data }))
    }

    // ADMIN ROUTES - Create price
    if (path === 'admin/prices') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const { 
        id, label, paymentInfo, hookInfo, amount, promoAmount, promoEnabled, currency,
        membershipDays, stripePriceId, displayOrder, isActive 
      } = body
      
      const price = {
        id: id || `price_${uuidv4().slice(0, 8)}`,
        label,
        payment_info: paymentInfo || '',
        hook_info: hookInfo || '',
        amount: amount || 0,
        promo_amount: promoAmount || null,
        promo_enabled: promoEnabled || false,
        currency: currency || 'USD',
        membership_days: membershipDays || null,
        stripe_price_id: stripePriceId || null,
        display_order: displayOrder || 0,
        is_active: isActive !== false,
        created_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('prices')
        .insert([price])
        .select()
        .single()
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ price: data }))
    }

    // ADMIN ROUTES - Create pile
    if (path === 'admin/piles') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const { id, slug, name, imagePath, collectionSeriesId, displayOrder, isActive } = body
      
      const pile = {
        id: id || `pile_${uuidv4().slice(0, 8)}`,
        slug: slug || name.toLowerCase().replace(/\s+/g, '_'),
        name,
        image_path: imagePath || '',
        collection_series_id: collectionSeriesId || null,
        display_order: displayOrder || 0,
        is_active: isActive !== false,
        created_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('piles')
        .insert([pile])
        .select()
        .single()
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ pile: data }))
    }

    // ADMIN ROUTES - Create bundle
    if (path === 'admin/bundles') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const { id, name, description, priceId, boxIds, displayOrder, isActive } = body
      
      const bundle = {
        id: id || `bundle_${uuidv4().slice(0, 8)}`,
        name,
        description: description || '',
        price_id: priceId || null,
        box_ids: boxIds || [],
        display_order: displayOrder || 0,
        is_active: isActive !== false,
        created_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('bundles')
        .insert([bundle])
        .select()
        .single()
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ bundle: data }))
    }

    // ADMIN ROUTES - Bulk delete cards
    if (path === 'admin/cards/bulk-delete') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const { boxId, pileId } = body
      
      if (!boxId) {
        return handleCORS(NextResponse.json({ error: 'boxId required' }, { status: 400 }))
      }
      
      // Build delete query
      let deleteResult
      if (pileId) {
        // Delete cards for specific box and pile
        const { data: cards } = await supabase.from('cards').select('*').eq('box_id', boxId).eq('pile_id', pileId)
        if (cards && cards.length > 0) {
          for (const card of cards) {
            await supabase.from('cards').delete().eq('id', card.id)
          }
        }
        deleteResult = { deleted: cards?.length || 0 }
      } else {
        // Delete all cards for box
        const { data: cards } = await supabase.from('cards').select('*').eq('box_id', boxId)
        if (cards && cards.length > 0) {
          for (const card of cards) {
            await supabase.from('cards').delete().eq('id', card.id)
          }
        }
        deleteResult = { deleted: cards?.length || 0 }
      }
      
      return handleCORS(NextResponse.json({ success: true, ...deleteResult }))
    }
    
    // ADMIN ROUTES - Export card paths
    if (path === 'admin/cards/export') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const { boxId, pileId } = body
      
      if (!boxId) {
        return handleCORS(NextResponse.json({ error: 'boxId required' }, { status: 400 }))
      }
      
      let query = supabase.from('cards').select('*').eq('box_id', boxId)
      
      if (pileId) {
        query = query.eq('pile_id', pileId)
      }
      
      const { data: cards, error } = await query
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ 
        cards: cards || [],
        imagePaths: (cards || []).map(c => c.image_path)
      }))
    }

    return handleCORS(NextResponse.json({ error: 'Route not found' }, { status: 404 }))
    
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
  }
}

export async function PUT(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/', '')
  const supabase = createSupabaseServer()

  try {
    const { user, error: authError } = await getAuthenticatedUser()
    
    if (authError || !user) {
      return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    // ADMIN ROUTES - Update card
    if (path.startsWith('admin/cards/')) {
      const cardId = path.split('/')[2]
      const body = await request.json()
      
      const updateData = {}
      if (body.boxId !== undefined) updateData.box_id = body.boxId
      if (body.pileId !== undefined) updateData.pile_id = body.pileId
      if (body.text !== undefined) updateData.text = body.text
      if (body.imagePath !== undefined) updateData.image_path = body.imagePath
      if (body.isActive !== undefined) updateData.is_active = body.isActive
      
      const { error } = await supabase
        .from('cards')
        .update(updateData)
        .eq('id', cardId)
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ADMIN ROUTES - Update box (enhanced with new fields)
    if (path.startsWith('admin/boxes/')) {
      const boxId = path.split('/')[2]
      const body = await request.json()
      
      // Map camelCase to snake_case
      const updateData = {}
      if (body.name !== undefined) updateData.name = body.name
      if (body.description !== undefined) updateData.description = body.description
      if (body.descriptionShort !== undefined) updateData.description_short = body.descriptionShort
      if (body.tagline !== undefined) updateData.tagline = body.tagline
      if (body.topics !== undefined) updateData.topics = body.topics
      if (body.priceId !== undefined) updateData.price_id = body.priceId
      if (body.color !== undefined) updateData.color = body.color
      if (body.colorPalette !== undefined) updateData.color_palette = body.colorPalette
      if (body.path !== undefined) updateData.path = body.path
      if (body.displayOrder !== undefined) updateData.display_order = body.displayOrder
      if (body.collectionSeriesId !== undefined) updateData.collection_series_id = body.collectionSeriesId
      if (body.isActive !== undefined) updateData.is_active = body.isActive
      
      // Handle is_sample and full_box_id fields
      if (body.isSample !== undefined) updateData.is_sample = body.isSample
      if (body.fullBoxId !== undefined) {
        // Only set full_box_id if this is a sample box
        updateData.full_box_id = body.isSample ? body.fullBoxId : null
      }
      // If setting isSample to false, clear the full_box_id
      if (body.isSample === false) {
        updateData.full_box_id = null
      }
      
      const { error } = await supabase
        .from('boxes')
        .update(updateData)
        .eq('id', boxId)
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ADMIN ROUTES - Update collection series
    if (path.startsWith('admin/collection-series/')) {
      const seriesId = path.split('/')[2]
      const body = await request.json()
      
      const updateData = {}
      if (body.name !== undefined) updateData.name = body.name
      if (body.description !== undefined) updateData.description = body.description
      if (body.displayOrder !== undefined) updateData.display_order = body.displayOrder
      if (body.isActive !== undefined) updateData.is_active = body.isActive
      
      const { error } = await supabase
        .from('collection_series')
        .update(updateData)
        .eq('id', seriesId)
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ADMIN ROUTES - Update price
    if (path.startsWith('admin/prices/')) {
      const priceId = path.split('/')[2]
      const body = await request.json()
      
      const updateData = {}
      if (body.label !== undefined) updateData.label = body.label
      if (body.paymentInfo !== undefined) updateData.payment_info = body.paymentInfo
      if (body.hookInfo !== undefined) updateData.hook_info = body.hookInfo
      if (body.amount !== undefined) updateData.amount = body.amount
      if (body.promoAmount !== undefined) updateData.promo_amount = body.promoAmount
      if (body.promoEnabled !== undefined) updateData.promo_enabled = body.promoEnabled
      if (body.currency !== undefined) updateData.currency = body.currency
      if (body.membershipDays !== undefined) updateData.membership_days = body.membershipDays
      if (body.stripePriceId !== undefined) updateData.stripe_price_id = body.stripePriceId
      if (body.displayOrder !== undefined) updateData.display_order = body.displayOrder
      if (body.isActive !== undefined) updateData.is_active = body.isActive
      
      const { error } = await supabase
        .from('prices')
        .update(updateData)
        .eq('id', priceId)
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ADMIN ROUTES - Update pile
    if (path.startsWith('admin/piles/')) {
      const pileId = path.split('/')[2]
      const body = await request.json()
      
      const updateData = {}
      if (body.slug !== undefined) updateData.slug = body.slug
      if (body.name !== undefined) updateData.name = body.name
      if (body.imagePath !== undefined) updateData.image_path = body.imagePath
      if (body.collectionSeriesId !== undefined) updateData.collection_series_id = body.collectionSeriesId
      if (body.displayOrder !== undefined) updateData.display_order = body.displayOrder
      if (body.isActive !== undefined) updateData.is_active = body.isActive
      
      const { error } = await supabase
        .from('piles')
        .update(updateData)
        .eq('id', pileId)
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ADMIN ROUTES - Update bundle
    if (path.startsWith('admin/bundles/')) {
      const bundleId = path.split('/')[2]
      const body = await request.json()
      
      const updateData = {}
      if (body.name !== undefined) updateData.name = body.name
      if (body.description !== undefined) updateData.description = body.description
      if (body.priceId !== undefined) updateData.price_id = body.priceId
      if (body.boxIds !== undefined) updateData.box_ids = body.boxIds
      if (body.displayOrder !== undefined) updateData.display_order = body.displayOrder
      if (body.isActive !== undefined) updateData.is_active = body.isActive
      
      const { error } = await supabase
        .from('bundles')
        .update(updateData)
        .eq('id', bundleId)
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ success: true }))
    }

    return handleCORS(NextResponse.json({ error: 'Route not found' }, { status: 404 }))
    
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
  }
}

export async function DELETE(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/', '')
  const supabase = createSupabaseServer()

  try {
    const { user, error: authError } = await getAuthenticatedUser()
    
    if (authError || !user) {
      return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    // ADMIN ROUTES - Delete card
    if (path.startsWith('admin/cards/')) {
      const cardId = path.split('/')[2]
      
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId)
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ADMIN ROUTES - Delete box
    if (path.startsWith('admin/boxes/')) {
      const boxId = path.split('/')[2]
      
      // First check if any cards are assigned to this box
      const { data: cards } = await supabase
        .from('cards')
        .select('id')
        .eq('box_id', boxId)
        .limit(1)
      
      if (cards && cards.length > 0) {
        return handleCORS(NextResponse.json({ 
          error: 'Cannot delete box with assigned cards. Remove cards first.' 
        }, { status: 400 }))
      }
      
      const { error } = await supabase
        .from('boxes')
        .delete()
        .eq('id', boxId)
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ADMIN ROUTES - Delete collection series
    if (path.startsWith('admin/collection-series/')) {
      const seriesId = path.split('/')[2]
      
      const { error } = await supabase
        .from('collection_series')
        .delete()
        .eq('id', seriesId)
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ADMIN ROUTES - Delete price
    if (path.startsWith('admin/prices/')) {
      const priceId = path.split('/')[2]
      
      const { error } = await supabase
        .from('prices')
        .delete()
        .eq('id', priceId)
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ADMIN ROUTES - Delete pile
    if (path.startsWith('admin/piles/')) {
      const pileId = path.split('/')[2]
      
      const { error } = await supabase
        .from('piles')
        .delete()
        .eq('id', pileId)
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ADMIN ROUTES - Delete bundle
    if (path.startsWith('admin/bundles/')) {
      const bundleId = path.split('/')[2]
      
      const { error } = await supabase
        .from('bundles')
        .delete()
        .eq('id', bundleId)
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ success: true }))
    }

    return handleCORS(NextResponse.json({ error: 'Route not found' }, { status: 404 }))
    
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
  }
}

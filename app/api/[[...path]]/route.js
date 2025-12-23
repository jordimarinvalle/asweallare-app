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
  const supabase = createSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Helper to get user's accessible boxes
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
  
  // Demo boxes are always accessible
  const accessibleBoxIds = boxes.filter(b => b.is_demo).map(b => b.id)
  
  if (userId) {
    // Get user's purchased products
    const { data: products } = await supabase
      .from('user_products')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
    
    if (products) {
      for (const product of products) {
        // All access subscription grants access to all boxes
        if (product.purchase_type === 'all_access') {
          // Check if subscription is still valid
          if (!product.expires_at || new Date(product.expires_at) > new Date()) {
            return { 
              boxes, 
              accessibleBoxIds: boxes.map(b => b.id),
              hasAllAccess: true 
            }
          }
        } else if (product.box_id && !accessibleBoxIds.includes(product.box_id)) {
          // Check expiry for subscriptions
          if (!product.expires_at || new Date(product.expires_at) > new Date()) {
            accessibleBoxIds.push(product.box_id)
          }
        }
      }
    }
  }
  
  return { boxes, accessibleBoxIds, hasAllAccess: false }
}

// Helper to check if user has paid access (legacy support)
async function checkUserAccess(userId) {
  const { accessibleBoxIds, hasAllAccess } = await getUserAccessibleBoxes(userId)
  
  // User has paid access if they have access to any non-demo box
  const hasPaidAccess = hasAllAccess || accessibleBoxIds.some(id => id !== 'box_demo')
  
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
      
      let query = supabase
        .from('cards')
        .select('*')
        .eq('isactive', true)
        .order('createdat', { ascending: false })
      
      if (boxIds.length > 0) {
        // Filter by requested boxes, but only include accessible ones
        const allowedBoxIds = boxIds.filter(id => accessibleBoxIds.includes(id))
        if (allowedBoxIds.length > 0) {
          query = query.in('box_id', allowedBoxIds)
        } else {
          // No accessible boxes requested, return demo cards only
          query = query.eq('isdemo', true)
        }
      } else {
        // No specific boxes requested - return cards from all accessible boxes
        if (accessibleBoxIds.length > 0) {
          query = query.in('box_id', accessibleBoxIds)
        } else {
          // Fallback: only demo cards
          query = query.eq('isdemo', true)
        }
      }
      
      const { data: cards, error } = await query
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ cards: cards || [] }))
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
      
      const { data: cards, error } = await supabase
        .from('cards')
        .select('*, boxes(name, color)')
        .order('createdat', { ascending: false })
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ cards: cards || [] }))
    }

    // ADMIN ROUTES - Get all boxes
    if (path === 'admin/boxes') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const { data: boxes, error } = await supabase
        .from('boxes')
        .select('*, collection_series(name), prices(id, label, amount, promo_amount, promo_enabled)')
        .order('display_order', { ascending: true })
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ boxes: boxes || [] }))
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
        .select('*, collection_series(name)')
        .order('display_order', { ascending: true })
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ piles: piles || [] }))
    }

    // ADMIN ROUTES - Get all bundles
    if (path === 'admin/bundles') {
      const { user, error: authError } = await getAuthenticatedUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const { data: bundles, error } = await supabase
        .from('bundles')
        .select('*, prices(label, amount)')
        .order('display_order', { ascending: true })
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
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
      
      if (box.is_demo) {
        return handleCORS(NextResponse.json({ error: 'Demo box is free' }, { status: 400 }))
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
      
      const { color, title, hint, language, isDemo, isActive, boxId } = body
      
      const card = {
        id: uuidv4(),
        color,
        title,
        hint: hint || '',
        language: language || 'en',
        isdemo: isDemo || false,
        isactive: isActive !== false,
        box_id: boxId || null,
        createdat: new Date().toISOString()
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
        name, description, descriptionShort, tagline, topics,
        priceId, color, colorPalette, path: boxPath, displayOrder, 
        isDemo, isActive, collectionSeriesId 
      } = body
      
      const box = {
        id: `box_${uuidv4().slice(0, 8)}`,
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
        is_demo: isDemo || false,
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
      
      // Map camelCase to snake_case for box_id
      const updateData = { ...body }
      if (body.boxId !== undefined) {
        updateData.box_id = body.boxId
        delete updateData.boxId
      }
      
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
      if (body.isDemo !== undefined) updateData.is_demo = body.isDemo
      if (body.isActive !== undefined) updateData.is_active = body.isActive
      if (body.collectionSeriesId !== undefined) updateData.collection_series_id = body.collectionSeriesId
      
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

    return handleCORS(NextResponse.json({ error: 'Route not found' }, { status: 404 }))
    
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
  }
}

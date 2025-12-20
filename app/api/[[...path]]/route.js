import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../lib/supabase-server'
import { stripe } from '../../../lib/stripe'
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

// Helper to check if user has paid access
async function checkUserAccess(userId) {
  const supabase = createSupabaseServer()
  
  const { data: access, error } = await supabase
    .from('user_access')
    .select('*')
    .eq('userid', userId)
    .single()
  
  if (error || !access) {
    return { hasPaidAccess: false }
  }
  
  // Check if subscription is still valid
  if (access.paymenttype === 'subscription' && access.expiresat) {
    const expiryDate = new Date(access.expiresat)
    if (expiryDate < new Date()) {
      return { hasPaidAccess: false }
    }
  }
  
  return { hasPaidAccess: true, accessData: access }
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
      const { hasPaidAccess } = await checkUserAccess(user.id)
      
      return handleCORS(NextResponse.json({ 
        user: {
          id: user.id,
          email: user.email,
          hasPaidAccess
        }
      }))
    }

    // CARDS ROUTES
    if (path === 'cards') {
      const { user } = await getAuthenticatedUser()
      
      let query = supabase
        .from('cards')
        .select('*')
        .eq('isactive', true)
        .order('createdat', { ascending: false })
      
      // If user is not logged in or doesn't have paid access, only return demo cards
      if (!user) {
        query = query.eq('isdemo', true)
      } else {
        const { hasPaidAccess } = await checkUserAccess(user.id)
        if (!hasPaidAccess) {
          query = query.eq('isdemo', true)
        }
      }
      
      const { data: cards, error } = await query
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ cards: cards || [] }))
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
        .select('*')
        .order('createdat', { ascending: false })
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json({ cards: cards || [] }))
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
      
      return handleCORS(NextResponse.json({ success: true }))
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

    // PAYMENT ROUTES
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
      }
      
      if (paymentType === 'onetime') {
        sessionConfig.line_items.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AS WE ALL ARE - Full Access',
              description: 'One-time unlock of all cards'
            },
            unit_amount: 2000, // $20.00
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
            unit_amount: 300, // $3.00
            recurring: {
              interval: 'month',
              interval_count: 3,
            },
          },
          quantity: 1,
        })
      }
      
      // Add coupon if provided
      if (couponCode) {
        try {
          const coupons = await stripe.coupons.list({ limit: 100 })
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
      
      const { color, title, hint, language, isDemo, isActive } = body
      
      const card = {
        id: uuidv4(),
        color,
        title,
        hint: hint || '',
        language: language || 'en',
        isDemo: isDemo || false,
        isActive: isActive !== false,
        createdAt: new Date().toISOString()
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
      
      const { error } = await supabase
        .from('cards')
        .update(body)
        .eq('id', cardId)
      
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

    return handleCORS(NextResponse.json({ error: 'Route not found' }, { status: 404 }))
    
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
  }
}

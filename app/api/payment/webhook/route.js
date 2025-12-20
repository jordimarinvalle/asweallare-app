import { NextResponse } from 'next/server'
import { stripe } from '../../../../lib/stripe'
import { createSupabaseServer } from '../../../../lib/supabase-server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    
    const userId = session.client_reference_id
    const paymentType = session.mode === 'subscription' ? 'subscription' : 'onetime'
    
    if (userId) {
      const supabase = createSupabaseServer()
      
      // Calculate expiry for subscription (3 months from now)
      const expiresAt = paymentType === 'subscription' 
        ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        : null
      
      // Check if user already has access
      const { data: existingAccess } = await supabase
        .from('user_access')
        .select('*')
        .eq('userid', userId)
        .single()
      
      if (existingAccess) {
        // Update existing access
        await supabase
          .from('user_access')
          .update({
            accesstype: 'paid',
            paymenttype: paymentType,
            stripesessionid: session.id,
            expiresat: expiresAt
          })
          .eq('userid', userId)
      } else {
        // Create new access record
        await supabase
          .from('user_access')
          .insert([{
            id: uuidv4(),
            userid: userId,
            accesstype: 'paid',
            paymenttype: paymentType,
            stripesessionid: session.id,
            expiresat: expiresAt,
            createdat: new Date().toISOString()
          }])
      }
      
      console.log(`✅ Granted ${paymentType} access to user ${userId}`)
    }
  }

  return NextResponse.json({ received: true })
}

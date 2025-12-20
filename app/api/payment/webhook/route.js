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
    console.error('Received signature:', signature?.substring(0, 50) + '...')
    console.error('Using secret:', process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 20) + '...')
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 })
  }
  
  console.log('✅ Webhook verified, event type:', event.type)

  const supabase = createSupabaseServer()

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.client_reference_id
    const metadata = session.metadata || {}
    
    if (!userId) {
      console.error('No user ID in checkout session')
      return NextResponse.json({ error: 'No user ID' }, { status: 400 })
    }
    
    const purchaseType = metadata.purchase_type || (session.mode === 'subscription' ? 'all_access' : 'one_time')
    const boxId = metadata.box_id || null
    
    // Calculate expiry for subscriptions
    let expiresAt = null
    if (session.mode === 'subscription') {
      // Default 1 month, will be updated on subscription renewal
      expiresAt = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString() // 35 days buffer
    }
    
    // Create user_products record
    const productRecord = {
      id: uuidv4(),
      user_id: userId,
      box_id: boxId,
      purchase_type: purchaseType,
      stripe_session_id: session.id,
      stripe_subscription_id: session.subscription || null,
      expires_at: expiresAt,
      is_active: true,
      created_at: new Date().toISOString()
    }
    
    const { error: insertError } = await supabase
      .from('user_products')
      .insert([productRecord])
    
    if (insertError) {
      console.error('Error inserting user_products:', insertError)
      
      // If it's a duplicate, update instead
      if (insertError.code === '23505') {
        await supabase
          .from('user_products')
          .update({
            stripe_session_id: session.id,
            stripe_subscription_id: session.subscription || null,
            expires_at: expiresAt,
            is_active: true
          })
          .eq('user_id', userId)
          .eq('box_id', boxId)
      }
    }
    
    // Also update legacy user_access table for backward compatibility
    const legacyRecord = {
      id: uuidv4(),
      userid: userId,
      accesstype: 'paid',
      paymenttype: purchaseType === 'all_access' ? 'subscription' : 'onetime',
      stripesessionid: session.id,
      expiresat: expiresAt,
      createdat: new Date().toISOString()
    }
    
    const { data: existingAccess } = await supabase
      .from('user_access')
      .select('*')
      .eq('userid', userId)
      .single()
    
    if (existingAccess) {
      await supabase
        .from('user_access')
        .update({
          accesstype: 'paid',
          paymenttype: legacyRecord.paymenttype,
          stripesessionid: session.id,
          expiresat: expiresAt
        })
        .eq('userid', userId)
    } else {
      await supabase
        .from('user_access')
        .insert([legacyRecord])
    }
    
    console.log(`✅ Granted ${purchaseType} access to user ${userId}${boxId ? ` for box ${boxId}` : ''}`)
  }

  // Handle subscription renewal
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object
    
    if (invoice.subscription) {
      // Find the user_products record with this subscription
      const { data: products } = await supabase
        .from('user_products')
        .select('*')
        .eq('stripe_subscription_id', invoice.subscription)
      
      if (products && products.length > 0) {
        // Extend expiry by 35 days (1 month + buffer)
        const newExpiry = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString()
        
        await supabase
          .from('user_products')
          .update({ expires_at: newExpiry, is_active: true })
          .eq('stripe_subscription_id', invoice.subscription)
        
        console.log(`✅ Extended subscription ${invoice.subscription} until ${newExpiry}`)
      }
    }
  }

  // Handle subscription cancellation
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object
    
    await supabase
      .from('user_products')
      .update({ is_active: false })
      .eq('stripe_subscription_id', subscription.id)
    
    console.log(`❌ Deactivated subscription ${subscription.id}`)
  }

  // Handle subscription update (e.g., plan change)
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object
    
    // If subscription is canceled or past_due, mark as inactive
    if (subscription.status === 'canceled' || subscription.status === 'past_due') {
      await supabase
        .from('user_products')
        .update({ is_active: false })
        .eq('stripe_subscription_id', subscription.id)
      
      console.log(`⚠️ Subscription ${subscription.id} status: ${subscription.status}`)
    } else if (subscription.status === 'active') {
      // Reactivate if it was inactive
      await supabase
        .from('user_products')
        .update({ is_active: true })
        .eq('stripe_subscription_id', subscription.id)
    }
  }

  return NextResponse.json({ received: true })
}

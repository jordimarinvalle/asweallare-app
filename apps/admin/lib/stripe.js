import Stripe from 'stripe'

// Lazy initialization to avoid build-time errors
let stripeInstance = null

export function getStripe() {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
  }
  return stripeInstance
}

// For backward compatibility - but this will fail at build time if imported directly
// Use getStripe() instead
export const stripe = typeof process !== 'undefined' && process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
  : null

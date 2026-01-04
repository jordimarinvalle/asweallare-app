import { NextResponse } from 'next/server'
import { signIn } from '../../../../../lib/auth-local'

export async function POST(request) {
  // Only allow in local mode
  if (process.env.LOCAL_MODE !== 'true') {
    return NextResponse.json({ error: 'Local auth not enabled' }, { status: 400 })
  }

  try {
    const { email, password } = await request.json()

    console.log('[LOCAL AUTH] Signin attempt for:', email)

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const { user, token, error } = await signIn(email, password)

    if (error) {
      console.log('[LOCAL AUTH] Signin error:', error)
      return NextResponse.json({ error }, { status: 401 })
    }

    console.log('[LOCAL AUTH] Signin success for:', user.email)

    // Set cookie with token
    const response = NextResponse.json({ user, success: true })
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: false, // Allow non-HTTPS for local dev
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return response
  } catch (error) {
    console.error('[LOCAL AUTH] Sign in error:', error)
    return NextResponse.json({ error: 'Sign in failed: ' + error.message }, { status: 500 })
  }
}

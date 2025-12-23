import { NextResponse } from 'next/server'
import { createUser, generateToken } from '../../../../../lib/auth-local'

export async function POST(request) {
  // Only allow in local mode
  if (process.env.LOCAL_MODE !== 'true') {
    return NextResponse.json({ error: 'Local auth not enabled' }, { status: 400 })
  }

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const { user, error } = await createUser(email, password)

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    // Auto sign-in after signup
    const token = generateToken(user)

    const response = NextResponse.json({ user, success: true })
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Sign up error:', error)
    return NextResponse.json({ error: 'Sign up failed' }, { status: 500 })
  }
}

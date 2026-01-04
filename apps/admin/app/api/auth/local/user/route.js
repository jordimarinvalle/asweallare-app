import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserFromToken } from '../../../../../lib/auth-local'

export async function GET() {
  // Only allow in local mode
  if (process.env.LOCAL_MODE !== 'true') {
    return NextResponse.json({ user: null })
  }

  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ user: null })
    }

    const user = await getUserFromToken(token)
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ user: null })
  }
}

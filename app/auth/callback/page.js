'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.search)
      
      if (error) {
        console.error('Auth callback error:', error)
        router.push('/?error=auth_failed')
      } else {
        router.push('/')
      }
    }

    handleCallback()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="text-2xl font-serif text-gray-900 mb-4">Completing sign in...</div>
        <div className="text-gray-600">Please wait a moment</div>
      </div>
    </div>
  )
}

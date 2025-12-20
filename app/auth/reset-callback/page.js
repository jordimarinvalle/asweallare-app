'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, AlertCircle, Lock } from 'lucide-react'

export default function ResetPasswordCallback() {
  const router = useRouter()
  const supabase = createClient()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      // The URL contains tokens that Supabase will automatically handle
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (session) {
        setSessionReady(true)
      } else {
        // Try to get session from URL hash (Supabase sends tokens in hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (!sessionError) {
            setSessionReady(true)
          } else {
            setError('Invalid or expired reset link. Please request a new password reset.')
          }
        } else {
          setError('Invalid reset link. Please request a new password reset.')
        }
      }
    }
    
    checkSession()
  }, [supabase])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setLoading(true)
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })
      
      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess(true)
        // Redirect to home after 3 seconds
        setTimeout(() => {
          router.push('/')
        }, 3000)
      }
    } catch (err) {
      setError('Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Show success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-serif text-gray-900 mb-2">Password Updated!</h2>
              <p className="text-gray-600 mb-4">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <p className="text-sm text-gray-500">Redirecting to home page...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error if invalid link
  if (error && !sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-serif text-gray-900 mb-2">Link Expired</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => router.push('/')} variant="outline">
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show loading while checking session
  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-2xl font-serif text-gray-900 mb-4">Verifying reset link...</div>
          <div className="text-gray-600">Please wait a moment</div>
        </div>
      </div>
    )
  }

  // Show password reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-gray-600" />
          </div>
          <CardTitle className="font-serif text-2xl">Set New Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                {error}
              </div>
            )}
            
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
                className="mt-2"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

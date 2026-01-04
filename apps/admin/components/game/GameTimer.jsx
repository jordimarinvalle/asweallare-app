'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'

/**
 * GameTimer - Handles the sharing timer with bell sounds
 * - 1 minute: single ding
 * - 2 minutes: double ding
 * - 3 minutes: triple ding
 */
export default function GameTimer({ onReset }) {
  const [isRunning, setIsRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [bellsPlayed, setBellsPlayed] = useState({ one: false, two: false, three: false })
  const audioContextRef = useRef(null)
  
  // Format time display
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    
    if (mins === 0) {
      return `${secs}s`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Play bell sound using Web Audio API
  const playBell = useCallback((count) => {
    try {
      // Create audio context on first use
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      
      const audioContext = audioContextRef.current
      
      // Resume if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }
      
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          // Create a more realistic bell sound
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          // Boxing bell: bright metallic sound
          oscillator.frequency.value = 1200
          oscillator.type = 'sine'
          
          // Start loud and decay
          const now = audioContext.currentTime
          gainNode.gain.setValueAtTime(0.4, now)
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6)
          
          oscillator.start(now)
          oscillator.stop(now + 0.6)
        }, i * 400) // 400ms between dings
      }
    } catch (error) {
      console.error('Error playing bell:', error)
    }
  }, [])
  
  // Timer effect
  useEffect(() => {
    let interval
    
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prev => {
          const newValue = prev + 1
          
          // Bell at 1 minute (60 seconds)
          if (newValue === 60 && !bellsPlayed.one) {
            playBell(1)
            setBellsPlayed(p => ({ ...p, one: true }))
          }
          
          // Bell at 2 minutes (120 seconds)
          if (newValue === 120 && !bellsPlayed.two) {
            playBell(2)
            setBellsPlayed(p => ({ ...p, two: true }))
          }
          
          // Bell at 3 minutes (180 seconds)
          if (newValue === 180 && !bellsPlayed.three) {
            playBell(3)
            setBellsPlayed(p => ({ ...p, three: true }))
          }
          
          return newValue
        })
      }, 1000)
    }
    
    return () => clearInterval(interval)
  }, [isRunning, bellsPlayed, playBell])
  
  // Start timer
  const startTimer = () => {
    setIsRunning(true)
    setSeconds(0)
    setBellsPlayed({ one: false, two: false, three: false })
  }
  
  // Stop timer
  const stopTimer = () => {
    setIsRunning(false)
  }
  
  // Reset timer (called from parent via onReset)
  const resetTimer = useCallback(() => {
    setIsRunning(false)
    setSeconds(0)
    setBellsPlayed({ one: false, two: false, three: false })
  }, [])
  
  // Expose reset to parent
  useEffect(() => {
    if (onReset) {
      // Store the reset function reference
      onReset.current = resetTimer
    }
  }, [onReset, resetTimer])
  
  return (
    <Button 
      onClick={isRunning ? stopTimer : startTimer} 
      size="lg" 
      variant="outline" 
      className="border-red-600 text-red-600 hover:bg-red-50 w-[180px] font-mono"
    >
      {isRunning ? (
        <>
          <Clock className="w-5 h-5 mr-2" />
          {formatTime(seconds)}
        </>
      ) : (
        <>
          <Clock className="w-5 h-5 mr-2" />
          Start Sharing
        </>
      )}
    </Button>
  )
}

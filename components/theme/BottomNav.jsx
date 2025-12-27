'use client'

import { useState, useEffect } from 'react'
import { Home, Gamepad2, ShoppingBag, User } from 'lucide-react'
import { useTheme } from './ThemeProvider'

const leftNavItems = [
  { id: 'home', icon: Home },
  { id: 'play', icon: Gamepad2 },
  { id: 'store', icon: ShoppingBag },
]

const rightNavItems = [
  { id: 'profile', icon: User }
]

export function BottomNav({ currentView, onNavigate, className = '' }) {
  const { isDark, colors } = useTheme()
  const [isLandscape, setIsLandscape] = useState(false)
  
  // Detect orientation
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth <= 1024
      const landscape = window.innerWidth > window.innerHeight
      setIsLandscape(isMobile && landscape)
    }
    
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)
    
    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])
  
  const isActive = (itemId) => {
    return currentView === itemId || 
      (itemId === 'play' && currentView === 'game') ||
      (itemId === 'profile' && (currentView === 'purchases' || currentView === 'profile' || currentView === 'admin'))
  }
  
  const NavButton = ({ item }) => {
    const Icon = item.icon
    const active = isActive(item.id)
    
    return (
      <button
        onClick={() => onNavigate(item.id)}
        className="relative flex items-center justify-center transition-all duration-200"
        style={{
          width: isLandscape ? '100%' : '56px',
          height: isLandscape ? '56px' : '44px',
          padding: isLandscape ? '0' : '0',
        }}
        aria-label={item.id}
      >
        {/* Active bubble/highlight */}
        {active && (
          <div 
            className="absolute inset-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
            }}
          />
        )}
        
        <Icon 
          className="relative z-10 transition-all duration-200"
          style={{ 
            width: '24px', 
            height: '24px',
            strokeWidth: active ? 2.2 : 1.8,
            color: active 
              ? (isDark ? '#0A84FF' : '#007AFF') // iOS blue for active
              : (isDark ? '#8E8E93' : '#8E8E93') // iOS gray for inactive
          }} 
        />
      </button>
    )
  }
  
  // Landscape mode: left side bar
  if (isLandscape) {
    return (
      <nav 
        className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col items-center ${className}`}
        style={{ 
          width: '72px',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          backgroundColor: isDark ? 'rgba(28, 28, 30, 0.92)' : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: `0.5px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        }}
      >
        {/* Left group items - vertically stacked at top */}
        <div className="flex flex-col items-center gap-1 pt-4">
          {leftNavItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </div>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Right group items - at bottom */}
        <div className="flex flex-col items-center gap-1 pb-4">
          {rightNavItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </div>
      </nav>
    )
  }
  
  // Portrait mode: floating bottom pill
  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center ${className}`}
      style={{ 
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)',
        paddingLeft: '16px',
        paddingRight: '16px',
      }}
    >
      {/* Floating pill container */}
      <div 
        className="flex items-center justify-between w-full"
        style={{
          maxWidth: '400px',
          height: '64px',
          padding: '0 8px',
          borderRadius: '32px',
          backgroundColor: isDark ? 'rgba(28, 28, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: isDark 
            ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0.5px 0 rgba(255, 255, 255, 0.1)' 
            : '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 0.5px 0 rgba(255, 255, 255, 0.8)',
          border: `0.5px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
        }}
      >
        {/* Left group - Home, Play, Store */}
        <div className="flex items-center gap-0">
          {leftNavItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </div>
        
        {/* Right group - Profile */}
        <div className="flex items-center">
          {rightNavItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </div>
      </div>
    </nav>
  )
}

// Hook to get bottom nav padding
export function useBottomNavPadding() {
  const [isLandscape, setIsLandscape] = useState(false)
  
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth <= 1024
      const landscape = window.innerWidth > window.innerHeight
      setIsLandscape(isMobile && landscape)
    }
    
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)
    
    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])
  
  return {
    paddingBottom: isLandscape ? '0' : 'calc(80px + env(safe-area-inset-bottom))',
    paddingLeft: isLandscape ? '72px' : '0',
    isLandscape
  }
}

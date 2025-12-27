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
    
    // iOS blue for active state
    const activeColor = isDark ? '#0A84FF' : '#007AFF'
    // iOS gray for inactive state  
    const inactiveColor = isDark ? '#8E8E93' : '#8E8E93'
    
    return (
      <button
        onClick={() => onNavigate(item.id)}
        className="relative flex items-center justify-center transition-all duration-200 active:scale-95"
        style={{
          width: isLandscape ? '100%' : '52px',
          height: isLandscape ? '52px' : '40px',
        }}
        aria-label={item.id}
      >
        {/* Active bubble/highlight background */}
        {active && (
          <div 
            className="absolute transition-all duration-300 ease-out"
            style={{
              width: isLandscape ? '44px' : '40px',
              height: isLandscape ? '44px' : '36px',
              borderRadius: isLandscape ? '12px' : '10px',
              backgroundColor: isDark 
                ? 'rgba(10, 132, 255, 0.15)' 
                : 'rgba(0, 122, 255, 0.12)',
            }}
          />
        )}
        
        <Icon 
          className="relative z-10 transition-all duration-200"
          style={{ 
            width: '22px', 
            height: '22px',
            strokeWidth: active ? 2.2 : 1.7,
            color: active ? activeColor : inactiveColor,
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
          width: '68px',
          paddingTop: 'calc(env(safe-area-inset-top) + 8px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)',
          paddingLeft: 'env(safe-area-inset-left)',
          backgroundColor: isDark ? 'rgba(28, 28, 30, 0.94)' : 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRight: `0.5px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
        }}
      >
        {/* Left group items - vertically stacked at top */}
        <div className="flex flex-col items-center gap-2">
          {leftNavItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </div>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Right group items - at bottom */}
        <div className="flex flex-col items-center gap-2">
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
      className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none ${className}`}
      style={{ 
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)',
        paddingLeft: '20px',
        paddingRight: '20px',
      }}
    >
      {/* Floating pill container */}
      <div 
        className="flex items-center justify-between pointer-events-auto"
        style={{
          width: '100%',
          maxWidth: '360px',
          height: '56px',
          padding: '0 6px',
          borderRadius: '28px',
          backgroundColor: isDark 
            ? 'rgba(44, 44, 46, 0.88)' 
            : 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: isDark 
            ? '0 4px 24px rgba(0, 0, 0, 0.5), 0 0 0 0.5px rgba(255, 255, 255, 0.06)' 
            : '0 4px 24px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Left group - Home, Play, Store */}
        <div className="flex items-center">
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
    paddingBottom: isLandscape ? '0' : 'calc(76px + env(safe-area-inset-bottom))',
    paddingLeft: isLandscape ? '68px' : '0',
    isLandscape
  }
}

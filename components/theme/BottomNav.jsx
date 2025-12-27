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
  
  const NavButton = ({ item, isRightGroup = false }) => {
    const Icon = item.icon
    const active = isActive(item.id)
    
    // iOS blue for active state
    const activeColor = isDark ? '#0A84FF' : '#007AFF'
    // iOS gray for inactive state  
    const inactiveColor = isDark ? '#8E8E93' : '#8E8E93'
    
    return (
      <button
        onClick={() => onNavigate(item.id)}
        className="relative flex items-center justify-center transition-all duration-200 active:scale-95 active:opacity-70"
        style={{
          width: isLandscape ? '56px' : (isRightGroup ? '48px' : '48px'),
          height: isLandscape ? '56px' : '48px',
        }}
        aria-label={item.id}
      >
        {/* Active state indicator - subtle background circle */}
        <div 
          className="absolute transition-all duration-250 ease-out rounded-full"
          style={{
            width: '36px',
            height: '36px',
            backgroundColor: active 
              ? (isDark ? 'rgba(10, 132, 255, 0.18)' : 'rgba(0, 122, 255, 0.12)')
              : 'transparent',
            transform: active ? 'scale(1)' : 'scale(0.8)',
            opacity: active ? 1 : 0,
          }}
        />
        
        <Icon 
          className="relative z-10 transition-all duration-200"
          style={{ 
            width: '24px', 
            height: '24px',
            strokeWidth: active ? 2.0 : 1.6,
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
          width: '72px',
          paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
          paddingLeft: 'env(safe-area-inset-left)',
          backgroundColor: isDark ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRight: `0.5px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
        }}
      >
        {/* Left group items - vertically stacked at top */}
        <div className="flex flex-col items-center gap-1">
          {leftNavItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </div>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Right group items - at bottom */}
        <div className="flex flex-col items-center gap-1">
          {rightNavItems.map((item) => (
            <NavButton key={item.id} item={item} isRightGroup={true} />
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
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)',
        paddingLeft: '16px',
        paddingRight: '16px',
      }}
    >
      {/* Floating pill container */}
      <div 
        className="flex items-center justify-between pointer-events-auto"
        style={{
          width: '100%',
          maxWidth: '320px',
          height: '60px',
          padding: '0 4px',
          borderRadius: '30px',
          backgroundColor: isDark 
            ? 'rgba(44, 44, 46, 0.92)' 
            : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          boxShadow: isDark 
            ? '0 2px 20px rgba(0, 0, 0, 0.5), 0 0 0 0.5px rgba(255, 255, 255, 0.08)' 
            : '0 2px 20px rgba(0, 0, 0, 0.1), 0 0 0 0.5px rgba(0, 0, 0, 0.04)',
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
            <NavButton key={item.id} item={item} isRightGroup={true} />
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
    paddingLeft: isLandscape ? '72px' : '0',
    isLandscape
  }
}

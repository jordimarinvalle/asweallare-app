'use client'

import { useState, useEffect } from 'react'
import { Home, Play, ShoppingBag, User } from 'lucide-react'
import { useTheme } from './ThemeProvider'

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'play', label: 'Play', icon: Play },
  { id: 'store', label: 'Store', icon: ShoppingBag },
  { id: 'profile', label: 'Profile', icon: User }
]

export function BottomNav({ currentView, onNavigate, className = '' }) {
  const { theme, isApple } = useTheme()
  const [isLandscape, setIsLandscape] = useState(false)
  
  // Detect orientation
  useEffect(() => {
    const checkOrientation = () => {
      // Check if we're on mobile and in landscape
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
  
  // Base styles
  const baseNavStyles = `
    bg-white border-gray-200 z-50
    ${isApple ? 'shadow-lg' : 'shadow-md'}
  `
  
  // Portrait mode: bottom bar
  // Landscape mode: left side bar
  const positionStyles = isLandscape
    ? 'fixed left-0 top-0 bottom-0 flex-col border-r w-20'
    : 'fixed bottom-0 left-0 right-0 flex-row border-t'
  
  const navHeight = isLandscape ? '' : `h-[${theme.nav.height}]`
  
  return (
    <nav 
      className={`${baseNavStyles} ${positionStyles} ${className} flex items-center justify-around safe-area-inset`}
      style={{ 
        height: isLandscape ? '100%' : theme.nav.height,
        width: isLandscape ? '5rem' : '100%',
        paddingBottom: isLandscape ? '0' : 'env(safe-area-inset-bottom)',
        paddingLeft: isLandscape ? 'env(safe-area-inset-left)' : '0'
      }}
    >
      <div className={`flex ${isLandscape ? 'flex-col h-full' : 'flex-row w-full'} items-center justify-around py-2`}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id || 
            (item.id === 'play' && currentView === 'game') ||
            (item.id === 'profile' && (currentView === 'purchases' || currentView === 'profile'))
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                flex flex-col items-center justify-center gap-1 
                transition-all duration-200
                ${isLandscape ? 'w-full py-4' : 'flex-1 py-1'}
                ${isActive 
                  ? 'text-red-600' 
                  : 'text-gray-500 hover:text-gray-900'
                }
              `}
              style={{ gap: theme.nav.gap }}
            >
              <Icon 
                className={`transition-transform ${isActive ? 'scale-110' : ''}`}
                style={{ 
                  width: theme.nav.iconSize, 
                  height: theme.nav.iconSize,
                  strokeWidth: isActive ? 2.5 : 2
                }} 
              />
              <span 
                className={`font-medium ${isActive ? 'text-red-600' : ''}`}
                style={{ fontSize: theme.nav.labelSize }}
              >
                {item.label}
              </span>
              {/* Active indicator dot */}
              {isActive && (
                <div 
                  className="absolute w-1 h-1 bg-red-600 rounded-full"
                  style={{
                    bottom: isLandscape ? 'auto' : '0.25rem',
                    left: isLandscape ? '0.25rem' : '50%',
                    transform: isLandscape ? 'none' : 'translateX(-50%)'
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// Hook to get bottom nav padding
export function useBottomNavPadding() {
  const { theme } = useTheme()
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
    paddingBottom: isLandscape ? '0' : `calc(${theme.nav.height} + env(safe-area-inset-bottom))`,
    paddingLeft: isLandscape ? '5rem' : '0',
    isLandscape
  }
}

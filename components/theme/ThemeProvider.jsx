'use client'

import { createContext, useContext, useState, useEffect } from 'react'

// Theme definitions
const appleTheme = {
  name: 'apple',
  // Typography
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
    brand: '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
  },
  // Spacing (more generous)
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  },
  // Border radius (more rounded)
  borderRadius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
    full: '9999px'
  },
  // Component styles
  button: {
    height: '2.75rem',
    padding: '0 1.25rem',
    fontSize: '0.9375rem',
    fontWeight: '500',
    borderRadius: '0.75rem'
  },
  nav: {
    height: '5rem',
    iconSize: '1.5rem',
    labelSize: '0.625rem',
    gap: '0.25rem'
  },
  // Shadows
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
    md: '0 4px 12px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.12)'
  }
}

const materialTheme = {
  name: 'material',
  // Typography
  fontFamily: {
    sans: '"Roboto", "Google Sans", system-ui, -apple-system, sans-serif',
    brand: '"Google Sans", "Roboto", system-ui, -apple-system, sans-serif'
  },
  // Spacing (standard)
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.875rem',
    lg: '1.25rem',
    xl: '1.75rem',
    '2xl': '2.5rem'
  },
  // Border radius (less rounded)
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px'
  },
  // Component styles
  button: {
    height: '2.5rem',
    padding: '0 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    borderRadius: '0.5rem'
  },
  nav: {
    height: '4.5rem',
    iconSize: '1.5rem',
    labelSize: '0.75rem',
    gap: '0.25rem'
  },
  // Shadows (Material elevation)
  shadow: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    md: '0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
    lg: '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.10)'
  }
}

// Detect platform
function detectPlatform() {
  if (typeof window === 'undefined') return 'material'
  
  const ua = navigator.userAgent || navigator.vendor || window.opera
  
  // iOS detection
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    return 'apple'
  }
  
  // macOS detection
  if (navigator.platform && navigator.platform.toLowerCase().includes('mac')) {
    return 'apple'
  }
  
  return 'material'
}

// Context
const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState('material')
  const [autoDetected, setAutoDetected] = useState('material')
  const [manualOverride, setManualOverride] = useState(null)
  
  // Detect platform on mount
  useEffect(() => {
    const detected = detectPlatform()
    setAutoDetected(detected)
    
    // Check for stored preference
    const stored = localStorage.getItem('theme-preference')
    if (stored === 'apple' || stored === 'material') {
      setManualOverride(stored)
      setThemeName(stored)
    } else {
      setThemeName(detected)
    }
  }, [])
  
  // Get current theme object
  const theme = themeName === 'apple' ? appleTheme : materialTheme
  
  // Toggle theme manually
  const toggleTheme = () => {
    const newTheme = themeName === 'apple' ? 'material' : 'apple'
    setThemeName(newTheme)
    setManualOverride(newTheme)
    localStorage.setItem('theme-preference', newTheme)
  }
  
  // Reset to auto-detected
  const resetToAuto = () => {
    setManualOverride(null)
    setThemeName(autoDetected)
    localStorage.removeItem('theme-preference')
  }
  
  const value = {
    theme,
    themeName,
    autoDetected,
    manualOverride,
    isApple: themeName === 'apple',
    isMaterial: themeName === 'material',
    toggleTheme,
    resetToAuto
  }
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Export themes for direct access if needed
export { appleTheme, materialTheme }

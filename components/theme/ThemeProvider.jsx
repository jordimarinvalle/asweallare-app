'use client'

import { createContext, useContext, useState, useEffect } from 'react'

// Default brand colors
const DEFAULT_COLORS = {
  primary: '#D12128',      // Brand red
  secondary: '#1F2937',    // Dark gray
  accent: '#6B7280',       // Gray
  danger: '#DC2626',       // Red
  background: '#FFFFFF',   // White
  foreground: '#111827',   // Near black
  muted: '#F3F4F6',        // Light gray
  border: '#E5E7EB'        // Border gray
}

// Dark mode colors
const DARK_COLORS = {
  background: '#0F0F0F',
  foreground: '#F9FAFB',
  muted: '#1F1F1F',
  border: '#2D2D2D'
}

// Theme definitions
const appleTheme = {
  name: 'apple',
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
    brand: '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  },
  borderRadius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
    full: '9999px'
  },
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
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
    md: '0 4px 12px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.12)'
  }
}

const materialTheme = {
  name: 'material',
  fontFamily: {
    sans: '"Roboto", "Google Sans", system-ui, -apple-system, sans-serif',
    brand: '"Google Sans", "Roboto", system-ui, -apple-system, sans-serif'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.875rem',
    lg: '1.25rem',
    xl: '1.75rem',
    '2xl': '2.5rem'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px'
  },
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
  
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    return 'apple'
  }
  
  if (navigator.platform && navigator.platform.toLowerCase().includes('mac')) {
    return 'apple'
  }
  
  return 'material'
}

// Detect preferred color scheme
function detectColorScheme() {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Context
const ThemeContext = createContext(null)

export function ThemeProvider({ children, appColors = null }) {
  const [themeName, setThemeName] = useState('material')
  const [autoDetected, setAutoDetected] = useState('material')
  const [manualOverride, setManualOverride] = useState(null)
  
  // Color mode state
  const [colorMode, setColorMode] = useState('light')
  const [autoColorMode, setAutoColorMode] = useState('light')
  const [colorModeOverride, setColorModeOverride] = useState(null)
  
  // Custom colors from app config
  const [customColors, setCustomColors] = useState(null)
  
  // Detect platform and color scheme on mount
  useEffect(() => {
    const detected = detectPlatform()
    setAutoDetected(detected)
    
    const detectedColorScheme = detectColorScheme()
    setAutoColorMode(detectedColorScheme)
    
    // Check for stored preferences
    const storedTheme = localStorage.getItem('theme-preference')
    if (storedTheme === 'apple' || storedTheme === 'material') {
      setManualOverride(storedTheme)
      setThemeName(storedTheme)
    } else {
      setThemeName(detected)
    }
    
    const storedColorMode = localStorage.getItem('color-mode-preference')
    if (storedColorMode === 'light' || storedColorMode === 'dark') {
      setColorModeOverride(storedColorMode)
      setColorMode(storedColorMode)
    } else {
      setColorMode(detectedColorScheme)
    }
    
    // Listen for system color scheme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      setAutoColorMode(e.matches ? 'dark' : 'light')
      if (!colorModeOverride) {
        setColorMode(e.matches ? 'dark' : 'light')
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  // Update custom colors when appColors prop changes
  useEffect(() => {
    if (appColors) {
      setCustomColors(appColors)
    }
  }, [appColors])
  
  // Apply dark mode class to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', colorMode === 'dark')
    }
  }, [colorMode])
  
  // Get current theme object
  const theme = themeName === 'apple' ? appleTheme : materialTheme
  
  // Compute colors based on mode and custom colors
  const colors = {
    ...DEFAULT_COLORS,
    ...(customColors || {}),
    ...(colorMode === 'dark' ? DARK_COLORS : {})
  }
  
  // Toggle theme manually
  const toggleTheme = () => {
    const newTheme = themeName === 'apple' ? 'material' : 'apple'
    setThemeName(newTheme)
    setManualOverride(newTheme)
    localStorage.setItem('theme-preference', newTheme)
  }
  
  // Toggle color mode
  const toggleColorMode = () => {
    const newMode = colorMode === 'light' ? 'dark' : 'light'
    setColorMode(newMode)
    setColorModeOverride(newMode)
    localStorage.setItem('color-mode-preference', newMode)
  }
  
  // Set specific color mode
  const setColorModePreference = (mode) => {
    if (mode === 'auto') {
      setColorModeOverride(null)
      setColorMode(autoColorMode)
      localStorage.removeItem('color-mode-preference')
    } else {
      setColorMode(mode)
      setColorModeOverride(mode)
      localStorage.setItem('color-mode-preference', mode)
    }
  }
  
  // Reset to auto-detected theme
  const resetToAuto = () => {
    setManualOverride(null)
    setThemeName(autoDetected)
    localStorage.removeItem('theme-preference')
  }
  
  // Update custom colors (called when admin saves new colors)
  const updateColors = (newColors) => {
    setCustomColors(prev => ({ ...prev, ...newColors }))
  }
  
  const value = {
    // Theme (Apple/Material)
    theme,
    themeName,
    autoDetected,
    manualOverride,
    isApple: themeName === 'apple',
    isMaterial: themeName === 'material',
    toggleTheme,
    resetToAuto,
    
    // Color mode (Light/Dark)
    colorMode,
    autoColorMode,
    colorModeOverride,
    isDark: colorMode === 'dark',
    isLight: colorMode === 'light',
    toggleColorMode,
    setColorModePreference,
    
    // Colors
    colors,
    updateColors
  }
  
  return (
    <ThemeContext.Provider value={value}>
      <div 
        style={{
          '--color-primary': colors.primary,
          '--color-secondary': colors.secondary,
          '--color-accent': colors.accent,
          '--color-danger': colors.danger,
          '--color-background': colors.background,
          '--color-foreground': colors.foreground,
          '--color-muted': colors.muted,
          '--color-border': colors.border,
        }}
        className={colorMode === 'dark' ? 'dark' : ''}
      >
        {children}
      </div>
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

// Export themes and colors for direct access
export { appleTheme, materialTheme, DEFAULT_COLORS }

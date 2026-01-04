'use client'

import { createContext, useContext, useState, useEffect } from 'react'

// iOS System Colors - Light Mode
const IOS_COLORS_LIGHT = {
  // System Blues
  blue: '#007AFF',
  blueLight: 'rgba(0, 122, 255, 0.12)',
  
  // System Grays (Light Mode)
  gray: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  
  // Semantic Colors
  red: '#FF3B30',
  orange: '#FF9500',
  yellow: '#FFCC00',
  green: '#34C759',
  teal: '#5AC8FA',
  indigo: '#5856D6',
  purple: '#AF52DE',
  pink: '#FF2D55',
  
  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F2F2F7',
  backgroundTertiary: '#FFFFFF',
  backgroundGrouped: '#F2F2F7',
  backgroundGroupedSecondary: '#FFFFFF',
  
  // Text
  label: '#000000',
  labelSecondary: '#3C3C43',
  labelTertiary: 'rgba(60, 60, 67, 0.6)',
  labelQuaternary: 'rgba(60, 60, 67, 0.3)',
  
  // Separators
  separator: 'rgba(60, 60, 67, 0.29)',
  separatorOpaque: '#C6C6C8',
  
  // Fills
  fill: 'rgba(120, 120, 128, 0.2)',
  fillSecondary: 'rgba(120, 120, 128, 0.16)',
  fillTertiary: 'rgba(118, 118, 128, 0.12)',
  fillQuaternary: 'rgba(116, 116, 128, 0.08)',
}

// iOS System Colors - Dark Mode
const IOS_COLORS_DARK = {
  // System Blues
  blue: '#0A84FF',
  blueLight: 'rgba(10, 132, 255, 0.15)',
  
  // System Grays (Dark Mode)
  gray: '#8E8E93',
  gray2: '#636366',
  gray3: '#48484A',
  gray4: '#3A3A3C',
  gray5: '#2C2C2E',
  gray6: '#1C1C1E',
  
  // Semantic Colors
  red: '#FF453A',
  orange: '#FF9F0A',
  yellow: '#FFD60A',
  green: '#30D158',
  teal: '#64D2FF',
  indigo: '#5E5CE6',
  purple: '#BF5AF2',
  pink: '#FF375F',
  
  // Backgrounds
  background: '#000000',
  backgroundSecondary: '#1C1C1E',
  backgroundTertiary: '#2C2C2E',
  backgroundGrouped: '#000000',
  backgroundGroupedSecondary: '#1C1C1E',
  
  // Text
  label: '#FFFFFF',
  labelSecondary: '#EBEBF5',
  labelTertiary: 'rgba(235, 235, 245, 0.6)',
  labelQuaternary: 'rgba(235, 235, 245, 0.3)',
  
  // Separators
  separator: 'rgba(84, 84, 88, 0.65)',
  separatorOpaque: '#38383A',
  
  // Fills
  fill: 'rgba(120, 120, 128, 0.36)',
  fillSecondary: 'rgba(120, 120, 128, 0.32)',
  fillTertiary: 'rgba(118, 118, 128, 0.24)',
  fillQuaternary: 'rgba(116, 116, 128, 0.18)',
}

// Brand accent color (your red)
const BRAND_RED = '#D12128'

// iOS Theme definition
const iosTheme = {
  name: 'ios',
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
    brand: '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    mono: '"SF Mono", "Menlo", "Monaco", "Courier New", monospace'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '44px'
  },
  borderRadius: {
    xs: '6px',
    sm: '8px',
    md: '10px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    full: '9999px'
  },
  button: {
    height: '50px',
    heightSmall: '36px',
    heightMini: '28px',
    padding: '0 20px',
    paddingSmall: '0 16px',
    fontSize: '17px',
    fontSizeSmall: '15px',
    fontWeight: '600',
    borderRadius: '12px',
    borderRadiusSmall: '8px'
  },
  input: {
    height: '44px',
    padding: '0 16px',
    fontSize: '17px',
    borderRadius: '10px',
    borderWidth: '0.5px'
  },
  card: {
    padding: '16px',
    borderRadius: '12px',
    shadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
  },
  nav: {
    height: '56px',
    iconSize: '22px',
    pillHeight: '56px',
    pillRadius: '28px'
  },
  shadow: {
    none: 'none',
    xs: '0 1px 2px rgba(0, 0, 0, 0.04)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.06)',
    md: '0 4px 12px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
    xl: '0 12px 32px rgba(0, 0, 0, 0.16)'
  },
  transition: {
    fast: '0.15s ease',
    normal: '0.25s ease',
    slow: '0.35s ease'
  }
}

// Detect preferred color scheme
function detectColorScheme() {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Context
const ThemeContext = createContext(null)

export function ThemeProvider({ children, appColors = null }) {
  // Color mode state
  const [colorMode, setColorMode] = useState('light')
  const [autoColorMode, setAutoColorMode] = useState('light')
  const [colorModeOverride, setColorModeOverride] = useState(null)
  
  // Custom colors from app config
  const [customColors, setCustomColors] = useState(null)
  
  // Detect color scheme on mount
  useEffect(() => {
    const detectedColorScheme = detectColorScheme()
    setAutoColorMode(detectedColorScheme)
    
    // Check for stored preferences
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
      // Set color-scheme for native elements
      document.documentElement.style.colorScheme = colorMode
    }
  }, [colorMode])
  
  // Get iOS colors based on mode
  const iosColors = colorMode === 'dark' ? IOS_COLORS_DARK : IOS_COLORS_LIGHT
  
  // Merge with custom colors (brand accent overrides)
  const colors = {
    ...iosColors,
    accent: customColors?.accent_color || BRAND_RED,
    primary: customColors?.primary_color || iosColors.blue,
    danger: customColors?.danger_color || iosColors.red,
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
  
  // Update custom colors (called when admin saves new colors)
  const updateColors = (newColors) => {
    setCustomColors(prev => ({ ...prev, ...newColors }))
  }
  
  const value = {
    // Theme (always iOS now)
    theme: iosTheme,
    themeName: 'ios',
    isApple: true,
    
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
    iosColors,
    updateColors
  }
  
  return (
    <ThemeContext.Provider value={value}>
      <div 
        style={{
          '--ios-blue': colors.blue,
          '--ios-blue-light': colors.blueLight,
          '--ios-gray': colors.gray,
          '--ios-gray2': colors.gray2,
          '--ios-gray3': colors.gray3,
          '--ios-gray4': colors.gray4,
          '--ios-gray5': colors.gray5,
          '--ios-gray6': colors.gray6,
          '--ios-red': colors.red,
          '--ios-green': colors.green,
          '--ios-background': colors.background,
          '--ios-background-secondary': colors.backgroundSecondary,
          '--ios-background-tertiary': colors.backgroundTertiary,
          '--ios-label': colors.label,
          '--ios-label-secondary': colors.labelSecondary,
          '--ios-label-tertiary': colors.labelTertiary,
          '--ios-separator': colors.separator,
          '--ios-fill': colors.fill,
          '--ios-fill-secondary': colors.fillSecondary,
          '--brand-accent': colors.accent,
          '--brand-primary': colors.primary,
          fontFamily: iosTheme.fontFamily.sans,
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

// Export theme and colors for direct access
export { iosTheme, IOS_COLORS_LIGHT, IOS_COLORS_DARK, BRAND_RED }

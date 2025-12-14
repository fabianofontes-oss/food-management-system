'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'
type AccentColor = 'violet' | 'blue' | 'green' | 'orange' | 'pink'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  accentColor: AccentColor
  setTheme: (theme: Theme) => void
  setAccentColor: (color: AccentColor) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const accentColors = {
  violet: { primary: 'rgb(139, 92, 246)', hover: 'rgb(124, 58, 237)' },
  blue: { primary: 'rgb(59, 130, 246)', hover: 'rgb(37, 99, 235)' },
  green: { primary: 'rgb(34, 197, 94)', hover: 'rgb(22, 163, 74)' },
  orange: { primary: 'rgb(249, 115, 22)', hover: 'rgb(234, 88, 12)' },
  pink: { primary: 'rgb(236, 72, 153)', hover: 'rgb(219, 39, 119)' }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [accentColor, setAccentColorState] = useState<AccentColor>('violet')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme') as Theme | null
    const savedAccent = localStorage.getItem('dashboard-accent') as AccentColor | null
    
    if (savedTheme) setThemeState(savedTheme)
    if (savedAccent) setAccentColorState(savedAccent)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    
    let effectiveTheme: 'light' | 'dark' = 'light'
    
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } else {
      effectiveTheme = theme
    }
    
    setResolvedTheme(effectiveTheme)
    
    if (effectiveTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    const colors = accentColors[accentColor]
    root.style.setProperty('--accent-primary', colors.primary)
    root.style.setProperty('--accent-hover', colors.hover)
    
    localStorage.setItem('dashboard-theme', theme)
    localStorage.setItem('dashboard-accent', accentColor)
  }, [theme, accentColor])

  useEffect(() => {
    if (theme !== 'system') return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light')
      if (e.matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color)
  }

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      resolvedTheme, 
      accentColor, 
      setTheme, 
      setAccentColor,
      toggleTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

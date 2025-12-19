/**
 * Módulo Minisite - Hook para gerenciar tema
 */

'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { updateMinisiteThemeAction } from '../actions'
import { DEFAULT_THEME, type MinisiteTheme, type LayoutType, type ThemeColors, type ThemeDisplay } from '../types'

interface UseMinisiteThemeReturn {
  theme: MinisiteTheme
  updateLayout: (layout: LayoutType) => void
  updateColor: (key: keyof ThemeColors, value: string) => void
  updateDisplay: (key: keyof ThemeDisplay, value: boolean) => void
  updateBanner: (url: string | null) => void
  save: () => Promise<boolean>
  reset: () => void
  isSaving: boolean
  hasChanges: boolean
}

export function useMinisiteTheme(
  storeId: string | null,
  initialTheme?: MinisiteTheme
): UseMinisiteThemeReturn {
  const params = useParams()
  const slug = params?.slug as string || ''
  
  const [theme, setTheme] = useState<MinisiteTheme>(initialTheme || DEFAULT_THEME)
  const [original, setOriginal] = useState<MinisiteTheme>(initialTheme || DEFAULT_THEME)
  const [isSaving, setIsSaving] = useState(false)

  const hasChanges = JSON.stringify(theme) !== JSON.stringify(original)

  const updateLayout = useCallback((layout: LayoutType) => {
    setTheme(prev => ({ ...prev, layout }))
  }, [])

  const updateColor = useCallback((key: keyof ThemeColors, value: string) => {
    setTheme(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: value }
    }))
  }, [])

  const updateDisplay = useCallback((key: keyof ThemeDisplay, value: boolean) => {
    setTheme(prev => ({
      ...prev,
      display: { ...prev.display, [key]: value }
    }))
  }, [])

  const updateBanner = useCallback((url: string | null) => {
    setTheme(prev => ({ ...prev, bannerUrl: url }))
  }, [])

  const save = useCallback(async (): Promise<boolean> => {
    if (!storeId) return false
    
    setIsSaving(true)
    try {
      const result = await updateMinisiteThemeAction(storeId, theme, slug)
      if (result.success) {
        setOriginal(theme)
      }
      return result.success
    } catch (error) {
      console.error('[useMinisiteTheme] save error:', error)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [storeId, theme, slug])

  const reset = useCallback(() => {
    setTheme(original)
  }, [original])

  return {
    theme,
    updateLayout,
    updateColor,
    updateDisplay,
    updateBanner,
    save,
    reset,
    isSaving,
    hasChanges,
  }
}

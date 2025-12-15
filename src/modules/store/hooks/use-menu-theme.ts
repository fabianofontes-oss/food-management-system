'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import type { MenuTheme, MenuLayout } from '../types'
import { DEFAULT_MENU_THEME } from '../types'
import { StoreRepository } from '../repository'
import { updateMenuThemeAction } from '../actions'

interface UseMenuThemeReturn {
  theme: MenuTheme
  setTheme: (theme: MenuTheme) => void
  updateLayout: (layout: MenuLayout) => void
  updateColor: (key: keyof MenuTheme['colors'], value: string) => void
  updateDisplay: (key: keyof MenuTheme['display'], value: boolean) => void
  updateBanner: (url: string | null) => void
  save: () => Promise<boolean>
  reset: () => void
  isSaving: boolean
  hasChanges: boolean
}

export function useMenuTheme(
  storeId: string | null,
  initialTheme?: MenuTheme,
  storeSlug?: string
): UseMenuThemeReturn {
  const params = useParams()
  const slug = storeSlug || (params?.slug as string) || ''
  
  const [theme, setThemeState] = useState<MenuTheme>(initialTheme || DEFAULT_MENU_THEME)
  const [originalTheme, setOriginalTheme] = useState<MenuTheme>(initialTheme || DEFAULT_MENU_THEME)
  const [isSaving, setIsSaving] = useState(false)

  const hasChanges = JSON.stringify(theme) !== JSON.stringify(originalTheme)

  const setTheme = useCallback((newTheme: MenuTheme) => {
    setThemeState(newTheme)
  }, [])

  const updateLayout = useCallback((layout: MenuLayout) => {
    setThemeState(prev => ({ ...prev, layout }))
  }, [])

  const updateColor = useCallback((key: keyof MenuTheme['colors'], value: string) => {
    setThemeState(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: value }
    }))
  }, [])

  const updateDisplay = useCallback((key: keyof MenuTheme['display'], value: boolean) => {
    setThemeState(prev => ({
      ...prev,
      display: { ...prev.display, [key]: value }
    }))
  }, [])

  const updateBanner = useCallback((url: string | null) => {
    setThemeState(prev => ({ ...prev, bannerUrl: url }))
  }, [])

  const save = useCallback(async (): Promise<boolean> => {
    if (!storeId) return false
    
    setIsSaving(true)
    try {
      // Passar o slug para revalidar o cache corretamente
      const result = await updateMenuThemeAction(storeId, theme, slug)
      if (result.success) {
        setOriginalTheme(theme)
      }
      return result.success
    } catch (error) {
      console.error('Erro ao salvar tema:', error)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [storeId, theme, slug])

  const reset = useCallback(() => {
    setThemeState(originalTheme)
  }, [originalTheme])

  return {
    theme,
    setTheme,
    updateLayout,
    updateColor,
    updateDisplay,
    updateBanner,
    save,
    reset,
    isSaving,
    hasChanges
  }
}

'use client'

import { Component, ReactNode } from 'react'
import type { MenuTheme, StoreWithSettings } from '../../types'
import { safeParseTheme, getThemeCSSVariables } from '../../utils'
import { ClassicLayout } from './layouts/classic-layout'
import { ModernLayout } from './layouts/modern-layout'
import { GridLayout } from './layouts/grid-layout'
import { MinimalLayout } from './layouts/minimal-layout'

interface Product {
  id: string
  name: string
  description?: string | null
  price: number
  image_url?: string | null
  is_available: boolean
}

interface Category {
  id: string
  name: string
  products: Product[]
}

interface StoreFrontProps {
  store: StoreWithSettings
  categories?: Category[]
  onAddToCart?: (product: Product) => void
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Error Boundary para proteger contra falhas nos layouts
 */
class LayoutErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Layout Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

/**
 * StoreFront - Orquestrador do cardápio público
 * 
 * Responsabilidades:
 * 1. Parsear o tema de forma segura (nunca null/undefined)
 * 2. Aplicar variáveis CSS de cor
 * 3. Escolher o layout correto
 * 4. Proteger contra erros com ErrorBoundary
 */
export function StoreFront({ store, categories = [], onAddToCart }: StoreFrontProps) {
  // BLINDAGEM: Sempre retorna um tema válido
  const theme = safeParseTheme(store.parsedTheme)
  
  // Variáveis CSS para uso global
  const cssVars = getThemeCSSVariables(theme)

  // Props comuns para todos os layouts
  const layoutProps = {
    theme,
    storeName: store.name || 'Loja',
    storeAddress: store.address || undefined,
    logoUrl: store.logo_url || undefined,
    bannerUrl: theme.bannerUrl || store.banner_url || undefined,
    categories,
    onAddToCart
  }

  // Fallback layout (Classic) em caso de erro
  const fallbackLayout = (
    <ClassicLayout {...layoutProps} />
  )

  // Seleciona o layout baseado no tema
  const renderLayout = () => {
    switch (theme.layout) {
      case 'modern':
        return <ModernLayout {...layoutProps} />
      case 'grid':
        return <GridLayout {...layoutProps} />
      case 'minimal':
        return <MinimalLayout {...layoutProps} />
      case 'classic':
      default:
        return <ClassicLayout {...layoutProps} />
    }
  }

  return (
    <div 
      style={cssVars as React.CSSProperties}
      className="store-front"
    >
      <LayoutErrorBoundary fallback={fallbackLayout}>
        {renderLayout()}
      </LayoutErrorBoundary>
    </div>
  )
}

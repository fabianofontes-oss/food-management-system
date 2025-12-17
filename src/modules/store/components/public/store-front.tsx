'use client'

import { Component, ReactNode, useEffect } from 'react'
import type { MenuTheme, StoreWithSettings } from '../../types'
import { safeParseTheme, getThemeCSSVariables } from '../../utils'
import { StoreHeader } from './header'
import { StoreStatusBanner } from './store-status-banner'
import { ClassicLayout } from './layouts/classic-layout'
import { ModernLayout } from './layouts/modern-layout'
import { GridLayout } from './layouts/grid-layout'
import { MinimalLayout } from './layouts/minimal-layout'
import { CartDrawer, useCartStore } from '@/modules/cart'

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

interface StoreStatus {
  isOpen: boolean
  nextOpenFormatted: string | null
  schedulingEnabled: boolean
}

interface StoreFrontProps {
  store: StoreWithSettings
  categories?: Category[]
  onAddToCart?: (product: Product) => void
  isOwner?: boolean
  storeStatus?: StoreStatus
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
export function StoreFront({ store, categories = [], onAddToCart, isOwner = false, storeStatus }: StoreFrontProps) {
  // SOLUÇÃO DEFINITIVA: Usar parsedTheme diretamente se existir, senão parse do menu_theme
  const rawTheme = store.parsedTheme || (store as any).menu_theme
  const theme = safeParseTheme(rawTheme)
  
  // Variáveis CSS para uso global
  const cssVars = getThemeCSSVariables(theme)

  // Setar a loja no carrinho (para evitar mistura de lojas)
  const { setStore } = useCartStore()
  useEffect(() => {
    if (store.id && store.slug) {
      setStore(store.id, store.slug, store.name || 'Loja')
    }
  }, [store.id, store.slug, store.name, setStore])

  // Props comuns para todos os layouts
  const layoutProps = {
    theme,
    storeName: store.name || 'Loja',
    storeAddress: store.address || undefined,
    storePhone: store.phone || undefined,
    storeWhatsapp: store.whatsapp || undefined,
    logoUrl: store.logo_url || undefined,
    bannerUrl: theme.bannerUrl || store.banner_url || undefined,
    categories,
    onAddToCart,
    // Props para botão de emergência
    storeId: store.id,
    storeSlug: store.slug || undefined,
    nicheSlug: (store as any).niche_slug || 'acaiteria', // Default para acaiteria se não tiver
    isOwner
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
      style={{
        '--primary': theme.colors.primary,
        '--background': theme.colors.background,
        '--header': theme.colors.header,
        ...cssVars
      } as React.CSSProperties}
      className="store-front min-h-screen"
    >
      {/* Banner de status da loja (fechada/agendamento) */}
      {storeStatus && (
        <StoreStatusBanner
          isOpen={storeStatus.isOpen}
          nextOpenFormatted={storeStatus.nextOpenFormatted}
          schedulingEnabled={storeStatus.schedulingEnabled}
          storeSlug={store.slug || ''}
          primaryColor={theme.colors.primary}
        />
      )}

      <LayoutErrorBoundary fallback={fallbackLayout}>
        {renderLayout()}
      </LayoutErrorBoundary>
      
      {/* Cart Drawer - sempre presente */}
      <CartDrawer primaryColor={theme.colors.primary} />
    </div>
  )
}

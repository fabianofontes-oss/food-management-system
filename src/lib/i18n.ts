// Internationalization module for multi-country support
// Supports: Brazil (pt-BR), USA (en-US), Chile (es-CL)

export type SupportedLocale = 'pt-BR' | 'en-US' | 'es-CL'
export type SupportedCountry = 'BR' | 'US' | 'CL'
export type SupportedCurrency = 'BRL' | 'USD' | 'CLP'

export type I18nMessages = {
  menu: { [key: string]: string }
  actions: { [key: string]: string }
  cart: { [key: string]: string }
  labels: { [key: string]: string }
  status: { [key: string]: string }
  superadmin: { [key: string]: string }
}

export const messages: Record<SupportedLocale, I18nMessages> = {
  'pt-BR': {
    menu: {
      dashboard: 'Painel',
      products: 'Produtos',
      orders: 'Pedidos',
      kitchen: 'Cozinha',
      delivery: 'Delivery',
      settings: 'Configurações',
      superadmin_dashboard: 'Dashboard',
      superadmin_tenants: 'Tenants',
      superadmin_stores: 'Lojas',
      superadmin_plans: 'Planos',
      superadmin_users: 'Usuários',
      superadmin_analytics: 'Analytics',
      superadmin_logs: 'Logs',
      superadmin_tickets: 'Tickets',
      superadmin_features: 'Feature Flags',
      superadmin_automations: 'Automações',
      superadmin_reports: 'Relatórios',
      superadmin_settings: 'Configurações'
    },
    actions: {
      save: 'Salvar',
      cancel: 'Cancelar',
      edit: 'Editar',
      delete: 'Excluir',
      view: 'Ver',
      close: 'Fechar',
      add: 'Adicionar',
      remove: 'Remover',
      confirm: 'Confirmar',
      back: 'Voltar'
    },
    cart: {
      title: 'Carrinho',
      add: 'Adicionar ao carrinho',
      checkout: 'Finalizar pedido',
      empty: 'Seu carrinho está vazio',
      subtotal: 'Subtotal',
      total: 'Total',
      continue_shopping: 'Continuar comprando'
    },
    labels: {
      price: 'Preço',
      quantity: 'Quantidade',
      total: 'Total',
      name: 'Nome',
      description: 'Descrição',
      category: 'Categoria',
      status: 'Status',
      date: 'Data',
      time: 'Hora',
      phone: 'Telefone',
      email: 'E-mail',
      address: 'Endereço'
    },
    status: {
      coming_soon: 'Em breve',
      active: 'Ativo',
      inactive: 'Inativo',
      pending: 'Pendente',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    },
    superadmin: {
      analytics_coming_soon: 'Aqui teremos gráficos de MRR, churn, métricas de uso e performance por tenant.',
      logs_coming_soon: 'Aqui será o painel de auditoria com histórico de ações (create/update/delete) por tenant e usuário.',
      tickets_coming_soon: 'Aqui será o sistema de suporte, com tickets, prioridades e histórico de conversa com os clientes.',
      features_coming_soon: 'Aqui será possível ativar/desativar funcionalidades específicas por tenant ou globalmente.',
      automations_coming_soon: 'Aqui será possível criar regras de automação para ações recorrentes e notificações.',
      reports_coming_soon: 'Aqui será possível gerar relatórios customizados e exportá-los em diversos formatos.'
    }
  },
  'en-US': {
    menu: {
      dashboard: 'Dashboard',
      products: 'Products',
      orders: 'Orders',
      kitchen: 'Kitchen',
      delivery: 'Delivery',
      settings: 'Settings',
      superadmin_dashboard: 'Dashboard',
      superadmin_tenants: 'Tenants',
      superadmin_stores: 'Stores',
      superadmin_plans: 'Plans',
      superadmin_users: 'Users',
      superadmin_analytics: 'Analytics',
      superadmin_logs: 'Logs',
      superadmin_tickets: 'Tickets',
      superadmin_features: 'Feature Flags',
      superadmin_automations: 'Automations',
      superadmin_reports: 'Reports',
      superadmin_settings: 'Settings'
    },
    actions: {
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      view: 'View',
      close: 'Close',
      add: 'Add',
      remove: 'Remove',
      confirm: 'Confirm',
      back: 'Back'
    },
    cart: {
      title: 'Cart',
      add: 'Add to cart',
      checkout: 'Checkout',
      empty: 'Your cart is empty',
      subtotal: 'Subtotal',
      total: 'Total',
      continue_shopping: 'Continue shopping'
    },
    labels: {
      price: 'Price',
      quantity: 'Quantity',
      total: 'Total',
      name: 'Name',
      description: 'Description',
      category: 'Category',
      status: 'Status',
      date: 'Date',
      time: 'Time',
      phone: 'Phone',
      email: 'Email',
      address: 'Address'
    },
    status: {
      coming_soon: 'Coming soon',
      active: 'Active',
      inactive: 'Inactive',
      pending: 'Pending',
      completed: 'Completed',
      cancelled: 'Cancelled'
    },
    superadmin: {
      analytics_coming_soon: 'Here we will have MRR charts, churn, usage metrics and performance by tenant.',
      logs_coming_soon: 'Here will be the audit panel with action history (create/update/delete) by tenant and user.',
      tickets_coming_soon: 'Here will be the support system, with tickets, priorities and conversation history with customers.',
      features_coming_soon: 'Here it will be possible to enable/disable specific features by tenant or globally.',
      automations_coming_soon: 'Here it will be possible to create automation rules for recurring actions and notifications.',
      reports_coming_soon: 'Here it will be possible to generate custom reports and export them in various formats.'
    }
  },
  'es-CL': {
    menu: {
      dashboard: 'Panel',
      products: 'Productos',
      orders: 'Pedidos',
      kitchen: 'Cocina',
      delivery: 'Delivery',
      settings: 'Configuración',
      superadmin_dashboard: 'Dashboard',
      superadmin_tenants: 'Tenants',
      superadmin_stores: 'Tiendas',
      superadmin_plans: 'Planes',
      superadmin_users: 'Usuarios',
      superadmin_analytics: 'Analytics',
      superadmin_logs: 'Logs',
      superadmin_tickets: 'Tickets',
      superadmin_features: 'Feature Flags',
      superadmin_automations: 'Automatizaciones',
      superadmin_reports: 'Informes',
      superadmin_settings: 'Configuración'
    },
    actions: {
      save: 'Guardar',
      cancel: 'Cancelar',
      edit: 'Editar',
      delete: 'Eliminar',
      view: 'Ver',
      close: 'Cerrar',
      add: 'Agregar',
      remove: 'Quitar',
      confirm: 'Confirmar',
      back: 'Volver'
    },
    cart: {
      title: 'Carrito',
      add: 'Agregar al carrito',
      checkout: 'Finalizar pedido',
      empty: 'Tu carrito está vacío',
      subtotal: 'Subtotal',
      total: 'Total',
      continue_shopping: 'Seguir comprando'
    },
    labels: {
      price: 'Precio',
      quantity: 'Cantidad',
      total: 'Total',
      name: 'Nombre',
      description: 'Descripción',
      category: 'Categoría',
      status: 'Estado',
      date: 'Fecha',
      time: 'Hora',
      phone: 'Teléfono',
      email: 'Email',
      address: 'Dirección'
    },
    status: {
      coming_soon: 'Próximamente',
      active: 'Activo',
      inactive: 'Inactivo',
      pending: 'Pendiente',
      completed: 'Completado',
      cancelled: 'Cancelado'
    },
    superadmin: {
      analytics_coming_soon: 'Aquí tendremos gráficos de MRR, churn, métricas de uso y rendimiento por tenant.',
      logs_coming_soon: 'Aquí estará el panel de auditoría con historial de acciones (crear/actualizar/eliminar) por tenant y usuario.',
      tickets_coming_soon: 'Aquí estará el sistema de soporte, con tickets, prioridades e historial de conversación con los clientes.',
      features_coming_soon: 'Aquí será posible activar/desactivar funcionalidades específicas por tenant o globalmente.',
      automations_coming_soon: 'Aquí será posible crear reglas de automatización para acciones recurrentes y notificaciones.',
      reports_coming_soon: 'Aquí será posible generar informes personalizados y exportarlos en varios formatos.'
    }
  }
}

// Currency formatter factory
export function createCurrencyFormatter(
  locale: SupportedLocale,
  currency: string
): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Date/Time formatter factory
export function createDateFormatter(locale: SupportedLocale, timezone: string) {
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })

  const timeFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  return {
    formatDate: (date: Date) => dateFormatter.format(date),
    formatTime: (date: Date) => timeFormatter.format(date),
    formatDateTime: (date: Date) => dateTimeFormatter.format(date)
  }
}

// Phone formatter by country
export function createPhoneFormatter(country: SupportedCountry) {
  return (phone: string): string => {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '')

    switch (country) {
      case 'BR':
        // Format: (11) 99999-9999
        if (cleaned.length === 11) {
          return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
        }
        // Format: (11) 9999-9999
        if (cleaned.length === 10) {
          return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
        }
        return phone // Return original if doesn't match

      case 'US':
        // Format: (555) 123-4567
        if (cleaned.length === 10) {
          return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
        }
        return phone

      case 'CL':
        // Format: +56 9 1234 5678
        if (cleaned.length === 9 && cleaned.startsWith('9')) {
          return `+56 ${cleaned.slice(0, 1)} ${cleaned.slice(1, 5)} ${cleaned.slice(5)}`
        }
        return phone

      default:
        return phone
    }
  }
}

// Helper to validate locale
export function isValidLocale(locale: string): locale is SupportedLocale {
  return ['pt-BR', 'en-US', 'es-CL'].includes(locale)
}

// Helper to validate country
export function isValidCountry(country: string): country is SupportedCountry {
  return ['BR', 'US', 'CL'].includes(country)
}

// Helper to validate currency
export function isValidCurrency(currency: string): currency is SupportedCurrency {
  return ['BRL', 'USD', 'CLP'].includes(currency)
}

// Get default values by country
export function getDefaultsByCountry(country: SupportedCountry): {
  locale: SupportedLocale
  currency: SupportedCurrency
  timezone: string
} {
  switch (country) {
    case 'BR':
      return {
        locale: 'pt-BR',
        currency: 'BRL',
        timezone: 'America/Sao_Paulo'
      }
    case 'US':
      return {
        locale: 'en-US',
        currency: 'USD',
        timezone: 'America/New_York'
      }
    case 'CL':
      return {
        locale: 'es-CL',
        currency: 'CLP',
        timezone: 'America/Santiago'
      }
  }
}

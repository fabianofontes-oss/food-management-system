export interface ModuleSetting {
  key: string
  label: string
  description?: string
  type: 'text' | 'number' | 'select' | 'toggle' | 'currency' | 'time'
  icon?: React.ReactNode
  options?: { value: string; label: string }[]
  placeholder?: string
  defaultValue?: any
  suffix?: string
  prefix?: string
}

export interface Module {
  id: string
  name: string
  description: string
  longDescription: string
  icon: React.ReactNode
  color: string
  bgColor: string
  category: 'store' | 'sales' | 'payments' | 'operations' | 'integrations' | 'marketing' | 'notifications'
  subcategory?: 'delivery_platforms' | 'social_commerce' | 'payment_gateways' | 'payment_machines' | 'fiscal' | 'erp' | 'communication' | 'analytics' | 'maps' | 'crm'
  configPage?: string
  isCore?: boolean
  hasCustomCard?: boolean
  requiresSuperadmin?: boolean
  settings: ModuleSetting[]
}

export interface Category {
  id: string
  name: string
  description: string
}

export interface IntegrationSubcategory {
  id: string
  name: string
  description: string
}

import { type Tenant } from '@/lib/superadmin/queries'
import { type Plan } from '@/lib/superadmin/plans'

export type TenantWithStoreCount = Tenant & {
  stores_count: number
  plan_name: string | null
  plan_slug: string | null
}

export interface TenantFormData {
  name: string
  email: string
  phone: string
  document: string
  document_type: 'cpf' | 'cnpj'
  responsible_name: string
  address: string
  city: string
  state: string
  cep: string
  status: string
  billing_day: number
  notes: string
}

export const INITIAL_FORM_DATA: TenantFormData = {
  name: '',
  email: '',
  phone: '',
  document: '',
  document_type: 'cpf',
  responsible_name: '',
  address: '',
  city: '',
  state: '',
  cep: '',
  status: 'active',
  billing_day: 1,
  notes: ''
}

export interface TenantStatusConfig {
  label: string
  color: string
  icon: any
}

export const STATUS_CONFIG: Record<string, TenantStatusConfig> = {
  active: { label: 'Ativo', color: 'bg-green-100 text-green-700', icon: 'CheckCircle' },
  trial: { label: 'Trial', color: 'bg-blue-100 text-blue-700', icon: 'Clock' },
  suspended: { label: 'Suspenso', color: 'bg-yellow-100 text-yellow-700', icon: 'AlertCircle' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: 'Ban' }
}

export type { Tenant, Plan }

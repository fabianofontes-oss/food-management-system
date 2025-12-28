export interface AdminStats {
  total_tenants: number
  active_tenants: number
  trial_tenants: number
  suspended_tenants: number
  new_this_month: number
  total_stores: number
  total_revenue_cents: number
  paid_invoices: number
  overdue_invoices: number
  pending_amount_cents: number
}

export interface TenantWithPlan {
  id: string
  name: string
  email: string
  status: string
  plan_name: string | null
  plan_slug: string | null
  created_at: string
  store_count?: number
}

export interface PlanData {
  id: string
  name: string
  slug: string
  is_active: boolean
  price_monthly_cents: number
}

export interface UserData {
  id: string
  email: string
  name: string | null
  created_at: string
  last_sign_in_at: string | null
}

export interface AuditLogEntry {
  id: string
  tenant_id: string | null
  user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  changes: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

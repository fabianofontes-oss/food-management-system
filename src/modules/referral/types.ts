import { z } from 'zod'

// Tipos de parceiros
export const PartnerTypeEnum = z.enum([
  'OWNER',
  'STAFF', 
  'DRIVER',
  'PARTNER_GENERAL',
  'PARTNER_PRO'
])
export type PartnerType = z.infer<typeof PartnerTypeEnum>

// Status de vendas/comissões
export const SaleStatusEnum = z.enum([
  'PENDING',
  'AVAILABLE',
  'CANCELLED',
  'ADJUSTED'
])
export type SaleStatus = z.infer<typeof SaleStatusEnum>

// Partner (afiliado)
export interface ReferralPartner {
  id: string
  user_id: string | null
  tenant_id: string | null
  store_id: string | null
  display_name: string
  partner_type: PartnerType
  base_commission_percent: number
  eligible_for_bonus: boolean
  is_active: boolean
  staff_share_percent: number | null
  owner_share_percent: number | null
  // Split 80/20 para DRIVER
  recruited_by_store_id: string | null
  driver_share_percent: number | null    // 80% para driver
  recruiter_share_percent: number | null // 20% para lojista recrutador (crédito)
  created_at: string
}

// Código de referral
export interface ReferralCode {
  code: string
  partner_id: string
  region: string
  is_active: boolean
  created_at: string
}

// Tenant indicado
export interface TenantReferral {
  referred_tenant_id: string
  referral_code: string | null
  partner_id: string | null
  captured_at: string
  captured_by_user_id: string | null
  utm: Record<string, any> | null
}

// Venda/comissão
export interface ReferralSale {
  id: string
  referral_code: string
  partner_id: string
  owner_partner_id: string | null
  referred_tenant_id: string
  plan_id: string
  billing_period: 'MONTHLY' | 'ANNUAL'
  sale_currency: string
  sale_value: number
  commission_base: number
  commission_percent: number
  commission_amount: number
  status: SaleStatus
  paid_at: string | null
  available_at: string | null
  cancelled_at: string | null
  chargeback_at: string | null
  staff_share_percent: number | null
  owner_share_percent: number | null
  staff_commission_amount: number | null
  owner_commission_amount: number | null
  metadata: Record<string, any> | null
  created_at: string
}

// Input para criar partner
export const CreatePartnerSchema = z.object({
  storeId: z.string().uuid().optional(),
  partnerType: PartnerTypeEnum,
  displayName: z.string().min(2).max(100),
})
export type CreatePartnerInput = z.infer<typeof CreatePartnerSchema>

// Input para criar código
export const CreateCodeSchema = z.object({
  partnerId: z.string().uuid(),
})
export type CreateCodeInput = z.infer<typeof CreateCodeSchema>

// Resultado de busca do partner com código
export interface MyReferralData {
  partner: ReferralPartner | null
  codes: ReferralCode[]
  referrals: Array<{
    referred_tenant_id: string
    captured_at: string
    tenant_name?: string
  }>
  sales: Array<{
    id: string
    sale_value: number
    commission_amount: number
    status: SaleStatus
    created_at: string
    tenant_name?: string
  }>
  totals: {
    pending: number
    available: number
    total: number
  }
}

// Gerar código aleatório (8 chars)
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Sem I, O, 0, 1 para evitar confusão
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

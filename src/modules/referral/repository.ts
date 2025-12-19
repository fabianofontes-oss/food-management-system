import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { 
  ReferralPartner, 
  ReferralCode, 
  TenantReferral,
  ReferralSale,
  MyReferralData 
} from './types'
import { generateReferralCode } from './types'

export const ReferralRepository = {
  /**
   * Validar código (público - para rota /r/[code])
   * Usa client browser para funcionar sem auth
   */
  async validateCode(code: string): Promise<{ valid: boolean; partnerId?: string }> {
    const supabase = createBrowserClient()
    
    const { data, error } = await supabase
      .from('referral_codes')
      .select('code, partner_id, is_active')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .maybeSingle()

    if (error || !data) {
      return { valid: false }
    }

    return { valid: true, partnerId: data.partner_id }
  },

  /**
   * Buscar meu partner por tipo (autenticado)
   */
  async getMyPartner(
    storeId?: string, 
    partnerType?: string
  ): Promise<ReferralPartner | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    let query = supabase
      .from('referral_partners')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (storeId) {
      query = query.eq('store_id', storeId)
    }
    if (partnerType) {
      query = query.eq('partner_type', partnerType)
    }

    const { data, error } = await query.maybeSingle()
    if (error || !data) return null

    return data as ReferralPartner
  },

  /**
   * Buscar todos os meus partners
   */
  async getMyPartners(): Promise<ReferralPartner[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('referral_partners')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (error || !data) return []
    return data as ReferralPartner[]
  },

  /**
   * Criar meu partner (self-service)
   */
  async createMyPartner(input: {
    storeId?: string
    tenantId?: string
    partnerType: string
    displayName: string
    recruitedByStoreId?: string // Loja que recrutou (para DRIVER)
  }): Promise<ReferralPartner> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    // Validar membership se for tipo interno
    if (['OWNER', 'STAFF', 'DRIVER'].includes(input.partnerType)) {
      if (!input.storeId) {
        throw new Error('storeId é obrigatório para OWNER/STAFF/DRIVER')
      }

      const { data: storeUser } = await supabase
        .from('store_users')
        .select('id')
        .eq('store_id', input.storeId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!storeUser) {
        throw new Error('Você não é membro desta loja')
      }

      // Buscar tenant_id da store
      if (!input.tenantId) {
        const { data: store } = await supabase
          .from('stores')
          .select('tenant_id')
          .eq('id', input.storeId)
          .single()
        
        input.tenantId = store?.tenant_id
      }
    }

    // Configurar split para DRIVER: 80% driver / 20% recrutador
    const isDriver = input.partnerType === 'DRIVER'
    
    const { data, error } = await supabase
      .from('referral_partners')
      .insert({
        user_id: user.id,
        store_id: input.storeId || null,
        tenant_id: input.tenantId || null,
        display_name: input.displayName,
        partner_type: input.partnerType,
        base_commission_percent: 20, // Default 20%
        is_active: true,
        // Split 80/20 para DRIVER
        recruited_by_store_id: isDriver ? (input.recruitedByStoreId || input.storeId) : null,
        driver_share_percent: isDriver ? 80 : null,
        recruiter_share_percent: isDriver ? 20 : null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar partner:', error)
      throw new Error(error.message || 'Erro ao criar perfil de afiliado')
    }

    return data as ReferralPartner
  },

  /**
   * Criar código para meu partner
   */
  async createMyCode(partnerId: string): Promise<ReferralCode> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    // Verificar se partner pertence ao usuário
    const { data: partner } = await supabase
      .from('referral_partners')
      .select('id')
      .eq('id', partnerId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (!partner) {
      throw new Error('Partner não encontrado ou não pertence a você')
    }

    // Tentar gerar código único (até 5 tentativas)
    let code = ''
    let attempts = 0
    while (attempts < 5) {
      code = generateReferralCode()
      
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('code', code)
        .maybeSingle()

      if (!existing) break
      attempts++
    }

    if (attempts >= 5) {
      throw new Error('Não foi possível gerar um código único')
    }

    const { data, error } = await supabase
      .from('referral_codes')
      .insert({
        code,
        partner_id: partnerId,
        region: 'BR',
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar código:', error)
      throw new Error(error.message || 'Erro ao criar código')
    }

    return data as ReferralCode
  },

  /**
   * Buscar meus códigos
   */
  async getMyCodes(partnerId?: string): Promise<ReferralCode[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Primeiro buscar meus partners
    let partnerIds: string[] = []
    
    if (partnerId) {
      partnerIds = [partnerId]
    } else {
      const partners = await this.getMyPartners()
      partnerIds = partners.map(p => p.id)
    }

    if (partnerIds.length === 0) return []

    const { data, error } = await supabase
      .from('referral_codes')
      .select('*')
      .in('partner_id', partnerIds)

    if (error || !data) return []
    return data as ReferralCode[]
  },

  /**
   * Listar meus indicados (tenant_referrals)
   */
  async getMyReferrals(partnerId?: string): Promise<Array<{
    referred_tenant_id: string
    captured_at: string
    tenant_name?: string
  }>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let partnerIds: string[] = []
    
    if (partnerId) {
      partnerIds = [partnerId]
    } else {
      const partners = await this.getMyPartners()
      partnerIds = partners.map(p => p.id)
    }

    if (partnerIds.length === 0) return []

    const { data, error } = await supabase
      .from('tenant_referrals')
      .select(`
        referred_tenant_id,
        captured_at,
        tenants:referred_tenant_id (name)
      `)
      .in('partner_id', partnerIds)
      .order('captured_at', { ascending: false })

    if (error || !data) return []
    
    return data.map((r: any) => ({
      referred_tenant_id: r.referred_tenant_id,
      captured_at: r.captured_at,
      tenant_name: r.tenants?.name,
    }))
  },

  /**
   * Listar minhas vendas/comissões
   */
  async getMySales(partnerId?: string): Promise<Array<{
    id: string
    sale_value: number
    commission_amount: number
    status: string
    created_at: string
    tenant_name?: string
  }>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let partnerIds: string[] = []
    
    if (partnerId) {
      partnerIds = [partnerId]
    } else {
      const partners = await this.getMyPartners()
      partnerIds = partners.map(p => p.id)
    }

    if (partnerIds.length === 0) return []

    const { data, error } = await supabase
      .from('referral_sales')
      .select(`
        id,
        sale_value,
        commission_amount,
        status,
        created_at,
        tenants:referred_tenant_id (name)
      `)
      .or(`partner_id.in.(${partnerIds.join(',')}),owner_partner_id.in.(${partnerIds.join(',')})`)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    
    return data.map((s: any) => ({
      id: s.id,
      sale_value: s.sale_value,
      commission_amount: s.commission_amount,
      status: s.status,
      created_at: s.created_at,
      tenant_name: s.tenants?.name,
    }))
  },

  /**
   * Buscar dados completos do meu referral
   */
  async getMyReferralData(): Promise<MyReferralData> {
    const partners = await this.getMyPartners()
    const partner = partners[0] || null
    const codes = await this.getMyCodes()
    const referrals = await this.getMyReferrals()
    const sales = await this.getMySales()

    const totals = {
      pending: sales
        .filter(s => s.status === 'PENDING')
        .reduce((acc, s) => acc + s.commission_amount, 0),
      available: sales
        .filter(s => s.status === 'AVAILABLE')
        .reduce((acc, s) => acc + s.commission_amount, 0),
      total: sales.reduce((acc, s) => acc + s.commission_amount, 0),
    }

    return {
      partner,
      codes,
      referrals,
      sales: sales as any,
      totals,
    }
  },

  /**
   * Capturar referral no onboarding (após publish)
   */
  async captureReferral(
    tenantId: string,
    referralCode: string,
    userId: string,
    utm?: Record<string, any>
  ): Promise<boolean> {
    const supabase = await createClient()

    // Verificar se código existe e está ativo
    const { data: codeData } = await supabase
      .from('referral_codes')
      .select('code, partner_id')
      .eq('code', referralCode.toUpperCase())
      .eq('is_active', true)
      .maybeSingle()

    if (!codeData) {
      console.log('[Referral] Código inválido ou inativo:', referralCode)
      return false
    }

    // Verificar se já existe referral para este tenant
    const { data: existing } = await supabase
      .from('tenant_referrals')
      .select('referred_tenant_id')
      .eq('referred_tenant_id', tenantId)
      .maybeSingle()

    if (existing) {
      console.log('[Referral] Tenant já tem referral:', tenantId)
      return false
    }

    // Inserir tenant_referral
    const { error } = await supabase
      .from('tenant_referrals')
      .insert({
        referred_tenant_id: tenantId,
        referral_code: codeData.code,
        partner_id: codeData.partner_id,
        captured_by_user_id: userId,
        utm: utm || null,
      })

    if (error) {
      console.error('[Referral] Erro ao capturar:', error)
      return false
    }

    console.log('[Referral] Capturado com sucesso:', { tenantId, code: codeData.code })
    return true
  },
}

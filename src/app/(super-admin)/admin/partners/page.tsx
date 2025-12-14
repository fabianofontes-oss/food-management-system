'use client'

import { useState } from 'react'
import { 
  Handshake, ExternalLink, DollarSign, Copy, Check, ChevronDown, ChevronUp,
  CreditCard, Truck, FileText, BarChart3, MessageSquare, Building2, Smartphone,
  Globe, Users, Zap, Gift
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Partner {
  id: string
  name: string
  logo: string
  category: 'payments' | 'delivery' | 'erp' | 'crm' | 'analytics' | 'communication' | 'machines'
  hasAffiliate: boolean
  commission: string
  commissionType: 'percentage' | 'fixed' | 'recurring'
  signupUrl: string
  partnerUrl: string
  description: string
  howToApply: string[]
  requirements: string[]
  benefits: string[]
  affiliateLink?: string
}

const PARTNERS: Partner[] = [
  // PAGAMENTOS
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    logo: '💳',
    category: 'payments',
    hasAffiliate: true,
    commission: '0.1% - 0.3% das transações',
    commissionType: 'percentage',
    signupUrl: 'https://www.mercadopago.com.br/developers',
    partnerUrl: 'https://www.mercadopago.com.br/developers/panel',
    description: 'Gateway de pagamento mais usado no Brasil. PIX, cartão, boleto.',
    howToApply: [
      '1. Acesse o Portal de Desenvolvedores do Mercado Pago',
      '2. Crie uma conta ou faça login',
      '3. Vá em "Suas integrações" → "Criar aplicação"',
      '4. Escolha "Pagamentos online" como tipo',
      '5. Após aprovação, solicite entrada no programa de Partners'
    ],
    requirements: [
      'CNPJ ativo',
      'Pelo menos 1 integração funcionando',
      'Volume mínimo de transações (varia)'
    ],
    benefits: [
      'Comissão sobre transações dos seus clientes',
      'Suporte prioritário',
      'Taxas especiais para seus clientes',
      'Dashboard de acompanhamento'
    ]
  },
  {
    id: 'pagseguro',
    name: 'PagSeguro',
    logo: '💚',
    category: 'payments',
    hasAffiliate: true,
    commission: 'Comissão por indicação',
    commissionType: 'fixed',
    signupUrl: 'https://dev.pagseguro.uol.com.br/',
    partnerUrl: 'https://pagseguro.uol.com.br/parceiros',
    description: 'Gateway tradicional com boa penetração no mercado.',
    howToApply: [
      '1. Acesse o portal de desenvolvedores',
      '2. Crie uma conta de desenvolvedor',
      '3. Solicite acesso ao programa de parceiros',
      '4. Aguarde análise (5-10 dias úteis)'
    ],
    requirements: ['CNPJ ativo', 'Integração funcionando'],
    benefits: ['Comissão por cliente indicado', 'Material de marketing', 'Suporte dedicado']
  },
  {
    id: 'stripe',
    name: 'Stripe',
    logo: '💜',
    category: 'payments',
    hasAffiliate: true,
    commission: 'Até 0.25% das transações (recorrente)',
    commissionType: 'recurring',
    signupUrl: 'https://stripe.com/br',
    partnerUrl: 'https://stripe.com/partners',
    description: 'Gateway internacional, ótimo para SaaS e recorrência.',
    howToApply: [
      '1. Acesse stripe.com/partners',
      '2. Escolha "Technology Partner"',
      '3. Preencha o formulário de aplicação',
      '4. Aguarde contato da equipe Stripe'
    ],
    requirements: ['Plataforma com múltiplos clientes', 'Integração via API'],
    benefits: ['Revenue share recorrente', 'Suporte técnico prioritário', 'Co-marketing']
  },
  // MAQUININHAS
  {
    id: 'stone',
    name: 'Stone',
    logo: '💚',
    category: 'machines',
    hasAffiliate: true,
    commission: 'R$50 - R$200 por maquininha vendida',
    commissionType: 'fixed',
    signupUrl: 'https://www.stone.com.br/',
    partnerUrl: 'https://www.stone.com.br/parceiros/',
    description: 'Maquininhas com melhor suporte do mercado.',
    howToApply: [
      '1. Acesse stone.com.br/parceiros',
      '2. Clique em "Quero ser parceiro"',
      '3. Preencha o formulário',
      '4. Aguarde contato do time comercial'
    ],
    requirements: ['CNPJ ativo', 'Capacidade de indicar clientes'],
    benefits: ['Comissão por maquininha', 'Dashboard de vendas', 'Material promocional']
  },
  {
    id: 'cielo',
    name: 'Cielo',
    logo: '💙',
    category: 'machines',
    hasAffiliate: true,
    commission: 'Comissão por indicação',
    commissionType: 'fixed',
    signupUrl: 'https://www.cielo.com.br/',
    partnerUrl: 'https://www.cielo.com.br/parceiros/',
    description: 'Maior adquirente do Brasil.',
    howToApply: [
      '1. Acesse cielo.com.br/parceiros',
      '2. Preencha o formulário de interesse',
      '3. Aguarde contato comercial'
    ],
    requirements: ['CNPJ ativo'],
    benefits: ['Comissão por indicação', 'Suporte dedicado']
  },
  // ERP
  {
    id: 'bling',
    name: 'Bling',
    logo: '📦',
    category: 'erp',
    hasAffiliate: true,
    commission: '20% recorrente (enquanto cliente pagar)',
    commissionType: 'recurring',
    signupUrl: 'https://www.bling.com.br/',
    partnerUrl: 'https://www.bling.com.br/parceiros',
    description: 'ERP mais popular para e-commerce e pequenas empresas.',
    howToApply: [
      '1. Acesse bling.com.br/parceiros',
      '2. Clique em "Programa de Afiliados"',
      '3. Cadastre-se na plataforma de afiliados',
      '4. Receba seu link personalizado'
    ],
    requirements: ['Cadastro simples, sem requisitos'],
    benefits: ['20% de comissão recorrente', 'Link de afiliado', 'Material de divulgação', 'Dashboard de ganhos']
  },
  {
    id: 'tiny',
    name: 'Tiny ERP',
    logo: '📊',
    category: 'erp',
    hasAffiliate: true,
    commission: '20% recorrente',
    commissionType: 'recurring',
    signupUrl: 'https://www.tiny.com.br/',
    partnerUrl: 'https://www.tiny.com.br/parceiros',
    description: 'ERP focado em pequenas empresas.',
    howToApply: [
      '1. Acesse tiny.com.br/parceiros',
      '2. Escolha "Afiliado" ou "Integrador"',
      '3. Preencha o cadastro',
      '4. Receba seu link de afiliado'
    ],
    requirements: ['Cadastro simples'],
    benefits: ['20% recorrente', 'Suporte para integradores']
  },
  {
    id: 'omie',
    name: 'Omie',
    logo: '🏢',
    category: 'erp',
    hasAffiliate: true,
    commission: '20% recorrente + bônus',
    commissionType: 'recurring',
    signupUrl: 'https://www.omie.com.br/',
    partnerUrl: 'https://www.omie.com.br/parceiros/',
    description: 'ERP robusto para empresas em crescimento.',
    howToApply: [
      '1. Acesse omie.com.br/parceiros',
      '2. Escolha o tipo de parceria',
      '3. Preencha o formulário',
      '4. Aguarde aprovação'
    ],
    requirements: ['Análise de perfil'],
    benefits: ['20%+ recorrente', 'Treinamento', 'Leads qualificados']
  },
  {
    id: 'contaazul',
    name: 'ContaAzul',
    logo: '💙',
    category: 'erp',
    hasAffiliate: true,
    commission: 'Comissão recorrente',
    commissionType: 'recurring',
    signupUrl: 'https://contaazul.com/',
    partnerUrl: 'https://contaazul.com/parceiros/',
    description: 'Gestão financeira para PMEs.',
    howToApply: [
      '1. Acesse contaazul.com/parceiros',
      '2. Escolha seu perfil (Contador, Integrador, etc)',
      '3. Faça o cadastro'
    ],
    requirements: ['Variam por tipo de parceria'],
    benefits: ['Comissão recorrente', 'Certificação']
  },
  // CRM
  {
    id: 'rdstation',
    name: 'RD Station',
    logo: '🚀',
    category: 'crm',
    hasAffiliate: true,
    commission: '20% recorrente',
    commissionType: 'recurring',
    signupUrl: 'https://www.rdstation.com/',
    partnerUrl: 'https://www.rdstation.com/parceiros/',
    description: 'Maior plataforma de marketing digital do Brasil.',
    howToApply: [
      '1. Acesse rdstation.com/parceiros',
      '2. Escolha "Agência" ou "Indicador"',
      '3. Preencha o formulário',
      '4. Faça a certificação (se aplicável)'
    ],
    requirements: ['Conhecimento em marketing digital'],
    benefits: ['20% recorrente', 'Leads', 'Certificação', 'Suporte']
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    logo: '🧡',
    category: 'crm',
    hasAffiliate: true,
    commission: 'Até 20% recorrente por 1 ano',
    commissionType: 'recurring',
    signupUrl: 'https://www.hubspot.com/',
    partnerUrl: 'https://www.hubspot.com/partners',
    description: 'CRM completo de classe mundial.',
    howToApply: [
      '1. Acesse hubspot.com/partners',
      '2. Escolha "Solutions Partner" ou "Affiliate"',
      '3. Complete o treinamento obrigatório',
      '4. Passe na certificação'
    ],
    requirements: ['Certificações HubSpot', 'Casos de sucesso'],
    benefits: ['Até 20% recorrente', 'Treinamento gratuito', 'Leads', 'Co-marketing']
  },
  // COMUNICAÇÃO
  {
    id: 'twilio',
    name: 'Twilio (SMS)',
    logo: '📱',
    category: 'communication',
    hasAffiliate: true,
    commission: '% do consumo do cliente',
    commissionType: 'recurring',
    signupUrl: 'https://www.twilio.com/',
    partnerUrl: 'https://www.twilio.com/partners',
    description: 'API de SMS, WhatsApp e voz.',
    howToApply: [
      '1. Acesse twilio.com/partners',
      '2. Escolha "Build Partner" ou "Consulting Partner"',
      '3. Preencha a aplicação',
      '4. Aguarde aprovação'
    ],
    requirements: ['Integração funcionando', 'Volume de uso'],
    benefits: ['Revenue share', 'Créditos grátis', 'Suporte técnico']
  },
  {
    id: 'sendgrid',
    name: 'SendGrid (Email)',
    logo: '📧',
    category: 'communication',
    hasAffiliate: true,
    commission: '% do valor pago pelo cliente',
    commissionType: 'recurring',
    signupUrl: 'https://sendgrid.com/',
    partnerUrl: 'https://sendgrid.com/partners/',
    description: 'Envio de emails transacionais.',
    howToApply: [
      '1. Acesse sendgrid.com/partners',
      '2. Preencha o formulário de parceria',
      '3. Aguarde análise'
    ],
    requirements: ['Volume de envios'],
    benefits: ['Revenue share', 'Suporte prioritário']
  }
]

const CATEGORY_LABELS = {
  payments: { name: '💳 Pagamentos', icon: CreditCard },
  machines: { name: '🔌 Maquininhas', icon: Smartphone },
  delivery: { name: '🚚 Delivery', icon: Truck },
  erp: { name: '🏢 ERP & Financeiro', icon: Building2 },
  crm: { name: '👥 CRM', icon: Users },
  analytics: { name: '📊 Analytics', icon: BarChart3 },
  communication: { name: '💬 Comunicação', icon: MessageSquare }
}

export default function PartnersPage() {
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [affiliateLinks, setAffiliateLinks] = useState<Record<string, string>>({})

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedLink(id)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const categories = Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg shadow-emerald-500/25">
            <Handshake className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Programas de Parceiros & Afiliados</h1>
            <p className="text-slate-500">Ganhe dinheiro indicando essas plataformas para seus lojistas</p>
          </div>
        </div>

        {/* Resumo de Ganhos Potenciais */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-6 h-6" />
            <h2 className="text-xl font-bold">Potencial de Ganhos</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-2xl font-bold">20%</p>
              <p className="text-sm opacity-90">Comissão ERP (recorrente)</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-2xl font-bold">0.3%</p>
              <p className="text-sm opacity-90">Por transação (pagamentos)</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-2xl font-bold">R$200</p>
              <p className="text-sm opacity-90">Por maquininha vendida</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-2xl font-bold">∞</p>
              <p className="text-sm opacity-90">Renda passiva mensal</p>
            </div>
          </div>
        </div>

        {/* Lista por Categoria */}
        {categories.map(category => {
          const categoryPartners = PARTNERS.filter(p => p.category === category)
          if (categoryPartners.length === 0) return null
          const CategoryIcon = CATEGORY_LABELS[category].icon

          return (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <CategoryIcon className="w-5 h-5 text-slate-600" />
                <h2 className="text-xl font-bold text-slate-800">{CATEGORY_LABELS[category].name}</h2>
              </div>

              <div className="space-y-3">
                {categoryPartners.map(partner => (
                  <div key={partner.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    {/* Header do Partner */}
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                      onClick={() => setExpandedPartner(expandedPartner === partner.id ? null : partner.id)}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{partner.logo}</span>
                        <div>
                          <h3 className="font-bold text-slate-800">{partner.name}</h3>
                          <p className="text-sm text-slate-500">{partner.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-emerald-600">{partner.commission}</p>
                          <p className="text-xs text-slate-400">
                            {partner.commissionType === 'recurring' ? '💰 Recorrente' : 
                             partner.commissionType === 'percentage' ? '📊 Por transação' : '💵 Por indicação'}
                          </p>
                        </div>
                        {expandedPartner === partner.id ? 
                          <ChevronUp className="w-5 h-5 text-slate-400" /> : 
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        }
                      </div>
                    </div>

                    {/* Detalhes Expandidos */}
                    {expandedPartner === partner.id && (
                      <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-4">
                        {/* Como se Cadastrar */}
                        <div>
                          <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" />
                            Como se Cadastrar
                          </h4>
                          <ol className="space-y-1 text-sm text-slate-600">
                            {partner.howToApply.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>

                        {/* Requisitos */}
                        <div>
                          <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            Requisitos
                          </h4>
                          <ul className="space-y-1 text-sm text-slate-600">
                            {partner.requirements.map((req, i) => (
                              <li key={i}>• {req}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Benefícios */}
                        <div>
                          <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <Gift className="w-4 h-4 text-emerald-500" />
                            Benefícios
                          </h4>
                          <ul className="space-y-1 text-sm text-slate-600">
                            {partner.benefits.map((benefit, i) => (
                              <li key={i}>✓ {benefit}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Campo para Link de Afiliado */}
                        <div className="bg-white rounded-lg p-4 border border-slate-200">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Seu Link de Afiliado (cole aqui após se cadastrar)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={affiliateLinks[partner.id] || ''}
                              onChange={(e) => setAffiliateLinks(prev => ({ ...prev, [partner.id]: e.target.value }))}
                              placeholder="https://..."
                              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            />
                            {affiliateLinks[partner.id] && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(affiliateLinks[partner.id], partner.id)}
                              >
                                {copiedLink === partner.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => window.open(partner.signupUrl, '_blank')}
                          >
                            <Globe className="w-4 h-4 mr-2" />
                            Site Oficial
                          </Button>
                          <Button
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => window.open(partner.partnerUrl, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Programa de Parceiros
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Dicas */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-bold text-amber-800 mb-3">💡 Dicas para Maximizar Ganhos</h3>
          <ul className="space-y-2 text-sm text-amber-700">
            <li>• <strong>ERP (Bling, Tiny, Omie):</strong> Maior potencial! 20% recorrente = cliente pagando R$100/mês = R$20/mês pra você, pra sempre</li>
            <li>• <strong>Pagamentos:</strong> Volume é rei. 100 lojistas × R$10k/mês × 0.2% = R$2.000/mês</li>
            <li>• <strong>Maquininhas:</strong> Bom para começar. R$100-200 por venda é dinheiro rápido</li>
            <li>• <strong>Documente tudo:</strong> Crie tutoriais mostrando como configurar cada integração (com seu link de afiliado)</li>
            <li>• <strong>Automatize:</strong> Quando lojista clicar em "Contratar Bling", abra seu link de afiliado</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

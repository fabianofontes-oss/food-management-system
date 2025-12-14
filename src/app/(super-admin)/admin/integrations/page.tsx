'use client'

import { useState, useEffect } from 'react'
import { 
  Link2, Settings, Check, X, ExternalLink, Copy, Eye, EyeOff,
  AlertCircle, CheckCircle, Info, ChevronDown, ChevronUp,
  MessageSquare, CreditCard, Printer, Star, Truck
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface IntegrationConfig {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  status: 'configured' | 'pending' | 'not_configured'
  envKeys: { key: string; label: string; secret?: boolean; value?: string }[]
  instructions: string[]
  docUrl?: string
}

const INTEGRATIONS: IntegrationConfig[] = [
  {
    id: 'google',
    name: 'Google Meu Negócio',
    description: 'Importar avaliações do Google automaticamente',
    icon: <Star className="w-6 h-6" />,
    color: 'bg-blue-500',
    status: 'not_configured',
    envKeys: [
      { key: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID', label: 'Client ID', secret: false },
      { key: 'GOOGLE_CLIENT_SECRET', label: 'Client Secret', secret: true }
    ],
    instructions: [
      'Acesse o Google Cloud Console (console.cloud.google.com)',
      'Crie um novo projeto ou selecione um existente',
      'Vá em "APIs e Serviços" > "Biblioteca"',
      'Busque e ative "Google My Business API"',
      'Vá em "Credenciais" > "Criar credenciais" > "ID do cliente OAuth"',
      'Selecione "Aplicativo da Web"',
      'Adicione a URL de redirecionamento: {APP_URL}/api/integrations/google/callback',
      'Copie o Client ID e Client Secret',
      'Cole nos campos abaixo e salve'
    ],
    docUrl: 'https://developers.google.com/my-business/content/basic-setup'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business API',
    description: 'Enviar notificações e receber pedidos via WhatsApp',
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'bg-green-500',
    status: 'not_configured',
    envKeys: [
      { key: 'WHATSAPP_PHONE_ID', label: 'Phone Number ID', secret: false },
      { key: 'WHATSAPP_ACCESS_TOKEN', label: 'Access Token', secret: true },
      { key: 'WHATSAPP_VERIFY_TOKEN', label: 'Verify Token (webhook)', secret: true }
    ],
    instructions: [
      'Acesse o Meta for Developers (developers.facebook.com)',
      'Crie um App do tipo "Business"',
      'Adicione o produto "WhatsApp"',
      'Configure um número de telefone de teste ou produção',
      'Gere um Access Token permanente',
      'Copie o Phone Number ID e Access Token',
      'Configure o Webhook com a URL: {APP_URL}/api/webhooks/whatsapp',
      'Use o Verify Token que você definir abaixo'
    ],
    docUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started'
  },
  {
    id: 'pix',
    name: 'PIX / Pagamentos',
    description: 'Receber pagamentos via PIX automaticamente',
    icon: <CreditCard className="w-6 h-6" />,
    color: 'bg-emerald-500',
    status: 'not_configured',
    envKeys: [
      { key: 'PIX_PROVIDER', label: 'Provedor (efi, mercadopago, asaas)', secret: false },
      { key: 'PIX_CLIENT_ID', label: 'Client ID', secret: false },
      { key: 'PIX_CLIENT_SECRET', label: 'Client Secret', secret: true },
      { key: 'PIX_CERTIFICATE', label: 'Certificado (base64)', secret: true },
      { key: 'PIX_WEBHOOK_SECRET', label: 'Webhook Secret', secret: true }
    ],
    instructions: [
      'Escolha um provedor de pagamentos (EFI, Mercado Pago, Asaas)',
      'Crie uma conta comercial no provedor escolhido',
      'Gere as credenciais de API (Client ID e Secret)',
      'Para EFI/Gerencianet: baixe o certificado .p12 e converta para base64',
      'Configure o webhook no painel do provedor: {APP_URL}/api/webhooks/pix',
      'Cole as credenciais nos campos abaixo'
    ],
    docUrl: 'https://dev.efipay.com.br/docs/api-pix'
  },
  {
    id: 'printer',
    name: 'Impressora Térmica',
    description: 'Imprimir comandas automaticamente',
    icon: <Printer className="w-6 h-6" />,
    color: 'bg-slate-600',
    status: 'not_configured',
    envKeys: [
      { key: 'PRINTER_TYPE', label: 'Tipo (escpos, star, epson)', secret: false },
      { key: 'PRINTER_CONNECTION', label: 'Conexão (usb, network, bluetooth)', secret: false },
      { key: 'PRINTER_ADDRESS', label: 'IP ou Porta (ex: 192.168.1.100:9100)', secret: false }
    ],
    instructions: [
      'Conecte a impressora térmica na rede ou USB',
      'Identifique o IP da impressora (para rede) ou porta USB',
      'Selecione o tipo de impressora compatível',
      'Configure a conexão e endereço',
      'Teste a impressão na página de configurações da loja'
    ]
  },
  {
    id: 'delivery',
    name: 'Rastreio de Entrega',
    description: 'Rastreamento em tempo real dos entregadores',
    icon: <Truck className="w-6 h-6" />,
    color: 'bg-orange-500',
    status: 'not_configured',
    envKeys: [
      { key: 'NEXT_PUBLIC_GOOGLE_MAPS_KEY', label: 'Google Maps API Key', secret: false }
    ],
    instructions: [
      'Acesse o Google Cloud Console',
      'Ative as APIs: Maps JavaScript, Directions, Geocoding',
      'Crie uma chave de API com restrição de domínio',
      'Cole a chave no campo abaixo'
    ],
    docUrl: 'https://developers.google.com/maps/documentation/javascript/get-api-key'
  }
]

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({})
  const [saving, setSaving] = useState(false)
  const [appUrl, setAppUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.origin)
    }
    
    // Carregar valores salvos do localStorage (em produção, viria de API segura)
    const saved = localStorage.getItem('admin_integrations')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setFormData(parsed)
        
        // Atualizar status baseado nos valores salvos
        setIntegrations(prev => prev.map(int => {
          const savedValues = parsed[int.id] || {}
          const allFilled = int.envKeys.every(k => savedValues[k.key])
          return {
            ...int,
            status: allFilled ? 'configured' : Object.keys(savedValues).length > 0 ? 'pending' : 'not_configured'
          }
        }))
      } catch {}
    }
  }, [])

  const handleSave = async (integrationId: string) => {
    setSaving(true)
    
    // Salvar no localStorage (em produção, enviaria para API segura)
    const newFormData = { ...formData }
    localStorage.setItem('admin_integrations', JSON.stringify(newFormData))
    
    // Atualizar status
    const integration = integrations.find(i => i.id === integrationId)
    if (integration) {
      const savedValues = formData[integrationId] || {}
      const allFilled = integration.envKeys.every(k => savedValues[k.key])
      
      setIntegrations(prev => prev.map(int => 
        int.id === integrationId 
          ? { ...int, status: allFilled ? 'configured' : 'pending' }
          : int
      ))
    }
    
    setTimeout(() => {
      setSaving(false)
      alert('Configurações salvas! Lembre-se de adicionar as variáveis de ambiente no servidor (Vercel).')
    }, 500)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copiado!')
  }

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const updateFormValue = (integrationId: string, key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [integrationId]: {
        ...(prev[integrationId] || {}),
        [key]: value
      }
    }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'configured':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Configurado</span>
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Incompleto</span>
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full flex items-center gap-1"><X className="w-3 h-3" /> Não configurado</span>
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
            <Link2 className="w-7 h-7 text-white" />
          </div>
          Integrações
        </h1>
        <p className="text-slate-500 mt-2">Configure as APIs e serviços externos do sistema</p>
      </div>

      {/* Aviso importante */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Importante sobre variáveis de ambiente</p>
            <p className="text-sm text-amber-700 mt-1">
              As configurações aqui são salvas localmente para referência. 
              Para o sistema funcionar em produção, você precisa adicionar as mesmas variáveis 
              no painel da <strong>Vercel</strong> (Settings → Environment Variables).
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Integrações */}
      <div className="space-y-4">
        {integrations.map(integration => (
          <div 
            key={integration.id}
            className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden"
          >
            {/* Header da integração */}
            <button
              onClick={() => setExpandedId(expandedId === integration.id ? null : integration.id)}
              className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 ${integration.color} rounded-xl text-white`}>
                  {integration.icon}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-800">{integration.name}</p>
                  <p className="text-sm text-slate-500">{integration.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(integration.status)}
                {expandedId === integration.id ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>

            {/* Conteúdo expandido */}
            {expandedId === integration.id && (
              <div className="border-t border-slate-100 p-5 bg-slate-50">
                {/* Instruções */}
                <div className="bg-white rounded-xl p-4 mb-5">
                  <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    Como configurar
                  </h3>
                  <ol className="space-y-2">
                    {integration.instructions.map((step, i) => (
                      <li key={i} className="text-sm text-slate-600 flex gap-2">
                        <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {i + 1}
                        </span>
                        <span>{step.replace('{APP_URL}', appUrl || 'https://seu-dominio.com')}</span>
                      </li>
                    ))}
                  </ol>
                  {integration.docUrl && (
                    <a 
                      href={integration.docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-3"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver documentação oficial
                    </a>
                  )}
                </div>

                {/* Campos de configuração */}
                <div className="space-y-4">
                  {integration.envKeys.map(envKey => (
                    <div key={envKey.key}>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {envKey.label}
                        <code className="ml-2 text-xs bg-slate-100 px-2 py-0.5 rounded">
                          {envKey.key}
                        </code>
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={envKey.secret && !showSecrets[envKey.key] ? 'password' : 'text'}
                            value={formData[integration.id]?.[envKey.key] || ''}
                            onChange={e => updateFormValue(integration.id, envKey.key, e.target.value)}
                            placeholder={`Digite ${envKey.label.toLowerCase()}`}
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none pr-20"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                            {envKey.secret && (
                              <button
                                type="button"
                                onClick={() => toggleSecret(envKey.key)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg"
                              >
                                {showSecrets[envKey.key] ? (
                                  <EyeOff className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <Eye className="w-4 h-4 text-slate-400" />
                                )}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => copyToClipboard(envKey.key)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg"
                              title="Copiar nome da variável"
                            >
                              <Copy className="w-4 h-4 text-slate-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Botão Salvar */}
                <div className="flex justify-end mt-5">
                  <Button
                    onClick={() => handleSave(integration.id)}
                    disabled={saving}
                    className="bg-gradient-to-r from-violet-500 to-purple-600"
                  >
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Resumo para Vercel */}
      <div className="mt-8 bg-slate-800 rounded-2xl p-6 text-white">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Variáveis para adicionar na Vercel
        </h3>
        <p className="text-sm text-slate-300 mb-4">
          Copie as variáveis configuradas e adicione em: Vercel → Settings → Environment Variables
        </p>
        <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm overflow-x-auto">
          {integrations.map(int => 
            int.envKeys.map(key => {
              const value = formData[int.id]?.[key.key]
              if (!value) return null
              return (
                <div key={key.key} className="text-green-400">
                  {key.key}={key.secret ? '***' : value}
                </div>
              )
            })
          )}
          {Object.keys(formData).length === 0 && (
            <p className="text-slate-500">Nenhuma variável configurada ainda</p>
          )}
        </div>
      </div>
    </div>
  )
}

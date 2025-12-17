'use client'

import { Info } from 'lucide-react'
import { ModuleCard } from '../ModuleCard'
import { ConfigField } from '../ConfigField'

interface IntegrationsData {
  ifood_enabled: boolean
  ifood_merchant_id: string
  ifood_client_id: string
  ifood_client_secret: string
  rappi_enabled: boolean
  rappi_store_id: string
  rappi_api_key: string
  google_reviews_enabled: boolean
  loggi_enabled: boolean
  loggi_api_key: string
  loggi_auto_dispatch: boolean
}

interface IntegrationsTabContentProps {
  integrations: IntegrationsData
  setIntegrations: (fn: (i: IntegrationsData) => IntegrationsData) => void
}

export function IntegrationsTabContent({ integrations, setIntegrations }: IntegrationsTabContentProps) {
  return (
    <div className="space-y-3">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-4">
        <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Sobre APIs:</strong> Algumas plataformas têm APIs restritas a parceiros. 
          Entre em contato com cada plataforma para obter suas credenciais.
        </p>
      </div>

      <ModuleCard
        icon={<span className="text-2xl">🍔</span>}
        title="iFood"
        description="Receba pedidos do iFood"
        enabled={integrations.ifood_enabled}
        onToggle={() => setIntegrations(i => ({ ...i, ifood_enabled: !i.ifood_enabled }))}
        color="red"
      >
        <ConfigField label="Merchant ID" value={integrations.ifood_merchant_id} onChange={v => setIntegrations(i => ({ ...i, ifood_merchant_id: v }))} placeholder="Seu Merchant ID" />
        <ConfigField label="Client ID" value={integrations.ifood_client_id} onChange={v => setIntegrations(i => ({ ...i, ifood_client_id: v }))} placeholder="Client ID" />
        <ConfigField label="Client Secret" value={integrations.ifood_client_secret} onChange={v => setIntegrations(i => ({ ...i, ifood_client_secret: v }))} type="password" placeholder="••••••••" />
      </ModuleCard>

      <ModuleCard
        icon={<span className="text-2xl">🛵</span>}
        title="Rappi"
        description="Receba pedidos da Rappi"
        enabled={integrations.rappi_enabled}
        onToggle={() => setIntegrations(i => ({ ...i, rappi_enabled: !i.rappi_enabled }))}
        color="amber"
      >
        <ConfigField label="Store ID" value={integrations.rappi_store_id} onChange={v => setIntegrations(i => ({ ...i, rappi_store_id: v }))} placeholder="Seu Store ID" />
        <ConfigField label="API Key" value={integrations.rappi_api_key} onChange={v => setIntegrations(i => ({ ...i, rappi_api_key: v }))} type="password" placeholder="••••••••" />
      </ModuleCard>

      <ModuleCard
        icon={<span className="text-2xl">📦</span>}
        title="Loggi"
        description="Entregas via Loggi"
        enabled={integrations.loggi_enabled}
        onToggle={() => setIntegrations(i => ({ ...i, loggi_enabled: !i.loggi_enabled }))}
        color="blue"
      >
        <ConfigField label="API Key" value={integrations.loggi_api_key} onChange={v => setIntegrations(i => ({ ...i, loggi_api_key: v }))} type="password" placeholder="••••••••" />
        <label className="flex items-center gap-2 col-span-2">
          <input 
            type="checkbox" 
            checked={integrations.loggi_auto_dispatch}
            onChange={e => setIntegrations(i => ({ ...i, loggi_auto_dispatch: e.target.checked }))}
            className="rounded"
          />
          <span className="text-sm">Despacho automático</span>
        </label>
      </ModuleCard>

      <ModuleCard
        icon={<span className="text-2xl">🔍</span>}
        title="Google Reviews"
        description="Importe avaliações do Google"
        enabled={integrations.google_reviews_enabled}
        onToggle={() => setIntegrations(i => ({ ...i, google_reviews_enabled: !i.google_reviews_enabled }))}
        color="blue"
      >
        <p className="text-sm text-slate-600 col-span-3">
          Clique em &quot;Conectar&quot; na página de Avaliações para autorizar o Google.
        </p>
      </ModuleCard>
    </div>
  )
}

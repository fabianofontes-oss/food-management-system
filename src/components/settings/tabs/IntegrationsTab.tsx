'use client'

import { Info } from 'lucide-react'
import { ModuleCard } from '../ModuleCard'
import { ConfigField } from '../ConfigField'
import type { IntegrationSettings } from '@/types/settings'

interface IntegrationsTabProps {
  integrations: IntegrationSettings
  onChange: (integrations: Partial<IntegrationSettings>) => void
}

export function IntegrationsTab({ integrations, onChange }: IntegrationsTabProps) {
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
        enabled={integrations.ifood.enabled}
        onToggle={() => onChange({ ifood: { ...integrations.ifood, enabled: !integrations.ifood.enabled } })}
        color="red"
      >
        <ConfigField label="Merchant ID" value={integrations.ifood.merchantId} onChange={v => onChange({ ifood: { ...integrations.ifood, merchantId: v } })} placeholder="Seu Merchant ID" />
        <ConfigField label="Client ID" value={integrations.ifood.clientId} onChange={v => onChange({ ifood: { ...integrations.ifood, clientId: v } })} placeholder="Client ID" />
        <ConfigField label="Client Secret" value={integrations.ifood.clientSecret} onChange={v => onChange({ ifood: { ...integrations.ifood, clientSecret: v } })} type="password" placeholder="••••••••" />
      </ModuleCard>

      <ModuleCard
        icon={<span className="text-2xl">🛵</span>}
        title="Rappi"
        description="Receba pedidos da Rappi"
        enabled={integrations.rappi.enabled}
        onToggle={() => onChange({ rappi: { ...integrations.rappi, enabled: !integrations.rappi.enabled } })}
        color="amber"
      >
        <ConfigField label="Store ID" value={integrations.rappi.storeId} onChange={v => onChange({ rappi: { ...integrations.rappi, storeId: v } })} placeholder="Seu Store ID" />
        <ConfigField label="API Key" value={integrations.rappi.apiKey} onChange={v => onChange({ rappi: { ...integrations.rappi, apiKey: v } })} type="password" placeholder="••••••••" />
      </ModuleCard>

      <ModuleCard
        icon={<span className="text-2xl">📦</span>}
        title="Loggi"
        description="Entregas via Loggi"
        enabled={integrations.loggi.enabled}
        onToggle={() => onChange({ loggi: { ...integrations.loggi, enabled: !integrations.loggi.enabled } })}
        color="blue"
      >
        <ConfigField label="API Key" value={integrations.loggi.apiKey} onChange={v => onChange({ loggi: { ...integrations.loggi, apiKey: v } })} type="password" placeholder="••••••••" />
        <label className="flex items-center gap-2 col-span-2">
          <input 
            type="checkbox" 
            checked={integrations.loggi.autoDispatch}
            onChange={e => onChange({ loggi: { ...integrations.loggi, autoDispatch: e.target.checked } })}
            className="rounded"
          />
          <span className="text-sm">Despacho automático</span>
        </label>
      </ModuleCard>

      <ModuleCard
        icon={<span className="text-2xl">🔍</span>}
        title="Google Reviews"
        description="Importe avaliações do Google"
        enabled={integrations.googleReviews.enabled}
        onToggle={() => onChange({ googleReviews: { ...integrations.googleReviews, enabled: !integrations.googleReviews.enabled } })}
        color="blue"
      >
        <p className="text-sm text-slate-600 col-span-3">
          Clique em &quot;Conectar&quot; na página de Avaliações para autorizar o Google.
        </p>
      </ModuleCard>
    </div>
  )
}

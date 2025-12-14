'use client'

import { Smartphone, Mail, Volume2 } from 'lucide-react'
import { ModuleCard } from '../ModuleCard'
import { ConfigField } from '../ConfigField'
import type { NotificationSettings } from '@/types/settings'

interface NotificationsTabProps {
  notifications: NotificationSettings
  onChange: (notifications: Partial<NotificationSettings>) => void
}

export function NotificationsTab({ notifications, onChange }: NotificationsTabProps) {
  return (
    <div className="space-y-3">
      <ModuleCard
        icon={<Smartphone className="w-5 h-5" />}
        title="WhatsApp"
        description="Notificações via WhatsApp"
        enabled={notifications.whatsapp.enabled}
        onToggle={() => onChange({ whatsapp: { ...notifications.whatsapp, enabled: !notifications.whatsapp.enabled } })}
        color="green"
      >
        <ConfigField label="Número WhatsApp" value={notifications.whatsapp.number} onChange={v => onChange({ whatsapp: { ...notifications.whatsapp, number: v } })} placeholder="5511999999999" />
        <div className="col-span-2 flex gap-4">
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={notifications.whatsapp.notifyOrder}
              onChange={e => onChange({ whatsapp: { ...notifications.whatsapp, notifyOrder: e.target.checked } })}
              className="rounded"
            />
            <span className="text-sm">Notificar novos pedidos</span>
          </label>
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={notifications.whatsapp.notifyCustomer}
              onChange={e => onChange({ whatsapp: { ...notifications.whatsapp, notifyCustomer: e.target.checked } })}
              className="rounded"
            />
            <span className="text-sm">Notificar cliente</span>
          </label>
        </div>
      </ModuleCard>

      <ModuleCard
        icon={<Mail className="w-5 h-5" />}
        title="E-mail"
        description="Notificações por e-mail"
        enabled={notifications.email.enabled}
        onToggle={() => onChange({ email: { ...notifications.email, enabled: !notifications.email.enabled } })}
        color="blue"
      >
        <label className="flex items-center gap-2 col-span-2">
          <input 
            type="checkbox" 
            checked={notifications.email.confirmation}
            onChange={e => onChange({ email: { ...notifications.email, confirmation: e.target.checked } })}
            className="rounded"
          />
          <span className="text-sm">Enviar confirmação de pedido</span>
        </label>
      </ModuleCard>

      <ModuleCard
        icon={<Volume2 className="w-5 h-5" />}
        title="Alertas Sonoros"
        description="Sons de notificação"
        enabled={notifications.sounds.enabled}
        onToggle={() => onChange({ sounds: { ...notifications.sounds, enabled: !notifications.sounds.enabled } })}
        color="amber"
      >
        <ConfigField 
          label="Volume" 
          value={notifications.sounds.volume} 
          onChange={v => onChange({ sounds: { ...notifications.sounds, volume: v } })} 
          type="select"
          options={[
            { value: 'low', label: 'Baixo' },
            { value: 'medium', label: 'Médio' },
            { value: 'high', label: 'Alto' }
          ]}
        />
      </ModuleCard>
    </div>
  )
}

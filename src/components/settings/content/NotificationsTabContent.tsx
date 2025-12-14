'use client'

import { Smartphone, Mail, Volume2 } from 'lucide-react'
import { ModuleCard } from '../ModuleCard'
import { ConfigField } from '../ConfigField'

interface NotificationsData {
  whatsapp_enabled: boolean
  whatsapp_number: string
  whatsapp_notify_order: boolean
  whatsapp_notify_customer: boolean
  email_enabled: boolean
  email_confirmation: boolean
  sounds_enabled: boolean
  sound_new_order: boolean
  sound_volume: string
}

interface NotificationsTabContentProps {
  notifications: NotificationsData
  setNotifications: (fn: (n: NotificationsData) => NotificationsData) => void
}

export function NotificationsTabContent({ notifications, setNotifications }: NotificationsTabContentProps) {
  return (
    <div className="space-y-3">
      <ModuleCard
        icon={<Smartphone className="w-5 h-5" />}
        title="WhatsApp"
        description="Notificações via WhatsApp"
        enabled={notifications.whatsapp_enabled}
        onToggle={() => setNotifications(n => ({ ...n, whatsapp_enabled: !n.whatsapp_enabled }))}
        color="green"
      >
        <ConfigField label="Número WhatsApp" value={notifications.whatsapp_number} onChange={v => setNotifications(n => ({ ...n, whatsapp_number: v }))} placeholder="5511999999999" />
        <div className="col-span-2 flex gap-4">
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={notifications.whatsapp_notify_order}
              onChange={e => setNotifications(n => ({ ...n, whatsapp_notify_order: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm">Notificar novos pedidos</span>
          </label>
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={notifications.whatsapp_notify_customer}
              onChange={e => setNotifications(n => ({ ...n, whatsapp_notify_customer: e.target.checked }))}
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
        enabled={notifications.email_enabled}
        onToggle={() => setNotifications(n => ({ ...n, email_enabled: !n.email_enabled }))}
        color="blue"
      >
        <label className="flex items-center gap-2 col-span-2">
          <input 
            type="checkbox" 
            checked={notifications.email_confirmation}
            onChange={e => setNotifications(n => ({ ...n, email_confirmation: e.target.checked }))}
            className="rounded"
          />
          <span className="text-sm">Enviar confirmação de pedido</span>
        </label>
      </ModuleCard>

      <ModuleCard
        icon={<Volume2 className="w-5 h-5" />}
        title="Alertas Sonoros"
        description="Sons de notificação"
        enabled={notifications.sounds_enabled}
        onToggle={() => setNotifications(n => ({ ...n, sounds_enabled: !n.sounds_enabled }))}
        color="amber"
      >
        <ConfigField 
          label="Volume" 
          value={notifications.sound_volume} 
          onChange={v => setNotifications(n => ({ ...n, sound_volume: v }))} 
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

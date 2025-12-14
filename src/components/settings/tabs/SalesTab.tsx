'use client'

import { Truck, Store, UtensilsCrossed, Calendar, Archive, ChefHat, Printer } from 'lucide-react'
import { ModuleCard } from '../ModuleCard'
import { ConfigField } from '../ConfigField'
import type { SalesSettings } from '@/types/settings'

interface SalesTabProps {
  sales: SalesSettings
  onChange: (sales: Partial<SalesSettings>) => void
}

export function SalesTab({ sales, onChange }: SalesTabProps) {
  return (
    <div className="space-y-3">
      <ModuleCard
        icon={<Truck className="w-5 h-5" />}
        title="Delivery"
        description="Entregas na casa do cliente"
        enabled={sales.delivery.enabled}
        onToggle={() => onChange({ delivery: { ...sales.delivery, enabled: !sales.delivery.enabled } })}
        color="emerald"
      >
        <ConfigField label="Raio de entrega" value={sales.delivery.radius} onChange={v => onChange({ delivery: { ...sales.delivery, radius: v } })} type="number" suffix="km" />
        <ConfigField label="Taxa de entrega" value={sales.delivery.fee} onChange={v => onChange({ delivery: { ...sales.delivery, fee: v } })} type="number" prefix="R$" />
        <ConfigField label="Pedido mínimo" value={sales.delivery.minOrder} onChange={v => onChange({ delivery: { ...sales.delivery, minOrder: v } })} type="number" prefix="R$" />
        <ConfigField label="Tempo estimado" value={sales.delivery.time} onChange={v => onChange({ delivery: { ...sales.delivery, time: v } })} type="number" suffix="min" />
        <ConfigField label="Frete grátis acima de" value={sales.delivery.freeAbove} onChange={v => onChange({ delivery: { ...sales.delivery, freeAbove: v } })} type="number" prefix="R$" />
      </ModuleCard>

      <ModuleCard
        icon={<Store className="w-5 h-5" />}
        title="Retirada na Loja"
        description="Cliente busca o pedido"
        enabled={sales.pickup.enabled}
        onToggle={() => onChange({ pickup: { ...sales.pickup, enabled: !sales.pickup.enabled } })}
        color="violet"
      >
        <ConfigField label="Tempo preparo" value={sales.pickup.time} onChange={v => onChange({ pickup: { ...sales.pickup, time: v } })} type="number" suffix="min" />
        <ConfigField label="Desconto retirada" value={sales.pickup.discount} onChange={v => onChange({ pickup: { ...sales.pickup, discount: v } })} type="number" suffix="%" />
      </ModuleCard>

      <ModuleCard
        icon={<UtensilsCrossed className="w-5 h-5" />}
        title="Mesas e Comandas"
        description="Atendimento no local"
        enabled={sales.tables.enabled}
        onToggle={() => onChange({ tables: { ...sales.tables, enabled: !sales.tables.enabled } })}
        color="amber"
      >
        <ConfigField label="Número de mesas" value={sales.tables.count} onChange={v => onChange({ tables: { ...sales.tables, count: v } })} type="number" />
        <ConfigField label="Taxa de serviço" value={sales.tables.serviceFee} onChange={v => onChange({ tables: { ...sales.tables, serviceFee: v } })} type="number" suffix="%" />
      </ModuleCard>

      <ModuleCard
        icon={<Calendar className="w-5 h-5" />}
        title="Agendamento"
        description="Pedidos para data futura"
        enabled={sales.scheduling.enabled}
        onToggle={() => onChange({ scheduling: { ...sales.scheduling, enabled: !sales.scheduling.enabled } })}
        color="blue"
      >
        <ConfigField label="Antecedência mínima" value={sales.scheduling.minHours} onChange={v => onChange({ scheduling: { ...sales.scheduling, minHours: v } })} type="number" suffix="horas" />
        <ConfigField label="Antecedência máxima" value={sales.scheduling.maxDays} onChange={v => onChange({ scheduling: { ...sales.scheduling, maxDays: v } })} type="number" suffix="dias" />
      </ModuleCard>

      <ModuleCard
        icon={<Archive className="w-5 h-5" />}
        title="Controle de Estoque"
        description="Gestão de insumos"
        enabled={sales.inventory.enabled}
        onToggle={() => onChange({ inventory: { ...sales.inventory, enabled: !sales.inventory.enabled } })}
        color="violet"
      >
        <ConfigField label="Alerta estoque baixo" value={sales.inventory.lowAlert} onChange={v => onChange({ inventory: { ...sales.inventory, lowAlert: v } })} type="number" suffix="unid" />
      </ModuleCard>

      <ModuleCard
        icon={<ChefHat className="w-5 h-5" />}
        title="Cozinha (KDS)"
        description="Painel de pedidos"
        enabled={sales.kitchen.enabled}
        onToggle={() => onChange({ kitchen: { ...sales.kitchen, enabled: !sales.kitchen.enabled } })}
        color="red"
      >
        <ConfigField label="Alerta de atraso" value={sales.kitchen.prepAlert} onChange={v => onChange({ kitchen: { ...sales.kitchen, prepAlert: v } })} type="number" suffix="min" />
      </ModuleCard>

      <ModuleCard
        icon={<Printer className="w-5 h-5" />}
        title="Impressão"
        description="Comandas automáticas"
        enabled={sales.printer.enabled}
        onToggle={() => onChange({ printer: { ...sales.printer, enabled: !sales.printer.enabled } })}
        color="violet"
      >
        <ConfigField 
          label="Tipo de impressora" 
          value={sales.printer.type} 
          onChange={v => onChange({ printer: { ...sales.printer, type: v } })} 
          type="select"
          options={[
            { value: 'thermal80', label: 'Térmica 80mm' },
            { value: 'thermal58', label: 'Térmica 58mm' },
            { value: 'a4', label: 'A4' }
          ]}
        />
      </ModuleCard>
    </div>
  )
}

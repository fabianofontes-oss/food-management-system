'use client'

import { Truck, Store, UtensilsCrossed, Calendar, Archive, ChefHat, Printer } from 'lucide-react'
import { ModuleCard } from '../ModuleCard'
import { ConfigField } from '../ConfigField'

interface SalesData {
  delivery_enabled: boolean
  delivery_radius: number
  delivery_fee: number
  delivery_min_order: number
  delivery_time: number
  delivery_free_above: number
  pickup_enabled: boolean
  pickup_time: number
  pickup_discount: number
  tables_enabled: boolean
  table_count: number
  service_fee: number
  scheduling_enabled: boolean
  scheduling_min_hours: number
  scheduling_max_days: number
  inventory_enabled: boolean
  inventory_low_alert: number
  kitchen_enabled: boolean
  kitchen_prep_alert: number
  printer_enabled: boolean
  printer_type: string
}

interface SalesTabContentProps {
  sales: SalesData
  setSales: (fn: (s: SalesData) => SalesData) => void
}

export function SalesTabContent({ sales, setSales }: SalesTabContentProps) {
  return (
    <div className="space-y-3">
      <ModuleCard
        icon={<Truck className="w-5 h-5" />}
        title="Delivery"
        description="Entregas na casa do cliente"
        enabled={sales.delivery_enabled}
        onToggle={() => setSales(s => ({ ...s, delivery_enabled: !s.delivery_enabled }))}
        color="emerald"
      >
        <ConfigField label="Raio de entrega" value={sales.delivery_radius} onChange={v => setSales(s => ({ ...s, delivery_radius: v }))} type="number" suffix="km" />
        <ConfigField label="Taxa de entrega" value={sales.delivery_fee} onChange={v => setSales(s => ({ ...s, delivery_fee: v }))} type="number" prefix="R$" />
        <ConfigField label="Pedido mínimo" value={sales.delivery_min_order} onChange={v => setSales(s => ({ ...s, delivery_min_order: v }))} type="number" prefix="R$" />
        <ConfigField label="Tempo estimado" value={sales.delivery_time} onChange={v => setSales(s => ({ ...s, delivery_time: v }))} type="number" suffix="min" />
        <ConfigField label="Frete grátis acima de" value={sales.delivery_free_above} onChange={v => setSales(s => ({ ...s, delivery_free_above: v }))} type="number" prefix="R$" />
      </ModuleCard>

      <ModuleCard
        icon={<Store className="w-5 h-5" />}
        title="Retirada na Loja"
        description="Cliente busca o pedido"
        enabled={sales.pickup_enabled}
        onToggle={() => setSales(s => ({ ...s, pickup_enabled: !s.pickup_enabled }))}
        color="violet"
      >
        <ConfigField label="Tempo preparo" value={sales.pickup_time} onChange={v => setSales(s => ({ ...s, pickup_time: v }))} type="number" suffix="min" />
        <ConfigField label="Desconto retirada" value={sales.pickup_discount} onChange={v => setSales(s => ({ ...s, pickup_discount: v }))} type="number" suffix="%" />
      </ModuleCard>

      <ModuleCard
        icon={<UtensilsCrossed className="w-5 h-5" />}
        title="Mesas e Comandas"
        description="Atendimento no local"
        enabled={sales.tables_enabled}
        onToggle={() => setSales(s => ({ ...s, tables_enabled: !s.tables_enabled }))}
        color="amber"
      >
        <ConfigField label="Número de mesas" value={sales.table_count} onChange={v => setSales(s => ({ ...s, table_count: v }))} type="number" />
        <ConfigField label="Taxa de serviço" value={sales.service_fee} onChange={v => setSales(s => ({ ...s, service_fee: v }))} type="number" suffix="%" />
      </ModuleCard>

      <ModuleCard
        icon={<Calendar className="w-5 h-5" />}
        title="Agendamento"
        description="Pedidos para data futura"
        enabled={sales.scheduling_enabled}
        onToggle={() => setSales(s => ({ ...s, scheduling_enabled: !s.scheduling_enabled }))}
        color="blue"
      >
        <ConfigField label="Antecedência mínima" value={sales.scheduling_min_hours} onChange={v => setSales(s => ({ ...s, scheduling_min_hours: v }))} type="number" suffix="horas" />
        <ConfigField label="Antecedência máxima" value={sales.scheduling_max_days} onChange={v => setSales(s => ({ ...s, scheduling_max_days: v }))} type="number" suffix="dias" />
      </ModuleCard>

      <ModuleCard
        icon={<Archive className="w-5 h-5" />}
        title="Controle de Estoque"
        description="Gestão de insumos"
        enabled={sales.inventory_enabled}
        onToggle={() => setSales(s => ({ ...s, inventory_enabled: !s.inventory_enabled }))}
        color="violet"
      >
        <ConfigField label="Alerta estoque baixo" value={sales.inventory_low_alert} onChange={v => setSales(s => ({ ...s, inventory_low_alert: v }))} type="number" suffix="unid" />
      </ModuleCard>

      <ModuleCard
        icon={<ChefHat className="w-5 h-5" />}
        title="Cozinha (KDS)"
        description="Painel de pedidos"
        enabled={sales.kitchen_enabled}
        onToggle={() => setSales(s => ({ ...s, kitchen_enabled: !s.kitchen_enabled }))}
        color="red"
      >
        <ConfigField label="Alerta de atraso" value={sales.kitchen_prep_alert} onChange={v => setSales(s => ({ ...s, kitchen_prep_alert: v }))} type="number" suffix="min" />
      </ModuleCard>

      <ModuleCard
        icon={<Printer className="w-5 h-5" />}
        title="Impressão"
        description="Comandas automáticas"
        enabled={sales.printer_enabled}
        onToggle={() => setSales(s => ({ ...s, printer_enabled: !s.printer_enabled }))}
        color="violet"
      >
        <ConfigField 
          label="Tipo de impressora" 
          value={sales.printer_type} 
          onChange={v => setSales(s => ({ ...s, printer_type: v }))} 
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

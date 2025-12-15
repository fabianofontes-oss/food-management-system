import { Store, ShoppingCart, ChefHat, Truck, Package } from 'lucide-react'
import { ToggleCard } from '@/components/settings/ToggleCard'
import type { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form'

interface FunctionalitiesSectionProps {
  watchedValues: any
  register: UseFormRegister<any>
  setValue: UseFormSetValue<any>
  errors: FieldErrors<any>
}

export function FunctionalitiesSection({ watchedValues, register, setValue, errors }: FunctionalitiesSectionProps) {
  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Store className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Funcionalidades Principais</h2>
      </div>
      <div className="space-y-3">
        <ToggleCard
          icon={ShoppingCart}
          iconColor="text-blue-600"
          title="PDV (Point of Sale)"
          description="Sistema de vendas no balcão"
          enabled={watchedValues.enablePOS}
          onToggle={(val) => setValue('enablePOS', val)}
        />
        <ToggleCard
          icon={ChefHat}
          iconColor="text-orange-600"
          title="Cozinha / KDS"
          description="Display de pedidos para a cozinha"
          enabled={watchedValues.enableKitchen}
          onToggle={(val) => setValue('enableKitchen', val)}
        />
        <ToggleCard
          icon={Truck}
          iconColor="text-purple-600"
          title="Delivery"
          description="Entregas em domicílio"
          enabled={watchedValues.delivery.enabled}
          onToggle={(val) => setValue('delivery.enabled', val)}
          showAccordion={true}
        >
          {(() => {
            const deliveryErrors = (errors as any)?.delivery
            return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taxa de Entrega (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('delivery.fee', { valueAsNumber: true })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                placeholder="5.00"
              />
              {deliveryErrors?.fee && (
                <p className="text-red-600 text-sm mt-1">{deliveryErrors.fee?.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raio de Entrega (km) *
              </label>
              <input
                type="number"
                {...register('delivery.minRadius', { valueAsNumber: true })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                placeholder="5"
              />
              {deliveryErrors?.minRadius && (
                <p className="text-red-600 text-sm mt-1">{deliveryErrors.minRadius?.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tempo Médio de Entrega (min) *
              </label>
              <input
                type="number"
                {...register('delivery.avgTime', { valueAsNumber: true })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                placeholder="30"
              />
              {deliveryErrors?.avgTime && (
                <p className="text-red-600 text-sm mt-1">{deliveryErrors.avgTime?.message}</p>
              )}
            </div>
          </div>
            )
          })()}
        </ToggleCard>
        <ToggleCard
          icon={Store}
          iconColor="text-green-600"
          title="Consumo no Local"
          description="Pedidos para consumir no estabelecimento"
          enabled={watchedValues.enableDineIn}
          onToggle={(val) => setValue('enableDineIn', val)}
        />
        <ToggleCard
          icon={Package}
          iconColor="text-indigo-600"
          title="Retirada"
          description="Pedidos para retirar no balcão"
          enabled={watchedValues.enableTakeout}
          onToggle={(val) => setValue('enableTakeout', val)}
        />
      </div>
    </section>
  )
}

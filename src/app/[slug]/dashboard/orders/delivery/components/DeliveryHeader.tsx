import { Truck, Bell } from 'lucide-react'

interface DeliveryHeaderProps {
  soundEnabled: boolean
  onToggleSound: () => void
}

export const DeliveryHeader = ({ soundEnabled, onToggleSound }: DeliveryHeaderProps) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
            <Truck className="w-8 h-8 md:w-10 md:h-10 text-purple-600" />
            Delivery
          </h1>
          <p className="text-gray-600 mt-1">Gestão de Entregas</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggleSound}
            className={`p-3 rounded-xl transition-colors ${
              soundEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
            }`}
            title={soundEnabled ? 'Som ativado' : 'Som desativado'}
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

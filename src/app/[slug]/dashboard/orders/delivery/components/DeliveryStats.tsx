import { Package, Truck, CheckCircle, Timer } from 'lucide-react'

interface DeliveryStatsProps {
  pendingCount: number
  inTransitCount: number
  deliveredToday: number
  avgDeliveryTime: number
}

export const DeliveryStats = ({ 
  pendingCount, 
  inTransitCount, 
  deliveredToday, 
  avgDeliveryTime 
}: DeliveryStatsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Package className="w-6 h-6" />
          <span className="text-sm font-medium opacity-90">Aguardando</span>
        </div>
        <div className="text-3xl font-bold">{pendingCount}</div>
      </div>
      
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Truck className="w-6 h-6" />
          <span className="text-sm font-medium opacity-90">Em Rota</span>
        </div>
        <div className="text-3xl font-bold">{inTransitCount}</div>
      </div>
      
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="w-6 h-6" />
          <span className="text-sm font-medium opacity-90">Entregues Hoje</span>
        </div>
        <div className="text-3xl font-bold">{deliveredToday}</div>
      </div>
      
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Timer className="w-6 h-6" />
          <span className="text-sm font-medium opacity-90">Tempo Médio</span>
        </div>
        <div className="text-3xl font-bold">{avgDeliveryTime || '--'} min</div>
      </div>
    </div>
  )
}

import Link from "next/link"
import { Store, ShoppingCart, ChefHat, Truck, BarChart3, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-block p-4 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl mb-6 shadow-lg">
            <Store className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-6">
            Food Management System
          </h1>
          <p className="text-2xl text-gray-700 max-w-3xl mx-auto font-medium">
            Sistema completo de gestão para negócios de alimentação. Multi-loja, multi-nicho.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          <ModuleCard
            icon={<Store className="w-12 h-12" />}
            title="Cardápio Digital"
            description="QR code por mesa, categorias personalizadas, modificadores flexíveis"
            href="/menu"
            color="bg-gradient-to-br from-green-500 to-green-600"
          />
          
          <ModuleCard
            icon={<ShoppingCart className="w-12 h-12" />}
            title="PDV (Point of Sale)"
            description="Interface rápida para pedidos, múltiplos métodos de pagamento, controle de caixa"
            href="/pos"
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          
          <ModuleCard
            icon={<ChefHat className="w-12 h-12" />}
            title="Cozinha/KDS"
            description="Display de pedidos em tempo real, workflow de preparação, estações separadas"
            href="/kitchen"
            color="bg-gradient-to-br from-orange-500 to-orange-600"
          />
          
          <ModuleCard
            icon={<Truck className="w-12 h-12" />}
            title="Delivery"
            description="Gestão de entregas, atribuição de entregadores, rastreamento em tempo real"
            href="/delivery"
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          
          <ModuleCard
            icon={<BarChart3 className="w-12 h-12" />}
            title="Dashboard Admin"
            description="Relatórios, analytics, gestão de estoque, configurações da loja"
            href="/admin"
            color="bg-gradient-to-br from-red-500 to-red-600"
          />
          
          <ModuleCard
            icon={<Users className="w-12 h-12" />}
            title="Multi-Tenant"
            description="Suporte para múltiplas lojas e redes, isolamento de dados, configurações por nicho"
            href="/stores"
            color="bg-indigo-500"
          />
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex flex-wrap gap-3 justify-center">
            <Badge text="Açaí" />
            <Badge text="Burger" />
            <Badge text="Hotdog" />
            <Badge text="Marmita" />
            <Badge text="Açougue" />
            <Badge text="Sorvete" />
            <Badge text="+ Outros" />
          </div>
          <p className="mt-4 text-gray-600">
            Arquitetura flexível para atender qualquer nicho de alimentação
          </p>
        </div>
      </div>
    </div>
  )
}

function ModuleCard({ 
  icon, 
  title, 
  description, 
  href, 
  color 
}: { 
  icon: React.ReactNode
  title: string
  description: string
  href: string
  color: string
}) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer h-full">
        <div className={`${color} text-white w-16 h-16 rounded-lg flex items-center justify-center mb-4`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </Link>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm">
      {text}
    </span>
  )
}

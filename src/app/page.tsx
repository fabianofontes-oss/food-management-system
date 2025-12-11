import Link from "next/link"
import { Store, ShoppingCart, ChefHat, Truck, BarChart3, Users, Package, Settings, UserCircle, LogIn, FileText, Building2, MapPin } from "lucide-react"

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

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">🎯 Módulos Operacionais (Integrados com Supabase)</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <ModuleCard
              icon={<ShoppingCart className="w-10 h-10" />}
              title="PDV"
              description="Point of Sale - Produtos e pedidos reais"
              href="/pos"
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              badge="✅ REAL"
            />
            
            <ModuleCard
              icon={<ChefHat className="w-10 h-10" />}
              title="Cozinha/KDS"
              description="Pedidos em tempo real do Supabase"
              href="/kitchen"
              color="bg-gradient-to-br from-orange-500 to-orange-600"
              badge="✅ REAL"
            />
            
            <ModuleCard
              icon={<Truck className="w-10 h-10" />}
              title="Delivery"
              description="Gestão de entregas com dados reais"
              href="/delivery"
              color="bg-gradient-to-br from-purple-500 to-purple-600"
              badge="✅ REAL"
            />
            
            <ModuleCard
              icon={<BarChart3 className="w-10 h-10" />}
              title="Dashboard Admin"
              description="Métricas reais do Supabase"
              href="/dashboard"
              color="bg-gradient-to-br from-red-500 to-red-600"
              badge="✅ REAL"
            />
            
            <ModuleCard
              icon={<Package className="w-10 h-10" />}
              title="Produtos (CRUD)"
              description="Gerenciar produtos no banco"
              href="/products"
              color="bg-gradient-to-br from-green-500 to-green-600"
              badge="✅ REAL"
            />
            
            <ModuleCard
              icon={<Users className="w-10 h-10" />}
              title="CRM"
              description="Clientes reais do Supabase"
              href="/crm"
              color="bg-gradient-to-br from-pink-500 to-pink-600"
              badge="✅ REAL"
            />
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">🏪 Área do Lojista</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <ModuleCard
              icon={<Store className="w-10 h-10" />}
              title="Dashboard Lojista"
              description="Métricas da loja em tempo real"
              href="/dashboard"
              color="bg-gradient-to-br from-green-600 to-green-700"
              badge="✅ REAL"
            />
            
            <ModuleCard
              icon={<Settings className="w-10 h-10" />}
              title="Configurações"
              description="Configurar dados da loja"
              href="/settings"
              color="bg-gradient-to-br from-gray-600 to-gray-700"
              badge="UI"
            />
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">🛒 Área do Cliente</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <ModuleCard
              icon={<Store className="w-10 h-10" />}
              title="Cardápio"
              description="Ver produtos da loja (exemplo)"
              href="/acai-sabor-real"
              color="bg-gradient-to-br from-green-500 to-green-600"
              badge="✅ REAL"
            />
            
            <ModuleCard
              icon={<ShoppingCart className="w-10 h-10" />}
              title="Carrinho"
              description="Ver carrinho de compras"
              href="/acai-sabor-real/cart"
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              badge="UI"
            />
            
            <ModuleCard
              icon={<FileText className="w-10 h-10" />}
              title="Checkout"
              description="Finalizar pedido"
              href="/acai-sabor-real/checkout"
              color="bg-gradient-to-br from-purple-500 to-purple-600"
              badge="✅ REAL"
            />
            
            <ModuleCard
              icon={<UserCircle className="w-10 h-10" />}
              title="Perfil"
              description="Dados do cliente"
              href="/profile"
              color="bg-gradient-to-br from-indigo-500 to-indigo-600"
              badge="UI"
            />
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">🔐 Autenticação & Outros</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <ModuleCard
              icon={<LogIn className="w-10 h-10" />}
              title="Login"
              description="Entrar no sistema"
              href="/login"
              color="bg-gradient-to-br from-teal-500 to-teal-600"
              badge="UI"
            />
            
            <ModuleCard
              icon={<UserCircle className="w-10 h-10" />}
              title="Cadastro"
              description="Criar conta"
              href="/signup"
              color="bg-gradient-to-br from-cyan-500 to-cyan-600"
              badge="UI"
            />
            
            <ModuleCard
              icon={<Building2 className="w-10 h-10" />}
              title="Tenants"
              description="Multi-tenant"
              href="/tenants"
              color="bg-gradient-to-br from-indigo-500 to-indigo-600"
              badge="UI"
            />
            
            <ModuleCard
              icon={<MapPin className="w-10 h-10" />}
              title="Lojas"
              description="Gestão de lojas"
              href="/stores"
              color="bg-gradient-to-br from-violet-500 to-violet-600"
              badge="UI"
            />
          </div>
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
  color,
  badge
}: { 
  icon: React.ReactNode
  title: string
  description: string
  href: string
  color: string
  badge?: string
}) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-all hover:scale-105 cursor-pointer h-full relative">
        {badge && (
          <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold ${
            badge === '✅ REAL' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {badge}
          </div>
        )}
        <div className={`${color} text-white w-14 h-14 rounded-lg flex items-center justify-center mb-3`}>
          {icon}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
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

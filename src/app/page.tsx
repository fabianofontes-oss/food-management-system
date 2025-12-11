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

        {/* Route Group: (auth) */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-3 mb-8">
            <h2 className="text-3xl font-bold text-gray-800">🔐 Route Group: (auth)</h2>
            <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-bold">Autenticação</span>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <ModuleCard
              icon={<LogIn className="w-10 h-10" />}
              title="Login"
              description="/login - Entrar no sistema"
              href="/login"
              color="bg-gradient-to-br from-teal-500 to-teal-600"
              badge="(auth)"
            />
            <ModuleCard
              icon={<UserCircle className="w-10 h-10" />}
              title="Signup"
              description="/signup - Criar conta"
              href="/signup"
              color="bg-gradient-to-br from-cyan-500 to-cyan-600"
              badge="(auth)"
            />
          </div>
        </div>

        {/* Route Group: (super-admin) */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-3 mb-8">
            <h2 className="text-3xl font-bold text-gray-800">👑 Route Group: (super-admin)</h2>
            <span className="px-3 py-1 bg-gray-800 text-white rounded-full text-sm font-bold">Sidebar Escura</span>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <ModuleCard
              icon={<Building2 className="w-10 h-10" />}
              title="Tenants"
              description="/tenants - Gestão de redes"
              href="/tenants"
              color="bg-gradient-to-br from-gray-700 to-gray-900"
              badge="(super-admin)"
            />
            <ModuleCard
              icon={<MapPin className="w-10 h-10" />}
              title="Stores"
              description="/stores - Gestão de lojas"
              href="/stores"
              color="bg-gradient-to-br from-gray-700 to-gray-900"
              badge="(super-admin)"
            />
          </div>
        </div>

        {/* Route Group: (store-dashboard) */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-3 mb-8">
            <h2 className="text-3xl font-bold text-gray-800">🏪 Route Group: (store-dashboard)</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">Sidebar Clara</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <ModuleCard
              icon={<BarChart3 className="w-10 h-10" />}
              title="Dashboard"
              description="/dashboard - Painel do lojista"
              href="/dashboard"
              color="bg-gradient-to-br from-red-500 to-red-600"
              badge="(store-dashboard)"
            />
            <ModuleCard
              icon={<Package className="w-10 h-10" />}
              title="Products"
              description="/products - CRUD de produtos"
              href="/products"
              color="bg-gradient-to-br from-green-500 to-green-600"
              badge="(store-dashboard)"
            />
            <ModuleCard
              icon={<Users className="w-10 h-10" />}
              title="CRM"
              description="/crm - Gestão de clientes"
              href="/crm"
              color="bg-gradient-to-br from-pink-500 to-pink-600"
              badge="(store-dashboard)"
            />
            <ModuleCard
              icon={<ShoppingCart className="w-10 h-10" />}
              title="POS"
              description="/pos - Point of Sale"
              href="/pos"
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              badge="(store-dashboard)"
            />
            <ModuleCard
              icon={<ChefHat className="w-10 h-10" />}
              title="Kitchen"
              description="/kitchen - KDS"
              href="/kitchen"
              color="bg-gradient-to-br from-orange-500 to-orange-600"
              badge="(store-dashboard)"
            />
            <ModuleCard
              icon={<Truck className="w-10 h-10" />}
              title="Delivery"
              description="/delivery - Entregas"
              href="/delivery"
              color="bg-gradient-to-br from-purple-500 to-purple-600"
              badge="(store-dashboard)"
            />
            <ModuleCard
              icon={<Settings className="w-10 h-10" />}
              title="Settings"
              description="/settings - Configurações"
              href="/settings"
              color="bg-gradient-to-br from-gray-600 to-gray-700"
              badge="(store-dashboard)"
            />
          </div>
        </div>

        {/* Route Group: (storefront) */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-3 mb-8">
            <h2 className="text-3xl font-bold text-gray-800">🛒 Route Group: (storefront)</h2>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">Loja do Cliente</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <ModuleCard
              icon={<Store className="w-10 h-10" />}
              title="Menu"
              description="/:slug - Cardápio"
              href="/acai-sabor-real"
              color="bg-gradient-to-br from-green-500 to-green-600"
              badge="(storefront)"
            />
            <ModuleCard
              icon={<ShoppingCart className="w-10 h-10" />}
              title="Cart"
              description="/:slug/cart - Carrinho"
              href="/acai-sabor-real/cart"
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              badge="(storefront)"
            />
            <ModuleCard
              icon={<FileText className="w-10 h-10" />}
              title="Checkout"
              description="/:slug/checkout - Finalizar"
              href="/acai-sabor-real/checkout"
              color="bg-gradient-to-br from-purple-500 to-purple-600"
              badge="(storefront)"
            />
            <ModuleCard
              icon={<FileText className="w-10 h-10" />}
              title="Order"
              description="/:slug/order/:id - Pedido"
              href="/acai-sabor-real/order/123"
              color="bg-gradient-to-br from-indigo-500 to-indigo-600"
              badge="(storefront)"
            />
          </div>
        </div>

        {/* Route Group: (public) */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-3 mb-8">
            <h2 className="text-3xl font-bold text-gray-800">🌍 Route Group: (public)</h2>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">Páginas Públicas</span>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <ModuleCard
              icon={<Store className="w-10 h-10" />}
              title="Landing"
              description="/landing - Página de apresentação"
              href="/landing"
              color="bg-gradient-to-br from-purple-500 to-purple-600"
              badge="(public)"
            />
            <ModuleCard
              icon={<UserCircle className="w-10 h-10" />}
              title="Profile"
              description="/profile - Perfil do usuário"
              href="/profile"
              color="bg-gradient-to-br from-indigo-500 to-indigo-600"
              badge="(public)"
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

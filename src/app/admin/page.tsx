import Link from 'next/link'
import { 
  Activity, Database, Wrench, Wand2, Camera, Printer, 
  Link2, Heart, ArrowRight, Shield, Settings, Zap
} from 'lucide-react'

export const metadata = {
  title: 'Admin | Sistema de Saúde',
  description: 'Painel administrativo de saúde e diagnóstico do sistema'
}

const tools = [
  // Diagnóstico & Monitoramento
  {
    category: '🩺 Diagnóstico & Monitoramento',
    items: [
      {
        title: 'Health Monitor',
        description: 'Dashboard de integridade de dados (crítico, atenção, status)',
        icon: Activity,
        href: '/admin/health',
        color: 'emerald'
      },
      {
        title: 'Debug de Lojas',
        description: 'Lista todas as lojas com URL, nicho, layout, cor e produtos',
        icon: Database,
        href: '/admin/debug',
        color: 'violet'
      }
    ]
  },
  // Ferramentas de Build
  {
    category: '🏗️ Ferramentas de Build',
    items: [
      {
        title: 'Kit Preguiçoso Builder',
        description: 'Aplicar templates completos em lojas (cores, layout, produtos)',
        icon: Wand2,
        href: '/admin/builder',
        color: 'purple'
      }
    ]
  },
  // Manutenção
  {
    category: '🔧 Manutenção & Reparo',
    items: [
      {
        title: 'Scanner de Imagens',
        description: 'Encontrar produtos sem foto e fazer upload rápido',
        icon: Camera,
        href: '/admin/diagnostics/images',
        color: 'pink'
      },
      {
        title: 'Validador de URLs',
        description: 'Detectar slugs inválidos e corrigir automaticamente',
        icon: Link2,
        href: '/admin/diagnostics/slugs',
        color: 'blue'
      },
      {
        title: 'Teste de Impressora',
        description: 'Testar impressão térmica 80mm e 58mm',
        icon: Printer,
        href: '/admin/diagnostics/printing',
        color: 'amber'
      }
    ]
  }
]

const colorClasses: Record<string, { bg: string; border: string; icon: string; hover: string }> = {
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: 'bg-emerald-100 text-emerald-600',
    hover: 'hover:border-emerald-400 hover:shadow-emerald-100'
  },
  violet: {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    icon: 'bg-violet-100 text-violet-600',
    hover: 'hover:border-violet-400 hover:shadow-violet-100'
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: 'bg-purple-100 text-purple-600',
    hover: 'hover:border-purple-400 hover:shadow-purple-100'
  },
  pink: {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    icon: 'bg-pink-100 text-pink-600',
    hover: 'hover:border-pink-400 hover:shadow-pink-100'
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'bg-blue-100 text-blue-600',
    hover: 'hover:border-blue-400 hover:shadow-blue-100'
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'bg-amber-100 text-amber-600',
    hover: 'hover:border-amber-400 hover:shadow-amber-100'
  }
}

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            🏥 Sistema de Saúde
          </h1>
          <p className="text-slate-600 text-lg">
            Painel administrativo de diagnóstico, build e manutenção
          </p>
        </div>

        {/* Categorias */}
        <div className="space-y-8">
          {tools.map((category, catIndex) => (
            <div key={catIndex}>
              <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
                {category.category}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.items.map((tool, toolIndex) => {
                  const colors = colorClasses[tool.color]
                  const Icon = tool.icon
                  
                  return (
                    <Link
                      key={toolIndex}
                      href={tool.href}
                      className={`group block p-5 rounded-2xl border-2 ${colors.border} ${colors.bg} ${colors.hover} transition-all duration-200 hover:shadow-lg`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-800 mb-1 group-hover:text-slate-900">
                            {tool.title}
                          </h3>
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {tool.description}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-10 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Atalhos Rápidos
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/admin/health"
              className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors"
            >
              Ver Saúde do Sistema
            </Link>
            <Link 
              href="/admin/builder"
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
            >
              Aplicar Kit em Loja
            </Link>
            <Link 
              href="/admin/debug"
              className="px-4 py-2 bg-violet-100 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-200 transition-colors"
            >
              Ver Todas as Lojas
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          Sistema de Saúde v1.0 | Food Management System
        </div>
      </div>
    </div>
  )
}

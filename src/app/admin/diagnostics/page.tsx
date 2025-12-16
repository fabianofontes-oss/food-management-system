import Link from 'next/link'
import { Camera, Printer, Link2, Wrench, ArrowRight, Activity } from 'lucide-react'

export const metadata = {
  title: 'Diagnósticos | Admin',
  description: 'Ferramentas de diagnóstico e manutenção do sistema'
}

const tools = [
  {
    id: 'images',
    title: '📸 Scanner de Imagens',
    description: 'Encontre produtos sem foto ou com links quebrados',
    icon: Camera,
    href: '/admin/diagnostics/images',
    color: 'violet',
    stats: 'Verifica image_url de todos os produtos'
  },
  {
    id: 'printing',
    title: '🖨️ Doutor da Impressora',
    description: 'Teste impressão térmica sem criar pedido',
    icon: Printer,
    href: '/admin/diagnostics/printing',
    color: 'blue',
    stats: 'Suporta 80mm e 58mm'
  },
  {
    id: 'slugs',
    title: '🔗 Validador de Links',
    description: 'Detecte URLs conflitantes ou inválidas',
    icon: Link2,
    href: '/admin/diagnostics/slugs',
    color: 'emerald',
    stats: 'Verifica duplicidade e caracteres especiais'
  }
]

const colorClasses: Record<string, { bg: string; border: string; icon: string; hover: string }> = {
  violet: {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    icon: 'bg-violet-100 text-violet-600',
    hover: 'hover:border-violet-400 hover:shadow-violet-100'
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'bg-blue-100 text-blue-600',
    hover: 'hover:border-blue-400 hover:shadow-blue-100'
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: 'bg-emerald-100 text-emerald-600',
    hover: 'hover:border-emerald-400 hover:shadow-emerald-100'
  }
}

export default function DiagnosticsPage() {
  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Wrench className="w-6 h-6 text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">🛠️ Central de Diagnósticos</h1>
          </div>
          <p className="text-slate-600">
            Ferramentas para manutenção e verificação do sistema.
          </p>
        </div>

        {/* Links Rápidos */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Link 
            href="/admin/health"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-sm"
          >
            <Activity className="w-4 h-4" />
            Health Monitor
          </Link>
          <Link 
            href="/admin/debug"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-sm"
          >
            <Wrench className="w-4 h-4" />
            Debug Lojas
          </Link>
        </div>

        {/* Grid de Ferramentas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const colors = colorClasses[tool.color]
            const Icon = tool.icon
            
            return (
              <Link
                key={tool.id}
                href={tool.href}
                className={`group block p-6 rounded-2xl border-2 ${colors.border} ${colors.bg} ${colors.hover} transition-all duration-200 hover:shadow-lg`}
              >
                <div className={`w-14 h-14 rounded-xl ${colors.icon} flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7" />
                </div>
                
                <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-slate-900">
                  {tool.title}
                </h2>
                
                <p className="text-slate-600 text-sm mb-4">
                  {tool.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {tool.stats}
                  </span>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Info */}
        <div className="mt-8 p-6 bg-white rounded-xl border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-2">💡 Sobre as Ferramentas</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• <strong>Scanner de Imagens:</strong> Identifica produtos sem foto para melhorar apresentação do cardápio.</li>
            <li>• <strong>Doutor da Impressora:</strong> Testa impressoras térmicas sem precisar criar pedidos de teste.</li>
            <li>• <strong>Validador de Links:</strong> Garante que todas as URLs de lojas funcionem corretamente.</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          Versão 1.0 | Sistema de Diagnósticos
        </div>
      </div>
    </div>
  )
}

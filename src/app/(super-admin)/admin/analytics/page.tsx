import { BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Em breve: Analytics</h1>
            <p className="text-gray-600 text-lg mb-6">
              Aqui teremos gráficos de MRR, churn, métricas de uso e performance por tenant.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <p className="text-sm text-blue-900 font-semibold mb-2">Funcionalidades Planejadas:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Receita recorrente mensal (MRR) e anual (ARR)</li>
                <li>• Taxa de cancelamento (Churn Rate)</li>
                <li>• Customer Lifetime Value (LTV)</li>
                <li>• Gráficos de crescimento temporal</li>
                <li>• Métricas de uso por tenant e loja</li>
                <li>• Performance por nicho de negócio</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

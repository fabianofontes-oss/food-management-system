'use client'

import { Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/lib/LanguageContext'

export default function AutomationsPage() {
  const { t } = useLanguage()
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-12 text-center">
            <Zap className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('status.coming_soon')}: {t('menu.superadmin_automations')}</h1>
            <p className="text-gray-600 text-lg mb-6">
              {t('superadmin.automations_coming_soon')}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <p className="text-sm text-blue-900 font-semibold mb-2">Funcionalidades Planejadas:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Criar regras de automação personalizadas</li>
                <li>• Triggers: loja inativa, trial ending, baixo uso</li>
                <li>• Actions: enviar email, notificação, webhook</li>
                <li>• Agendamento de tarefas recorrentes</li>
                <li>• Logs de execução de automações</li>
                <li>• Templates pré-configurados</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

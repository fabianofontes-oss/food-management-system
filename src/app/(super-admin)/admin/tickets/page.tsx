'use client'

import { Ticket } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/lib/LanguageContext'

export default function TicketsPage() {
  const { t } = useLanguage()
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-12 text-center">
            <Ticket className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('status.coming_soon')}: {t('menu.superadmin_tickets')}</h1>
            <p className="text-gray-600 text-lg mb-6">
              {t('superadmin.tickets_coming_soon')}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <p className="text-sm text-blue-900 font-semibold mb-2">Funcionalidades Planejadas:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Criação e gestão de tickets de suporte</li>
                <li>• Priorização (baixa, média, alta, crítica)</li>
                <li>• Status (aberto, em andamento, resolvido, fechado)</li>
                <li>• Sistema de mensagens (chat interno)</li>
                <li>• Atribuição de tickets para membros da equipe</li>
                <li>• SLA tracking e notificações</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

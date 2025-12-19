'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Settings, Save, Loader2, Info
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface AffiliateSettings {
  default_commission_percent: number
  driver_share_percent: number
  recruiter_share_percent: number
  release_days: number
  min_payout_amount: number
  allow_self_registration: boolean
}

export default function AdminAffiliatesSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<AffiliateSettings>({
    default_commission_percent: 20,
    driver_share_percent: 80,
    recruiter_share_percent: 20,
    release_days: 60,
    min_payout_amount: 5000, // R$ 50,00 em centavos
    allow_self_registration: true,
  })

  async function handleSave() {
    setSaving(true)
    // TODO: Salvar no banco
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success('Configurações salvas!')
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/affiliates">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
            <p className="text-slate-600">Regras do programa de afiliados</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar
        </Button>
      </div>

      {/* Comissões */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Comissões Padrão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Comissão base (%)
            </label>
            <input
              type="number"
              value={settings.default_commission_percent}
              onChange={(e) => setSettings(s => ({ ...s, default_commission_percent: Number(e.target.value) }))}
              className="w-full max-w-xs px-4 py-2 border border-slate-200 rounded-lg focus:border-violet-500 focus:outline-none"
              min={0}
              max={100}
            />
            <p className="text-sm text-slate-500 mt-1">
              Percentual padrão de comissão sobre mensalidades dos tenants indicados
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Split Driver/Recrutador */}
      <Card>
        <CardHeader>
          <CardTitle>Split Driver / Loja Recrutadora</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Quando um motoboy (DRIVER) é recrutado por uma loja, a comissão é dividida entre o driver e a loja recrutadora.
                O percentual do recrutador vira crédito na fatura da loja.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Driver recebe (%)
              </label>
              <input
                type="number"
                value={settings.driver_share_percent}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  setSettings(s => ({ 
                    ...s, 
                    driver_share_percent: value,
                    recruiter_share_percent: 100 - value
                  }))
                }}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-violet-500 focus:outline-none"
                min={0}
                max={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Loja recrutadora recebe (%)
              </label>
              <input
                type="number"
                value={settings.recruiter_share_percent}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  setSettings(s => ({ 
                    ...s, 
                    recruiter_share_percent: value,
                    driver_share_percent: 100 - value
                  }))
                }}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-violet-500 focus:outline-none"
                min={0}
                max={100}
              />
            </div>
          </div>

          <div className="bg-slate-100 rounded-lg p-4">
            <p className="text-sm text-slate-700">
              <strong>Resumo:</strong> Driver recebe {settings.driver_share_percent}% da comissão, 
              Loja recrutadora recebe {settings.recruiter_share_percent}% como crédito na fatura.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Liberação */}
      <Card>
        <CardHeader>
          <CardTitle>Regras de Liberação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Dias para liberação (D+)
            </label>
            <input
              type="number"
              value={settings.release_days}
              onChange={(e) => setSettings(s => ({ ...s, release_days: Number(e.target.value) }))}
              className="w-full max-w-xs px-4 py-2 border border-slate-200 rounded-lg focus:border-violet-500 focus:outline-none"
              min={0}
              max={180}
            />
            <p className="text-sm text-slate-500 mt-1">
              Comissões ficam pendentes por este período antes de serem liberadas para saque
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Valor mínimo para saque (centavos)
            </label>
            <input
              type="number"
              value={settings.min_payout_amount}
              onChange={(e) => setSettings(s => ({ ...s, min_payout_amount: Number(e.target.value) }))}
              className="w-full max-w-xs px-4 py-2 border border-slate-200 rounded-lg focus:border-violet-500 focus:outline-none"
              min={0}
            />
            <p className="text-sm text-slate-500 mt-1">
              R$ {(settings.min_payout_amount / 100).toFixed(2)} - Valor mínimo acumulado para solicitar saque
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cadastro */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-cadastro</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allow_self_registration}
              onChange={(e) => setSettings(s => ({ ...s, allow_self_registration: e.target.checked }))}
              className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
            />
            <div>
              <p className="font-medium text-slate-900">Permitir auto-cadastro de afiliados</p>
              <p className="text-sm text-slate-500">
                Usuários podem criar seu próprio perfil de afiliado sem aprovação prévia
              </p>
            </div>
          </label>
        </CardContent>
      </Card>
    </div>
  )
}

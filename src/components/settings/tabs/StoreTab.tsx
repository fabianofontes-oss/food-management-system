'use client'

import { Store, MapPin, Clock, Palette } from 'lucide-react'
import { ConfigField } from '../ConfigField'
import type { StoreInfo, BusinessHour } from '@/types/settings'

interface StoreTabProps {
  info: StoreInfo
  businessHours: BusinessHour[]
  onInfoChange: (info: Partial<StoreInfo>) => void
  onBusinessHoursChange: (hours: BusinessHour[]) => void
}

export function StoreTab({ info, businessHours, onInfoChange, onBusinessHoursChange }: StoreTabProps) {
  const updateHour = (index: number, field: keyof BusinessHour, value: any) => {
    const newHours = [...businessHours]
    newHours[index] = { ...newHours[index], [field]: value }
    onBusinessHoursChange(newHours)
  }

  return (
    <div className="space-y-4">
      {/* Dados Básicos */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Store className="w-5 h-5 text-emerald-600" />
          Dados Básicos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConfigField label="Nome da Loja" value={info.name} onChange={v => onInfoChange({ name: v })} placeholder="Ex: Açaí do João" />
          <ConfigField label="Telefone / WhatsApp" value={info.phone} onChange={v => onInfoChange({ phone: v })} placeholder="(31) 99914-0095" />
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Descrição</label>
            <textarea
              value={info.description}
              onChange={e => onInfoChange({ description: e.target.value })}
              placeholder="Descreva sua loja..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 focus:outline-none resize-none"
            />
          </div>
          <ConfigField label="E-mail" value={info.email} onChange={v => onInfoChange({ email: v })} placeholder="contato@loja.com" />
        </div>
      </div>

      {/* Endereço */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-red-500" />
          Endereço
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2 md:col-span-4">
            <ConfigField label="Endereço" value={info.address} onChange={v => onInfoChange({ address: v })} placeholder="Rua, número, bairro" />
          </div>
          <ConfigField label="Cidade" value={info.city} onChange={v => onInfoChange({ city: v })} placeholder="São Paulo" />
          <ConfigField label="Estado" value={info.state} onChange={v => onInfoChange({ state: v })} placeholder="SP" />
          <ConfigField label="CEP" value={info.cep} onChange={v => onInfoChange({ cep: v })} placeholder="32.010-370" />
        </div>
      </div>

      {/* Horários */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          Horário de Funcionamento
        </h3>
        <div className="space-y-2">
          {businessHours.map((h, i) => (
            <div key={h.day} className={`flex items-center justify-between p-3 rounded-lg ${h.enabled ? 'bg-emerald-50' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateHour(i, 'enabled', !h.enabled)}
                  className={`w-10 h-5 rounded-full transition-all ${h.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-all ${h.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <span className={`font-medium min-w-[40px] ${h.enabled ? 'text-emerald-800' : 'text-slate-400'}`}>{h.name}</span>
              </div>
              {h.enabled ? (
                <div className="flex items-center gap-2">
                  <input type="time" value={h.open} onChange={e => updateHour(i, 'open', e.target.value)} className="px-2 py-1 border border-emerald-200 rounded text-sm" />
                  <span className="text-slate-400">às</span>
                  <input type="time" value={h.close} onChange={e => updateHour(i, 'close', e.target.value)} className="px-2 py-1 border border-emerald-200 rounded text-sm" />
                </div>
              ) : (
                <span className="text-slate-400 text-sm">Fechado</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Visual */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-500" />
          Visual e Redes Sociais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConfigField label="URL do Logo" value={info.logoUrl} onChange={v => onInfoChange({ logoUrl: v })} placeholder="https://..." />
          <ConfigField label="URL do Banner" value={info.bannerUrl} onChange={v => onInfoChange({ bannerUrl: v })} placeholder="https://..." />
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Cor Principal</label>
            <div className="flex gap-2">
              <input type="color" value={info.primaryColor} onChange={e => onInfoChange({ primaryColor: e.target.value })} className="w-12 h-10 rounded border border-slate-200 cursor-pointer" />
              <input type="text" value={info.primaryColor} onChange={e => onInfoChange({ primaryColor: e.target.value })} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
          </div>
          <ConfigField label="Instagram" value={info.instagram} onChange={v => onInfoChange({ instagram: v })} placeholder="@seuinstagram" />
          <ConfigField label="Facebook" value={info.facebook} onChange={v => onInfoChange({ facebook: v })} placeholder="facebook.com/pagina" />
          <ConfigField label="Website" value={info.website} onChange={v => onInfoChange({ website: v })} placeholder="https://..." />
        </div>
      </div>
    </div>
  )
}

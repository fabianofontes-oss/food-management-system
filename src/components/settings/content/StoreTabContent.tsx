'use client'

import { Store, MapPin, Clock, Palette } from 'lucide-react'
import { ConfigField } from '../ConfigField'

interface StoreData {
  name: string
  description: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  cep: string
  logo_url: string
  banner_url: string
  primary_color: string
  instagram: string
  facebook: string
  website: string
}

interface BusinessHour {
  day: string
  name: string
  enabled: boolean
  open: string
  close: string
}

interface StoreTabContentProps {
  store: StoreData
  setStore: (fn: (s: StoreData) => StoreData) => void
  businessHours: BusinessHour[]
  setBusinessHours: (hours: BusinessHour[]) => void
}

export function StoreTabContent({ store, setStore, businessHours, setBusinessHours }: StoreTabContentProps) {
  return (
    <div className="space-y-4">
      {/* Dados Básicos */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Store className="w-5 h-5 text-emerald-600" />
          Dados Básicos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConfigField label="Nome da Loja" value={store.name} onChange={v => setStore(s => ({ ...s, name: v }))} placeholder="Ex: Açaí do João" />
          <ConfigField label="Telefone / WhatsApp" value={store.phone} onChange={v => setStore(s => ({ ...s, phone: v }))} placeholder="(11) 99999-9999" />
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Descrição</label>
            <textarea
              value={store.description}
              onChange={e => setStore(s => ({ ...s, description: e.target.value }))}
              placeholder="Descreva sua loja..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 focus:outline-none resize-none"
            />
          </div>
          <ConfigField label="E-mail" value={store.email} onChange={v => setStore(s => ({ ...s, email: v }))} placeholder="contato@loja.com" />
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
            <ConfigField label="Endereço" value={store.address} onChange={v => setStore(s => ({ ...s, address: v }))} placeholder="Rua, número, bairro" />
          </div>
          <ConfigField label="Cidade" value={store.city} onChange={v => setStore(s => ({ ...s, city: v }))} placeholder="São Paulo" />
          <ConfigField label="Estado" value={store.state} onChange={v => setStore(s => ({ ...s, state: v }))} placeholder="SP" />
          <ConfigField label="CEP" value={store.cep} onChange={v => setStore(s => ({ ...s, cep: v }))} placeholder="00000-000" />
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
                  onClick={() => {
                    const newHours = [...businessHours]
                    newHours[i].enabled = !newHours[i].enabled
                    setBusinessHours(newHours)
                  }}
                  className={`w-10 h-5 rounded-full transition-all ${h.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-all ${h.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <span className={`font-medium min-w-[40px] ${h.enabled ? 'text-emerald-800' : 'text-slate-400'}`}>{h.name}</span>
              </div>
              {h.enabled ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={h.open}
                    onChange={e => {
                      const newHours = [...businessHours]
                      newHours[i].open = e.target.value
                      setBusinessHours(newHours)
                    }}
                    className="px-2 py-1 border border-emerald-200 rounded text-sm"
                  />
                  <span className="text-slate-400">às</span>
                  <input
                    type="time"
                    value={h.close}
                    onChange={e => {
                      const newHours = [...businessHours]
                      newHours[i].close = e.target.value
                      setBusinessHours(newHours)
                    }}
                    className="px-2 py-1 border border-emerald-200 rounded text-sm"
                  />
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
          <ConfigField label="URL do Logo" value={store.logo_url} onChange={v => setStore(s => ({ ...s, logo_url: v }))} placeholder="https://..." />
          <ConfigField label="URL do Banner" value={store.banner_url} onChange={v => setStore(s => ({ ...s, banner_url: v }))} placeholder="https://..." />
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Cor Principal</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={store.primary_color}
                onChange={e => setStore(s => ({ ...s, primary_color: e.target.value }))}
                className="w-12 h-10 rounded border border-slate-200 cursor-pointer"
              />
              <input
                type="text"
                value={store.primary_color}
                onChange={e => setStore(s => ({ ...s, primary_color: e.target.value }))}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <ConfigField label="Instagram" value={store.instagram} onChange={v => setStore(s => ({ ...s, instagram: v }))} placeholder="@seuinstagram" />
          <ConfigField label="Facebook" value={store.facebook} onChange={v => setStore(s => ({ ...s, facebook: v }))} placeholder="facebook.com/pagina" />
          <ConfigField label="Website" value={store.website} onChange={v => setStore(s => ({ ...s, website: v }))} placeholder="https://..." />
        </div>
      </div>
    </div>
  )
}

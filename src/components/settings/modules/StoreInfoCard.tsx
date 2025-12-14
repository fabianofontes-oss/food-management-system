'use client'

import { useState, useEffect } from 'react'
import { Store, Phone, Mail, MapPin, Building2, Hash, Map, Loader2, CheckCircle, Search } from 'lucide-react'

interface StoreInfoCardProps {
  settings: Record<string, any>
  enabled: boolean
  onUpdateSetting: (key: string, value: any) => void
}

interface ViaCEPResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export function StoreInfoCard({ settings, enabled, onUpdateSetting }: StoreInfoCardProps) {
  const [loadingCep, setLoadingCep] = useState(false)
  const [cepFound, setCepFound] = useState(false)

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  const formatCep = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    onUpdateSetting('store_cep', formatCep(cleanCep))

    if (cleanCep.length === 8) {
      setLoadingCep(true)
      setCepFound(false)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data: ViaCEPResponse = await response.json()
        
        if (!data.erro) {
          onUpdateSetting('store_street', data.logradouro)
          onUpdateSetting('store_neighborhood', data.bairro)
          onUpdateSetting('store_city', data.localidade)
          onUpdateSetting('store_state', data.uf)
          setCepFound(true)
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
      } finally {
        setLoadingCep(false)
      }
    }
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value)
    onUpdateSetting('store_phone', formatted)
  }

  return (
    <div className={`space-y-6 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Nome da Loja - Campo Principal */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
          <Store className="w-4 h-4 text-violet-500" />
          Nome da Loja
        </label>
        <input
          type="text"
          value={settings.store_name || ''}
          onChange={e => onUpdateSetting('store_name', e.target.value)}
          placeholder="Ex: Açaí do João"
          className="w-full px-4 py-3 text-lg font-medium border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none bg-white"
        />
        <p className="text-xs text-slate-500 mt-1">Nome que aparece para seus clientes</p>
      </div>

      {/* Telefone e Email - Grid 2 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
            <Phone className="w-4 h-4 text-green-500" />
            Telefone / WhatsApp
          </label>
          <input
            type="tel"
            value={settings.store_phone || ''}
            onChange={e => handlePhoneChange(e.target.value)}
            placeholder="(11) 99999-9999"
            maxLength={15}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
            <Mail className="w-4 h-4 text-blue-500" />
            E-mail
          </label>
          <input
            type="email"
            value={settings.store_email || ''}
            onChange={e => onUpdateSetting('store_email', e.target.value)}
            placeholder="contato@minhaloja.com"
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Endereço - Seção Completa */}
      <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
        <h3 className="flex items-center gap-2 font-semibold text-slate-700">
          <MapPin className="w-5 h-5 text-red-500" />
          Endereço da Loja
        </h3>

        {/* CEP + Número */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2 md:col-span-1">
            <label className="text-xs font-medium text-slate-600 mb-1 block">CEP</label>
            <div className="relative">
              <input
                type="text"
                value={settings.store_cep || ''}
                onChange={e => handleCepChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {loadingCep ? (
                  <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
                ) : cepFound ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Search className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>
          </div>
          <div className="col-span-2 md:col-span-2">
            <label className="text-xs font-medium text-slate-600 mb-1 block">Rua / Avenida</label>
            <input
              type="text"
              value={settings.store_street || ''}
              onChange={e => onUpdateSetting('store_street', e.target.value)}
              placeholder="Nome da rua"
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Número</label>
            <input
              type="text"
              value={settings.store_number || ''}
              onChange={e => onUpdateSetting('store_number', e.target.value)}
              placeholder="123"
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Complemento + Bairro */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Complemento</label>
            <input
              type="text"
              value={settings.store_complement || ''}
              onChange={e => onUpdateSetting('store_complement', e.target.value)}
              placeholder="Sala 101, Bloco A (opcional)"
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Bairro</label>
            <input
              type="text"
              value={settings.store_neighborhood || ''}
              onChange={e => onUpdateSetting('store_neighborhood', e.target.value)}
              placeholder="Nome do bairro"
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Cidade + Estado */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-600 mb-1 block">Cidade</label>
            <input
              type="text"
              value={settings.store_city || ''}
              onChange={e => onUpdateSetting('store_city', e.target.value)}
              placeholder="São Paulo"
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">UF</label>
            <select
              value={settings.store_state || ''}
              onChange={e => onUpdateSetting('store_state', e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none bg-white"
            >
              <option value="">UF</option>
              {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dica */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
        <Building2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Dica</p>
          <p className="text-xs text-amber-700">Digite o CEP para preencher o endereço automaticamente!</p>
        </div>
      </div>
    </div>
  )
}

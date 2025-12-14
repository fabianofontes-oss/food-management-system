'use client'

import { useState, useRef } from 'react'
import { Store, Phone, Mail, MapPin, Building2, Loader2, CheckCircle, Search, Upload, User, FileText, Image as ImageIcon, X } from 'lucide-react'

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
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const formatCnpjCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onUpdateSetting('store_logo', reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    onUpdateSetting('store_logo', '')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className={`space-y-6 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Nome + Logo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
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
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
            <ImageIcon className="w-4 h-4 text-pink-500" />
            Logo
          </label>
          {settings.store_logo ? (
            <div className="relative w-full h-[88px] border-2 border-violet-200 rounded-xl overflow-hidden bg-white">
              <img src={settings.store_logo} alt="Logo" className="w-full h-full object-contain p-2" />
              <button onClick={removeLogo} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()} className="w-full h-[88px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-violet-400 hover:bg-violet-50 transition-colors">
              <Upload className="w-5 h-5 text-slate-400" />
              <span className="text-xs text-slate-500">200x200px</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
        </div>
      </div>

      {/* Dados Fiscais */}
      <div className="bg-blue-50 rounded-2xl p-4 space-y-3">
        <h3 className="flex items-center gap-2 font-semibold text-slate-700 text-sm">
          <FileText className="w-4 h-4 text-blue-500" />
          Dados Fiscais
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Tipo</label>
            <select
              value={settings.store_document_type || 'cnpj'}
              onChange={e => onUpdateSetting('store_document_type', e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none bg-white text-sm"
            >
              <option value="cnpj">CNPJ</option>
              <option value="cpf">CPF</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-600 mb-1 block">{settings.store_document_type === 'cpf' ? 'CPF' : 'CNPJ'}</label>
            <input
              type="text"
              value={settings.store_document || ''}
              onChange={e => onUpdateSetting('store_document', formatCnpjCpf(e.target.value))}
              placeholder={settings.store_document_type === 'cpf' ? '000.000.000-00' : '00.000.000/0001-00'}
              maxLength={settings.store_document_type === 'cpf' ? 14 : 18}
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Responsável Legal */}
      <div className="bg-green-50 rounded-2xl p-4 space-y-3">
        <h3 className="flex items-center gap-2 font-semibold text-slate-700 text-sm">
          <User className="w-4 h-4 text-green-600" />
          Responsável Legal
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Nome Completo</label>
            <input
              type="text"
              value={settings.owner_name || ''}
              onChange={e => onUpdateSetting('owner_name', e.target.value)}
              placeholder="João da Silva"
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">CPF</label>
            <input
              type="text"
              value={settings.owner_cpf || ''}
              onChange={e => onUpdateSetting('owner_cpf', formatCnpjCpf(e.target.value))}
              placeholder="000.000.000-00"
              maxLength={14}
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Telefone e Email */}
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

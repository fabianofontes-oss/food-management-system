'use client'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type TenantFormData } from '../types/tenant.types'

interface TenantFormModalProps {
  isEditing: boolean
  submitting: boolean
  formData: TenantFormData
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  updateField: <K extends keyof TenantFormData>(field: K, value: TenantFormData[K]) => void
}

export function TenantFormModal({
  isEditing,
  submitting,
  formData,
  onSubmit,
  onCancel,
  updateField
}: TenantFormModalProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6">
        {isEditing ? 'Editar Tenant' : 'Novo Tenant'}
      </h2>
      
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Dados Básicos */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome do Tenant *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Ex: Rede Açaí Premium"
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
              required
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome do Responsável
            </label>
            <input
              type="text"
              value={formData.responsible_name}
              onChange={(e) => updateField('responsible_name', e.target.value)}
              placeholder="Ex: João da Silva"
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
              disabled={submitting}
            />
          </div>
        </div>

        {/* Contato */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="contato@empresa.com"
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Telefone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="(31) 99914-0095"
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
              disabled={submitting}
            />
          </div>
        </div>

        {/* Documento */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tipo Documento
            </label>
            <select
              value={formData.document_type}
              onChange={(e) => updateField('document_type', e.target.value as 'cpf' | 'cnpj')}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
              disabled={submitting}
            >
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {formData.document_type === 'cpf' ? 'CPF' : 'CNPJ'}
            </label>
            <input
              type="text"
              value={formData.document}
              onChange={(e) => updateField('document', e.target.value)}
              placeholder={formData.document_type === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
              disabled={submitting}
            />
          </div>
        </div>

        {/* Endereço */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Endereço
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Rua, número, bairro"
            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
            disabled={submitting}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cidade
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="Belo Horizonte"
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Estado
            </label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => updateField('state', e.target.value.toUpperCase().slice(0, 2))}
              placeholder="MG"
              maxLength={2}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              CEP
            </label>
            <input
              type="text"
              value={formData.cep}
              onChange={(e) => updateField('cep', e.target.value)}
              placeholder="32.010-370"
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
              disabled={submitting}
            />
          </div>
        </div>

        {/* Status e Billing */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => updateField('status', e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
              disabled={submitting}
            >
              <option value="active">✅ Ativo</option>
              <option value="trial">⏳ Trial (Período de Teste)</option>
              <option value="suspended">⚠️ Suspenso</option>
              <option value="cancelled">❌ Cancelado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Dia de Vencimento
            </label>
            <select
              value={formData.billing_day}
              onChange={(e) => updateField('billing_day', parseInt(e.target.value))}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
              disabled={submitting}
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>Dia {day}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Anotações */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Anotações Internas
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Observações sobre o cliente..."
            rows={3}
            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
            disabled={submitting}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              isEditing ? 'Salvar Alterações' : 'Criar Tenant'
            )}
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}

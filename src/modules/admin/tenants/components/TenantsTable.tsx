'use client'

import { Building2, Store, CreditCard, FileText, Mail, Phone, MapPin, Calendar, Edit, Trash2, CheckCircle, Clock, AlertCircle, Ban } from 'lucide-react'
import { type TenantWithStoreCount } from '../types/tenant.types'

const STATUS_ICONS = {
  CheckCircle,
  Clock,
  AlertCircle,
  Ban
}

const STATUS_CONFIG: Record<string, { label: string; color: string; iconName: keyof typeof STATUS_ICONS }> = {
  active: { label: 'Ativo', color: 'bg-green-100 text-green-700', iconName: 'CheckCircle' },
  trial: { label: 'Trial', color: 'bg-blue-100 text-blue-700', iconName: 'Clock' },
  suspended: { label: 'Suspenso', color: 'bg-yellow-100 text-yellow-700', iconName: 'AlertCircle' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', iconName: 'Ban' }
}

interface TenantsTableProps {
  tenants: TenantWithStoreCount[]
  onEdit: (tenant: TenantWithStoreCount) => void
  onDelete: (id: string) => void
  onChangePlan: (tenantId: string) => void
}

export function TenantsTable({ tenants, onEdit, onDelete, onChangePlan }: TenantsTableProps) {
  if (tenants.length === 0) {
    return (
      <div className="text-center py-16">
        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Nenhum tenant cadastrado</p>
        <p className="text-gray-400 mt-2">Clique em "Adicionar Novo Tenant" para começar</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tenants.map((tenant) => {
        const tenantData = tenant as any
        const statusInfo = STATUS_CONFIG[tenantData.status] || STATUS_CONFIG.active
        const StatusIcon = STATUS_ICONS[statusInfo.iconName]

        return (
          <div key={tenant.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                  <h3 className="text-2xl font-bold text-gray-900">{tenant.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </span>
                </div>
                
                {/* Info Grid */}
                <div className="grid md:grid-cols-2 gap-4 text-gray-600">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      <span className="text-sm font-semibold">{tenant.stores_count} loja(s)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span className="text-sm">
                        {tenant.plan_name ? (
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                            {tenant.plan_name}
                          </span>
                        ) : (
                          <span className="text-gray-400">Sem plano</span>
                        )}
                      </span>
                    </div>
                    {tenantData.responsible_name && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">{tenantData.responsible_name}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {tenantData.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{tenantData.email}</span>
                      </div>
                    )}
                    {tenantData.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">{tenantData.phone}</span>
                      </div>
                    )}
                    {(tenantData.city || tenantData.state) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">
                          {tenantData.city}{tenantData.city && tenantData.state ? ' - ' : ''}{tenantData.state}
                        </span>
                      </div>
                    )}
                    {tenantData.billing_day && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Vencimento: Dia {tenantData.billing_day}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Footer */}
                <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
                  Criado em: {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                  {tenantData.document && (
                    <span className="ml-4">
                      {tenantData.document_type?.toUpperCase()}: {tenantData.document}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(tenant)}
                  className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  title="Editar"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onChangePlan(tenant.id)}
                  className="p-3 text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                  title="Alterar Plano"
                >
                  <CreditCard className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDelete(tenant.id)}
                  className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

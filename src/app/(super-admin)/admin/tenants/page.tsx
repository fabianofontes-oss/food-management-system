'use client'

import { Building2, Store, Plus, Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  useTenantsController, 
  TenantsTable, 
  TenantFormModal, 
  PlanModal 
} from '@/modules/admin/tenants'

export default function TenantsPage() {
  const controller = useTenantsController()

  if (controller.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando tenants...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Gestão de Tenants</h1>
          <p className="text-gray-600 mt-1">Multi-Tenant - Gerenciar Redes e Empresas</p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-8 h-8 text-indigo-600" />
              <span className="text-3xl font-bold text-gray-900">{controller.tenants.length}</span>
            </div>
            <div className="text-gray-600">Total de Tenants</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Store className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-bold text-gray-900">{controller.totalStores}</span>
            </div>
            <div className="text-gray-600">Total de Lojas</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">{controller.tenants.length}</span>
            </div>
            <div className="text-gray-600">Redes Cadastradas</div>
          </div>
        </div>

        {/* Add Button */}
        <div className="mb-6">
          <Button
            onClick={() => controller.setShowForm(true)}
            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Novo Tenant
          </Button>
        </div>

        {/* Form Modal */}
        {controller.showForm && (
          <TenantFormModal
            isEditing={!!controller.editingTenant}
            submitting={controller.submitting}
            formData={controller.formData}
            onSubmit={controller.handleSubmit}
            onCancel={controller.handleCancel}
            updateField={controller.updateFormField}
          />
        )}

        {/* Tenants Table */}
        <TenantsTable
          tenants={controller.tenants}
          onEdit={controller.handleEdit}
          onDelete={controller.handleDelete}
          onChangePlan={controller.handleOpenPlanModal}
        />

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Informação sobre Planos</p>
            <p>
              No futuro, o plano poderá controlar quais módulos estão disponíveis (PDV, Cozinha, Delivery, CRM, etc.). 
              Por enquanto, ele é apenas informativo e usado para organização e billing.
            </p>
          </div>
        </div>

        {/* Plan Modal */}
        <PlanModal
          isOpen={controller.showPlanModal}
          plans={controller.plans}
          selectedPlanId={controller.selectedPlanId}
          changingPlan={controller.changingPlan}
          onSelectPlan={controller.setSelectedPlanId}
          onConfirm={controller.handleChangePlan}
          onClose={controller.handleClosePlanModal}
        />
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  Plus, Edit, Trash2, X, Save, Loader2,
  CheckCircle, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Receivable {
  id: string
  description: string
  amount: number
  due_date: string
  paid_at: string | null
  status: string
  customer_name: string | null
  customer_phone: string | null
}

interface ReceivablesTabProps {
  storeId: string
}

export function ReceivablesTab({ storeId }: ReceivablesTabProps) {
  const supabase = createClient()
  
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingReceivable, setEditingReceivable] = useState<Receivable | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all')
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    due_date: new Date().toISOString().split('T')[0],
    customer_name: '',
    customer_phone: '',
    notes: ''
  })

  useEffect(() => {
    loadReceivables()
  }, [storeId, statusFilter])

  async function loadReceivables() {
    setLoading(true)
    let query = supabase
      .from('receivables')
      .select('*')
      .eq('store_id', storeId)
      .order('due_date', { ascending: true })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data } = await query
    setReceivables(data || [])
    setLoading(false)
  }

  function openNewForm() {
    setEditingReceivable(null)
    setFormData({
      description: '',
      amount: '',
      due_date: new Date().toISOString().split('T')[0],
      customer_name: '',
      customer_phone: '',
      notes: ''
    })
    setShowForm(true)
  }

  function openEditForm(receivable: Receivable) {
    setEditingReceivable(receivable)
    setFormData({
      description: receivable.description,
      amount: receivable.amount.toString(),
      due_date: receivable.due_date,
      customer_name: receivable.customer_name || '',
      customer_phone: receivable.customer_phone || '',
      notes: (receivable as any).notes || ''
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!formData.description || !formData.amount) return
    
    setSaving(true)
    
    const receivableData = {
      store_id: storeId,
      description: formData.description,
      amount: parseFloat(formData.amount),
      due_date: formData.due_date,
      customer_name: formData.customer_name || null,
      customer_phone: formData.customer_phone || null,
      notes: formData.notes || null,
      status: 'pending'
    }

    if (editingReceivable) {
      await supabase.from('receivables').update(receivableData).eq('id', editingReceivable.id)
    } else {
      await supabase.from('receivables').insert(receivableData)
    }

    setShowForm(false)
    loadReceivables()
    setSaving(false)
  }

  async function markAsPaid(id: string) {
    await supabase.from('receivables').update({
      status: 'paid',
      paid_at: new Date().toISOString()
    }).eq('id', id)
    loadReceivables()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este recebível?')) return
    await supabase.from('receivables').delete().eq('id', id)
    loadReceivables()
  }

  const totals = {
    pending: receivables.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0),
    paid: receivables.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0),
    overdue: receivables.filter(r => r.status === 'overdue').reduce((s, r) => s + r.amount, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'pending', 'paid', 'overdue'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === status
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border'
              }`}
            >
              {status === 'all' ? 'Todos' : status === 'pending' ? '⏳ Pendentes' : status === 'paid' ? '✅ Recebidos' : '⚠️ Vencidos'}
            </button>
          ))}
        </div>
        <Button onClick={openNewForm} className="bg-green-500 hover:bg-green-600">
          <Plus className="w-4 h-4 mr-2" />
          Novo Recebível
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <p className="text-sm text-yellow-700">A Receber</p>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totals.pending)}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-sm text-green-700">Recebidos</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.paid)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <p className="text-sm text-red-700">Vencidos</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.overdue)}</p>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      ) : receivables.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border">
          <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum recebível encontrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Descrição</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Vencimento</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Valor</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {receivables.map(receivable => (
                <tr key={receivable.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{receivable.description}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {receivable.customer_name || '-'}
                    {receivable.customer_phone && (
                      <p className="text-xs text-slate-400">{receivable.customer_phone}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(receivable.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">
                    {formatCurrency(receivable.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {receivable.status === 'paid' ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">✅ Recebido</span>
                    ) : receivable.status === 'overdue' ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">⚠️ Vencido</span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">⏳ Pendente</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      {receivable.status === 'pending' && (
                        <button onClick={() => markAsPaid(receivable.id)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Marcar como recebido">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => openEditForm(receivable)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(receivable.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold">{editingReceivable ? 'Editar' : 'Novo'} Recebível</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Ex: Venda fiado, Parcela 1..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento *</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={e => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={e => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Nome do cliente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.customer_phone}
                    onChange={e => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-slate-50 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

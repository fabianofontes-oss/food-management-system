'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  Plus, Edit, Trash2, X, Save, Loader2, Calendar,
  CheckCircle, Clock, AlertCircle, Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Expense {
  id: string
  description: string
  amount: number
  due_date: string
  paid_at: string | null
  status: string
  category?: { name: string; color: string }
  supplier?: { name: string }
}

interface Category {
  id: string
  name: string
  color: string
}

interface ExpensesTabProps {
  storeId: string
}

export function ExpensesTab({ storeId }: ExpensesTabProps) {
  const supabase = createClient()
  
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all')
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    due_date: new Date().toISOString().split('T')[0],
    category_id: '',
    notes: ''
  })

  useEffect(() => {
    loadExpenses()
    loadCategories()
  }, [storeId, statusFilter])

  async function loadExpenses() {
    setLoading(true)
    let query = supabase
      .from('expenses')
      .select('*, category:financial_categories(name, color), supplier:suppliers(name)')
      .eq('store_id', storeId)
      .order('due_date', { ascending: true })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data } = await query
    setExpenses(data || [])
    setLoading(false)
  }

  async function loadCategories() {
    const { data } = await supabase
      .from('financial_categories')
      .select('id, name, color')
      .eq('store_id', storeId)
      .eq('type', 'expense')
      .eq('is_active', true)
    setCategories(data || [])
  }

  function openNewForm() {
    setEditingExpense(null)
    setFormData({
      description: '',
      amount: '',
      due_date: new Date().toISOString().split('T')[0],
      category_id: '',
      notes: ''
    })
    setShowForm(true)
  }

  function openEditForm(expense: Expense) {
    setEditingExpense(expense)
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      due_date: expense.due_date,
      category_id: (expense as any).category_id || '',
      notes: (expense as any).notes || ''
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!formData.description || !formData.amount) return
    
    setSaving(true)
    
    const expenseData = {
      store_id: storeId,
      description: formData.description,
      amount: parseFloat(formData.amount),
      due_date: formData.due_date,
      category_id: formData.category_id || null,
      notes: formData.notes || null,
      status: 'pending'
    }

    if (editingExpense) {
      await supabase.from('expenses').update(expenseData).eq('id', editingExpense.id)
    } else {
      await supabase.from('expenses').insert(expenseData)
    }

    setShowForm(false)
    loadExpenses()
    setSaving(false)
  }

  async function markAsPaid(id: string) {
    await supabase.from('expenses').update({
      status: 'paid',
      paid_at: new Date().toISOString()
    }).eq('id', id)
    loadExpenses()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta despesa?')) return
    await supabase.from('expenses').delete().eq('id', id)
    loadExpenses()
  }

  const totals = {
    pending: expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0),
    paid: expenses.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0),
    overdue: expenses.filter(e => e.status === 'overdue').reduce((s, e) => s + e.amount, 0)
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
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border'
              }`}
            >
              {status === 'all' ? 'Todas' : status === 'pending' ? '⏳ Pendentes' : status === 'paid' ? '✅ Pagas' : '⚠️ Vencidas'}
            </button>
          ))}
        </div>
        <Button onClick={openNewForm} className="bg-red-500 hover:bg-red-600">
          <Plus className="w-4 h-4 mr-2" />
          Nova Despesa
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <p className="text-sm text-yellow-700">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totals.pending)}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-sm text-green-700">Pagas</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.paid)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <p className="text-sm text-red-700">Vencidas</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.overdue)}</p>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border">
          <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500">Nenhuma despesa encontrada</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Descrição</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Categoria</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Vencimento</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Valor</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {expenses.map(expense => (
                <tr key={expense.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{expense.description}</p>
                    {expense.supplier && (
                      <p className="text-xs text-slate-500">{expense.supplier.name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {expense.category && (
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: expense.category.color + '20', color: expense.category.color }}
                      >
                        {expense.category.name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(expense.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {expense.status === 'paid' ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">✅ Pago</span>
                    ) : expense.status === 'overdue' ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">⚠️ Vencido</span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">⏳ Pendente</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      {expense.status === 'pending' && (
                        <button onClick={() => markAsPaid(expense.id)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Marcar como pago">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => openEditForm(expense)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(expense.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
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
              <h3 className="text-lg font-bold">{editingExpense ? 'Editar' : 'Nova'} Despesa</h3>
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
                  placeholder="Ex: Aluguel, Energia, Fornecedor..."
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={formData.category_id}
                  onChange={e => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Selecione</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
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

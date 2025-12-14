'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  Wallet, Plus, ArrowUpCircle, ArrowDownCircle, 
  CheckCircle, XCircle, Loader2, Clock, Receipt
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CashRegister {
  id: string
  status: 'open' | 'closed'
  opening_amount: number
  closing_amount: number | null
  expected_amount: number | null
  difference: number | null
  opened_at: string
  closed_at: string | null
  opened_by_name: string | null
  closed_by_name: string | null
}

interface CashMovement {
  id: string
  type: 'sale' | 'deposit' | 'withdrawal' | 'adjustment'
  amount: number
  description: string | null
  payment_method: string | null
  created_at: string
  created_by_name: string | null
}

interface CashControlTabProps {
  storeId: string
}

export function CashControlTab({ storeId }: CashControlTabProps) {
  const supabase = useMemo(() => createClient(), [])
  
  const [loading, setLoading] = useState(true)
  const [registers, setRegisters] = useState<CashRegister[]>([])
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [openRegister, setOpenRegister] = useState<CashRegister | null>(null)
  
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  
  const [openingAmount, setOpeningAmount] = useState('')
  const [closingAmount, setClosingAmount] = useState('')
  const [movementType, setMovementType] = useState<'deposit' | 'withdrawal'>('deposit')
  const [movementAmount, setMovementAmount] = useState('')
  const [movementDescription, setMovementDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [storeId])

  async function loadData() {
    setLoading(true)
    
    const { data: regs } = await supabase
      .from('cash_registers')
      .select('*')
      .eq('store_id', storeId)
      .order('opened_at', { ascending: false })
      .limit(10)
    
    setRegisters(regs || [])
    setOpenRegister(regs?.find((r: CashRegister) => r.status === 'open') || null)
    
    const { data: movs } = await supabase
      .from('cash_movements')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(20)
    
    setMovements(movs || [])
    setLoading(false)
  }

  async function handleOpenCash() {
    if (!openingAmount) return
    setSaving(true)
    
    await supabase.from('cash_registers').insert({
      store_id: storeId,
      opening_amount: parseFloat(openingAmount),
      status: 'open',
      opened_by_name: 'Operador'
    })
    
    setShowOpenModal(false)
    setOpeningAmount('')
    setSaving(false)
    loadData()
  }

  async function handleCloseCash() {
    if (!openRegister || !closingAmount) return
    setSaving(true)
    
    const closing = parseFloat(closingAmount)
    const sales = movements
      .filter((m: CashMovement) => m.type === 'sale' || m.type === 'deposit')
      .reduce((sum: number, m: CashMovement) => sum + m.amount, 0)
    const withdrawals = movements
      .filter((m: CashMovement) => m.type === 'withdrawal')
      .reduce((sum: number, m: CashMovement) => sum + m.amount, 0)
    const expected = openRegister.opening_amount + sales - withdrawals
    
    await supabase.from('cash_registers').update({
      status: 'closed',
      closing_amount: closing,
      expected_amount: expected,
      difference: closing - expected,
      closed_at: new Date().toISOString(),
      closed_by_name: 'Operador'
    }).eq('id', openRegister.id)
    
    setShowCloseModal(false)
    setClosingAmount('')
    setSaving(false)
    loadData()
  }

  async function handleAddMovement() {
    if (!movementAmount) return
    setSaving(true)
    
    await supabase.from('cash_movements').insert({
      store_id: storeId,
      register_id: openRegister?.id || null,
      type: movementType,
      amount: parseFloat(movementAmount),
      description: movementDescription || null,
      created_by_name: 'Operador'
    })
    
    setShowMovementModal(false)
    setMovementAmount('')
    setMovementDescription('')
    setSaving(false)
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  const todayMovements = movements.filter((m: CashMovement) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(m.created_at) >= today
  })

  const totalIn = todayMovements
    .filter((m: CashMovement) => m.type === 'sale' || m.type === 'deposit')
    .reduce((sum: number, m: CashMovement) => sum + m.amount, 0)
  const totalOut = todayMovements
    .filter((m: CashMovement) => m.type === 'withdrawal')
    .reduce((sum: number, m: CashMovement) => sum + m.amount, 0)

  return (
    <div className="space-y-6">
      {/* Status do Caixa */}
      <div className={`p-6 rounded-2xl ${
        openRegister 
          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' 
          : 'bg-slate-100'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${openRegister ? 'bg-white/20' : 'bg-white'}`}>
              <Wallet className={`w-8 h-8 ${openRegister ? 'text-white' : 'text-slate-400'}`} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${openRegister ? 'text-white' : 'text-slate-800'}`}>
                {openRegister ? 'Caixa Aberto' : 'Caixa Fechado'}
              </h3>
              {openRegister && (
                <p className="text-emerald-100 text-sm">
                  Aberto às {new Date(openRegister.opened_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  {openRegister.opened_by_name && ` por ${openRegister.opened_by_name}`}
                </p>
              )}
            </div>
          </div>
          
          {openRegister ? (
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowMovementModal(true)}
                variant="outline"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <Plus className="w-4 h-4 mr-2" />
                Movimentação
              </Button>
              <Button 
                onClick={() => setShowCloseModal(true)}
                variant="outline"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Fechar Caixa
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => setShowOpenModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Abrir Caixa
            </Button>
          )}
        </div>

        {openRegister && (
          <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-white/20">
            <div>
              <p className="text-emerald-100 text-sm">Abertura</p>
              <p className="text-xl font-bold">{formatCurrency(openRegister.opening_amount)}</p>
            </div>
            <div>
              <p className="text-emerald-100 text-sm">Entradas</p>
              <p className="text-xl font-bold text-green-200">+{formatCurrency(totalIn)}</p>
            </div>
            <div>
              <p className="text-emerald-100 text-sm">Saídas</p>
              <p className="text-xl font-bold text-red-200">-{formatCurrency(totalOut)}</p>
            </div>
            <div>
              <p className="text-emerald-100 text-sm">Saldo Atual</p>
              <p className="text-xl font-bold">{formatCurrency(openRegister.opening_amount + totalIn - totalOut)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Movimentações do Dia */}
      <div className="bg-white rounded-2xl border shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Movimentações de Hoje
          </h3>
          <span className="text-sm text-slate-500">{todayMovements.length} registros</span>
        </div>
        
        {todayMovements.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-2" />
            <p className="text-slate-500">Nenhuma movimentação hoje</p>
          </div>
        ) : (
          <div className="divide-y max-h-80 overflow-y-auto">
            {todayMovements.map((mov: CashMovement) => (
              <div key={mov.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  {mov.type === 'sale' || mov.type === 'deposit' ? (
                    <div className="p-2 bg-green-100 rounded-lg">
                      <ArrowUpCircle className="w-5 h-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="p-2 bg-red-100 rounded-lg">
                      <ArrowDownCircle className="w-5 h-5 text-red-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-slate-800">
                      {mov.type === 'sale' ? 'Venda' : 
                       mov.type === 'deposit' ? 'Depósito' :
                       mov.type === 'withdrawal' ? 'Sangria' : 'Ajuste'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {mov.description || mov.payment_method || '-'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    mov.type === 'sale' || mov.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {mov.type === 'sale' || mov.type === 'deposit' ? '+' : '-'}
                    {formatCurrency(mov.amount)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(mov.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Histórico de Caixas */}
      <div className="bg-white rounded-2xl border shadow-sm">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Histórico de Caixas
          </h3>
        </div>
        <div className="divide-y">
          {registers.slice(0, 5).map((reg: CashRegister) => (
            <div key={reg.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {reg.status === 'open' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <p className="font-medium">
                    {new Date(reg.opened_at).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm text-slate-500">
                    {reg.status === 'open' ? 'Aberto' : 'Fechado'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCurrency(reg.opening_amount)}</p>
                {reg.closing_amount !== null && (
                  <p className={`text-sm ${
                    (reg.difference || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Dif: {formatCurrency(reg.difference || 0)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Abrir Caixa */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Abrir Caixa</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Valor de Abertura (troco inicial)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={openingAmount}
                  onChange={e => setOpeningAmount(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl text-lg"
                  placeholder="0,00"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowOpenModal(false)}>
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700" 
                onClick={handleOpenCash}
                disabled={saving || !openingAmount}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Abrir Caixa'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Fechar Caixa */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Fechar Caixa</h3>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">Abertura</span>
                  <span className="font-medium">{formatCurrency(openRegister?.opening_amount || 0)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">Entradas</span>
                  <span className="font-medium text-green-600">+{formatCurrency(totalIn)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">Saídas</span>
                  <span className="font-medium text-red-600">-{formatCurrency(totalOut)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-bold">Esperado</span>
                  <span className="font-bold text-emerald-600">
                    {formatCurrency((openRegister?.opening_amount || 0) + totalIn - totalOut)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Valor em Caixa (contado)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={closingAmount}
                  onChange={e => setClosingAmount(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl text-lg"
                  placeholder="0,00"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowCloseModal(false)}>
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-red-600 hover:bg-red-700" 
                onClick={handleCloseCash}
                disabled={saving || !closingAmount}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fechar Caixa'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Movimentação */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Nova Movimentação</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMovementType('deposit')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    movementType === 'deposit' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-slate-200'
                  }`}
                >
                  <ArrowUpCircle className={`w-8 h-8 mx-auto mb-2 ${
                    movementType === 'deposit' ? 'text-green-600' : 'text-slate-400'
                  }`} />
                  <p className="font-medium">Depósito</p>
                </button>
                <button
                  onClick={() => setMovementType('withdrawal')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    movementType === 'withdrawal' 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-slate-200'
                  }`}
                >
                  <ArrowDownCircle className={`w-8 h-8 mx-auto mb-2 ${
                    movementType === 'withdrawal' ? 'text-red-600' : 'text-slate-400'
                  }`} />
                  <p className="font-medium">Sangria</p>
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  value={movementAmount}
                  onChange={e => setMovementAmount(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl text-lg"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={movementDescription}
                  onChange={e => setMovementDescription(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl"
                  placeholder="Ex: Sangria para depósito bancário"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowMovementModal(false)}>
                Cancelar
              </Button>
              <Button 
                className={`flex-1 ${movementType === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                onClick={handleAddMovement}
                disabled={saving || !movementAmount}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

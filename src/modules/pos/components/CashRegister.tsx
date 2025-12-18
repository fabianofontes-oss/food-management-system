'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, ArrowDownCircle, ArrowUpCircle, Lock, 
  Unlock, Calculator, Clock, X, Check, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { CashRegisterSession, CashMovement } from '../types'

interface CashRegisterProps {
  storeId: string
  attendant: string
  session: CashRegisterSession | null
  onSessionChange: (session: CashRegisterSession | null) => void
  darkMode: boolean
}

export function CashRegister({ storeId, attendant, session, onSessionChange, darkMode }: CashRegisterProps) {
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'open' | 'close' | 'withdrawal' | 'deposit'>('open')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [closingBalance, setClosingBalance] = useState('')
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [loading, setLoading] = useState(false)

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white'
  const textColor = darkMode ? 'text-white' : 'text-gray-900'
  const mutedText = darkMode ? 'text-gray-400' : 'text-gray-500'
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200'

  useEffect(() => {
    if (session) loadMovements()
  }, [session])

  const loadMovements = async () => {
    if (!session) return
    const { data } = await supabase
      .from('cash_movements')
      .select('*')
      .eq('cash_session_id', session.id)
      .order('created_at', { ascending: false })
    if (data) setMovements(data)
  }

  const openCashRegister = async () => {
    if (!amount) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('cash_register_sessions')
        .insert({
          store_id: storeId,
          attendant,
          opening_balance: parseFloat(amount),
          cash_sales: 0,
          card_sales: 0,
          pix_sales: 0,
          withdrawals: 0,
          deposits: 0,
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error
      onSessionChange(data)
      setShowModal(false)
      setAmount('')
    } catch (error) {
      console.error('Erro ao abrir caixa:', error)
      alert('Erro ao abrir caixa')
    } finally {
      setLoading(false)
    }
  }

  const closeCashRegister = async () => {
    if (!session || !closingBalance) return
    setLoading(true)
    try {
      const expectedBalance = session.opening_balance + session.cash_sales + session.deposits - session.withdrawals
      const difference = parseFloat(closingBalance) - expectedBalance

      const { error } = await supabase
        .from('cash_register_sessions')
        .update({
          closed_at: new Date().toISOString(),
          closing_balance: parseFloat(closingBalance),
          expected_balance: expectedBalance,
          difference,
          status: 'closed'
        })
        .eq('id', session.id)

      if (error) throw error
      onSessionChange(null)
      setShowModal(false)
      setClosingBalance('')
    } catch (error) {
      console.error('Erro ao fechar caixa:', error)
      alert('Erro ao fechar caixa')
    } finally {
      setLoading(false)
    }
  }

  const addMovement = async (type: 'withdrawal' | 'deposit') => {
    if (!session || !amount || !reason) return
    setLoading(true)
    try {
      const value = parseFloat(amount)
      
      await supabase.from('cash_movements').insert({
        cash_session_id: session.id,
        type,
        amount: value,
        reason,
        attendant
      })

      const updateField = type === 'withdrawal' ? 'withdrawals' : 'deposits'
      await supabase
        .from('cash_register_sessions')
        .update({ [updateField]: session[updateField] + value })
        .eq('id', session.id)

      onSessionChange({
        ...session,
        [updateField]: session[updateField] + value
      })

      loadMovements()
      setShowModal(false)
      setAmount('')
      setReason('')
    } catch (error) {
      console.error('Erro ao registrar movimento:', error)
      alert('Erro ao registrar movimento')
    } finally {
      setLoading(false)
    }
  }

  const expectedBalance = session 
    ? session.opening_balance + session.cash_sales + session.deposits - session.withdrawals 
    : 0

  return (
    <>
      {/* Botão de status do caixa */}
      <button
        onClick={() => {
          setModalType(session ? 'close' : 'open')
          setShowModal(true)
        }}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${
          session 
            ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
            : 'bg-gradient-to-r from-red-500 to-rose-600'
        }`}
      >
        <div className="p-2 bg-white/20 rounded-lg">
          {session ? <Unlock className="w-5 h-5 text-white" /> : <Lock className="w-5 h-5 text-white" />}
        </div>
        <div>
          <p className="text-xs text-white/80 font-medium">{session ? 'Caixa Aberto' : 'Caixa Fechado'}</p>
          <p className="font-bold text-white text-lg">{session ? formatCurrency(expectedBalance) : '---'}</p>
        </div>
      </button>

      {/* Botões de sangria/suprimento quando caixa aberto */}
      {session && (
        <div className="flex gap-2">
          <button
            onClick={() => { setModalType('withdrawal'); setShowModal(true) }}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-orange-100 text-orange-700 text-sm"
          >
            <ArrowUpCircle className="w-4 h-4" />
            Sangria
          </button>
          <button
            onClick={() => { setModalType('deposit'); setShowModal(true) }}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-100 text-blue-700 text-sm"
          >
            <ArrowDownCircle className="w-4 h-4" />
            Suprimento
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${cardBg} rounded-2xl p-6 w-full max-w-md shadow-2xl`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${
                  modalType === 'open' ? 'bg-green-100' : 
                  modalType === 'close' ? 'bg-red-100' :
                  modalType === 'withdrawal' ? 'bg-orange-100' : 'bg-blue-100'
                }`}>
                  {modalType === 'open' ? <Unlock className="w-6 h-6 text-green-600" /> :
                   modalType === 'close' ? <Lock className="w-6 h-6 text-red-600" /> :
                   modalType === 'withdrawal' ? <ArrowUpCircle className="w-6 h-6 text-orange-600" /> :
                   <ArrowDownCircle className="w-6 h-6 text-blue-600" />}
                </div>
                <h2 className={`text-xl font-bold ${textColor}`}>
                  {modalType === 'open' ? 'Abrir Caixa' :
                   modalType === 'close' ? 'Fechar Caixa' :
                   modalType === 'withdrawal' ? 'Sangria' : 'Suprimento'}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className={mutedText}>
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Conteúdo do modal */}
            {modalType === 'open' && (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${textColor} mb-2`}>Valor Inicial do Caixa</label>
                  <div className="relative">
                    <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${mutedText}`} />
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0,00"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border ${borderColor} ${cardBg} ${textColor}`}
                      autoFocus
                    />
                  </div>
                </div>
                <Button onClick={openCashRegister} disabled={loading || !amount} className="w-full h-12 bg-green-600 hover:bg-green-700">
                  {loading ? 'Abrindo...' : 'Abrir Caixa'}
                </Button>
              </div>
            )}

            {modalType === 'close' && session && (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className={mutedText}>Abertura</span><span className={textColor}>{formatCurrency(session.opening_balance)}</span></div>
                    <div className="flex justify-between"><span className={mutedText}>Vendas Dinheiro</span><span className="text-green-500">+{formatCurrency(session.cash_sales)}</span></div>
                    <div className="flex justify-between"><span className={mutedText}>Suprimentos</span><span className="text-blue-500">+{formatCurrency(session.deposits)}</span></div>
                    <div className="flex justify-between"><span className={mutedText}>Sangrias</span><span className="text-orange-500">-{formatCurrency(session.withdrawals)}</span></div>
                    <div className={`flex justify-between pt-2 border-t ${borderColor} font-bold`}>
                      <span className={textColor}>Esperado</span>
                      <span className="text-blue-600">{formatCurrency(expectedBalance)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${textColor} mb-2`}>Valor Contado (Fechamento Cego)</label>
                  <div className="relative">
                    <Calculator className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${mutedText}`} />
                    <input
                      type="number"
                      value={closingBalance}
                      onChange={(e) => setClosingBalance(e.target.value)}
                      placeholder="Conte o dinheiro..."
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border ${borderColor} ${cardBg} ${textColor}`}
                      autoFocus
                    />
                  </div>
                </div>

                {closingBalance && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 ${
                    parseFloat(closingBalance) === expectedBalance 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {parseFloat(closingBalance) === expectedBalance ? (
                      <><Check className="w-5 h-5" /> Caixa fechando corretamente!</>
                    ) : (
                      <><AlertCircle className="w-5 h-5" /> Diferença: {formatCurrency(parseFloat(closingBalance) - expectedBalance)}</>
                    )}
                  </div>
                )}

                <Button onClick={closeCashRegister} disabled={loading || !closingBalance} className="w-full h-12 bg-red-600 hover:bg-red-700">
                  {loading ? 'Fechando...' : 'Fechar Caixa'}
                </Button>
              </div>
            )}

            {(modalType === 'withdrawal' || modalType === 'deposit') && (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${textColor} mb-2`}>Valor</label>
                  <div className="relative">
                    <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${mutedText}`} />
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0,00"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border ${borderColor} ${cardBg} ${textColor}`}
                      autoFocus
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${textColor} mb-2`}>Motivo</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={modalType === 'withdrawal' ? 'Ex: Troco para cliente' : 'Ex: Reforço de caixa'}
                    className={`w-full px-4 py-3 rounded-xl border ${borderColor} ${cardBg} ${textColor}`}
                  />
                </div>
                <Button 
                  onClick={() => addMovement(modalType)} 
                  disabled={loading || !amount || !reason} 
                  className={`w-full h-12 ${modalType === 'withdrawal' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {loading ? 'Registrando...' : 'Confirmar'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

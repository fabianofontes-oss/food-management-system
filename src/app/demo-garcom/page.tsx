'use client'

import { useState } from 'react'
import { Utensils, ArrowLeft, Plus, X, Users, DollarSign, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatarMoeda } from '@/lib/marketing-utils'

type MesaStatus = 'livre' | 'ocupada' | 'aguardando'

interface Mesa {
  id: number
  numero: string
  status: MesaStatus
  total: number
  tempo: number
  itens: Array<{ nome: string; qtd: number; preco: number }>
}

const MESAS_INICIAIS: Mesa[] = [
  { id: 1, numero: '1', status: 'livre', total: 0, tempo: 0, itens: [] },
  { id: 2, numero: '2', status: 'ocupada', total: 85, tempo: 15, itens: [
    { nome: 'Hambúrguer Artesanal', qtd: 2, preco: 60 },
    { nome: 'Batata Frita', qtd: 1, preco: 15 },
    { nome: 'Refrigerante', qtd: 2, preco: 10 },
  ]},
  { id: 3, numero: '3', status: 'aguardando', total: 120, tempo: 8, itens: [
    { nome: 'Pizza Margherita', qtd: 1, preco: 45 },
    { nome: 'Pizza Calabresa', qtd: 1, preco: 45 },
    { nome: 'Cerveja', qtd: 6, preco: 30 },
  ]},
  { id: 4, numero: '4', status: 'livre', total: 0, tempo: 0, itens: [] },
  { id: 5, numero: '5', status: 'ocupada', total: 45, tempo: 22, itens: [
    { nome: 'Salada Caesar', qtd: 1, preco: 28 },
    { nome: 'Suco Natural', qtd: 1, preco: 12 },
    { nome: 'Água', qtd: 1, preco: 5 },
  ]},
  { id: 6, numero: '6', status: 'livre', total: 0, tempo: 0, itens: [] },
]

export default function DemoGarcomPage() {
  const [mesas, setMesas] = useState<Mesa[]>(MESAS_INICIAIS)
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null)
  const [showAddItem, setShowAddItem] = useState(false)

  const getStatusColor = (status: MesaStatus) => {
    if (status === 'livre') return 'bg-green-100 border-green-300 text-green-700'
    if (status === 'ocupada') return 'bg-yellow-100 border-yellow-300 text-yellow-700'
    return 'bg-orange-100 border-orange-300 text-orange-700'
  }

  const getStatusLabel = (status: MesaStatus) => {
    if (status === 'livre') return 'Livre'
    if (status === 'ocupada') return 'Ocupada'
    return 'Aguardando'
  }

  const adicionarItem = (nome: string, preco: number) => {
    if (!mesaSelecionada) return
    
    const mesasAtualizadas = mesas.map(m => {
      if (m.id === mesaSelecionada.id) {
        const novosItens = [...m.itens, { nome, qtd: 1, preco }]
        const novoTotal = novosItens.reduce((acc, item) => acc + (item.qtd * item.preco), 0)
        return { ...m, itens: novosItens, total: novoTotal, status: 'ocupada' as MesaStatus }
      }
      return m
    })
    
    setMesas(mesasAtualizadas)
    setMesaSelecionada(mesasAtualizadas.find(m => m.id === mesaSelecionada.id) || null)
    setShowAddItem(false)
  }

  const fecharMesa = (mesaId: number) => {
    const mesasAtualizadas = mesas.map(m => 
      m.id === mesaId ? { ...m, status: 'livre' as MesaStatus, total: 0, tempo: 0, itens: [] } : m
    )
    setMesas(mesasAtualizadas)
    setMesaSelecionada(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Demo Garçom</p>
              <p className="text-xs text-slate-500">Restaurante Demo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
              MODO DEMO
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/para-garcons">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Sair
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Grid de Mesas */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Minhas Mesas</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {mesas.map((mesa) => (
            <button
              key={mesa.id}
              onClick={() => setMesaSelecionada(mesa)}
              className={`p-6 rounded-2xl border-2 transition-all hover:shadow-lg ${
                getStatusColor(mesa.status)
              }`}
            >
              <div className="text-center">
                <p className="text-2xl font-bold mb-2">Mesa {mesa.numero}</p>
                <p className="text-sm font-medium mb-2">{getStatusLabel(mesa.status)}</p>
                {mesa.status !== 'livre' && (
                  <>
                    <p className="text-lg font-bold">{formatarMoeda(mesa.total)}</p>
                    <p className="text-xs mt-1">{mesa.tempo} min</p>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal Comanda */}
      {mesaSelecionada && !showAddItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Mesa {mesaSelecionada.numero}</h3>
                <p className="text-sm text-slate-500">{mesaSelecionada.tempo} min</p>
              </div>
              <button
                onClick={() => setMesaSelecionada(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {mesaSelecionada.itens.length === 0 ? (
                <div className="text-center py-8">
                  <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Mesa vazia</p>
                  <p className="text-sm text-slate-400">Adicione itens para começar</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {mesaSelecionada.itens.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">{item.qtd}x {item.nome}</p>
                      </div>
                      <p className="font-bold text-slate-800">{formatarMoeda(item.qtd * item.preco)}</p>
                    </div>
                  ))}
                </div>
              )}

              {mesaSelecionada.itens.length > 0 && (
                <div className="border-t border-slate-200 pt-4 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-bold">{formatarMoeda(mesaSelecionada.total)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-600">Taxa serviço (10%)</span>
                    <span className="font-bold">{formatarMoeda(mesaSelecionada.total * 0.1)}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="font-bold text-slate-800">Total</span>
                    <span className="font-bold text-green-600">{formatarMoeda(mesaSelecionada.total * 1.1)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={() => setShowAddItem(true)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Item
                </Button>
                {mesaSelecionada.itens.length > 0 && (
                  <>
                    <Button variant="outline" className="w-full">
                      Enviar para Cozinha
                    </Button>
                    <Button
                      onClick={() => fecharMesa(mesaSelecionada.id)}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      Fechar Conta
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Item */}
      {showAddItem && mesaSelecionada && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Adicionar Item</h3>
              <button
                onClick={() => setShowAddItem(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {[
                { nome: 'Hambúrguer Artesanal', preco: 30 },
                { nome: 'Pizza Margherita', preco: 45 },
                { nome: 'Batata Frita', preco: 15 },
                { nome: 'Refrigerante', preco: 5 },
                { nome: 'Cerveja', preco: 8 },
                { nome: 'Salada Caesar', preco: 28 },
                { nome: 'Suco Natural', preco: 12 },
              ].map((produto, i) => (
                <button
                  key={i}
                  onClick={() => adicionarItem(produto.nome, produto.preco)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-orange-50 rounded-xl transition-colors"
                >
                  <span className="font-medium text-slate-800">{produto.nome}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800">{formatarMoeda(produto.preco)}</span>
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Plus className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Banner Demo */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-3 text-center">
        <p className="text-sm">
          💡 Esta é uma demonstração. Peça para seu gerente ativar o sistema.
          <Link href="/para-garcons" className="ml-2 underline font-medium">
            Saber mais
          </Link>
        </p>
      </div>
    </div>
  )
}

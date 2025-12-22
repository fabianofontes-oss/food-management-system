/**
 * Landing Page para Motoristas - entregou.food
 * Recrutamento e cadastro de entregadores
 * 
 * TODO: Implementar layout completo conforme SPECS-LANDING-PAGES.md
 * Por enquanto, placeholder para não quebrar roteamento
 */

'use client'

import { Truck, Users, DollarSign, Star, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ParaMotoristasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Ganhe Dinheiro Fazendo Entregas
          </h1>
          <p className="text-xl text-cyan-100 mb-8 max-w-2xl mx-auto">
            Seja seu próprio chefe. Escolha seus horários. Receba semanalmente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              asChild
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white text-lg px-8 py-6 shadow-2xl"
            >
              <Link href="/cadastro-motorista">
                Quero Ser Entregador
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Link 
              href="/login"
              className="text-white/90 hover:text-white underline"
            >
              Já sou cadastrado
            </Link>
          </div>
          <div className="mt-6 inline-block px-4 py-2 bg-yellow-400 text-yellow-900 rounded-full font-bold">
            💰 Ganhe até R$ 3.000/mês
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 -mt-12 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
            <Users className="w-12 h-12 text-cyan-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-slate-800">500+</p>
            <p className="text-slate-600">Entregadores</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
            <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-slate-800">R$ 2.5k</p>
            <p className="text-slate-600">Média/mês</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
            <Star className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <p className="text-3xl font-bold text-slate-800">4.8/5</p>
            <p className="text-slate-600">Satisfação</p>
          </div>
        </div>
      </div>

      {/* Placeholder para seções completas */}
      <div className="max-w-4xl mx-auto px-4 pb-16 text-center">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-amber-900 mb-4">
            🚧 Página em Construção
          </h2>
          <p className="text-amber-800 mb-6">
            Esta landing page está sendo desenvolvida com layout completo no Stitch/V0.
            <br />
            Veja as especificações completas em <code className="bg-amber-100 px-2 py-1 rounded">SPECS-LANDING-PAGES.md</code>
          </p>
          <Button asChild>
            <Link href="/cadastro-motorista">
              Ir para Cadastro
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

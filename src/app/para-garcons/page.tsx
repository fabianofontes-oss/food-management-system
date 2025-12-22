/**
 * Landing Page para Garçons - pediufood.com/para-garcons
 * Demonstração do sistema de comandas digitais
 * 
 * TODO: Implementar layout completo conforme SPECS-LANDING-PAGES.md
 * Por enquanto, placeholder para não quebrar roteamento
 */

'use client'

import { Utensils, Zap, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ParaGarconsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Utensils className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Atenda Mais Mesas com Tecnologia
          </h1>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            App de comandas digital. Sem papel, sem erro, mais gorjetas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              asChild
              size="lg"
              className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-8 py-6 shadow-2xl"
            >
              <Link href="/demo-garcom">
                Experimentar Grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
          <div className="mt-6 inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
            ✨ Usado em 200+ restaurantes
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 -mt-12 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
            <Zap className="w-12 h-12 text-orange-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-slate-800">3x</p>
            <p className="text-slate-600">Mais Rápido</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-slate-800">Zero</p>
            <p className="text-slate-600">Erros</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
            <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-slate-800">+30%</p>
            <p className="text-slate-600">Gorjetas</p>
          </div>
        </div>
      </div>

      {/* Placeholder */}
      <div className="max-w-4xl mx-auto px-4 pb-16 text-center">
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-orange-900 mb-4">
            🚧 Página em Construção
          </h2>
          <p className="text-orange-800 mb-6">
            Esta landing page está sendo desenvolvida com layout completo no Stitch/V0.
            <br />
            Veja as especificações completas em <code className="bg-orange-100 px-2 py-1 rounded">SPECS-LANDING-PAGES.md</code>
          </p>
          <Button asChild>
            <Link href="/demo-garcom">
              Testar Demo
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

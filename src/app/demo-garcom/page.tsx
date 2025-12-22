/**
 * Demo Interativo - App do Garçom
 * Simulação do sistema de comandas digitais
 * 
 * TODO: Implementar demo completo conforme SPECS-LANDING-PAGES.md
 * Por enquanto, placeholder
 */

'use client'

import { Utensils, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DemoGarcomPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
          <Utensils className="w-8 h-8 text-white" />
        </div>
        
        <div className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-4">
          MODO DEMO
        </div>
        
        <h1 className="text-3xl font-bold text-slate-800 mb-4">
          Demo do App Garçom
        </h1>
        
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
          <p className="text-sm text-amber-800">
            🚧 <strong>Demo interativo em desenvolvimento</strong>
            <br />
            <br />
            Simulação completa do app com mesas, comandas e fechamento de conta.
            <br />
            Veja specs em <code className="bg-amber-100 px-2 py-1 rounded text-xs">SPECS-LANDING-PAGES.md</code>
          </p>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link href="/para-garcons">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar para Landing
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/[slug]/garcom" as="/demo/garcom">
              Ver App Real (Demo)
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

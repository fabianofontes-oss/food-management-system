/**
 * Cadastro de Motorista - Multi-step Form
 * 
 * TODO: Implementar form completo conforme SPECS-LANDING-PAGES.md
 * Por enquanto, placeholder
 */

'use client'

import { Truck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function CadastroMotoristaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
          <Truck className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-800 mb-4">
          Cadastro de Motorista
        </h1>
        
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
          <p className="text-sm text-amber-800">
            🚧 <strong>Formulário em desenvolvimento</strong>
            <br />
            <br />
            Multi-step form com 4 etapas sendo criado no Stitch/V0.
            <br />
            Veja specs em <code className="bg-amber-100 px-2 py-1 rounded text-xs">SPECS-LANDING-PAGES.md</code>
          </p>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link href="/para-motoristas">
              <ArrowRight className="w-5 h-5 mr-2" />
              Voltar para Landing
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">
              Já tenho cadastro
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

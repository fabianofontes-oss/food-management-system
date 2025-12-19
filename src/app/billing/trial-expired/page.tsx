import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function TrialExpiredPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-orange-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Trial Expirado
        </h1>

        <p className="text-gray-600 mb-8">
          Seu período de teste gratuito expirou. Para continuar usando o sistema,
          escolha um plano e ative sua assinatura.
        </p>

        <div className="space-y-4">
          <Link
            href="/billing/plans"
            className="block w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-orange-700 hover:to-red-700 transition-all"
          >
            Ver Planos Disponíveis
          </Link>

          <Link
            href="/contact"
            className="block w-full border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:border-gray-400 transition-all"
          >
            Falar com Suporte
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Dúvidas? Entre em contato conosco pelo email{' '}
          <a href="mailto:suporte@sistema.com" className="text-orange-600 hover:underline">
            suporte@sistema.com
          </a>
        </p>
      </div>
    </div>
  )
}

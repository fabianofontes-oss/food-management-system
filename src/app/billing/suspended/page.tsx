import { Ban } from 'lucide-react'
import Link from 'next/link'

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Ban className="w-10 h-10 text-red-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Conta Suspensa
        </h1>

        <p className="text-gray-600 mb-8">
          Sua conta foi suspensa por falta de pagamento. Para reativar o acesso,
          regularize sua situação financeira.
        </p>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
          <p className="text-sm text-red-800">
            <strong>Importante:</strong> Enquanto sua conta estiver suspensa,
            você não poderá acessar o dashboard nem realizar operações.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/billing/payment"
            className="block w-full bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-red-700 hover:to-pink-700 transition-all"
          >
            Regularizar Pagamento
          </Link>

          <Link
            href="/contact"
            className="block w-full border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:border-gray-400 transition-all"
          >
            Falar com Suporte
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Precisa de ajuda? Entre em contato:{' '}
          <a href="mailto:financeiro@sistema.com" className="text-red-600 hover:underline">
            financeiro@sistema.com
          </a>
        </p>
      </div>
    </div>
  )
}

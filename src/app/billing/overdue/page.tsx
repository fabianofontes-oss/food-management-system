import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function OverduePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-yellow-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Pagamento Atrasado
        </h1>

        <p className="text-gray-600 mb-6">
          Identificamos que seu último pagamento está atrasado. Para evitar a
          suspensão da sua conta, regularize sua situação o quanto antes.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
          <p className="text-sm text-yellow-800 mb-2">
            <strong>Grace Period:</strong> Você tem até 3 dias após o vencimento
            para regularizar sem perder o acesso.
          </p>
          <p className="text-xs text-yellow-700">
            Após esse período, sua conta será suspensa automaticamente.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/billing/payment"
            className="block w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-yellow-700 hover:to-orange-700 transition-all"
          >
            Pagar Agora
          </Link>

          <Link
            href="/billing/invoices"
            className="block w-full border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:border-gray-400 transition-all"
          >
            Ver Faturas
          </Link>

          <Link
            href="/contact"
            className="block w-full text-gray-600 hover:text-gray-800 transition-all"
          >
            Falar com Suporte
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Dúvidas sobre cobrança?{' '}
          <a href="mailto:financeiro@sistema.com" className="text-yellow-600 hover:underline">
            financeiro@sistema.com
          </a>
        </p>
      </div>
    </div>
  )
}

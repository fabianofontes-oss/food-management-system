import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-block p-3 bg-red-100 rounded-full mb-4">
            <ShieldAlert className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">403</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h2>
          <p className="text-gray-600 mb-8">
            Você não tem permissão para acessar esta página.
            Entre em contato com o administrador se você acredita que isso é um erro.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link 
              href="/login" 
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Fazer Login
            </Link>
            <Link 
              href="/" 
              className="inline-block bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
            >
              Voltar para Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

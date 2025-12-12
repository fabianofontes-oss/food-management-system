'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Store, Loader2, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type UserStore = {
  store_id: string
  store_slug: string
  store_name: string
  user_role: 'owner' | 'manager' | 'staff'
}

export default function SelectStorePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stores, setStores] = useState<UserStore[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    loadStores()
  }, [])

  async function loadStores() {
    try {
      const supabase = createClient()
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      const { data, error: storesError } = await supabase.rpc('get_user_stores')

      if (storesError) {
        console.error('Error fetching stores:', storesError)
        setError('Erro ao carregar suas lojas')
        setLoading(false)
        return
      }

      if (!data || data.length === 0) {
        setStores([])
        setLoading(false)
        return
      }

      if (data.length === 1) {
        router.push(`/${data[0].store_slug}/dashboard`)
        return
      }

      setStores(data)
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar lojas')
      setLoading(false)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Carregando suas lojas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-block p-3 bg-red-100 rounded-full mb-4">
              <Store className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleLogout}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              Fazer Logout
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (stores.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-block p-3 bg-yellow-100 rounded-full mb-4">
              <Store className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Nenhuma loja atribuída</h1>
            <p className="text-gray-600 mb-6">
              Você ainda não tem acesso a nenhuma loja. Entre em contato com o administrador para solicitar acesso.
            </p>
            <button
              onClick={handleLogout}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold flex items-center justify-center gap-2 mx-auto"
            >
              <LogOut className="w-5 h-5" />
              Fazer Logout
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Selecione uma loja</h1>
            <p className="text-gray-600">Você tem acesso a {stores.length} lojas</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div
              key={store.store_id}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => router.push(`/${store.store_slug}/dashboard`)}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Store className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{store.store_name}</h2>
                  <p className="text-sm text-gray-500">/{store.store_slug}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  store.user_role === 'owner' 
                    ? 'bg-purple-100 text-purple-700'
                    : store.user_role === 'manager'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {store.user_role === 'owner' ? 'Proprietário' : 
                   store.user_role === 'manager' ? 'Gerente' : 'Funcionário'}
                </span>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm">
                  Abrir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

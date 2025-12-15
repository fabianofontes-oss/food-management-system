'use client'

import { useState, useEffect } from 'react'
import { Users, Trash2, Mail, Shield, Search, Loader2, Store, Building2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSystemUsers, getUserStats, deleteSystemUser, type SystemUser } from '@/lib/superadmin/users'
import { isSuperAdmin } from '@/lib/auth/super-admin'
import { toast } from 'sonner'

const roleLabels: Record<string, { label: string; color: string }> = {
  'OWNER': { label: 'Proprietário', color: 'text-red-600 bg-red-50' },
  'MANAGER': { label: 'Gerente', color: 'text-purple-600 bg-purple-50' },
  'CASHIER': { label: 'Caixa', color: 'text-blue-600 bg-blue-50' },
  'KITCHEN': { label: 'Cozinha', color: 'text-orange-600 bg-orange-50' },
  'DELIVERY': { label: 'Entregador', color: 'text-green-600 bg-green-50' },
  'UNKNOWN': { label: 'Desconhecido', color: 'text-gray-600 bg-gray-50' }
}

export default function UsersPage() {
  const [users, setUsers] = useState<SystemUser[]>([])
  const [stats, setStats] = useState<{
    totalUsers: number
    usersWithStores: number
    roleDistribution: Record<string, number>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [usersData, statsData] = await Promise.all([
        getSystemUsers(),
        getUserStats()
      ])
      setUsers(usersData)
      setStats(statsData)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      const result = await deleteSystemUser(userId)
      if (result.success) {
        toast.success('Usuário excluído com sucesso')
        loadData() // Recarregar lista
      } else {
        toast.error(result.error || 'Erro ao excluir usuário')
      }
    } catch (err) {
      console.error('Erro ao excluir usuário:', err)
      toast.error('Erro ao excluir usuário')
    }
  }

  const getRoleInfo = (role: string) => {
    return roleLabels[role] || roleLabels['UNKNOWN']
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadData}>Tentar Novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Gestão de Usuários</h1>
            <p className="text-gray-600 mt-1">Usuários cadastrados no sistema (dados reais do banco)</p>
          </div>
          <Button onClick={loadData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</span>
            </div>
            <div className="text-gray-600">Total de Usuários</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Store className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-bold text-gray-900">{stats?.usersWithStores || 0}</span>
            </div>
            <div className="text-gray-600">Com Lojas Vinculadas</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-8 h-8 text-purple-600" />
              <span className="text-3xl font-bold text-gray-900">
                {users.filter(u => isSuperAdmin(u.email)).length}
              </span>
            </div>
            <div className="text-gray-600">Super Admins</div>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.map((user) => {
            const isSuper = isSuperAdmin(user.email)
            return (
              <div key={user.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-6 h-6 text-blue-600" />
                      <h3 className="text-2xl font-bold text-gray-900">{user.name}</h3>
                      {isSuper && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                          Super Admin
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                      
                      {/* Lojas vinculadas */}
                      {user.stores.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-gray-500 mb-2">Lojas vinculadas:</p>
                          <div className="flex flex-wrap gap-2">
                            {user.stores.map((store, idx) => {
                              const roleInfo = getRoleInfo(store.role)
                              return (
                                <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                                  <Store className="w-4 h-4 text-gray-500" />
                                  <div>
                                    <span className="text-sm font-medium">{store.store_name}</span>
                                    <span className="text-xs text-gray-400 ml-2">({store.tenant_name})</span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${roleInfo.color}`}>
                                    {roleInfo.label}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      
                      {user.stores.length === 0 && (
                        <div className="flex items-center gap-2 text-amber-600 mt-2">
                          <Building2 className="w-4 h-4" />
                          <span className="text-sm">Sem lojas vinculadas</span>
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-500 mt-2">
                        Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(user.id, user.name)}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Excluir"
                      disabled={isSuper}
                    >
                      <Trash2 className={`w-5 h-5 ${isSuper ? 'opacity-30' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum usuário encontrado</p>
            <p className="text-gray-400 mt-2">
              {searchTerm ? 'Tente ajustar sua busca' : 'Usuários são criados quando fazem login no sistema'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Users, Plus, Edit, Trash2, Mail, Shield, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface User {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'tenant_admin' | 'store_manager'
  tenant_name?: string
  store_name?: string
  is_active: boolean
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Admin Sistema',
      email: 'admin@sistema.com',
      role: 'super_admin',
      is_active: true,
      created_at: '2024-01-01'
    },
    {
      id: '2',
      name: 'João Silva',
      email: 'joao@tenant.com',
      role: 'tenant_admin',
      tenant_name: 'Tenant Demo',
      is_active: true,
      created_at: '2024-02-15'
    }
  ])

  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'store_manager' as User['role'],
    is_active: true
  })

  const roles = [
    { value: 'super_admin', label: 'Super Admin', color: 'text-red-600 bg-red-50' },
    { value: 'tenant_admin', label: 'Admin Tenant', color: 'text-purple-600 bg-purple-50' },
    { value: 'store_manager', label: 'Gerente Loja', color: 'text-blue-600 bg-blue-50' }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingUser) {
      setUsers(users.map(u => 
        u.id === editingUser.id 
          ? { ...u, ...formData }
          : u
      ))
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        ...formData,
        created_at: new Date().toISOString()
      }
      setUsers([...users, newUser])
    }

    setFormData({ name: '', email: '', role: 'store_manager', is_active: true })
    setShowForm(false)
    setEditingUser(null)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active
    })
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      setUsers(users.filter(u => u.id !== id))
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingUser(null)
    setFormData({ name: '', email: '', role: 'store_manager', is_active: true })
  }

  const getRoleInfo = (role: string) => {
    return roles.find(r => r.value === role) || roles[2]
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Gestão de Usuários</h1>
          <p className="text-gray-600 mt-1">Gerenciar usuários e permissões do sistema</p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">{users.length}</span>
            </div>
            <div className="text-gray-600">Total de Usuários</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-bold text-gray-900">
                {users.filter(u => u.is_active).length}
              </span>
            </div>
            <div className="text-gray-600">Usuários Ativos</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Mail className="w-8 h-8 text-purple-600" />
              <span className="text-3xl font-bold text-gray-900">
                {users.filter(u => u.role === 'super_admin').length}
              </span>
            </div>
            <div className="text-gray-600">Super Admins</div>
          </div>
        </div>

        {/* Search and Add */}
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
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Usuário
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6">
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: João Silva"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Ex: joao@email.com"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Função *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    required
                  >
                    {roles.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">
                  Usuário Ativo
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.map((user) => {
            const roleInfo = getRoleInfo(user.role)
            return (
              <div key={user.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-6 h-6 text-blue-600" />
                      <h3 className="text-2xl font-bold text-gray-900">{user.name}</h3>
                      {user.is_active ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                          Inativo
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </div>
                      {user.tenant_name && (
                        <div className="text-sm text-gray-500">
                          Tenant: {user.tenant_name}
                        </div>
                      )}
                      {user.store_name && (
                        <div className="text-sm text-gray-500">
                          Loja: {user.store_name}
                        </div>
                      )}
                      <div className="text-sm text-gray-500">
                        Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum usuário encontrado</p>
            <p className="text-gray-400 mt-2">
              {searchTerm ? 'Tente ajustar sua busca' : 'Clique em "Adicionar Usuário" para começar'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

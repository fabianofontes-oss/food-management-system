'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Users, UserPlus, Loader2, Trash2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTeamMembers, inviteMember, updateMemberRole, removeMember } from './actions'
import { supabase } from '@/lib/supabase'

type TeamMember = {
  id: string
  user_id: string
  email: string
  role: 'owner' | 'manager' | 'staff'
  created_at: string
}

type UserRole = 'owner' | 'manager' | 'staff'

export default function TeamPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('staff')
  const [storeId, setStoreId] = useState<string>('')
  const [error, setError] = useState('')
  
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('staff')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  useEffect(() => {
    loadStoreAndMembers()
  }, [slug])

  async function loadStoreAndMembers() {
    try {
      setLoading(true)
      setError('')

      // Get store by slug
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', slug)
        .single()

      if (storeError || !store) {
        setError('Loja não encontrada')
        setLoading(false)
        return
      }

      setStoreId(store.id)

      // Get team members
      const result = await getTeamMembers(store.id)

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      setMembers(result.data || [])
      setCurrentUserRole(result.currentUserRole || 'staff')
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar equipe')
      setLoading(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteError('')
    setInviteSuccess('')

    const result = await inviteMember(storeId, inviteEmail, inviteRole)

    if (result.error) {
      setInviteError(result.error)
      setInviting(false)
      return
    }

    setInviteSuccess(`Convite enviado para ${inviteEmail}`)
    setInviteEmail('')
    setInviteRole('staff')
    setInviting(false)
    
    setTimeout(() => setInviteSuccess(''), 3000)
    loadStoreAndMembers()
  }

  async function handleRoleChange(memberId: string, newRole: UserRole) {
    const result = await updateMemberRole(storeId, memberId, newRole)

    if (result.error) {
      alert(result.error)
      return
    }

    loadStoreAndMembers()
  }

  async function handleRemove(memberId: string) {
    setRemovingId(memberId)
    
    const result = await removeMember(storeId, memberId)

    if (result.error) {
      alert(result.error)
      setRemovingId(null)
      setConfirmRemove(null)
      return
    }

    setRemovingId(null)
    setConfirmRemove(null)
    loadStoreAndMembers()
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  }

  function getRoleBadgeColor(role: UserRole) {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-700'
      case 'manager':
        return 'bg-blue-100 text-blue-700'
      case 'staff':
        return 'bg-gray-100 text-gray-700'
    }
  }

  function getRoleLabel(role: UserRole) {
    switch (role) {
      case 'owner':
        return 'Proprietário'
      case 'manager':
        return 'Gerente'
      case 'staff':
        return 'Funcionário'
    }
  }

  const canInvite = currentUserRole === 'owner' || currentUserRole === 'manager'
  const canChangeRoles = currentUserRole === 'owner'
  const canRemove = currentUserRole === 'owner' || currentUserRole === 'manager'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Carregando equipe...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={loadStoreAndMembers}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Equipe</h1>
          </div>
          <p className="text-gray-600">Gerencie os membros da sua loja</p>
        </div>

        {canInvite && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Convidar membro
            </h2>
            
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Papel
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    disabled={currentUserRole === 'manager'}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none disabled:bg-gray-100"
                  >
                    {currentUserRole === 'owner' && <option value="owner">Proprietário</option>}
                    {currentUserRole === 'owner' && <option value="manager">Gerente</option>}
                    <option value="staff">Funcionário</option>
                  </select>
                </div>
              </div>

              {inviteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {inviteError}
                </div>
              )}

              {inviteSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  {inviteSuccess}
                </div>
              )}

              <Button
                type="submit"
                disabled={inviting}
                className="w-full md:w-auto"
              >
                {inviting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando convite...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Enviar convite
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Membros ({members.length})
            </h2>
          </div>

          {members.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Nenhum membro ainda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Papel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adicionado em
                    </th>
                    {(canChangeRoles || canRemove) && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{member.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {canChangeRoles ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(member.role)}`}
                          >
                            <option value="owner">Proprietário</option>
                            <option value="manager">Gerente</option>
                            <option value="staff">Funcionário</option>
                          </select>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(member.role)}`}>
                            {getRoleLabel(member.role)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(member.created_at)}
                      </td>
                      {(canChangeRoles || canRemove) && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {canRemove && (
                            confirmRemove === member.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-gray-600 text-xs">Confirmar?</span>
                                <button
                                  onClick={() => handleRemove(member.id)}
                                  disabled={removingId === member.id}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                >
                                  {removingId === member.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Sim'
                                  )}
                                </button>
                                <button
                                  onClick={() => setConfirmRemove(null)}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmRemove(member.id)}
                                className="text-red-600 hover:text-red-900 flex items-center gap-1"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remover
                              </button>
                            )
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

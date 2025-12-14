'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Users, UserPlus, Loader2, Trash2, AlertCircle, Crown, Shield, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

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

  const supabase = useMemo(() => createClient(), [])
  
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('')
  const [storeId, setStoreId] = useState<string>('')
  const [tableExists, setTableExists] = useState(true)

  useEffect(() => {
    loadData()
  }, [slug])

  async function loadData() {
    try {
      setLoading(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserEmail(user.email || '')
      }

      // Get store by slug
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', slug)
        .single()

      if (store) {
        setStoreId(store.id)

        // Try to get team members
        const { data: membersData, error: membersError } = await supabase
          .from('store_users')
          .select('id, user_id, role, created_at')
          .eq('store_id', store.id)
          .order('created_at', { ascending: true })

        if (membersError) {
          // Tabela pode não existir
          console.log('Tabela store_users não existe ou erro:', membersError.message)
          setTableExists(false)
          
          // Criar membro fictício (o próprio usuário como owner)
          if (user) {
            setMembers([{
              id: 'current',
              user_id: user.id,
              email: user.email || 'Você',
              role: 'owner',
              created_at: new Date().toISOString()
            }])
          }
        } else {
          const membersWithEmail = (membersData || []).map((m: any) => ({
            ...m,
            email: m.user_id === user?.id ? (user?.email || 'Você') : 'Membro da equipe'
          }))
          setMembers(membersWithEmail.length > 0 ? membersWithEmail : [{
            id: 'current',
            user_id: user?.id || '',
            email: user?.email || 'Você',
            role: 'owner',
            created_at: new Date().toISOString()
          }])
        }
      }
      
      setLoading(false)
    } catch (err: any) {
      console.error('Erro:', err)
      setLoading(false)
    }
  }

  function getRoleBadgeColor(role: UserRole) {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-700'
      case 'manager': return 'bg-blue-100 text-blue-700'
      case 'staff': return 'bg-gray-100 text-gray-700'
    }
  }

  function getRoleLabel(role: UserRole) {
    switch (role) {
      case 'owner': return 'Proprietário'
      case 'manager': return 'Gerente'
      case 'staff': return 'Funcionário'
    }
  }

  function getRoleIcon(role: UserRole) {
    switch (role) {
      case 'owner': return <Crown className="w-5 h-5 text-purple-600" />
      case 'manager': return <Shield className="w-5 h-5 text-blue-600" />
      case 'staff': return <User className="w-5 h-5 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            Equipe
          </h1>
          <p className="text-slate-500 mt-2 ml-14">Membros da sua loja</p>
        </div>

        {!tableExists && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl">
            <p className="text-sm">
              <strong>Nota:</strong> A tabela de membros ainda não foi criada no banco de dados. 
              Execute as migrações SQL para habilitar o gerenciamento de equipe.
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Membros ({members.length})
          </h2>

          <div className="space-y-3">
            {members.map((member) => (
              <div 
                key={member.id} 
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    {getRoleIcon(member.role)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{member.email}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                      {getRoleLabel(member.role)}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-slate-400">
                  {member.email === currentUserEmail && (
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg text-xs font-medium">
                      Você
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {members.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400">Nenhum membro encontrado</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Adicionar Membros</h2>
          <p className="text-slate-500 text-sm mb-4">
            Para adicionar novos membros à equipe, é necessário configurar o Supabase Service Role Key.
          </p>
          <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600">
            <p className="font-medium mb-2">Passos para habilitar:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Adicione SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente do Vercel</li>
              <li>Redeploy a aplicação</li>
              <li>A funcionalidade de convite estará disponível</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

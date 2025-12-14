'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type UserRole = 'owner' | 'manager' | 'staff'

export async function getTeamMembers(storeId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Não autenticado', data: [], currentUserRole: 'staff' as UserRole }
    }

    // Verify user has access to this store
    const { data: access } = await supabase
      .from('store_users')
      .select('role')
      .eq('store_id', storeId)
      .eq('user_id', user.id)
      .single()

    if (!access) {
      return { error: 'Sem permissão', data: [], currentUserRole: 'staff' as UserRole }
    }

    // Get all store members with profiles
    const { data: members, error } = await supabase
      .from('store_users')
      .select('id, user_id, role, created_at, profiles(email, full_name)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: true })

    if (error) {
      // Se profiles não existe, buscar sem ele
      const { data: membersSimple, error: err2 } = await supabase
        .from('store_users')
        .select('id, user_id, role, created_at')
        .eq('store_id', storeId)
        .order('created_at', { ascending: true })
      
      if (err2) {
        return { error: err2.message, data: [], currentUserRole: (access as any).role }
      }
      
      const membersWithEmail = (membersSimple as any[])?.map((m: any) => ({
        ...m,
        email: m.user_id === user.id ? user.email : 'Membro da equipe'
      })) || []
      
      return { data: membersWithEmail, currentUserRole: (access as any).role }
    }

    const membersWithEmails = (members as any[])?.map((member: any) => ({
      ...member,
      email: member.profiles?.email || member.profiles?.full_name || 
             (member.user_id === user.id ? user.email : 'Membro da equipe')
    })) || []

    return { data: membersWithEmails, currentUserRole: (access as any).role }
  } catch (err: any) {
    console.error('Erro ao carregar equipe:', err)
    return { error: err.message || 'Erro desconhecido', data: [], currentUserRole: 'staff' as UserRole }
  }
}

export async function inviteMember(storeId: string, email: string, role: UserRole) {
  // Funcionalidade de convite requer configuração de admin
  // Por enquanto, retorna mensagem informativa
  return { error: 'Convite por email não está disponível. Configure SUPABASE_SERVICE_ROLE_KEY para habilitar.' }
}

export async function updateMemberRole(storeId: string, memberId: string, newRole: UserRole) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Não autenticado' }
    }

    // Verify user is owner
    const { data: access } = await supabase
      .from('store_users')
      .select('role')
      .eq('store_id', storeId)
      .eq('user_id', user.id)
      .single()

    if (!access || (access as any).role !== 'owner') {
      return { error: 'Apenas proprietários podem alterar papéis' }
    }

    // Get target member
    const { data: targetMember } = await supabase
      .from('store_users')
      .select('role, user_id')
      .eq('id', memberId)
      .single()

    if (!targetMember) {
      return { error: 'Membro não encontrado' }
    }

    // Prevent changing own role
    if ((targetMember as any).user_id === user.id) {
      return { error: 'Você não pode alterar seu próprio papel' }
    }

    // Update role
    const { error: updateError } = await supabase
      .from('store_users')
      .update({ role: newRole } as Record<string, unknown>)
      .eq('id', memberId)

    if (updateError) {
      return { error: updateError.message }
    }

    revalidatePath(`/[slug]/dashboard/team`)
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function removeMember(storeId: string, memberId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Não autenticado' }
    }

    // Verify user has permission (owner or manager)
    const { data: access } = await supabase
      .from('store_users')
      .select('role')
      .eq('store_id', storeId)
      .eq('user_id', user.id)
      .single()

    if (!access || ((access as any).role !== 'owner' && (access as any).role !== 'manager')) {
      return { error: 'Sem permissão para remover membros' }
    }

    // Get target member
    const { data: targetMember } = await supabase
      .from('store_users')
      .select('role, user_id')
      .eq('id', memberId)
      .single()

    if (!targetMember) {
      return { error: 'Membro não encontrado' }
    }

    // Prevent removing self
    if ((targetMember as any).user_id === user.id) {
      return { error: 'Você não pode remover a si mesmo' }
    }

    // Managers cannot remove owners
    if ((access as any).role === 'manager' && (targetMember as any).role === 'owner') {
      return { error: 'Gerentes não podem remover proprietários' }
    }

    // Check if this is the last owner
    if ((targetMember as any).role === 'owner') {
      const { data: owners } = await supabase
        .from('store_users')
        .select('id')
        .eq('store_id', storeId)
        .eq('role', 'owner')

      if (owners && owners.length <= 1) {
        return { error: 'Não é possível remover o último proprietário' }
      }
    }

    // Remove member
    const { error: deleteError } = await supabase
      .from('store_users')
      .delete()
      .eq('id', memberId)

    if (deleteError) {
      return { error: deleteError.message }
    }

    revalidatePath(`/[slug]/dashboard/team`)
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

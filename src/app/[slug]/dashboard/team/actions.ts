'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

type UserRole = 'owner' | 'manager' | 'staff'

export async function getTeamMembers(storeId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { error: 'Não autenticado' }
    }

    // Verify user has access to this store
    const { data: access } = await supabase
      .from('store_users')
      .select('role')
      .eq('store_id', storeId)
      .eq('user_id', session.user.id)
      .single()

    if (!access) {
      return { error: 'Sem permissão' }
    }

    // Get all store members
    const { data: members, error } = await supabase
      .from('store_users')
      .select('id, user_id, role, created_at')
      .eq('store_id', storeId)
      .order('created_at', { ascending: true })

    if (error) {
      return { error: error.message }
    }

    // Fetch user emails using admin client
    const membersWithEmails = await Promise.all(
      members.map(async (member) => {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(member.user_id)
        return {
          ...member,
          email: userData.user?.email || 'Email não disponível'
        }
      })
    )

    return { data: membersWithEmails, currentUserRole: access.role }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function inviteMember(storeId: string, email: string, role: UserRole) {
  try {
    const supabase = await createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { error: 'Não autenticado' }
    }

    // Verify user has permission (owner or manager)
    const { data: access } = await supabase
      .from('store_users')
      .select('role')
      .eq('store_id', storeId)
      .eq('user_id', session.user.id)
      .single()

    if (!access || (access.role !== 'owner' && access.role !== 'manager')) {
      return { error: 'Sem permissão para convidar membros' }
    }

    // Managers cannot assign owner role
    if (access.role === 'manager' && role === 'owner') {
      return { error: 'Gerentes não podem atribuir o papel de proprietário' }
    }

    // Check if user exists, if not create
    let userId: string

    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const user = existingUser.users.find(u => u.email === email)

    if (user) {
      userId = user.id
    } else {
      // Create new user with email confirmation
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true
      })

      if (createError || !newUser.user) {
        return { error: createError?.message || 'Erro ao criar usuário' }
      }

      userId = newUser.user.id

      // Generate password reset link for new user
      const { data: resetData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email
      })

      console.log('Password reset link for new user:', resetData)
    }

    // Add to store_users
    const { error: insertError } = await supabase
      .from('store_users')
      .insert({
        store_id: storeId,
        user_id: userId,
        role
      })

    if (insertError) {
      if (insertError.code === '23505') {
        return { error: 'Este usuário já é membro desta loja' }
      }
      return { error: insertError.message }
    }

    revalidatePath(`/[slug]/dashboard/team`)
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function updateMemberRole(storeId: string, memberId: string, newRole: UserRole) {
  try {
    const supabase = await createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { error: 'Não autenticado' }
    }

    // Verify user is owner
    const { data: access } = await supabase
      .from('store_users')
      .select('role')
      .eq('store_id', storeId)
      .eq('user_id', session.user.id)
      .single()

    if (!access || access.role !== 'owner') {
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
    if (targetMember.user_id === session.user.id) {
      return { error: 'Você não pode alterar seu próprio papel' }
    }

    // Update role
    const { error: updateError } = await supabase
      .from('store_users')
      .update({ role: newRole })
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
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { error: 'Não autenticado' }
    }

    // Verify user has permission (owner or manager)
    const { data: access } = await supabase
      .from('store_users')
      .select('role')
      .eq('store_id', storeId)
      .eq('user_id', session.user.id)
      .single()

    if (!access || (access.role !== 'owner' && access.role !== 'manager')) {
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
    if (targetMember.user_id === session.user.id) {
      return { error: 'Você não pode remover a si mesmo' }
    }

    // Managers cannot remove owners
    if (access.role === 'manager' && targetMember.role === 'owner') {
      return { error: 'Gerentes não podem remover proprietários' }
    }

    // Check if this is the last owner
    if (targetMember.role === 'owner') {
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

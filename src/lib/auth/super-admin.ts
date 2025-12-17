/**
 * Módulo de Autenticação SuperAdmin
 * 
 * PROTEÇÃO DE SEGURANÇA: Este módulo controla quem pode acessar o painel /admin
 * 
 * Formas de configurar Super Admins:
 * 1. Variável de ambiente SUPER_ADMIN_EMAILS (lista separada por vírgula)
 * 2. Lista hardcoded de fallback (para desenvolvimento)
 */

/**
 * Lista de emails de Super Admins (fallback para desenvolvimento)
 * IMPORTANTE: Em produção, use a variável de ambiente SUPER_ADMIN_EMAILS
 */
const HARDCODED_SUPER_ADMINS = [
  'admin@sistema.com',
  'fabiano@exemplo.com',
  'fabianobraga@me.com',
]

/**
 * Obtém a lista de emails de Super Admins
 * Prioridade: env SUPER_ADMIN_EMAILS > hardcoded list
 */
function getSuperAdminEmails(): string[] {
  const envEmails = process.env.SUPER_ADMIN_EMAILS

  if (envEmails) {
    return envEmails
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0)
  }

  return HARDCODED_SUPER_ADMINS.map(email => email.toLowerCase())
}

/**
 * Verifica se um email é de um Super Admin
 * 
 * @param email - Email do usuário a verificar
 * @returns true se o email está na lista de Super Admins
 */
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false

  const normalizedEmail = email.trim().toLowerCase()
  const superAdminEmails = getSuperAdminEmails()

  return superAdminEmails.includes(normalizedEmail)
}

/**
 * Verifica se o usuário atual (via sessão) é Super Admin
 * Versão async para uso com Supabase
 * 
 * @param supabase - Cliente Supabase
 * @returns true se o usuário logado é Super Admin
 */
export async function checkIsSuperAdmin(supabase: any): Promise<boolean> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return false
    }

    return isSuperAdmin(user.email)
  } catch (error) {
    console.error('Erro ao verificar Super Admin:', error)
    return false
  }
}

/**
 * Obtém informações do Super Admin atual
 * 
 * @param supabase - Cliente Supabase
 * @returns Dados do usuário se for Super Admin, null caso contrário
 */
export async function getSuperAdminUser(supabase: any): Promise<{
  id: string
  email: string
  name?: string
} | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    if (!isSuperAdmin(user.email)) {
      return null
    }

    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Admin'
    }
  } catch (error) {
    console.error('Erro ao obter Super Admin:', error)
    return null
  }
}

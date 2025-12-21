/**
 * Página de Verificação de Email
 * 
 * Mostra status de verificação e permite reenviar email.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Se já verificado, redirecionar
      if (user.email_confirmed_at) {
        router.push('/select-store')
        return
      }

      setLoading(false)
    } catch (err) {
      console.error('Erro ao verificar usuário:', err)
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!user?.email) return

    setSending(true)
    setMessage('')
    setError('')

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      })

      if (resendError) {
        setError(resendError.message)
      } else {
        setMessage('Email de verificação reenviado com sucesso! Verifique sua caixa de entrada.')
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar email')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
        {/* Ícone */}
        <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Mail className="w-10 h-10 text-blue-600" />
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">
          Verifique seu email
        </h1>

        <p className="text-slate-600 text-center mb-6">
          Enviamos um link de verificação para:
        </p>

        <div className="bg-slate-50 rounded-xl p-4 mb-6 text-center">
          <p className="font-medium text-slate-800">{user?.email}</p>
        </div>

        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-slate-700">
            <strong>Próximos passos:</strong>
          </p>
          <ol className="text-sm text-slate-600 mt-2 space-y-1 list-decimal list-inside">
            <li>Abra seu email</li>
            <li>Clique no link de verificação</li>
            <li>Volte aqui e faça login</li>
          </ol>
        </div>

        {/* Mensagens */}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 flex items-start gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{message}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Botão reenviar */}
        <Button
          onClick={handleResend}
          disabled={sending}
          variant="outline"
          className="w-full mb-4"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Reenviando...
            </>
          ) : (
            'Reenviar email de verificação'
          )}
        </Button>

        {/* Link voltar */}
        <Link href="/login" className="flex items-center justify-center gap-2 text-slate-600 hover:text-slate-800 text-sm">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao login
        </Link>

        {/* Aviso */}
        <p className="text-xs text-slate-500 text-center mt-6">
          Não recebeu o email? Verifique sua pasta de spam ou lixo eletrônico.
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Bike, User, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface StoreData {
  id: string
  name: string
  slug: string
}

interface DriverData {
  id: string
  name: string
  phone: string
  commission_percent: number
  photo_url?: string
}

export default function MotoristaLoginPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [store, setStore] = useState<StoreData | null>(null)
  const [activeTab, setActiveTab] = useState<'login' | 'cadastro'>('login')
  const [showPassword, setShowPassword] = useState(false)
  
  // Form fields
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    // Check if already logged in
    const driverData = localStorage.getItem(`driver_${slug}`)
    if (driverData) {
      router.push(`/${slug}/motorista/`)
      return
    }

    async function fetchStore() {
      const { data } = await supabase
        .from('stores')
        .select('id, name, slug')
        .eq('slug', slug)
        .single()
      
      if (data) {
        setStore(data)
      }
      setLoading(false)
    }
    if (slug) fetchStore()
  }, [slug, supabase, router])

  const handleLogin = async () => {
    if (!emailOrPhone || emailOrPhone.length < 10) {
      setLoginError('Digite um e-mail ou telefone válido')
      return
    }

    setSubmitting(true)
    setLoginError('')
    
    try {
      // Buscar motorista por telefone ou email
      const isEmail = emailOrPhone.includes('@')
      const query = supabase
        .from('drivers')
        .select('id, name, phone, commission_percent, photo_url')
        .eq('store_id', store?.id)
      
      const { data: driverData } = isEmail
        ? await query.eq('email', emailOrPhone).single()
        : await query.eq('phone', emailOrPhone.replace(/\D/g, '')).single()

      if (driverData) {
        // Salvar no localStorage e redirecionar
        localStorage.setItem(`driver_${slug}`, JSON.stringify({
          driver: driverData,
          store: store,
        }))
        router.push(`/${slug}/motorista/`)
      } else {
        // Fallback: buscar por entregas com esse telefone
        const { data: deliveriesData } = await supabase
          .from('deliveries')
          .select('driver_name')
          .eq('store_id', store?.id)
          .eq('driver_phone', emailOrPhone.replace(/\D/g, ''))
          .limit(1)

        if (deliveriesData && deliveriesData.length > 0) {
          const driver = {
            id: '',
            name: deliveriesData[0].driver_name || 'Motorista',
            phone: emailOrPhone,
            commission_percent: 10
          }
          localStorage.setItem(`driver_${slug}`, JSON.stringify({
            driver,
            store: store,
          }))
          router.push(`/${slug}/motorista/`)
        } else {
          setLoginError('Motorista não encontrado. Verifique seus dados.')
        }
      }
    } catch (err) {
      console.error('Erro:', err)
      setLoginError('Erro ao acessar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-driver-background flex items-center justify-center">
        <Bike className="w-12 h-12 text-driver-primary animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-driver-background font-display">
      {/* Hero Background */}
      <div 
        className="h-64 bg-cover bg-center relative"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(34, 24, 16, 0.3), rgba(34, 24, 16, 1)), url("https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop")`,
        }}
      >
        {/* Logo */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-2 bg-driver-surface/80 backdrop-blur-sm px-4 py-2 rounded-full">
            <Bike className="w-5 h-5 text-driver-primary" />
            <span className="text-white font-bold">LogiMoto</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-20 pb-8">
        <div className="max-w-md mx-auto">
          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-white mb-2">Bem-vindo, parceiro!</h1>
            <p className="text-driver-text-secondary">
              Gerencie suas entregas e ganhos em um só lugar.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-driver-surface rounded-full p-1 mb-6">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 rounded-full font-bold text-sm transition-colors ${
                activeTab === 'login'
                  ? 'bg-driver-primary text-white'
                  : 'text-driver-text-secondary hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('cadastro')}
              className={`flex-1 py-3 rounded-full font-bold text-sm transition-colors ${
                activeTab === 'cadastro'
                  ? 'bg-driver-primary text-white'
                  : 'text-driver-text-secondary hover:text-white'
              }`}
            >
              Cadastro
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Email/Phone Field */}
            <div>
              <label className="block text-driver-text-secondary text-xs font-medium uppercase tracking-wide mb-2">
                E-mail ou Celular
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-driver-text-secondary" />
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="ex: joao@email.com"
                  className="w-full pl-12 pr-4 py-4 bg-driver-surface border border-driver-surface-lighter rounded-xl text-white placeholder:text-driver-text-muted focus:outline-none focus:border-driver-primary transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-driver-text-secondary text-xs font-medium uppercase tracking-wide mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-driver-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-driver-surface border border-driver-surface-lighter rounded-xl text-white placeholder:text-driver-text-muted focus:outline-none focus:border-driver-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-driver-text-secondary hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="text-right mt-2">
                <button className="text-driver-text-secondary text-sm hover:text-driver-primary transition-colors">
                  Esqueci minha senha
                </button>
              </div>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                {loginError}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleLogin}
              disabled={submitting}
              className="w-full py-4 bg-driver-primary hover:bg-driver-primary-hover text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-driver-primary/20 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Entrar na conta <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-driver-surface-lighter" />
              <span className="text-driver-text-secondary text-sm">ou continue com</span>
              <div className="flex-1 h-px bg-driver-surface-lighter" />
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-4">
              <button className="py-3 px-4 bg-driver-surface border border-driver-surface-lighter rounded-xl text-white font-medium flex items-center justify-center gap-2 hover:bg-driver-surface-lighter transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              <button className="py-3 px-4 bg-driver-surface border border-driver-surface-lighter rounded-xl text-white font-medium flex items-center justify-center gap-2 hover:bg-driver-surface-lighter transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Apple
              </button>
            </div>

            {/* Terms */}
            <p className="text-center text-driver-text-muted text-xs mt-6">
              Ao entrar, você concorda com nossos{' '}
              <Link href="#" className="text-driver-primary hover:underline">Termos</Link>
              {' '}e{' '}
              <Link href="#" className="text-driver-primary hover:underline">Política de Privacidade</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

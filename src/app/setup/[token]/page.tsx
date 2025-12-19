'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Store, Package, Palette, Clock, Rocket } from 'lucide-react'
import type { DraftConfig } from '@/modules/draft-store'

type Step = 'info' | 'products' | 'theme' | 'hours' | 'publish'

export default function SetupPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [step, setStep] = useState<Step>('info')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slug, setSlug] = useState('')
  
  const [config, setConfig] = useState<DraftConfig>({
    storeName: '',
    storeDescription: '',
    niche: undefined,
    theme: { primaryColor: '#8b5cf6' },
    products: [],
    categories: [],
    businessHours: {},
  })

  useEffect(() => {
    loadDraft()
  }, [token])

  const loadDraft = async () => {
    try {
      const res = await fetch(`/api/draft-store/get?token=${token}`)
      const json = await res.json()

      if (!json.success) {
        setError('Draft não encontrado ou expirado')
        setTimeout(() => router.push('/choose-url'), 2000)
        return
      }

      setSlug(json.data.slug)
      setConfig(json.data.config || config)
    } catch (e) {
      setError('Erro ao carregar draft')
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async (newConfig: Partial<DraftConfig>) => {
    setSaving(true)
    try {
      const res = await fetch('/api/draft-store/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftToken: token, config: newConfig }),
      })

      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error)
      }

      setConfig({ ...config, ...newConfig })
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    const steps: Step[] = ['info', 'products', 'theme', 'hours', 'publish']
    const currentIndex = steps.indexOf(step)
    
    if (step === 'info') {
      await saveConfig({ 
        storeName: config.storeName, 
        storeDescription: config.storeDescription,
        niche: config.niche 
      })
    }

    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1])
    }
  }

  const handlePublish = () => {
    router.push(`/signup?draft=${token}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (error && !slug) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
              <Store className="w-4 h-4" />
              <span>{slug}.pediu.food</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Configure sua loja</h1>
            <p className="text-slate-600 mt-2">Sem cadastro. Só publicar quando estiver pronto.</p>
          </div>

          <div className="flex gap-2 mb-8">
            {[
              { key: 'info', icon: Store, label: 'Info' },
              { key: 'products', icon: Package, label: 'Produtos' },
              { key: 'theme', icon: Palette, label: 'Tema' },
              { key: 'hours', icon: Clock, label: 'Horário' },
              { key: 'publish', icon: Rocket, label: 'Publicar' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setStep(key as Step)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-lg transition-colors ${
                  step === key
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {step === 'info' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome da loja</label>
                <input
                  value={config.storeName}
                  onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-violet-500 focus:outline-none"
                  placeholder="Ex: Açaí do João"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Descrição (opcional)</label>
                <textarea
                  value={config.storeDescription}
                  onChange={(e) => setConfig({ ...config, storeDescription: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-violet-500 focus:outline-none"
                  placeholder="Conte um pouco sobre sua loja..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nicho</label>
                <select
                  value={config.niche || ''}
                  onChange={(e) => setConfig({ ...config, niche: e.target.value as any })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-violet-500 focus:outline-none"
                >
                  <option value="">Selecione...</option>
                  <option value="acai">Açaí</option>
                  <option value="burger">Hamburgueria</option>
                  <option value="pizza">Pizzaria</option>
                  <option value="sushi">Sushi</option>
                  <option value="coffee">Cafeteria</option>
                  <option value="bakery">Padaria</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              <button
                onClick={handleNext}
                disabled={!config.storeName || saving}
                className="w-full bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-700 transition-colors font-semibold disabled:opacity-60"
              >
                {saving ? 'Salvando...' : 'Próximo'}
              </button>
            </div>
          )}

          {step === 'products' && (
            <div className="space-y-4">
              <p className="text-slate-600">Você pode adicionar produtos depois no dashboard. Por enquanto, vamos pular.</p>
              <button
                onClick={handleNext}
                className="w-full bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-700 transition-colors font-semibold"
              >
                Próximo
              </button>
            </div>
          )}

          {step === 'theme' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cor principal</label>
                <input
                  type="color"
                  value={config.theme?.primaryColor || '#8b5cf6'}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    theme: { ...config.theme, primaryColor: e.target.value } 
                  })}
                  className="w-full h-12 rounded-lg cursor-pointer"
                />
              </div>
              <button
                onClick={handleNext}
                className="w-full bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-700 transition-colors font-semibold"
              >
                Próximo
              </button>
            </div>
          )}

          {step === 'hours' && (
            <div className="space-y-4">
              <p className="text-slate-600">Você pode configurar horários depois no dashboard.</p>
              <button
                onClick={handleNext}
                className="w-full bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-700 transition-colors font-semibold"
              >
                Próximo
              </button>
            </div>
          )}

          {step === 'publish' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-lg p-6">
                <Rocket className="w-12 h-12 text-violet-600 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Pronto para publicar?</h2>
                <p className="text-slate-600 mb-4">
                  Sua loja <strong>{config.storeName}</strong> está configurada!
                </p>
                <p className="text-sm text-slate-600">
                  Ao publicar, você criará sua conta e ganhará <strong>10 dias de teste grátis</strong>.
                </p>
              </div>

              <button
                onClick={handlePublish}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-4 rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all font-bold text-lg flex items-center justify-center gap-2"
              >
                <Rocket className="w-5 h-5" />
                Publicar e Criar Conta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

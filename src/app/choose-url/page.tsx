'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Link2 } from 'lucide-react'

export default function ChooseUrlPage() {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalized = useMemo(() => {
    return slug
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }, [slug])

  const previewPath = normalized ? `pediu.food/${normalized}` : 'pediu.food/seu-nome'
  const previewSub = normalized ? `${normalized}.pediu.food` : 'seu-nome.pediu.food'

  const handleContinue = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/onboarding/reserve-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: normalized }),
      })

      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Slug indisponível')
      }

      router.push(`/signup?reservation=${encodeURIComponent(json.token)}&slug=${encodeURIComponent(json.slug)}`)
    } catch (e: any) {
      setError(e?.message || 'Erro ao reservar slug')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="inline-block p-3 bg-violet-100 rounded-full mb-4">
              <Link2 className="w-8 h-8 text-violet-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Escolha sua URL</h1>
            <p className="text-slate-600 mt-1">Você define o nome do seu minisite antes do cadastro.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Seu endereço</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-violet-500 focus:outline-none"
                placeholder="ex: acai-do-joao"
              />
              <p className="text-xs text-slate-500 mt-2">Sem acentos. Use letras, números e hífen.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
              <div className="font-medium">Prévia</div>
              <div className="mt-1">{previewPath}</div>
              <div className="mt-1">{previewSub}</div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleContinue}
              disabled={loading || !normalized}
              className="w-full bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Reservando...
                </>
              ) : (
                'Continuar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

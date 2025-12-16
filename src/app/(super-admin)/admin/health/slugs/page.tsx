'use client'

import { useState, useEffect } from 'react'
import { Link2, ArrowLeft, AlertTriangle, CheckCircle, Wrench, Loader2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface SlugIssue {
  id: string
  name: string
  slug: string
  issue: string
  suggestedSlug?: string
}

function validateSlug(slug: string): { valid: boolean; issue?: string; suggested?: string } {
  if (!slug || slug.trim() === '') return { valid: false, issue: 'vazio' }
  if (slug.includes(' ')) return { valid: false, issue: 'espaços', suggested: slug.toLowerCase().replace(/\s+/g, '-') }
  
  const invalidChars = /[^a-z0-9-]/
  if (invalidChars.test(slug)) {
    return { 
      valid: false, 
      issue: 'caracteres inválidos',
      suggested: slug.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    }
  }
  return { valid: true }
}

export default function SlugsPage() {
  const [stores, setStores] = useState<any[]>([])
  const [issues, setIssues] = useState<SlugIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [fixing, setFixing] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data } = await supabase.from('stores').select('id, name, slug').order('name')
    
    const foundIssues: SlugIssue[] = []
    const slugCount: Record<string, string[]> = {}

    for (const store of data || []) {
      const validation = validateSlug(store.slug || '')
      if (!validation.valid) {
        foundIssues.push({
          id: store.id,
          name: store.name || 'Sem nome',
          slug: store.slug || '',
          issue: validation.issue || 'inválido',
          suggestedSlug: validation.suggested
        })
      }
      if (store.slug) {
        if (!slugCount[store.slug]) slugCount[store.slug] = []
        slugCount[store.slug].push(store.id)
      }
    }

    // Duplicados
    for (const [slug, ids] of Object.entries(slugCount)) {
      if (ids.length > 1) {
        for (const id of ids) {
          const store = data?.find((s: any) => s.id === id)
          if (store && !foundIssues.find(i => i.id === id)) {
            foundIssues.push({
              id: store.id,
              name: store.name || 'Sem nome',
              slug: store.slug || '',
              issue: `duplicado (${ids.length}x)`
            })
          }
        }
      }
    }

    setStores(data || [])
    setIssues(foundIssues)
    setLoading(false)
  }

  async function handleFix(storeId: string, suggestedSlug: string) {
    setFixing(storeId)
    try {
      const supabase = createClient()
      
      // Verificar se já existe
      const { data: existing } = await supabase.from('stores').select('id').eq('slug', suggestedSlug).neq('id', storeId).single()
      
      let finalSlug = suggestedSlug
      if (existing) {
        let counter = 1
        while (true) {
          const { data: check } = await supabase.from('stores').select('id').eq('slug', `${suggestedSlug}-${counter}`).single()
          if (!check) { finalSlug = `${suggestedSlug}-${counter}`; break }
          counter++
        }
      }

      await supabase.from('stores').update({ slug: finalSlug }).eq('id', storeId)
      toast.success(`Slug atualizado: ${finalSlug}`)
      loadData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setFixing(null)
    }
  }

  const validCount = stores.length - issues.length
  const percentage = stores.length > 0 ? Math.round((validCount / stores.length) * 100) : 100

  if (loading) return <div className="min-h-screen bg-slate-100 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/health" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4">
            <ArrowLeft className="w-4 h-4" />Voltar
          </Link>
          <h1 className="text-3xl font-bold text-slate-800">🔗 Validador de URLs</h1>
          <p className="text-slate-600">Detecte slugs inválidos.</p>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-slate-800">{stores.length}</div>
            <div className="text-slate-600">Lojas</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-emerald-600">{validCount}</div>
            <div className="text-slate-600">Válidas</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className={`text-3xl font-bold ${issues.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{issues.length}</div>
            <div className="text-slate-600">Problemas</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-emerald-600">{percentage}%</div>
            <div className="text-slate-600">Conformidade</div>
          </div>
        </div>

        {issues.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
            <h3 className="text-xl font-bold text-emerald-700 mb-2">Tudo certo!</h3>
            <p className="text-emerald-600">Todas as URLs são válidas.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-slate-200 bg-red-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h2 className="font-semibold text-red-700">{issues.length} problema(s) encontrado(s)</h2>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {issues.map((issue) => (
                <div key={issue.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="font-medium text-slate-800">{issue.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-sm">/{issue.slug || '(vazio)'}</code>
                      <span className="text-xs text-slate-500">→ {issue.issue}</span>
                    </div>
                  </div>
                  {issue.suggestedSlug && (
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-sm">/{issue.suggestedSlug}</code>
                      <button
                        onClick={() => handleFix(issue.id, issue.suggestedSlug!)}
                        disabled={fixing === issue.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${fixing === issue.id ? 'bg-slate-100 text-slate-400' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}
                      >
                        {fixing === issue.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
                        Corrigir
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista completa */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-semibold text-slate-700">📋 Todas as Lojas</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {stores.map((store: any) => {
              const hasIssue = issues.find(i => i.id === store.id)
              return (
                <div key={store.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-800">{store.name}</span>
                    <code className={`px-2 py-0.5 rounded text-sm ${hasIssue ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>/{store.slug || '(vazio)'}</code>
                  </div>
                  {!hasIssue && store.slug && (
                    <a href={`/${store.slug}`} target="_blank" className="text-slate-400 hover:text-slate-600">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">Última verificação: {new Date().toLocaleString('pt-BR')}</div>
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { Link2, ArrowLeft, AlertTriangle, CheckCircle, Copy, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { SlugFixButton } from './slug-fix-button'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Validador de Links | Diagnósticos',
  description: 'Verificar URLs de lojas'
}

interface SlugIssue {
  id: string
  name: string
  slug: string
  issue: 'invalid_chars' | 'duplicate' | 'empty' | 'spaces'
  description: string
  suggestedSlug?: string
}

function validateSlug(slug: string): { valid: boolean; issue?: string; suggested?: string } {
  if (!slug || slug.trim() === '') {
    return { valid: false, issue: 'empty' }
  }

  if (slug.includes(' ')) {
    return { 
      valid: false, 
      issue: 'spaces',
      suggested: slug.toLowerCase().replace(/\s+/g, '-')
    }
  }

  // Regex para caracteres inválidos (aceita apenas letras minúsculas, números e hífen)
  const invalidChars = /[^a-z0-9-]/
  if (invalidChars.test(slug)) {
    const suggested = slug
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Espaços para hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .replace(/^-|-$/g, '') // Remove hífens no início/fim
    
    return { valid: false, issue: 'invalid_chars', suggested }
  }

  return { valid: true }
}

async function getStoresWithSlugIssues() {
  const supabase = await createClient()

  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, name, slug')
    .order('name')

  if (error) {
    console.error('Erro ao buscar lojas:', error)
    return { stores: [], issues: [], error: error.message }
  }

  const issues: SlugIssue[] = []
  const slugCount: Record<string, string[]> = {}

  // Verificar cada loja
  for (const store of stores || []) {
    const validation = validateSlug(store.slug || '')

    if (!validation.valid) {
      let issueType: SlugIssue['issue'] = 'invalid_chars'
      let description = 'Contém caracteres inválidos'

      if (validation.issue === 'empty') {
        issueType = 'empty'
        description = 'Slug está vazio'
      } else if (validation.issue === 'spaces') {
        issueType = 'spaces'
        description = 'Contém espaços'
      }

      issues.push({
        id: store.id,
        name: store.name || 'Sem nome',
        slug: store.slug || '',
        issue: issueType,
        description,
        suggestedSlug: validation.suggested
      })
    }

    // Contar duplicados
    if (store.slug) {
      if (!slugCount[store.slug]) {
        slugCount[store.slug] = []
      }
      slugCount[store.slug].push(store.id)
    }
  }

  // Adicionar duplicados
  for (const [slug, ids] of Object.entries(slugCount)) {
    if (ids.length > 1) {
      for (const id of ids) {
        const store = stores?.find((s: any) => s.id === id)
        if (store && !issues.find(i => i.id === id)) {
          issues.push({
            id: store.id,
            name: store.name || 'Sem nome',
            slug: store.slug || '',
            issue: 'duplicate',
            description: `Duplicado (${ids.length} lojas com este slug)`
          })
        }
      }
    }
  }

  return { stores: stores || [], issues, error: null }
}

export default async function SlugsPage() {
  const { stores, issues, error } = await getStoresWithSlugIssues()

  const validCount = stores.length - issues.length
  const percentage = stores.length > 0 
    ? Math.round((validCount / stores.length) * 100) 
    : 100

  const issuesByType = {
    invalid_chars: issues.filter(i => i.issue === 'invalid_chars'),
    spaces: issues.filter(i => i.issue === 'spaces'),
    empty: issues.filter(i => i.issue === 'empty'),
    duplicate: issues.filter(i => i.issue === 'duplicate')
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/admin/diagnostics"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Diagnósticos
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Link2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">🔗 Validador de Links</h1>
          </div>
          <p className="text-slate-600">
            Detecte URLs conflitantes ou inválidas.
          </p>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-slate-800">{stores.length}</div>
            <div className="text-slate-600">Total de Lojas</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-emerald-600">{validCount}</div>
            <div className="text-slate-600">URLs Válidas</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className={`text-3xl font-bold ${issues.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {issues.length}
            </div>
            <div className="text-slate-600">Com Problemas</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-emerald-600">{percentage}%</div>
            <div className="text-slate-600">Conformidade</div>
            <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Status */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-700">Erro ao carregar dados</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        ) : issues.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
            <h3 className="text-xl font-bold text-emerald-700 mb-2">Tudo certo!</h3>
            <p className="text-emerald-600">Todas as URLs de lojas são válidas.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Caracteres Inválidos */}
            {issuesByType.invalid_chars.length > 0 && (
              <IssueSection
                title="Caracteres Inválidos"
                description="URLs com acentos ou caracteres especiais"
                icon="⚠️"
                color="amber"
                issues={issuesByType.invalid_chars}
              />
            )}

            {/* Espaços */}
            {issuesByType.spaces.length > 0 && (
              <IssueSection
                title="Contém Espaços"
                description="URLs não podem ter espaços"
                icon="📝"
                color="orange"
                issues={issuesByType.spaces}
              />
            )}

            {/* Vazios */}
            {issuesByType.empty.length > 0 && (
              <IssueSection
                title="Slug Vazio"
                description="Lojas sem URL definida"
                icon="❌"
                color="red"
                issues={issuesByType.empty}
              />
            )}

            {/* Duplicados */}
            {issuesByType.duplicate.length > 0 && (
              <IssueSection
                title="Duplicados"
                description="Múltiplas lojas com a mesma URL"
                icon="👥"
                color="purple"
                issues={issuesByType.duplicate}
              />
            )}
          </div>
        )}

        {/* Lista de Todas as Lojas */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-semibold text-slate-700">📋 Todas as Lojas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Loja</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">URL</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stores.map((store: any) => {
                  const issue = issues.find(i => i.id === store.id)
                  const isValid = !issue
                  
                  return (
                    <tr key={store.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{store.name || 'Sem nome'}</div>
                        <div className="text-xs text-slate-400 font-mono">{store.id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-4 py-3">
                        <code className={`px-2 py-1 rounded text-sm ${isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          /{store.slug || '(vazio)'}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        {isValid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Válido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            {issue?.description}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isValid && store.slug && (
                            <Link
                              href={`/${store.slug}`}
                              target="_blank"
                              className="p-2 text-slate-400 hover:text-slate-600"
                              title="Abrir loja"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          )}
                          {!isValid && issue?.suggestedSlug && (
                            <SlugFixButton 
                              storeId={store.id} 
                              currentSlug={store.slug || ''} 
                              suggestedSlug={issue.suggestedSlug} 
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          Última verificação: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  )
}

function IssueSection({ 
  title, 
  description, 
  icon, 
  color, 
  issues 
}: { 
  title: string
  description: string
  icon: string
  color: string
  issues: SlugIssue[] 
}) {
  const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' }
  }

  const colors = colorClasses[color] || colorClasses.amber

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden`}>
      <div className={`px-6 py-4 border-b ${colors.border}`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <div>
            <h3 className={`font-semibold ${colors.text}`}>{title}</h3>
            <p className="text-sm opacity-75">{description}</p>
          </div>
          <span className={`ml-auto px-3 py-1 rounded-full text-sm font-bold ${colors.bg} ${colors.text}`}>
            {issues.length}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-2">
          {issues.map(issue => (
            <div key={issue.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div>
                <span className="font-medium text-slate-800">{issue.name}</span>
                <code className="ml-2 px-2 py-0.5 bg-slate-100 rounded text-sm text-slate-600">
                  /{issue.slug || '(vazio)'}
                </code>
              </div>
              {issue.suggestedSlug && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Sugestão:</span>
                  <code className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-sm">
                    /{issue.suggestedSlug}
                  </code>
                  <SlugFixButton 
                    storeId={issue.id} 
                    currentSlug={issue.slug} 
                    suggestedSlug={issue.suggestedSlug} 
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

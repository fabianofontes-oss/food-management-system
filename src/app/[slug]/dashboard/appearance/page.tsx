'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Palette, Save, Eye, Copy, Upload, Image as ImageIcon } from 'lucide-react'
import { useDashboardStoreId } from '../DashboardClient'
import { updateStoreAppearance, getStoreAppearance } from '@/lib/actions/appearance'
import { toast } from 'sonner'
import type { PublicProfile, MenuTheme } from '@/types/menu'

const PRESET_OPTIONS = [
  { value: 'menuA', label: 'Menu A - Tabs no Topo', description: 'Categorias em tabs fixas no topo' },
  { value: 'menuB', label: 'Menu B - Sidebar/Drawer', description: 'Categorias em sidebar (desktop) e drawer (mobile)' },
  { value: 'menuC', label: 'Menu C - Pills Scrollspy', description: 'Navegação por pills com scroll automático' },
]

const CARD_VARIANT_OPTIONS = [
  { value: 'cardA', label: 'Card A - Compacto', description: 'Imagem pequena + nome + preço' },
  { value: 'cardB', label: 'Card B - Grid Grande', description: 'Card grid com imagem grande' },
  { value: 'cardC', label: 'Card C - Lista Detalhada', description: 'Lista com destaque para descrição e tags' },
]

const DEFAULT_COLORS = {
  primary: '#10B981',
  accent: '#F59E0B',
  bg: '#0B1220',
  text: '#E5E7EB',
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
]

export default function AppearancePage() {
  const params = useParams()
  const slug = params.slug as string
  const storeId = useDashboardStoreId()

  const baseUrl = process.env.NEXT_PUBLIC_PUBLIC_APP_URL
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const normalizedBase = (baseUrl || origin).replace(/\/$/, '')
  const publicMenuUrl = normalizedBase ? `${normalizedBase}/${slug}` : `/${slug}`

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)

  const [menuTheme, setMenuTheme] = useState<MenuTheme>({
    preset: 'menuA',
    cardVariant: 'cardA',
    colors: DEFAULT_COLORS,
    layout: {
      showSearch: true,
      showCategories: true,
    },
  } as MenuTheme)

  const [publicProfile, setPublicProfile] = useState<PublicProfile>({
    displayName: '',
    slogan: '',
    fullAddress: '',
    googleMapsUrl: '',
    phone: '',
    whatsapp: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    businessHours: {},
    notes: '',
  })

  useEffect(() => {
    if (!storeId) return

    const loadAppearance = async () => {
      setLoading(true)
      const result = await getStoreAppearance(storeId)
      if (result.success && result.data) {
        if (result.data.logoUrl) {
          setLogoUrl(result.data.logoUrl)
        }
        if (result.data.menuTheme && Object.keys(result.data.menuTheme).length > 0) {
          setMenuTheme({
            preset: result.data.menuTheme.preset || 'menuA',
            cardVariant: result.data.menuTheme.cardVariant || 'cardA',
            colors: result.data.menuTheme.colors || DEFAULT_COLORS,
            layout: result.data.menuTheme.layout || { showSearch: true, showCategories: true },
          })
        }
        if (result.data.publicProfile && Object.keys(result.data.publicProfile).length > 0) {
          setPublicProfile({
            displayName: result.data.publicProfile.displayName || '',
            slogan: result.data.publicProfile.slogan || '',
            fullAddress: result.data.publicProfile.fullAddress || '',
            googleMapsUrl: result.data.publicProfile.googleMapsUrl || '',
            phone: result.data.publicProfile.phone || '',
            whatsapp: result.data.publicProfile.whatsapp || '',
            instagram: result.data.publicProfile.instagram || '',
            facebook: result.data.publicProfile.facebook || '',
            tiktok: result.data.publicProfile.tiktok || '',
            businessHours: result.data.publicProfile.businessHours || {},
            notes: result.data.publicProfile.notes || '',
          })
        }
      }
      setLoading(false)
    }

    loadAppearance()
  }, [storeId])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !storeId) return

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('storeId', storeId)

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success && data.url) {
        setLogoUrl(data.url)
        toast.success('Logo enviada com sucesso!')
      } else {
        toast.error(data.error || 'Erro ao enviar logo')
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error('Erro ao enviar logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSave = async () => {
    if (!storeId) return

    setSaving(true)
    try {
      const result = await updateStoreAppearance({
        storeId,
        menuTheme,
        publicProfile,
      })

      if (result.success) {
        toast.success('Aparência atualizada com sucesso!')
      } else {
        toast.error(result.error || 'Erro ao salvar aparência')
      }
    } catch (error) {
      console.error('Error saving appearance:', error)
      toast.error('Erro ao salvar aparência')
    } finally {
      setSaving(false)
    }
  }

  if (!storeId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold">Loja inválida</div>
          <div className="text-sm text-muted-foreground">Não foi possível carregar as configurações.</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Palette className="w-8 h-8" />
            Aparência do Cardápio
          </h1>
          <p className="text-muted-foreground mt-1">
            Personalize o tema e o perfil público da sua loja
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? 'Ocultar Preview' : 'Ver Preview'}
          </Button>
          <Button variant="outline" asChild>
            <a href={publicMenuUrl} target="_blank" rel="noopener noreferrer">
              <Eye className="w-4 h-4 mr-2" />
              Abrir em Nova Aba
            </a>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(publicMenuUrl)
                toast.success('URL do cardápio copiada!')
              } catch (error) {
                console.error('Error copying public menu URL:', error)
                toast.error('Não foi possível copiar a URL')
              }
            }}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar URL
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Preview do Cardápio */}
      {showPreview && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Preview do Cardápio</CardTitle>
            <CardDescription>Visualização em tempo real do seu cardápio público</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full h-[600px] border-t">
              <iframe
                src={publicMenuUrl}
                className="w-full h-full"
                title="Preview do Cardápio"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Layout do Menu */}
        <Card>
          <CardHeader>
            <CardTitle>Layout do Menu</CardTitle>
            <CardDescription>Escolha como as categorias serão exibidas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {PRESET_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  menuTheme.preset === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <input
                  type="radio"
                  name="preset"
                  value={option.value}
                  checked={menuTheme.preset === option.value}
                  onChange={(e) => setMenuTheme({ ...menuTheme, preset: e.target.value as any })}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Variante do Card */}
        <Card>
          <CardHeader>
            <CardTitle>Estilo dos Cards</CardTitle>
            <CardDescription>Escolha como os produtos serão exibidos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {CARD_VARIANT_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  menuTheme.cardVariant === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <input
                  type="radio"
                  name="cardVariant"
                  value={option.value}
                  checked={menuTheme.cardVariant === option.value}
                  onChange={(e) => setMenuTheme({ ...menuTheme, cardVariant: e.target.value as any })}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Cores */}
      <Card>
        <CardHeader>
          <CardTitle>Cores do Tema</CardTitle>
          <CardDescription>Personalize as cores do seu cardápio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color-primary">Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  id="color-primary"
                  type="color"
                  value={menuTheme.colors?.primary || DEFAULT_COLORS.primary}
                  onChange={(e) =>
                    setMenuTheme({
                      ...menuTheme,
                      colors: { ...menuTheme.colors, primary: e.target.value },
                    })
                  }
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={menuTheme.colors?.primary || DEFAULT_COLORS.primary}
                  onChange={(e) =>
                    setMenuTheme({
                      ...menuTheme,
                      colors: { ...menuTheme.colors, primary: e.target.value },
                    })
                  }
                  className="flex-1"
                  placeholder="#10B981"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color-accent">Cor de Destaque</Label>
              <div className="flex gap-2">
                <Input
                  id="color-accent"
                  type="color"
                  value={menuTheme.colors?.accent || DEFAULT_COLORS.accent}
                  onChange={(e) =>
                    setMenuTheme({
                      ...menuTheme,
                      colors: { ...menuTheme.colors, accent: e.target.value },
                    })
                  }
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={menuTheme.colors?.accent || DEFAULT_COLORS.accent}
                  onChange={(e) =>
                    setMenuTheme({
                      ...menuTheme,
                      colors: { ...menuTheme.colors, accent: e.target.value },
                    })
                  }
                  className="flex-1"
                  placeholder="#F59E0B"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color-bg">Cor de Fundo</Label>
              <div className="flex gap-2">
                <Input
                  id="color-bg"
                  type="color"
                  value={menuTheme.colors?.bg || DEFAULT_COLORS.bg}
                  onChange={(e) =>
                    setMenuTheme({
                      ...menuTheme,
                      colors: { ...menuTheme.colors, bg: e.target.value },
                    })
                  }
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={menuTheme.colors?.bg || DEFAULT_COLORS.bg}
                  onChange={(e) =>
                    setMenuTheme({
                      ...menuTheme,
                      colors: { ...menuTheme.colors, bg: e.target.value },
                    })
                  }
                  className="flex-1"
                  placeholder="#0B1220"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color-text">Cor do Texto</Label>
              <div className="flex gap-2">
                <Input
                  id="color-text"
                  type="color"
                  value={menuTheme.colors?.text || DEFAULT_COLORS.text}
                  onChange={(e) =>
                    setMenuTheme({
                      ...menuTheme,
                      colors: { ...menuTheme.colors, text: e.target.value },
                    })
                  }
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={menuTheme.colors?.text || DEFAULT_COLORS.text}
                  onChange={(e) =>
                    setMenuTheme({
                      ...menuTheme,
                      colors: { ...menuTheme.colors, text: e.target.value },
                    })
                  }
                  className="flex-1"
                  placeholder="#E5E7EB"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Perfil Público */}
      <Card>
        <CardHeader>
          <CardTitle>Perfil Público</CardTitle>
          <CardDescription>Informações exibidas no cardápio público</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload de Logo */}
          <div className="space-y-2">
            <Label>Logo da Loja</Label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative w-24 h-24 rounded-lg border-2 border-border overflow-hidden bg-muted">
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                  id="logo-upload"
                />
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingLogo}
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {logoUrl ? 'Alterar Logo' : 'Enviar Logo'}
                      </>
                    )}
                  </Button>
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Recomendado: 200x200px, PNG ou JPG
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome de Exibição</Label>
              <Input
                id="displayName"
                value={publicProfile.displayName || ''}
                onChange={(e) => setPublicProfile({ ...publicProfile, displayName: e.target.value })}
                placeholder="Nome da sua loja"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slogan">Slogan</Label>
              <Input
                id="slogan"
                value={publicProfile.slogan || ''}
                onChange={(e) => setPublicProfile({ ...publicProfile, slogan: e.target.value })}
                placeholder="Seu slogan"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullAddress">Endereço Completo</Label>
            <Input
              id="fullAddress"
              value={publicProfile.fullAddress || ''}
              onChange={(e) => setPublicProfile({ ...publicProfile, fullAddress: e.target.value })}
              placeholder="Rua, número, bairro, cidade - UF"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="googleMapsUrl">Link do Google Maps</Label>
            <Input
              id="googleMapsUrl"
              type="url"
              value={publicProfile.googleMapsUrl || ''}
              onChange={(e) => setPublicProfile({ ...publicProfile, googleMapsUrl: e.target.value })}
              placeholder="https://maps.google.com/..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={publicProfile.phone || ''}
                onChange={(e) => setPublicProfile({ ...publicProfile, phone: e.target.value })}
                placeholder="(00) 0000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={publicProfile.whatsapp || ''}
                onChange={(e) => setPublicProfile({ ...publicProfile, whatsapp: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={publicProfile.instagram || ''}
                onChange={(e) => setPublicProfile({ ...publicProfile, instagram: e.target.value })}
                placeholder="@usuario"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={publicProfile.facebook || ''}
                onChange={(e) => setPublicProfile({ ...publicProfile, facebook: e.target.value })}
                placeholder="facebook.com/pagina"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiktok">TikTok</Label>
              <Input
                id="tiktok"
                value={publicProfile.tiktok || ''}
                onChange={(e) => setPublicProfile({ ...publicProfile, tiktok: e.target.value })}
                placeholder="@usuario"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Horário de Funcionamento</Label>
            <div className="space-y-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.key} className="grid grid-cols-[140px_1fr] gap-4 items-center">
                  <Label htmlFor={`hours-${day.key}`} className="text-sm">
                    {day.label}
                  </Label>
                  <Input
                    id={`hours-${day.key}`}
                    value={(publicProfile.businessHours as any)?.[day.key] || ''}
                    onChange={(e) =>
                      setPublicProfile({
                        ...publicProfile,
                        businessHours: {
                          ...publicProfile.businessHours,
                          [day.key]: e.target.value,
                        },
                      })
                    }
                    placeholder="Ex: 08:00 - 18:00 ou Fechado"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={publicProfile.notes || ''}
              onChange={(e) => setPublicProfile({ ...publicProfile, notes: e.target.value })}
              placeholder="Informações adicionais (ex: retirada até 22h)"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

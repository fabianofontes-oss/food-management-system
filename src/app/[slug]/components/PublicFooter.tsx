'use client'

import { MapPin, Phone, Clock, Instagram, Facebook, MessageCircle, ExternalLink } from 'lucide-react'
import { format, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { PublicProfile } from '@/types/menu'

interface PublicFooterProps {
  publicProfile?: PublicProfile | null
}

const DAYS_MAP: { [key: number]: keyof NonNullable<PublicProfile['businessHours']> } = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

const DAYS_LABELS: { [key: string]: string } = {
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

export function PublicFooter({ publicProfile }: PublicFooterProps) {
  if (!publicProfile) return null

  const today = getDay(new Date())
  const todayKey = DAYS_MAP[today]
  const todayHours = publicProfile.businessHours?.[todayKey]
  const isOpen = todayHours && !todayHours.toLowerCase().includes('fechado')

  const hasContactInfo = publicProfile.phone || publicProfile.whatsapp || publicProfile.fullAddress
  const hasSocialMedia = publicProfile.instagram || publicProfile.facebook || publicProfile.tiktok
  const hasBusinessHours = publicProfile.businessHours && Object.keys(publicProfile.businessHours).length > 0

  if (!hasContactInfo && !hasSocialMedia && !hasBusinessHours && !publicProfile.notes) {
    return null
  }

  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Contato */}
          {hasContactInfo && (
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--theme-accent, #F59E0B)' }}>
                Contato
              </h3>
              <div className="space-y-3">
                {publicProfile.fullAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--theme-primary, #10B981)' }} />
                    <div>
                      <p className="text-gray-300">{publicProfile.fullAddress}</p>
                      {publicProfile.googleMapsUrl && (
                        <a
                          href={publicProfile.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm hover:underline inline-flex items-center gap-1 mt-1"
                          style={{ color: 'var(--theme-accent, #F59E0B)' }}
                        >
                          Ver no mapa
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
                
                {publicProfile.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--theme-primary, #10B981)' }} />
                    <a href={`tel:${publicProfile.phone}`} className="text-gray-300 hover:text-white">
                      {publicProfile.phone}
                    </a>
                  </div>
                )}
                
                {publicProfile.whatsapp && (
                  <a
                    href={`https://wa.me/${publicProfile.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: 'var(--theme-primary, #10B981)' }}
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Horário de Funcionamento */}
          {hasBusinessHours && (
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--theme-accent, #F59E0B)' }}>
                Horário de Funcionamento
              </h3>
              
              {todayHours && (
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--theme-primary, #10B981)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold">Hoje ({DAYS_LABELS[todayKey]})</span>
                  </div>
                  <p className="text-sm font-bold">
                    {isOpen ? todayHours : 'Fechado'}
                  </p>
                </div>
              )}
              
              <div className="space-y-2 text-sm">
                {Object.entries(DAYS_LABELS).map(([key, label]) => {
                  const hours = publicProfile.businessHours?.[key as keyof typeof publicProfile.businessHours]
                  if (!hours) return null
                  
                  const isToday = key === todayKey
                  
                  return (
                    <div
                      key={key}
                      className={`flex justify-between ${isToday ? 'font-semibold' : 'text-gray-400'}`}
                    >
                      <span>{label}</span>
                      <span>{hours}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Redes Sociais */}
          {hasSocialMedia && (
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--theme-accent, #F59E0B)' }}>
                Redes Sociais
              </h3>
              <div className="flex flex-wrap gap-3">
                {publicProfile.instagram && (
                  <a
                    href={`https://instagram.com/${publicProfile.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <Instagram className="w-5 h-5" />
                    Instagram
                  </a>
                )}
                
                {publicProfile.facebook && (
                  <a
                    href={publicProfile.facebook.startsWith('http') ? publicProfile.facebook : `https://facebook.com/${publicProfile.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <Facebook className="w-5 h-5" />
                    Facebook
                  </a>
                )}
                
                {publicProfile.tiktok && (
                  <a
                    href={`https://tiktok.com/@${publicProfile.tiktok.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-black rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                    </svg>
                    TikTok
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Observações */}
        {publicProfile.notes && (
          <div className="mt-8 pt-8 border-t border-gray-800">
            <p className="text-gray-400 text-sm">{publicProfile.notes}</p>
          </div>
        )}

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Todos os direitos reservados</p>
        </div>
      </div>
    </footer>
  )
}

import { 
  Store, Clock, Globe, Phone, Mail, MapPin, Instagram, Facebook, 
  MessageSquare, Zap, Monitor, Send, Link2, ShoppingBag, Bike
} from 'lucide-react'
import type { Module } from './types'

export const STORE_MODULES: Module[] = [
  {
    id: 'store_info',
    name: 'Dados da Loja',
    description: 'Informações básicas',
    longDescription: 'Configure nome, descrição, telefone, e-mail e endereço da sua loja.',
    icon: <Store className="w-6 h-6" />,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    category: 'store',
    isCore: true,
    settings: [
      { key: 'store_name', label: 'Nome da Loja', description: 'Nome exibido para clientes', type: 'text', icon: <Store className="w-4 h-4" />, placeholder: 'Minha Loja', defaultValue: '' },
      { key: 'store_phone', label: 'Telefone', description: 'Contato principal', type: 'text', icon: <Phone className="w-4 h-4" />, placeholder: '(31) 99914-0095', defaultValue: '' },
      { key: 'store_email', label: 'E-mail', description: 'E-mail de contato', type: 'text', icon: <Mail className="w-4 h-4" />, placeholder: 'contato@loja.com', defaultValue: '' },
      { key: 'store_address', label: 'Endereço', description: 'Endereço completo', type: 'text', icon: <MapPin className="w-4 h-4" />, placeholder: 'Rua, número, bairro', defaultValue: '' }
    ]
  },
  {
    id: 'store_hours',
    name: 'Horários de Funcionamento',
    description: 'Dias e horários da loja',
    longDescription: 'Configure os horários de funcionamento para cada dia da semana.',
    icon: <Clock className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'store',
    hasCustomCard: true,
    settings: [
      { key: 'hours_enabled', label: 'Controle de Horários', description: 'Fecha automaticamente fora do horário', type: 'toggle', icon: <Clock className="w-4 h-4" />, defaultValue: true },
      { key: 'hours_monday_open', label: 'Segunda - Abre', type: 'time', defaultValue: '08:00' },
      { key: 'hours_monday_close', label: 'Segunda - Fecha', type: 'time', defaultValue: '22:00' },
      { key: 'hours_monday_closed', label: 'Segunda - Fechado', type: 'toggle', defaultValue: false },
      { key: 'hours_tuesday_open', label: 'Terça - Abre', type: 'time', defaultValue: '08:00' },
      { key: 'hours_tuesday_close', label: 'Terça - Fecha', type: 'time', defaultValue: '22:00' },
      { key: 'hours_tuesday_closed', label: 'Terça - Fechado', type: 'toggle', defaultValue: false },
      { key: 'hours_wednesday_open', label: 'Quarta - Abre', type: 'time', defaultValue: '08:00' },
      { key: 'hours_wednesday_close', label: 'Quarta - Fecha', type: 'time', defaultValue: '22:00' },
      { key: 'hours_wednesday_closed', label: 'Quarta - Fechado', type: 'toggle', defaultValue: false },
      { key: 'hours_thursday_open', label: 'Quinta - Abre', type: 'time', defaultValue: '08:00' },
      { key: 'hours_thursday_close', label: 'Quinta - Fecha', type: 'time', defaultValue: '22:00' },
      { key: 'hours_thursday_closed', label: 'Quinta - Fechado', type: 'toggle', defaultValue: false },
      { key: 'hours_friday_open', label: 'Sexta - Abre', type: 'time', defaultValue: '08:00' },
      { key: 'hours_friday_close', label: 'Sexta - Fecha', type: 'time', defaultValue: '23:00' },
      { key: 'hours_friday_closed', label: 'Sexta - Fechado', type: 'toggle', defaultValue: false },
      { key: 'hours_saturday_open', label: 'Sábado - Abre', type: 'time', defaultValue: '08:00' },
      { key: 'hours_saturday_close', label: 'Sábado - Fecha', type: 'time', defaultValue: '23:00' },
      { key: 'hours_saturday_closed', label: 'Sábado - Fechado', type: 'toggle', defaultValue: false },
      { key: 'hours_sunday_open', label: 'Domingo - Abre', type: 'time', defaultValue: '10:00' },
      { key: 'hours_sunday_close', label: 'Domingo - Fecha', type: 'time', defaultValue: '20:00' },
      { key: 'hours_sunday_closed', label: 'Domingo - Fechado', type: 'toggle', defaultValue: false }
    ]
  },
  {
    id: 'social_media',
    name: 'Redes Sociais',
    description: 'Links e perfis sociais',
    longDescription: 'Configure todas as redes sociais da sua loja para seus clientes te encontrarem facilmente.',
    icon: <Globe className="w-6 h-6" />,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    category: 'store',
    hasCustomCard: true,
    settings: [
      { key: 'social_enabled', label: 'Exibir Redes Sociais', description: 'Mostra os links para clientes', type: 'toggle', icon: <Globe className="w-4 h-4" />, defaultValue: true },
      { key: 'social_instagram', label: 'Instagram', description: '@usuario ou link completo', type: 'text', icon: <Instagram className="w-4 h-4" />, placeholder: '@minhaloja', defaultValue: '' },
      { key: 'social_facebook', label: 'Facebook', description: 'Link da página', type: 'text', icon: <Facebook className="w-4 h-4" />, placeholder: 'facebook.com/minhaloja', defaultValue: '' },
      { key: 'social_whatsapp', label: 'WhatsApp Business', description: 'Número com DDD', type: 'text', icon: <MessageSquare className="w-4 h-4" />, placeholder: '11999999999', defaultValue: '' },
      { key: 'social_tiktok', label: 'TikTok', description: '@usuario', type: 'text', icon: <Zap className="w-4 h-4" />, placeholder: '@minhaloja', defaultValue: '' },
      { key: 'social_youtube', label: 'YouTube', description: 'Link do canal', type: 'text', icon: <Monitor className="w-4 h-4" />, placeholder: 'youtube.com/@minhaloja', defaultValue: '' },
      { key: 'social_twitter', label: 'X (Twitter)', description: '@usuario', type: 'text', icon: <Send className="w-4 h-4" />, placeholder: '@minhaloja', defaultValue: '' },
      { key: 'social_linkedin', label: 'LinkedIn', description: 'Link da empresa', type: 'text', icon: <Link2 className="w-4 h-4" />, placeholder: 'linkedin.com/company/minhaloja', defaultValue: '' },
      { key: 'social_website', label: 'Site Oficial', description: 'URL do site', type: 'text', icon: <Globe className="w-4 h-4" />, placeholder: 'www.minhaloja.com.br', defaultValue: '' },
      { key: 'social_ifood', label: 'iFood', description: 'Link do restaurante no iFood', type: 'text', icon: <ShoppingBag className="w-4 h-4" />, placeholder: 'ifood.com.br/delivery/...', defaultValue: '' },
      { key: 'social_rappi', label: 'Rappi', description: 'Link do restaurante no Rappi', type: 'text', icon: <Bike className="w-4 h-4" />, placeholder: 'rappi.com.br/...', defaultValue: '' },
      { key: 'social_custom1_name', label: 'Rede Personalizada 1 - Nome', description: 'Nome da rede', type: 'text', placeholder: 'Pinterest', defaultValue: '' },
      { key: 'social_custom1_url', label: 'Rede Personalizada 1 - Link', description: 'URL completa', type: 'text', placeholder: 'https://...', defaultValue: '' },
      { key: 'social_custom2_name', label: 'Rede Personalizada 2 - Nome', description: 'Nome da rede', type: 'text', placeholder: 'Telegram', defaultValue: '' },
      { key: 'social_custom2_url', label: 'Rede Personalizada 2 - Link', description: 'URL completa', type: 'text', placeholder: 'https://...', defaultValue: '' }
    ]
  }
]

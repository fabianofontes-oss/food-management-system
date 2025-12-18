import { 
  Mail, Smartphone, Bell, Send, Volume2, Building2, Hash, Phone, 
  Truck, Tag, Star, ShoppingBag, Timer, ChefHat
} from 'lucide-react'
import type { Module } from './types'

export const NOTIFICATIONS_MODULES: Module[] = [
  {
    id: 'email_notifications',
    name: 'E-mail Transacional',
    description: 'E-mails automáticos',
    longDescription: 'Configure e-mails automáticos para confirmação de pedidos e atualizações.',
    icon: <Mail className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'notifications',
    settings: [
      { key: 'email_enabled', label: 'Ativar E-mails', description: 'Habilita envio de e-mails', type: 'toggle', icon: <Mail className="w-4 h-4" />, defaultValue: false },
      { key: 'email_provider', label: 'Provedor', description: 'Serviço de envio de e-mail', type: 'select', icon: <Building2 className="w-4 h-4" />, options: [{ value: 'smtp', label: 'SMTP (próprio)' }, { value: 'sendgrid', label: 'SendGrid' }, { value: 'mailgun', label: 'Mailgun' }, { value: 'ses', label: 'Amazon SES' }, { value: 'resend', label: 'Resend' }], defaultValue: 'smtp' },
      { key: 'email_smtp_host', label: 'Servidor SMTP', description: 'Host do servidor', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'smtp.gmail.com', defaultValue: '' },
      { key: 'email_smtp_port', label: 'Porta SMTP', description: '587 (TLS) ou 465 (SSL)', type: 'number', icon: <Hash className="w-4 h-4" />, placeholder: '587', defaultValue: 587 },
      { key: 'email_smtp_user', label: 'Usuário SMTP', description: 'Geralmente o e-mail', type: 'text', icon: <Mail className="w-4 h-4" />, placeholder: 'seu@email.com', defaultValue: '' },
      { key: 'email_smtp_pass', label: 'Senha SMTP', description: 'Senha ou App Password', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: '********', defaultValue: '' },
      { key: 'email_from_name', label: 'Nome do Remetente', description: 'Ex: Açaí do João', type: 'text', icon: <Building2 className="w-4 h-4" />, placeholder: 'Minha Loja', defaultValue: '' },
      { key: 'email_from_address', label: 'E-mail do Remetente', description: 'E-mail que aparece para o cliente', type: 'text', icon: <Mail className="w-4 h-4" />, placeholder: 'pedidos@minhaloja.com', defaultValue: '' },
      { key: 'email_notify_order_created', label: 'Pedido Criado', description: 'Envia confirmação ao cliente', type: 'toggle', icon: <Bell className="w-4 h-4" />, defaultValue: true },
      { key: 'email_notify_order_ready', label: 'Pedido Pronto', description: 'Avisa que está pronto', type: 'toggle', icon: <Bell className="w-4 h-4" />, defaultValue: true },
      { key: 'email_notify_order_delivered', label: 'Pedido Entregue', description: 'Confirma entrega', type: 'toggle', icon: <Truck className="w-4 h-4" />, defaultValue: true }
    ]
  },
  {
    id: 'sms',
    name: 'SMS',
    description: 'Notificações por SMS',
    longDescription: 'Envie SMS para clientes sobre status do pedido.',
    icon: <Smartphone className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    category: 'notifications',
    settings: [
      { key: 'sms_enabled', label: 'Ativar SMS', description: 'Habilita envio de SMS', type: 'toggle', icon: <Smartphone className="w-4 h-4" />, defaultValue: false },
      { key: 'sms_provider', label: 'Provedor', description: 'Serviço de SMS', type: 'select', icon: <Building2 className="w-4 h-4" />, options: [{ value: 'twilio', label: 'Twilio' }, { value: 'zenvia', label: 'Zenvia' }, { value: 'infobip', label: 'Infobip' }, { value: 'comtele', label: 'Comtele' }], defaultValue: 'twilio' },
      { key: 'sms_api_key', label: 'API Key', description: 'Chave da API', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'API Key...', defaultValue: '' },
      { key: 'sms_api_secret', label: 'API Secret', description: 'Chave secreta', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Secret...', defaultValue: '' },
      { key: 'sms_from_number', label: 'Número Remetente', description: 'Número que envia', type: 'text', icon: <Phone className="w-4 h-4" />, placeholder: '+5511999999999', defaultValue: '' },
      { key: 'sms_notify_order_created', label: 'Pedido Criado', description: 'SMS de confirmação', type: 'toggle', icon: <Bell className="w-4 h-4" />, defaultValue: true },
      { key: 'sms_notify_out_delivery', label: 'Saiu para Entrega', description: 'SMS quando sai', type: 'toggle', icon: <Truck className="w-4 h-4" />, defaultValue: true }
    ]
  },
  {
    id: 'push_notifications',
    name: 'Push Notifications',
    description: 'Notificações no navegador',
    longDescription: 'Envie notificações push para o navegador dos clientes. Gratuito.',
    icon: <Bell className="w-6 h-6" />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    category: 'notifications',
    settings: [
      { key: 'push_enabled', label: 'Ativar Push', description: 'Habilita notificações push', type: 'toggle', icon: <Bell className="w-4 h-4" />, defaultValue: false },
      { key: 'push_provider', label: 'Provedor', description: 'Serviço de push', type: 'select', icon: <Building2 className="w-4 h-4" />, options: [{ value: 'onesignal', label: 'OneSignal' }, { value: 'firebase', label: 'Firebase (FCM)' }, { value: 'pusher', label: 'Pusher' }], defaultValue: 'onesignal' },
      { key: 'push_app_id', label: 'App ID', description: 'ID do aplicativo', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'App ID...', defaultValue: '' },
      { key: 'push_api_key', label: 'API Key', description: 'Chave da API', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'API Key...', defaultValue: '' },
      { key: 'push_ask_permission', label: 'Pedir Permissão', description: 'Solicita permissão ao visitar', type: 'toggle', icon: <Bell className="w-4 h-4" />, defaultValue: true },
      { key: 'push_notify_promotions', label: 'Promoções', description: 'Envia ofertas e cupons', type: 'toggle', icon: <Tag className="w-4 h-4" />, defaultValue: true }
    ]
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Bot do Telegram',
    longDescription: 'Receba notificações de pedidos no Telegram via bot. Gratuito.',
    icon: <Send className="w-6 h-6" />,
    color: 'text-sky-600',
    bgColor: 'bg-sky-100',
    category: 'notifications',
    settings: [
      { key: 'telegram_enabled', label: 'Ativar Telegram', description: 'Habilita bot do Telegram', type: 'toggle', icon: <Send className="w-4 h-4" />, defaultValue: false },
      { key: 'telegram_bot_token', label: 'Bot Token', description: 'Token do @BotFather', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: '123456789:ABC...', defaultValue: '' },
      { key: 'telegram_chat_id', label: 'Chat ID', description: 'ID do chat/grupo', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: '-123456789', defaultValue: '' },
      { key: 'telegram_notify_orders', label: 'Novos Pedidos', description: 'Notifica pedidos novos', type: 'toggle', icon: <ShoppingBag className="w-4 h-4" />, defaultValue: true },
      { key: 'telegram_notify_reviews', label: 'Avaliações', description: 'Notifica novas avaliações', type: 'toggle', icon: <Star className="w-4 h-4" />, defaultValue: true }
    ]
  },
  {
    id: 'sounds',
    name: 'Alertas Sonoros',
    description: 'Sons no painel',
    longDescription: 'Configure sons para alertar novos pedidos e outras notificações.',
    icon: <Volume2 className="w-6 h-6" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    category: 'notifications',
    settings: [
      { key: 'sounds_enabled', label: 'Ativar Sons', description: 'Habilita alertas sonoros', type: 'toggle', icon: <Volume2 className="w-4 h-4" />, defaultValue: true },
      { key: 'sound_new_order', label: 'Novo Pedido', description: 'Som ao receber pedido', type: 'select', icon: <Bell className="w-4 h-4" />, options: [{ value: 'bell', label: '🔔 Sino' }, { value: 'chime', label: '🎵 Chime' }, { value: 'alert', label: '⚠️ Alerta' }, { value: 'notification', label: '📱 Notificação' }, { value: 'none', label: '🔇 Nenhum' }], defaultValue: 'bell' },
      { key: 'sound_order_ready', label: 'Pedido Pronto', description: 'Som quando fica pronto', type: 'select', icon: <ChefHat className="w-4 h-4" />, options: [{ value: 'bell', label: '🔔 Sino' }, { value: 'chime', label: '🎵 Chime' }, { value: 'success', label: '✅ Sucesso' }, { value: 'none', label: '🔇 Nenhum' }], defaultValue: 'chime' },
      { key: 'sound_volume', label: 'Volume', description: 'Nível do som', type: 'select', icon: <Volume2 className="w-4 h-4" />, options: [{ value: '25', label: '25%' }, { value: '50', label: '50%' }, { value: '75', label: '75%' }, { value: '100', label: '100%' }], defaultValue: '75' },
      { key: 'sound_repeat', label: 'Repetir Alerta', description: 'Repete até confirmar', type: 'toggle', icon: <Bell className="w-4 h-4" />, defaultValue: true },
      { key: 'sound_repeat_interval', label: 'Intervalo Repetição', description: 'Segundos entre repetições', type: 'number', icon: <Timer className="w-4 h-4" />, placeholder: '30', suffix: 'seg', defaultValue: 30 }
    ]
  }
]

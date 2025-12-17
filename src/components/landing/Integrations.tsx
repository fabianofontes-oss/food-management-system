'use client'

import { AnimatedSection, getStaggerDelay } from './AnimatedSection'
import { 
  MessageCircle, 
  CreditCard, 
  Printer, 
  MapPin,
  Star,
  Smartphone,
  Zap,
  Globe
} from 'lucide-react'

const integrations = [
  {
    category: 'Delivery',
    items: [
      { name: 'iFood', description: 'Receba pedidos do iFood direto no sistema', color: 'from-red-500 to-red-600' },
      { name: 'Rappi', description: 'Integração com pedidos Rappi', color: 'from-orange-500 to-orange-600' },
      { name: 'Aiqfome', description: 'Sincronize com Aiqfome', color: 'from-purple-500 to-purple-600' },
      { name: '99Food', description: 'Pedidos 99Food integrados', color: 'from-yellow-500 to-yellow-600' },
    ]
  },
  {
    category: 'Pagamentos',
    items: [
      { name: 'PIX', description: 'Pagamentos instantâneos via PIX', color: 'from-teal-500 to-teal-600' },
      { name: 'Mercado Pago', description: 'Cartão, boleto e PIX', color: 'from-blue-500 to-blue-600' },
      { name: 'PagSeguro', description: 'Todas as formas de pagamento', color: 'from-green-500 to-green-600' },
      { name: 'Stone', description: 'Maquininhas integradas', color: 'from-emerald-500 to-emerald-600' },
    ]
  },
  {
    category: 'Comunicação',
    items: [
      { name: 'WhatsApp', description: 'Notificações automáticas', color: 'from-green-500 to-green-600' },
      { name: 'SMS', description: 'Alertas por mensagem', color: 'from-blue-500 to-blue-600' },
      { name: 'E-mail', description: 'Confirmações e marketing', color: 'from-gray-500 to-gray-600' },
      { name: 'Push', description: 'Notificações no app', color: 'from-violet-500 to-violet-600' },
    ]
  },
]

const features = [
  { icon: Smartphone, label: 'Apps de Delivery', count: '4+' },
  { icon: CreditCard, label: 'Gateways de Pagamento', count: '6+' },
  { icon: MessageCircle, label: 'Canais de Comunicação', count: '4+' },
  { icon: Printer, label: 'Impressoras Térmicas', count: '10+' },
  { icon: MapPin, label: 'Google Maps', count: '✓' },
  { icon: Star, label: 'Google Meu Negócio', count: '✓' },
  { icon: Zap, label: 'Webhooks', count: '∞' },
  { icon: Globe, label: 'API Aberta', count: '✓' },
]

export function Integrations() {
  return (
    <section id="integracoes" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-violet-100/50 via-transparent to-transparent dark:from-violet-900/20" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Ecossistema completo
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Integrado com tudo que você
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent"> já usa</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
            Conecte seu negócio com as principais plataformas de delivery, pagamento e comunicação
          </p>
        </AnimatedSection>

        {/* Integration Cards */}
        <div className="grid lg:grid-cols-3 gap-6 mb-16">
          {integrations.map((category, catIndex) => (
            <AnimatedSection key={category.category} delay={getStaggerDelay(catIndex, 0, 100)}>
              <div className="h-full p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
                  {category.category}
                </h3>
                <div className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <div
                      key={item.name}
                      className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-default"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold text-sm shadow-lg transition-transform group-hover:scale-110`}>
                        {item.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {item.description}
                        </div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" title="Disponível" />
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Features Grid */}
        <AnimatedSection delay={400}>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {features.map((feature, index) => (
              <div
                key={feature.label}
                className="group text-center p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-lg transition-all"
              >
                <feature.icon className="w-6 h-6 mx-auto mb-2 text-violet-600 dark:text-violet-400 transition-transform group-hover:scale-110" />
                <div className="text-2xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                  {feature.count}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {feature.label}
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* CTA */}
        <AnimatedSection delay={500} className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Não encontrou a integração que precisa?
          </p>
          <a
            href="#faq"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Fale com nosso time
            <MessageCircle className="w-4 h-4" />
          </a>
        </AnimatedSection>
      </div>
    </section>
  )
}

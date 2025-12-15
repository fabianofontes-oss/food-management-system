'use client'

import { 
  Smartphone, QrCode, Bell, CreditCard, Clock, MapPin,
  Receipt, Printer, Users, TrendingUp, Shield, Zap,
  Palette, Globe, MessageCircle, Package, LucideIcon
} from 'lucide-react'
import { AnimatedSection, useStagger } from './AnimatedSection'

const features = [
  {
    icon: QrCode,
    title: 'QR Code Dinâmico',
    description: 'Gere QR codes para mesas, balcão ou delivery. Cliente escaneia e já acessa o cardápio.',
    color: 'from-violet-500 to-indigo-500',
  },
  {
    icon: Bell,
    title: 'Notificações em Tempo Real',
    description: 'Alertas sonoros e push para novos pedidos. Nunca perca uma venda.',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: CreditCard,
    title: 'Pagamento Online',
    description: 'PIX, cartão de crédito e débito. Integração com Mercado Pago e PagSeguro.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Clock,
    title: 'Horários Automáticos',
    description: 'Configure horários de funcionamento. Sistema abre e fecha sozinho.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: MapPin,
    title: 'Áreas de Entrega',
    description: 'Defina bairros, raios de entrega e taxas diferentes por região.',
    color: 'from-rose-500 to-orange-500',
  },
  {
    icon: Receipt,
    title: 'Cupons e Promoções',
    description: 'Crie cupons de desconto, combos e promoções por horário.',
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: Printer,
    title: 'Impressão Automática',
    description: 'Integração com impressoras térmicas. Imprime direto na cozinha.',
    color: 'from-amber-500 to-yellow-500',
  },
  {
    icon: Users,
    title: 'Multi-usuários',
    description: 'Crie contas para funcionários com permissões específicas.',
    color: 'from-yellow-500 to-lime-500',
  },
  {
    icon: TrendingUp,
    title: 'Relatórios Detalhados',
    description: 'Vendas por período, produtos mais vendidos, horários de pico.',
    color: 'from-lime-500 to-green-500',
  },
  {
    icon: Shield,
    title: 'Dados Seguros',
    description: 'Criptografia de ponta, backups automáticos e LGPD compliant.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Palette,
    title: 'Personalização Total',
    description: 'Cores, logo, layout do cardápio. Deixe com a cara da sua marca.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Globe,
    title: 'Link Próprio',
    description: 'Seu cardápio em pediu.app/suamarca ou domínio próprio.',
    color: 'from-teal-500 to-cyan-500',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp Integrado',
    description: 'Notificações automáticas de pedido para o cliente via WhatsApp.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Package,
    title: 'Controle de Estoque',
    description: 'Gerencie ingredientes, alertas de estoque baixo e custos.',
    color: 'from-blue-500 to-violet-500',
  },
  {
    icon: Smartphone,
    title: '100% Mobile',
    description: 'Gerencie tudo pelo celular. App PWA para iOS e Android.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: Zap,
    title: 'Setup em 5 Minutos',
    description: 'Cadastre produtos, personalize e comece a vender rapidamente.',
    color: 'from-purple-500 to-indigo-500',
  },
]

export function Features() {
  return (
    <section id="funcionalidades" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-violet-50/30 to-white dark:from-gray-900 dark:via-violet-950/20 dark:to-gray-900" />
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            +40 funcionalidades
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Tudo que você precisa para
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent"> vender mais</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
            Funcionalidades pensadas para facilitar sua operação e encantar seus clientes
          </p>
        </AnimatedSection>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <AnimatedSection
              key={feature.title}
              delay={useStagger(index, 0, 50)}
            >
              <div className="group relative h-full p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden">
                {/* Gradient line on top */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
                
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                
                {/* Content */}
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* CTA */}
        <AnimatedSection delay={800} className="mt-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            E muito mais! Novas funcionalidades toda semana.
          </p>
          <a
            href="#precos"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-violet-500/25 transition-all hover:scale-105"
          >
            Ver planos e preços
          </a>
        </AnimatedSection>
      </div>
    </section>
  )
}

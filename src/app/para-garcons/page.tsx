/**
 * Landing Page para Garçons - pediufood.com/para-garcons
 * Demonstração do sistema de comandas digitais
 * 
 * TODO: Implementar layout completo conforme SPECS-LANDING-PAGES.md
 * Por enquanto, placeholder para não quebrar roteamento
 */

'use client'

import { Utensils, Zap, CheckCircle, TrendingUp, ArrowRight, Key, Smartphone, FileText, Send, Users, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { StatsGrid } from '@/components/marketing/StatsGrid'
import { HowItWorksSteps } from '@/components/marketing/HowItWorksSteps'
import { TestimonialsSection } from '@/components/marketing/TestimonialsSection'
import { FAQSection } from '@/components/marketing/FAQSection'
import { CTASection } from '@/components/marketing/CTASection'

export default function ParaGarconsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Utensils className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Atenda Mais Mesas com Tecnologia
          </h1>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            App de comandas digital. Sem papel, sem erro, mais gorjetas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              asChild
              size="lg"
              className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-8 py-6 shadow-2xl"
            >
              <Link href="/demo-garcom">
                Experimentar Grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
          <div className="mt-6 inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
            ✨ Usado em 200+ restaurantes
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 -mt-12 mb-16">
        <StatsGrid
          stats={[
            { icon: Zap, value: '3x', label: 'Mais Rápido', color: 'text-orange-600' },
            { icon: CheckCircle, value: 'Zero', label: 'Erros', color: 'text-green-600' },
            { icon: TrendingUp, value: '+30%', label: 'Gorjetas', color: 'text-blue-600' },
          ]}
        />
      </div>

      {/* Como Funciona */}
      <HowItWorksSteps
        title="Como Funciona"
        subtitle="3 passos para começar a usar"
        steps={[
          {
            number: '1',
            title: 'Receba Login',
            description: 'Gerente cria sua conta no sistema',
            icon: Key,
            time: '1 minuto',
          },
          {
            number: '2',
            title: 'Acesse pelo Celular',
            description: 'Entre com seu usuário no app',
            icon: Smartphone,
            time: 'Instantâneo',
          },
          {
            number: '3',
            title: 'Comece a Atender',
            description: 'Anote pedidos, envie para cozinha, feche contas',
            icon: Utensils,
            time: 'Imediato',
          },
        ]}
      />

      {/* Funcionalidades */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 text-center mb-12">
            Funcionalidades do App
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: FileText, title: 'Comanda Digital', text: 'Anote pedidos direto no celular, sem papel' },
              { icon: Send, title: 'Envio para Cozinha', text: 'Pedido vai direto para o KDS em tempo real' },
              { icon: Users, title: 'Split de Conta', text: 'Divida conta por pessoa ou item facilmente' },
              { icon: Heart, title: 'Gorjeta Digital', text: 'Cliente paga gorjeta via PIX com QR Code' },
            ].map((feature, i) => (
              <div key={i} className="bg-orange-50 rounded-xl p-6 hover:shadow-lg transition-all">
                <feature.icon className="w-10 h-10 text-orange-600 mb-3" />
                <h3 className="font-bold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 text-center mb-8">
            Benefícios para Você
          </h2>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="space-y-3">
              {[
                'Sem papel, sem caneta',
                'Pedidos nunca se perdem',
                'Cozinha recebe na hora',
                'Controle de mesas em tempo real',
                'Histórico de atendimentos',
                'Ranking de performance',
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <TestimonialsSection
        title="Garçons que Usam, Recomendam"
        testimonials={[
          {
            quote: 'Antes eu perdia 30min por noite só organizando comandas. Agora é tudo digital e rápido!',
            author: 'Carlos Silva',
            role: 'Garçom - Restaurante Bella Vista',
            rating: 5,
          },
          {
            quote: 'Minhas gorjetas aumentaram 40% com o sistema. Os clientes adoram o QR Code!',
            author: 'Ana Costa',
            role: 'Garçonete - Pizzaria Napoli',
            rating: 5,
          },
        ]}
      />

      {/* FAQ */}
      <FAQSection
        title="Perguntas Frequentes"
        faqs={[
          {
            question: 'Preciso pagar para usar?',
            answer: 'Não! O sistema é pago pelo restaurante. Você só precisa de um celular.',
          },
          {
            question: 'Funciona offline?',
            answer: 'Sim, você pode anotar pedidos offline e eles sincronizam quando voltar a conexão.',
          },
          {
            question: 'É difícil de aprender?',
            answer: 'Não! A interface é super intuitiva. Em 5 minutos você já está usando.',
          },
          {
            question: 'Como funciona a gorjeta digital?',
            answer: 'O cliente escaneia um QR Code e paga a gorjeta direto para você via PIX.',
          },
        ]}
      />

      {/* CTA Final */}
      <CTASection
        headline="Seu Restaurante Usa o Pediu?"
        subheadline="Peça para o gerente cadastrar você no sistema"
        primaryCTA={{
          text: 'Testar Demo',
          href: '/demo-garcom',
        }}
        secondaryCTA={{
          text: 'Falar com Gerente',
          href: 'https://wa.me/5511999999999?text=Quero%20usar%20o%20app%20de%20gar%u00e7om',
        }}
        gradient="from-orange-600 to-red-600"
      />

      {/* Footer */}
      <footer className="bg-slate-100 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-slate-500">
            Pediu Food • Sistema completo para restaurantes
          </p>
        </div>
      </footer>
    </div>
  )
}

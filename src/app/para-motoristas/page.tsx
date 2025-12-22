'use client'

import { useState } from 'react'
import { 
  Truck, Users, DollarSign, Star, ArrowRight, UserPlus, CheckCircle, 
  Clock, Calendar, Gift, Headphones, TrendingUp, Smartphone, Bike, Car
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { StatsGrid } from '@/components/marketing/StatsGrid'
import { HowItWorksSteps } from '@/components/marketing/HowItWorksSteps'
import { TestimonialsSection } from '@/components/marketing/TestimonialsSection'
import { FAQSection } from '@/components/marketing/FAQSection'
import { CTASection } from '@/components/marketing/CTASection'
import { calcularGanhos, formatarMoeda } from '@/lib/marketing-utils'

export default function ParaMotoristasPage() {
  const [entregasPorDia, setEntregasPorDia] = useState(15)
  const ganhos = calcularGanhos(entregasPorDia, 10)

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Ganhe Dinheiro Fazendo Entregas
          </h1>
          <p className="text-xl text-cyan-100 mb-8 max-w-2xl mx-auto">
            Seja seu próprio chefe. Escolha seus horários. Receba semanalmente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              asChild
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white text-lg px-8 py-6 shadow-2xl"
            >
              <Link href="/cadastro-motorista">
                Quero Ser Entregador
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Link 
              href="/login"
              className="text-white/90 hover:text-white underline"
            >
              Já sou cadastrado
            </Link>
          </div>
          <div className="mt-6 inline-block px-4 py-2 bg-yellow-400 text-yellow-900 rounded-full font-bold">
            💰 Ganhe até R$ 3.000/mês
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 -mt-12 mb-16">
        <StatsGrid
          stats={[
            { icon: Users, value: '500+', label: 'Entregadores', color: 'text-cyan-600' },
            { icon: DollarSign, value: 'R$ 2.5k', label: 'Média/mês', color: 'text-green-600' },
            { icon: Star, value: '4.8/5', label: 'Satisfação', color: 'text-yellow-500' },
          ]}
        />
      </div>

      {/* Como Funciona */}
      <HowItWorksSteps
        title="Como Funciona"
        subtitle="3 passos simples para começar a ganhar"
        steps={[
          {
            number: '1',
            title: 'Cadastre-se',
            description: 'Preencha seus dados, envie documentos e foto',
            icon: UserPlus,
            time: '5 minutos',
          },
          {
            number: '2',
            title: 'Seja Aprovado',
            description: 'Análise em até 24h. Receba credenciais no WhatsApp',
            icon: CheckCircle,
            time: '1 dia',
          },
          {
            number: '3',
            title: 'Comece a Entregar',
            description: 'Aceite corridas, entregue e receba pagamentos',
            icon: Truck,
            time: 'Imediato',
          },
        ]}
      />

      {/* Benefícios */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 text-center mb-12">
            Por Que Ser Entregador Parceiro?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Clock, title: 'Flexibilidade Total', text: 'Trabalhe quando quiser, onde quiser' },
              { icon: Calendar, title: 'Pagamento Semanal', text: 'Receba toda sexta-feira via PIX' },
              { icon: Gift, title: 'Sem Taxa de Adesão', text: 'Cadastro 100% gratuito, sem mensalidade' },
              { icon: Headphones, title: 'Suporte 24/7', text: 'Equipe disponível via WhatsApp' },
              { icon: TrendingUp, title: 'Bônus por Performance', text: 'Ganhe mais entregando com qualidade' },
              { icon: Smartphone, title: 'App Simples', text: 'Interface intuitiva, sem complicação' },
            ].map((benefit, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-6 hover:shadow-lg transition-all">
                <benefit.icon className="w-10 h-10 text-cyan-600 mb-3" />
                <h3 className="font-bold text-slate-800 mb-2">{benefit.title}</h3>
                <p className="text-slate-600 text-sm">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculadora de Ganhos */}
      <section className="py-16 px-4 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 text-center mb-8">
            Calcule Seus Ganhos
          </h2>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <label className="block mb-4">
              <span className="text-slate-700 font-medium mb-2 block">
                Quantas entregas por dia?
              </span>
              <input
                type="range"
                min="5"
                max="30"
                value={entregasPorDia}
                onChange={(e) => setEntregasPorDia(Number(e.target.value))}
                className="w-full h-2 bg-cyan-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-slate-500 mt-2">
                <span>5</span>
                <span className="font-bold text-cyan-600 text-lg">{entregasPorDia}</span>
                <span>30</span>
              </div>
            </label>

            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-sm text-slate-600 mb-1">Por Dia</p>
                <p className="text-2xl font-bold text-green-600">{formatarMoeda(ganhos.porDia)}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-sm text-slate-600 mb-1">Por Semana</p>
                <p className="text-2xl font-bold text-green-600">{formatarMoeda(ganhos.porSemana)}</p>
              </div>
              <div className="text-center p-4 bg-green-100 rounded-xl">
                <p className="text-sm text-slate-600 mb-1">Por Mês</p>
                <p className="text-3xl font-bold text-green-600">{formatarMoeda(ganhos.porMes)}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center mt-4">
              * Valores médios baseados em R$ 8-12 por entrega
            </p>
          </div>
        </div>
      </section>

      {/* Requisitos */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 text-center mb-8">
            Você Precisa de:
          </h2>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: Bike, text: 'Moto ou bicicleta em bom estado' },
                { icon: CheckCircle, text: 'CNH válida (categoria A para moto)' },
                { icon: Smartphone, text: 'Smartphone com GPS' },
                { icon: Gift, text: 'Bag térmica (fornecemos)' },
                { icon: Users, text: 'Maior de 18 anos' },
                { icon: Clock, text: 'Disponibilidade mínima de 20h/semana' },
              ].map((req, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">{req.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <TestimonialsSection
        title="Quem Já Entrega, Aprova"
        testimonials={[
          {
            quote: 'Comecei há 3 meses e já estou tirando mais de R$ 3k por mês. A flexibilidade é incrível!',
            author: 'João Silva',
            role: 'Entregador há 3 meses',
            rating: 5,
          },
          {
            quote: 'O app é muito fácil de usar e o suporte sempre me ajuda quando preciso. Recomendo!',
            author: 'Maria Santos',
            role: 'Entregadora há 1 ano',
            rating: 5,
          },
          {
            quote: 'Trabalho nos meus horários e consigo conciliar com a faculdade. Perfeito!',
            author: 'Pedro Costa',
            role: 'Entregador há 6 meses',
            rating: 5,
          },
        ]}
      />

      {/* FAQ */}
      <FAQSection
        title="Perguntas Frequentes"
        faqs={[
          {
            question: 'Como funciona o pagamento?',
            answer: 'Pagamento semanal via PIX, toda sexta-feira. Você recebe 80% do valor de cada entrega realizada.',
          },
          {
            question: 'Preciso ter moto própria?',
            answer: 'Sim, você precisa de veículo próprio (moto, bicicleta ou carro). Também aceitamos entregadores de bike elétrica.',
          },
          {
            question: 'Posso trabalhar em outras plataformas?',
            answer: 'Sim! Você é autônomo e pode trabalhar em quantas plataformas quiser simultaneamente.',
          },
          {
            question: 'Qual a comissão?',
            answer: 'Você fica com 80% do valor da entrega. Por exemplo: entrega de R$ 10, você recebe R$ 8.',
          },
          {
            question: 'Como recebo as corridas?',
            answer: 'Pelo app, você aceita ou recusa corridas conforme sua disponibilidade e localização.',
          },
          {
            question: 'Tem seguro?',
            answer: 'Oferecemos parceria com seguradoras para você contratar seguro com desconto especial.',
          },
        ]}
      />

      {/* CTA Final */}
      <CTASection
        headline="Pronto para Começar?"
        subheadline="Cadastro rápido e aprovação em 24h"
        primaryCTA={{
          text: 'Cadastrar Agora',
          href: '/cadastro-motorista',
        }}
        secondaryCTA={{
          text: 'Falar no WhatsApp',
          href: 'https://wa.me/5511999999999',
        }}
        gradient="from-green-600 to-emerald-600"
      />

      {/* Footer */}
      <footer className="bg-slate-100 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-slate-500">
            Entregou • Parte do ecossistema Pediu Food
          </p>
        </div>
      </footer>
    </div>
  )
}

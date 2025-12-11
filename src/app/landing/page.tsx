'use client'

import Link from 'next/link'
import { Check, ArrowRight, Zap, Shield, TrendingUp, Users } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b sticky top-0 bg-white z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">Food Management System</h1>
          <div className="flex gap-4">
            <Link href="/login" className="px-6 py-2 text-gray-700 hover:text-green-600 transition-colors">
              Login
            </Link>
            <Link href="/signup" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Começar Grátis
            </Link>
          </div>
        </div>
      </header>

      <section className="py-20 bg-gradient-to-br from-green-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Gerencie seu negócio de alimentação<br />com inteligência
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Sistema completo para delivery, PDV, cozinha e gestão. Tudo em um só lugar.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup" className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold flex items-center gap-2">
              Começar Agora
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#demo" className="px-8 py-4 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-lg font-semibold">
              Ver Demo
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Tudo que você precisa em um só sistema
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Rápido e Eficiente</h4>
              <p className="text-gray-600">
                Interface otimizada para agilizar seus pedidos e aumentar suas vendas.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Seguro e Confiável</h4>
              <p className="text-gray-600">
                Seus dados protegidos com a melhor tecnologia de segurança.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Aumente suas Vendas</h4>
              <p className="text-gray-600">
                Ferramentas de marketing e CRM para fidelizar seus clientes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Planos para todos os tamanhos
          </h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
              <h4 className="text-2xl font-bold text-gray-900 mb-2">Starter</h4>
              <p className="text-gray-600 mb-6">Para começar</p>
              <p className="text-4xl font-bold text-gray-900 mb-6">
                R$ 99<span className="text-lg text-gray-600">/mês</span>
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">1 Loja</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Cardápio Digital</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">PDV Básico</span>
                </li>
              </ul>
              <button className="w-full py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-semibold">
                Começar
              </button>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-xl border-2 border-green-600 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Mais Popular
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-2">Professional</h4>
              <p className="text-gray-600 mb-6">Para crescer</p>
              <p className="text-4xl font-bold text-gray-900 mb-6">
                R$ 199<span className="text-lg text-gray-600">/mês</span>
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">3 Lojas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Todos os módulos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">CRM Completo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Relatórios Avançados</span>
                </li>
              </ul>
              <button className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold">
                Começar
              </button>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
              <h4 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h4>
              <p className="text-gray-600 mb-6">Para escalar</p>
              <p className="text-4xl font-bold text-gray-900 mb-6">
                Custom
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Lojas Ilimitadas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Suporte Prioritário</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Customizações</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">API Dedicada</span>
                </li>
              </ul>
              <button className="w-full py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-semibold">
                Falar com Vendas
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">
            Pronto para começar?
          </h3>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de negócios que já transformaram sua gestão
          </p>
          <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold">
            Começar Agora Grátis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2024 Food Management System. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

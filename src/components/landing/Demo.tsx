'use client'

import Link from 'next/link'
import { Play, ExternalLink, Smartphone, ShoppingCart, CreditCard } from 'lucide-react'
import { AnimatedSection } from './AnimatedSection'

export function Demo() {
  return (
    <section id="demo" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent" />
      
      {/* Animated orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-violet-500/20 to-indigo-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-l from-purple-500/20 to-violet-500/20 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
            Veja o <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Pediu</span> em ação
          </h2>
          <p className="text-lg sm:text-xl text-gray-400">
            Experimente um cardápio digital real e veja como seus clientes vão pedir
          </p>
        </AnimatedSection>

        <AnimatedSection delay={200} className="max-w-5xl mx-auto">
          {/* Demo mockup */}
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500 rounded-3xl opacity-20 group-hover:opacity-40 blur-2xl transition-all duration-700" />
            
            {/* Main container */}
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl overflow-hidden border border-gray-700/50 shadow-2xl">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-6 py-4 bg-gray-800/80 border-b border-gray-700/50">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 mx-8">
                  <div className="bg-gray-700/50 rounded-lg px-4 py-2 text-sm text-gray-400 text-center font-mono flex items-center justify-center gap-2">
                    <span className="text-emerald-400">🔒</span>
                    pediu.food/acai-sabor-real
                  </div>
                </div>
              </div>
              
              {/* Demo area */}
              <div className="relative aspect-[16/9] bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:3rem_3rem]" />
                
                {/* Feature cards floating */}
                <div className="absolute top-8 left-8 p-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/20 backdrop-blur-sm animate-bounce [animation-duration:3s]">
                  <Smartphone className="w-8 h-8 text-violet-400" />
                </div>
                <div className="absolute top-1/4 right-12 p-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 border border-indigo-500/20 backdrop-blur-sm animate-bounce [animation-duration:2.5s] [animation-delay:0.5s]">
                  <ShoppingCart className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="absolute bottom-12 left-1/4 p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 backdrop-blur-sm animate-bounce [animation-duration:2s] [animation-delay:1s]">
                  <CreditCard className="w-8 h-8 text-purple-400" />
                </div>
                
                {/* Play button */}
                <Link
                  href="/acai-sabor-real"
                  className="relative z-10 group/btn flex flex-col items-center gap-4"
                >
                  <div className="relative">
                    {/* Pulse rings */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 animate-ping opacity-20" />
                    <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 animate-pulse opacity-10" />
                    
                    {/* Play button */}
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/40 transition-all duration-300 group-hover/btn:scale-110 group-hover/btn:shadow-violet-500/60">
                      <Play className="w-10 h-10 text-white fill-white ml-1" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-300 group-hover/btn:bg-white/20">
                    <span className="text-white font-bold">Ver demonstração ao vivo</span>
                    <ExternalLink className="w-4 h-4 text-violet-400" />
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { icon: Smartphone, text: 'Mobile-first', color: 'violet' },
              { icon: ShoppingCart, text: 'Checkout rápido', color: 'indigo' },
              { icon: CreditCard, text: 'Pagamento integrado', color: 'purple' },
            ].map((item, i) => (
              <div key={i} className="text-center p-4 rounded-2xl bg-gray-800/50 border border-gray-700/50">
                <item.icon className={`w-6 h-6 mx-auto mb-2 text-${item.color}-400`} />
                <span className="text-sm text-gray-400 font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

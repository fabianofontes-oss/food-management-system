'use client'

import Link from 'next/link'
import { Play, ExternalLink } from 'lucide-react'
import { AnimatedSection } from './AnimatedSection'

export function Demo() {
  return (
    <section id="demo" className="py-20 sm:py-28 bg-white dark:bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Veja o Pediu em ação
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Experimente um cardápio digital real e veja como seus clientes vão pedir
          </p>
        </AnimatedSection>

        <AnimatedSection delay={200} className="max-w-4xl mx-auto">
          {/* Video placeholder / Demo preview */}
          <div className="relative group">
            {/* Glow effect on hover */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl opacity-20 group-hover:opacity-40 blur-xl transition-opacity duration-500" />
            
            {/* Main container */}
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-2xl">
              {/* Browser chrome mockup */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/80 border-b border-gray-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-700 rounded-md px-3 py-1 text-sm text-gray-400 text-center">
                    pediu.food/acai-sabor-real
                  </div>
                </div>
              </div>
              
              {/* Video/Demo area */}
              <div className="relative aspect-video bg-gradient-to-br from-emerald-900/20 to-teal-900/20 flex items-center justify-center">
                {/* Placeholder pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem]" />
                
                {/* Play button */}
                <Link
                  href="/acai-sabor-real"
                  className="relative z-10 group/btn flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full border border-white/20 transition-all duration-300 hover:scale-105"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                  </div>
                  <span className="text-white font-semibold">Ver demonstração ao vivo</span>
                  <ExternalLink className="w-4 h-4 text-white/60" />
                </Link>
                
                {/* Decorative elements */}
                <div className="absolute top-8 left-8 w-32 h-32 bg-emerald-500/10 rounded-2xl" />
                <div className="absolute bottom-8 right-8 w-48 h-24 bg-teal-500/10 rounded-xl" />
                <div className="absolute top-1/2 left-1/4 w-24 h-40 bg-emerald-500/5 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Caption */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Clique para abrir um cardápio de exemplo em uma nova aba
          </p>
        </AnimatedSection>
      </div>
    </section>
  )
}

'use client'

import Link from 'next/link'
import { ArrowRight, Play, Check, Sparkles } from 'lucide-react'
import { AnimatedSection } from './AnimatedSection'

interface HeroProps {
  headline: string
  subheadline: string
  primaryCTA: { text: string; href: string }
  secondaryCTA: { text: string; href: string }
  stats: Array<{ value: string; label: string }>
}

export function Hero({ headline, subheadline, primaryCTA, secondaryCTA, stats }: HeroProps) {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center pt-20">
      {/* Vibrant gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-indigo-500/10 to-purple-500/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/80 dark:from-gray-900 dark:to-gray-900/80" />
      
      {/* Animated mesh gradient */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-40 w-[500px] h-[500px] bg-gradient-to-r from-violet-400 to-indigo-300 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-l from-purple-400 to-violet-300 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-gradient-to-t from-indigo-400 to-purple-300 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8b5cf615_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf615_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_40%,transparent_100%)]" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Animated badge */}
          <AnimatedSection delay={0}>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 backdrop-blur-sm mb-8 shadow-lg shadow-violet-500/10">
              <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
              <span className="text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                +500 estabelecimentos ativos
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
              </span>
            </div>
          </AnimatedSection>

          {/* Headline with gradient */}
          <AnimatedSection delay={100}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
              <span className="text-gray-900 dark:text-white">{headline.split(',')[0]},</span>
              <br />
              <span className="bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                completo e digital
              </span>
            </h1>
          </AnimatedSection>

          {/* Subheadline */}
          <AnimatedSection delay={200}>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
              {subheadline}
            </p>
          </AnimatedSection>

          {/* 3D CTAs */}
          <AnimatedSection delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              {/* Primary CTA - 3D effect */}
              <Link 
                href={primaryCTA.href}
                className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 overflow-hidden rounded-2xl font-bold text-white text-lg transition-all duration-300 hover:scale-105 active:scale-100"
              >
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600" />
                {/* 3D shadow layer */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
                {/* Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                
                <span className="relative">{primaryCTA.text}</span>
                <ArrowRight className="relative w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>

              {/* Secondary CTA */}
              <Link 
                href={secondaryCTA.href}
                className="group inline-flex items-center justify-center gap-2 px-10 py-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white font-bold text-lg rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-violet-500/10 active:scale-100"
              >
                <Play className="w-5 h-5 fill-violet-500 text-violet-500 group-hover:scale-110 transition-transform" />
                {secondaryCTA.text}
              </Link>
            </div>
          </AnimatedSection>

          {/* Trust signals with icons */}
          <AnimatedSection delay={400}>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {[
                'Setup em 5 minutos',
                'Sem taxa de adesão', 
                'Suporte em português'
              ].map((text, i) => (
                <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-violet-100 dark:border-violet-900/50 text-gray-700 dark:text-gray-300">
                  <Check className="w-4 h-4 text-violet-500" />
                  {text}
                </span>
              ))}
            </div>
          </AnimatedSection>
        </div>

        {/* Stats with gradient cards */}
        <AnimatedSection delay={500} className="mt-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="group relative text-center p-8 rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-800 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/20"
              >
                {/* Gradient glow on hover */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative">
                  <div className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-6 h-10 rounded-full border-2 border-violet-500/30 flex items-start justify-center p-1.5">
          <div className="w-1.5 h-3 rounded-full bg-gradient-to-b from-violet-500 to-indigo-500 animate-bounce" />
        </div>
      </div>
    </section>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Play, Sparkles, Zap } from 'lucide-react'

interface HeroProps {
  headline: string
  subheadline: string
  primaryCTA: { text: string; href: string }
  secondaryCTA: { text: string; href: string }
  stats: Array<{ value: string; label: string }>
}

export function Hero({ headline, subheadline, primaryCTA, secondaryCTA, stats }: HeroProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center">
      {/* Animated gradient background with parallax */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-background -z-10 transition-transform duration-1000"
        style={{ transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent -z-10" />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)] -z-10 animate-pulse" />
      
      {/* Floating orbs with different animations */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-l from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center py-20 gap-12 animate-in">
          {/* Animated badge */}
          <div className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 backdrop-blur-md hover:border-primary/40 transition-all hover:scale-105 cursor-default shadow-lg shadow-primary/5">
            <Zap className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              Sistema completo para food service
            </span>
            <Sparkles className="w-4 h-4 text-purple-500 animate-pulse delay-1000" />
          </div>

          {/* Headline with gradient animation */}
          <div className="max-w-6xl space-y-8">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight">
              <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-foreground via-primary to-purple-600 animate-gradient">
                {headline}
              </span>
            </h1>
            <p className="text-xl sm:text-2xl lg:text-3xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
              {subheadline}
            </p>
          </div>

          {/* Premium CTAs with 3D effect */}
          <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto mt-6">
            <Link 
              href={primaryCTA.href}
              className="group relative inline-flex items-center justify-center gap-3 px-12 py-5 text-lg font-bold text-white overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {/* 3D button layers */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-primary/80 to-purple-600/80 blur-xl" />
              
              {/* Button content */}
              <span className="relative z-10">{primaryCTA.text}</span>
              <ArrowRight className="relative z-10 w-5 h-5 transition-transform group-hover:translate-x-1" />
              
              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
            </Link>

            <Link 
              href={secondaryCTA.href}
              className="group relative inline-flex items-center justify-center gap-3 px-12 py-5 text-lg font-bold overflow-hidden rounded-2xl border-2 border-primary/30 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/60 hover:bg-primary/5 active:scale-95"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-primary/10 to-purple-500/10" />
              <Play className="relative z-10 w-5 h-5 fill-current transition-transform group-hover:scale-110" />
              <span className="relative z-10">{secondaryCTA.text}</span>
            </Link>
          </div>

          {/* Animated stats with stagger */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 mt-20 w-full max-w-5xl">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="relative group cursor-default"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 scale-95 group-hover:scale-100" />
                
                {/* Card */}
                <div className="relative p-8 rounded-3xl bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-xl border border-primary/10 group-hover:border-primary/30 transition-all duration-500 group-hover:translate-y-[-4px]">
                  {/* Stat value with gradient */}
                  <div className="text-5xl sm:text-6xl lg:text-7xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-br from-primary via-purple-600 to-pink-600 group-hover:scale-110 transition-transform duration-500">
                    {stat.value}
                  </div>
                  
                  {/* Stat label */}
                  <div className="text-sm sm:text-base text-muted-foreground font-semibold tracking-wide">
                    {stat.label}
                  </div>
                  
                  {/* Decorative element */}
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-gradient-to-r from-primary to-purple-600 opacity-50 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 rounded-full bg-primary/50 animate-pulse" />
        </div>
      </div>
    </section>
  )
}

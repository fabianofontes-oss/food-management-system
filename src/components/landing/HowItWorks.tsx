'use client'

import { Store, Share2, ShoppingBag, LucideIcon, ArrowRight } from 'lucide-react'
import { AnimatedSection, useStagger } from './AnimatedSection'

const iconMap: Record<string, LucideIcon> = {
  Store,
  Share2,
  ShoppingBag,
}

const stepGradients = [
  'from-violet-500 to-indigo-500',
  'from-indigo-500 to-purple-500',
  'from-purple-500 to-pink-500',
]

interface Step {
  number: string
  title: string
  description: string
  icon: string
}

interface HowItWorksProps {
  title: string
  subtitle: string
  steps: Step[]
}

export function HowItWorks({ title, subtitle, steps }: HowItWorksProps) {
  return (
    <section id="como-funciona" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-violet-50/50 via-white to-white dark:from-violet-950/30 dark:via-gray-900 dark:to-gray-900" />
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4">
            {title}
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = iconMap[step.icon]
            const gradient = stepGradients[index]
            
            return (
              <AnimatedSection 
                key={index} 
                delay={useStagger(index, 150)}
                className="relative"
              >
                <div className="group relative flex flex-col items-center text-center p-8 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl overflow-hidden">
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  {/* Step number badge */}
                  <div className={`absolute top-4 right-4 w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                    {index + 1}
                  </div>
                  
                  {/* Icon */}
                  <div className={`relative w-20 h-20 rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                    <Icon className="w-10 h-10 text-white" />
                    {/* Glow */}
                    <div className={`absolute -inset-2 bg-gradient-to-br ${gradient} rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity`} />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Connector arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 lg:-right-1 z-10 w-6 h-6 items-center justify-center">
                    <ArrowRight className={`w-5 h-5 text-${index === 0 ? 'emerald' : index === 1 ? 'teal' : 'cyan'}-500`} />
                  </div>
                )}
              </AnimatedSection>
            )
          })}
        </div>
      </div>
    </section>
  )
}

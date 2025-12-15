'use client'

import { Store, Share2, ShoppingBag, LucideIcon } from 'lucide-react'
import { AnimatedSection, useStagger } from './AnimatedSection'

const iconMap: Record<string, LucideIcon> = {
  Store,
  Share2,
  ShoppingBag,
}

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
    <section id="como-funciona" className="py-20 sm:py-28 bg-gray-50 dark:bg-gray-900/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = iconMap[step.icon]
            return (
              <AnimatedSection 
                key={index} 
                delay={useStagger(index, 100)}
                className="relative"
              >
                <div className="group flex flex-col items-center text-center">
                  {/* Step number + icon */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
                      <Icon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-lg">
                      {index + 1}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] h-px bg-gradient-to-r from-emerald-300 to-transparent dark:from-emerald-700" />
                )}
              </AnimatedSection>
            )
          })}
        </div>
      </div>
    </section>
  )
}

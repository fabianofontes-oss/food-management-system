'use client'

import { 
  IceCream, Beef, UtensilsCrossed, Pizza, Coffee, Salad, 
  Fish, Cake, Beer, Leaf, Building2, Croissant,
  Apple, Store, Sandwich, Waves, LucideIcon 
} from 'lucide-react'
import { AnimatedSection, useStagger } from './AnimatedSection'

const iconMap: Record<string, LucideIcon> = {
  IceCream,
  Beef,
  UtensilsCrossed,
  Pizza,
  Coffee,
  Salad,
  Fish,
  Cake,
  Beer,
  Leaf,
  Building2,
  Croissant,
  Apple,
  Store,
  Sandwich,
  Waves,
}

interface Segment {
  icon: string
  title: string
  description: string
  image: string
}

interface TargetAudienceProps {
  title: string
  subtitle: string
  segments: Segment[]
}

export function TargetAudience({ title, subtitle, segments }: TargetAudienceProps) {
  return (
    <section id="para-quem" className="py-20 sm:py-28 bg-gray-50 dark:bg-gray-900/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {segments.map((segment, index) => {
            const Icon = iconMap[segment.icon]
            return (
              <AnimatedSection 
                key={index}
                delay={useStagger(index, 0, 80)}
              >
                <div className="group h-full p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3">
                    <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {segment.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {segment.description}
                  </p>
                </div>
              </AnimatedSection>
            )
          })}
        </div>
      </div>
    </section>
  )
}

'use client'

import { 
  Menu, ShoppingCart, Monitor, ChefHat, Truck, Users, Package, BarChart3, LucideIcon 
} from 'lucide-react'
import { AnimatedSection, useStagger } from './AnimatedSection'

const iconMap: Record<string, LucideIcon> = {
  Menu,
  ShoppingCart,
  Monitor,
  ChefHat,
  Truck,
  Users,
  Package,
  BarChart3,
}

interface Module {
  icon: string
  title: string
  description: string
}

interface ModulesProps {
  title: string
  subtitle: string
  items: Module[]
}

export function Modules({ title, subtitle, items }: ModulesProps) {
  return (
    <section id="modulos" className="py-20 sm:py-28 bg-white dark:bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        </AnimatedSection>

        {/* Bento Grid - 4 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {items.map((module, index) => {
            const Icon = iconMap[module.icon]
            const isWide = index === 0 || index === 5
            
            return (
              <AnimatedSection
                key={index}
                delay={useStagger(index, 0, 60)}
                className={isWide ? 'sm:col-span-2' : ''}
              >
                <div className="group h-full p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3">
                    <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {module.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {module.description}
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

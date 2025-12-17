'use client'

import { 
  Menu, ShoppingCart, Monitor, ChefHat, Truck, Users, Package, BarChart3, LucideIcon 
} from 'lucide-react'
import { AnimatedSection, getStaggerDelay } from './AnimatedSection'

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

const gradients = [
  'from-violet-500 to-indigo-500',
  'from-indigo-500 to-purple-500',
  'from-purple-500 to-pink-500',
  'from-pink-500 to-rose-500',
  'from-rose-500 to-orange-500',
  'from-orange-500 to-amber-500',
  'from-amber-500 to-yellow-500',
  'from-teal-500 to-cyan-500',
]

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
    <section id="modulos" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-violet-50/30 to-white dark:from-gray-900 dark:via-violet-950/20 dark:to-gray-900" />
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4">
            {title}
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        </AnimatedSection>

        {/* Bento Grid with colorful cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto">
          {items.map((module, index) => {
            const Icon = iconMap[module.icon]
            const isWide = index === 0 || index === 5
            const gradient = gradients[index % gradients.length]
            
            return (
              <AnimatedSection
                key={index}
                delay={getStaggerDelay(index, 0, 80)}
                className={isWide ? 'sm:col-span-2' : ''}
              >
                <div className="group relative h-full p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl overflow-hidden">
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  {/* Colored top border */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                  
                  {/* Content */}
                  <div className="relative">
                    {/* Icon with gradient bg */}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-xl`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-indigo-600 transition-all duration-300">
                      {module.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {module.description}
                    </p>
                  </div>
                  
                  {/* Corner decoration */}
                  <div className={`absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br ${gradient} rounded-full opacity-0 group-hover:opacity-10 transition-all duration-500 group-hover:-translate-x-2 group-hover:-translate-y-2`} />
                </div>
              </AnimatedSection>
            )
          })}
        </div>
      </div>
    </section>
  )
}

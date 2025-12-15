'use client'

import { 
  Menu, ShoppingCart, Monitor, ChefHat, Truck, Users, Package, BarChart3, LucideIcon 
} from 'lucide-react'
import { AnimatedSection } from './AnimatedSection'

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
    <section id="modulos" className="relative py-32 overflow-hidden">
      {/* Section transition gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent -z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-muted/30 to-transparent -z-10" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
            {title}
          </h2>
          <p className="text-xl sm:text-2xl text-muted-foreground font-light">
            {subtitle}
          </p>
        </AnimatedSection>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {items.map((module, index) => {
            const Icon = iconMap[module.icon]
            const isLarge = index === 0 || index === 3
            
            return (
              <AnimatedSection
                key={index}
                delay={index * 100}
                className={`group relative ${isLarge ? 'md:col-span-2' : ''}`}
              >
                {/* Glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500" />
                
                {/* Card */}
                <div className="relative h-full p-8 rounded-3xl bg-gradient-to-br from-background to-muted/30 border-2 border-primary/10 group-hover:border-primary/30 transition-all duration-500 group-hover:translate-y-[-8px] overflow-hidden">
                  {/* Background pattern */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:14px_14px] opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Content */}
                  <div className="relative space-y-4">
                    {/* Icon with animated background */}
                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 group-hover:from-primary/20 group-hover:to-purple-500/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                      <Icon className="w-8 h-8 text-primary transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                      {module.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-muted-foreground leading-relaxed">
                      {module.description}
                    </p>
                  </div>
                  
                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </AnimatedSection>
            )
          })}
        </div>
      </div>
    </section>
  )
}

import { 
  Menu, ShoppingCart, Monitor, ChefHat, Truck, Users, Package, BarChart3, LucideIcon 
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

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
    <section id="modulos" className="py-20 sm:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            {title}
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground">
            {subtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {items.map((module, index) => {
            const Icon = iconMap[module.icon]
            return (
              <Card key={index} className="group relative border-2 hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                <CardContent className="relative p-6 space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold">
                    {module.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {module.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

import { 
  IceCream, Beef, UtensilsCrossed, Pizza, Coffee, Salad, LucideIcon 
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const iconMap: Record<string, LucideIcon> = {
  IceCream,
  Beef,
  UtensilsCrossed,
  Pizza,
  Coffee,
  Salad,
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
    <section id="para-quem" className="py-20 sm:py-28 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            {title}
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground">
            {subtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {segments.map((segment, index) => {
            const Icon = iconMap[segment.icon]
            return (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      {segment.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {segment.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

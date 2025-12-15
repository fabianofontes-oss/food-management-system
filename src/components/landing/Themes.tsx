import { Palette, Smartphone, Eye, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ThemesProps {
  title: string
  subtitle: string
  description: string
  menuLayouts: Array<{ name: string; description: string }>
  cardStyles: Array<{ name: string; description: string }>
  features: string[]
}

export function Themes({ title, subtitle, description, menuLayouts, cardStyles, features }: ThemesProps) {
  return (
    <section id="temas" className="py-20 sm:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            {title}
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-4">
            {subtitle}
          </p>
          <p className="text-base text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-12">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Layouts de Menu</h3>
                </div>
                <div className="space-y-3">
                  {menuLayouts.map((layout, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Badge variant="outline" className="mt-0.5">{index + 1}</Badge>
                      <div>
                        <div className="font-medium">{layout.name}</div>
                        <div className="text-sm text-muted-foreground">{layout.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Estilos de Cards</h3>
                </div>
                <div className="space-y-3">
                  {cardStyles.map((style, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Badge variant="outline" className="mt-0.5">{index + 1}</Badge>
                      <div>
                        <div className="font-medium">{style.name}</div>
                        <div className="text-sm text-muted-foreground">{style.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Recursos de Personalização</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

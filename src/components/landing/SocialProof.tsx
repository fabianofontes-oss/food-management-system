import { Card, CardContent } from '@/components/ui/card'
import { Quote } from 'lucide-react'

interface Logo {
  name: string
  image: string
}

interface Testimonial {
  quote: string
  author: string
  role: string
  avatar: string
}

interface SocialProofProps {
  title: string
  subtitle: string
  logos: Logo[]
  testimonials: Testimonial[]
}

export function SocialProof({ title, subtitle, logos, testimonials }: SocialProofProps) {
  return (
    <section id="depoimentos" className="py-20 sm:py-28 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            {title}
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground">
            {subtitle}
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center opacity-60">
            {logos.map((logo, index) => (
              <div key={index} className="flex items-center justify-center h-16 text-center text-sm text-muted-foreground">
                {logo.name}
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2">
                <CardContent className="p-6 space-y-4">
                  <Quote className="w-8 h-8 text-primary/20" />
                  <p className="text-muted-foreground italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {testimonial.author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

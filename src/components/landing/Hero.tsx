import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play } from 'lucide-react'

interface HeroProps {
  headline: string
  subheadline: string
  primaryCTA: { text: string; href: string }
  secondaryCTA: { text: string; href: string }
  stats: Array<{ value: string; label: string }>
}

export function Hero({ headline, subheadline, primaryCTA, secondaryCTA, stats }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center py-20 sm:py-28 lg:py-36 gap-8">
          <div className="max-w-4xl space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight">
              {headline}
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto">
              {subheadline}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button asChild size="lg" className="text-base sm:text-lg h-12 sm:h-14 px-8">
              <Link href={primaryCTA.href}>
                {primaryCTA.text}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base sm:text-lg h-12 sm:h-14 px-8">
              <Link href={secondaryCTA.href}>
                <Play className="mr-2 h-5 w-5" />
                {secondaryCTA.text}
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 mt-12 w-full max-w-3xl">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm sm:text-base text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

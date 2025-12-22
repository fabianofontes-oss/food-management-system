'use client'

import { ArrowRight, LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface CTASectionProps {
  headline: string
  subheadline?: string
  primaryCTA: {
    text: string
    href: string
    icon?: LucideIcon
  }
  secondaryCTA?: {
    text: string
    href: string
  }
  gradient?: string
}

export function CTASection({
  headline,
  subheadline,
  primaryCTA,
  secondaryCTA,
  gradient = 'from-slate-800 to-slate-900',
}: CTASectionProps) {
  const PrimaryIcon = primaryCTA.icon

  return (
    <section className={`bg-gradient-to-r ${gradient} text-white py-16 px-4`}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {headline}
        </h2>
        {subheadline && (
          <p className="text-xl text-white/80 mb-8">
            {subheadline}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 py-6 shadow-2xl"
          >
            <Link href={primaryCTA.href}>
              {primaryCTA.text}
              {PrimaryIcon ? (
                <PrimaryIcon className="w-5 h-5 ml-2" />
              ) : (
                <ArrowRight className="w-5 h-5 ml-2" />
              )}
            </Link>
          </Button>
          {secondaryCTA && (
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6"
            >
              <Link href={secondaryCTA.href}>
                {secondaryCTA.text}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { AnimatedSection, useStagger } from './AnimatedSection'

interface Plan {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  href: string
  highlighted: boolean
}

interface PricingProps {
  title: string
  subtitle: string
  plans: Plan[]
}

export function Pricing({ title, subtitle, plans }: PricingProps) {
  return (
    <section id="precos" className="py-20 sm:py-28 bg-gray-50 dark:bg-gray-900/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {plans.map((plan, index) => (
            <AnimatedSection 
              key={index}
              delay={useStagger(index, 100)}
              className={plan.highlighted ? 'md:-mt-4 md:mb-4' : ''}
            >
              <div className={`
                relative h-full p-6 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1
                ${plan.highlighted 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-500/25' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                }
              `}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">
                    Mais Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className={`text-xl font-bold mb-1 ${plan.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${plan.highlighted ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'}`}>
                    {plan.description}
                  </p>
                </div>

                <div className="text-center mb-6">
                  <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`text-sm ${plan.highlighted ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'}`}>
                      {plan.period}
                    </span>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-emerald-200' : 'text-emerald-500'}`} />
                      <span className={`text-sm ${plan.highlighted ? 'text-emerald-50' : 'text-gray-600 dark:text-gray-300'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`
                    block w-full py-3 px-4 text-center font-semibold rounded-xl transition-all duration-200
                    ${plan.highlighted 
                      ? 'bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                  `}
                >
                  {plan.cta}
                </Link>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

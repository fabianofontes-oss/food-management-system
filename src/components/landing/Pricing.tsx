'use client'

import Link from 'next/link'
import { Check, Sparkles, Zap, Building2 } from 'lucide-react'
import { AnimatedSection, useStagger } from './AnimatedSection'

const planIcons = [Zap, Sparkles, Building2]

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
    <section id="precos" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent dark:from-emerald-900/20" />
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4">
            {title}
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          {plans.map((plan, index) => {
            const Icon = planIcons[index] || Zap
            
            return (
              <AnimatedSection 
                key={index}
                delay={useStagger(index, 100)}
                className={plan.highlighted ? 'md:-mt-6 md:mb-6' : ''}
              >
                <div className={`
                  group relative h-full rounded-3xl transition-all duration-500 hover:-translate-y-2
                  ${plan.highlighted 
                    ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-[2px] shadow-2xl shadow-emerald-500/30' 
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-xl'
                  }
                `}>
                  {/* Inner content */}
                  <div className={`
                    relative h-full p-8 rounded-[22px]
                    ${plan.highlighted 
                      ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white' 
                      : 'bg-white dark:bg-gray-800'
                    }
                  `}>
                    {/* Badge for highlighted */}
                    {plan.highlighted && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Mais Popular
                      </div>
                    )}

                    {/* Plan icon */}
                    <div className={`
                      w-14 h-14 rounded-2xl flex items-center justify-center mb-6
                      ${plan.highlighted 
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30' 
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600'
                      }
                    `}>
                      <Icon className={`w-7 h-7 ${plan.highlighted ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`} />
                    </div>

                    {/* Plan name */}
                    <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm mb-6 ${plan.highlighted ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {plan.description}
                    </p>

                    {/* Price */}
                    <div className="mb-8">
                      <span className={`text-5xl font-black ${plan.highlighted ? 'text-white' : 'bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent'}`}>
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className={`text-sm ${plan.highlighted ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {plan.period}
                        </span>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <div className={`
                            w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                            ${plan.highlighted 
                              ? 'bg-emerald-500/20' 
                              : 'bg-emerald-100 dark:bg-emerald-900/30'
                            }
                          `}>
                            <Check className={`w-3 h-3 ${plan.highlighted ? 'text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                          </div>
                          <span className={`text-sm ${plan.highlighted ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}`}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Link
                      href={plan.href}
                      className={`
                        group/btn relative block w-full py-4 px-6 text-center font-bold rounded-xl overflow-hidden transition-all duration-300
                        ${plan.highlighted 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02]' 
                          : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                        }
                      `}
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                      <span className="relative">{plan.cta}</span>
                    </Link>
                  </div>
                </div>
              </AnimatedSection>
            )
          })}
        </div>
      </div>
    </section>
  )
}

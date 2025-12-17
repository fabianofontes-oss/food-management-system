'use client'

import { useEffect, useRef, useState, ReactNode, CSSProperties } from 'react'

type AnimationType = 'fade-up' | 'fade-in' | 'scale-in' | 'slide-left' | 'slide-right'

interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  delay?: number
  animation?: AnimationType
  once?: boolean
}

const animations: Record<AnimationType, { from: CSSProperties; to: CSSProperties }> = {
  'fade-up': {
    from: { opacity: 0, transform: 'translateY(24px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  'fade-in': {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  'scale-in': {
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
  'slide-left': {
    from: { opacity: 0, transform: 'translateX(24px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },
  'slide-right': {
    from: { opacity: 0, transform: 'translateX(-24px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },
}

export function AnimatedSection({ 
  children, 
  className = '', 
  delay = 0,
  animation = 'fade-up',
  once = true
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true)
      return
    }

    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay)
          if (once) observer.unobserve(node)
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [delay, once, prefersReducedMotion])

  const anim = animations[animation]
  const style: CSSProperties = prefersReducedMotion
    ? {}
    : {
        ...anim.from,
        ...(isVisible ? anim.to : {}),
        transition: `opacity 0.6s ease-out, transform 0.6s ease-out`,
        transitionDelay: `${delay}ms`,
      }

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  )
}

export function getStaggerDelay(index: number, base = 0, step = 80) {
  return base + index * step
}

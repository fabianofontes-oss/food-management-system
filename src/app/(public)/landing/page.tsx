import type { Metadata } from 'next'
import { landingContent } from '@/content/landing'
import { Hero } from '@/components/landing/Hero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Modules } from '@/components/landing/Modules'
import { TargetAudience } from '@/components/landing/TargetAudience'
import { Themes } from '@/components/landing/Themes'
import { SocialProof } from '@/components/landing/SocialProof'
import { Pricing } from '@/components/landing/Pricing'
import { FAQ } from '@/components/landing/FAQ'
import { Footer } from '@/components/landing/Footer'

const baseUrl = process.env.NEXT_PUBLIC_PUBLIC_APP_URL || 'https://pediu.app'

export const metadata: Metadata = {
  title: landingContent.seo.title,
  description: landingContent.seo.description,
  keywords: landingContent.seo.keywords,
  authors: [{ name: 'Pediu' }],
  creator: 'Pediu',
  publisher: 'Pediu',
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: `${baseUrl}/landing`,
    title: landingContent.seo.title,
    description: landingContent.seo.description,
    siteName: 'Pediu',
    images: [
      {
        url: landingContent.seo.ogImage,
        width: 1200,
        height: 630,
        alt: 'Pediu - Sistema Completo de Cardápio Digital',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: landingContent.seo.title,
    description: landingContent.seo.description,
    creator: landingContent.seo.twitterHandle,
    images: [landingContent.seo.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'TODO: Google Search Console verification code',
  },
}

export default function LandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Pediu',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'BRL',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '500',
        },
        description: landingContent.seo.description,
        url: `${baseUrl}/landing`,
        screenshot: landingContent.seo.ogImage,
        featureList: [
          'Cardápio Digital',
          'Pedidos Online',
          'PDV Integrado',
          'Gestão de Delivery',
          'Controle de Estoque',
          'Relatórios e Analytics',
        ],
      },
      {
        '@type': 'Organization',
        name: 'Pediu',
        url: baseUrl,
        logo: `${baseUrl}/logo.png`,
        description: landingContent.footer.company.description,
        sameAs: landingContent.footer.social.map((s) => s.href),
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Support',
          availableLanguage: 'Portuguese',
        },
      },
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}/landing`,
        url: `${baseUrl}/landing`,
        name: landingContent.seo.title,
        description: landingContent.seo.description,
        isPartOf: {
          '@type': 'WebSite',
          '@id': baseUrl,
          url: baseUrl,
          name: 'Pediu',
        },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <main className="min-h-screen">
        <Hero {...landingContent.hero} />
        <HowItWorks {...landingContent.howItWorks} />
        <Modules {...landingContent.modules} />
        <TargetAudience {...landingContent.targetAudience} />
        <Themes {...landingContent.themes} />
        <SocialProof {...landingContent.socialProof} />
        <Pricing {...landingContent.pricing} />
        <FAQ {...landingContent.faq} />
        <Footer {...landingContent.footer} />
      </main>
    </>
  )
}

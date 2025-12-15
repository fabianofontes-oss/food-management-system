import Link from 'next/link'
import { Instagram, Facebook, Twitter, Linkedin } from 'lucide-react'

const iconMap = {
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
}

interface FooterLink {
  label: string
  href: string
}

interface SocialLink {
  platform: string
  href: string
  icon: keyof typeof iconMap
}

interface FooterProps {
  company: {
    name: string
    description: string
  }
  links: {
    product: FooterLink[]
    company: FooterLink[]
    legal: FooterLink[]
    support: FooterLink[]
  }
  social: SocialLink[]
}

export function Footer({ company, links, social }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="font-bold text-xl text-emerald-400 mb-3">{company.name}</div>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              {company.description}
            </p>
            <div className="flex gap-2">
              {social.map((item) => {
                const Icon = iconMap[item.icon]
                return (
                  <a
                    key={item.platform}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-emerald-600 text-gray-400 hover:text-white transition-all duration-200 flex items-center justify-center"
                    aria-label={item.platform}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Produto</h3>
            <ul className="space-y-2">
              {links.product.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Empresa</h3>
            <ul className="space-y-2">
              {links.company.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              {links.legal.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Suporte</h3>
            <ul className="space-y-2">
              {links.support.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>© {currentYear} {company.name}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

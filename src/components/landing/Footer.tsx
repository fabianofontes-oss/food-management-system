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
    <footer className="bg-gradient-to-b from-muted/30 to-muted/50 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="font-bold text-2xl mb-3">{company.name}</div>
            <p className="text-sm text-muted-foreground mb-4">
              {company.description}
            </p>
            <div className="flex gap-3">
              {social.map((item) => {
                const Icon = iconMap[item.icon]
                return (
                  <a
                    key={item.platform}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
                    aria-label={item.platform}
                  >
                    <Icon className="w-4 h-4 transition-transform hover:scale-125" />
                  </a>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Produto</h3>
            <ul className="space-y-2">
              {links.product.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Empresa</h3>
            <ul className="space-y-2">
              {links.company.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {links.legal.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Suporte</h3>
            <ul className="space-y-2">
              {links.support.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {currentYear} {company.name}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

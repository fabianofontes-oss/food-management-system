import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Mapa do Site - Pediu',
  description: 'Navegue por todas as páginas e recursos do Pediu',
  robots: {
    index: true,
    follow: true,
  },
}

const siteMap = {
  'Páginas Principais': [
    { label: 'Página Inicial', href: '/landing' },
    { label: 'Login', href: '/login' },
    { label: 'Cadastro', href: '/signup' },
    { label: 'Demonstração', href: '/acai-sabor-real' },
  ],
  'Produto': [
    { label: 'Funcionalidades', href: '/landing#modulos' },
    { label: 'Preços', href: '/landing#precos' },
    { label: 'Para quem é', href: '/landing#para-quem' },
    { label: 'Personalização', href: '/landing#temas' },
  ],
  'Suporte': [
    { label: 'FAQ', href: '/landing#faq' },
    { label: 'Central de Ajuda', href: '/ajuda' },
    { label: 'Contato', href: '/contato' },
  ],
  'Empresa': [
    { label: 'Sobre nós', href: '/sobre' },
    { label: 'Blog', href: '/blog' },
  ],
  'Legal': [
    { label: 'Termos de Uso', href: '/termos' },
    { label: 'Política de Privacidade', href: '/privacidade' },
    { label: 'Status do Sistema', href: '/status' },
  ],
}

export default function SiteMapPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4">Mapa do Site</h1>
            <p className="text-lg text-muted-foreground">
              Navegue por todas as páginas e recursos disponíveis no Pediu
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(siteMap).map(([category, links]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                  <CardDescription>
                    {links.length} {links.length === 1 ? 'página' : 'páginas'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 p-6 border rounded-lg bg-muted/30">
            <h2 className="font-semibold mb-2">Precisa de ajuda?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Se você não encontrou o que procura, entre em contato com nosso suporte.
            </p>
            <Link
              href="/contato"
              className="text-sm text-primary hover:underline"
            >
              Falar com o suporte →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

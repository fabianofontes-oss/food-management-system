'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  MessageCircle, 
  Printer, 
  ShoppingBag, 
  CreditCard,
  Check,
  Clock,
  ExternalLink,
  Settings,
  TestTube
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  status: 'active' | 'coming_soon' | 'beta'
  statusLabel: string
  actionLabel: string
  actionHref?: string
  actionDisabled?: boolean
  onAction?: () => void
}

export default function IntegrationsPage() {
  const params = useParams()
  const slug = params.slug as string
  const base = `/${slug}/dashboard`

  const handleTestPrint = () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Teste de Impressão</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              width: 80mm; 
              padding: 5mm;
            }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .title { font-size: 16px; font-weight: bold; }
            .section { padding: 8px 0; border-bottom: 1px dashed #000; }
            .footer { text-align: center; margin-top: 12px; font-size: 10px; }
            @media print { @page { size: 80mm auto; margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">TESTE DE IMPRESSÃO</div>
            <div>Sistema Food Management</div>
          </div>
          <div class="section">
            <strong>Configuração OK!</strong><br/>
            Se você consegue ler isto,<br/>
            sua impressora está funcionando.
          </div>
          <div class="section">
            <div>Largura: 80mm</div>
            <div>Fonte: Courier New</div>
            <div>Data: ${new Date().toLocaleString('pt-BR')}</div>
          </div>
          <div class="footer">
            <div>- - - - - - - - - - - - - -</div>
            <div>Teste concluído com sucesso!</div>
          </div>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank', 'width=320,height=400')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
        toast.success('Teste de impressão enviado!')
      }, 300)
    } else {
      toast.error('Permita pop-ups para testar a impressão')
    }
  }

  const integrations: Integration[] = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      description: 'Envie notificações de pedidos direto no WhatsApp do cliente',
      icon: MessageCircle,
      iconColor: 'text-white',
      iconBg: 'bg-green-500',
      status: 'active',
      statusLabel: 'Ativo',
      actionLabel: 'Configurar Mensagens',
      actionHref: `${base}/settings/store`,
    },
    {
      id: 'printing',
      name: 'Impressão',
      description: 'Imprima cupons de pedido em impressoras térmicas 80mm',
      icon: Printer,
      iconColor: 'text-white',
      iconBg: 'bg-slate-600',
      status: 'active',
      statusLabel: 'Ativo',
      actionLabel: 'Testar Impressão',
      onAction: handleTestPrint,
    },
    {
      id: 'ifood',
      name: 'iFood',
      description: 'Receba pedidos do iFood diretamente no sistema',
      icon: ShoppingBag,
      iconColor: 'text-white',
      iconBg: 'bg-red-500',
      status: 'coming_soon',
      statusLabel: 'Em Desenvolvimento',
      actionLabel: 'Em Breve',
      actionDisabled: true,
    },
    {
      id: 'mercadopago',
      name: 'Mercado Pago',
      description: 'Receba pagamentos PIX e cartão automaticamente',
      icon: CreditCard,
      iconColor: 'text-white',
      iconBg: 'bg-blue-500',
      status: 'coming_soon',
      statusLabel: 'Em Desenvolvimento',
      actionLabel: 'Em Breve',
      actionDisabled: true,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Integrações
          </h1>
          <p className="text-slate-500 mt-1">
            Conecte seu sistema a outras plataformas
          </p>
        </div>

        {/* Grid de Integrações */}
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map((integration) => {
            const Icon = integration.icon
            
            return (
              <Card 
                key={integration.id} 
                className={`relative overflow-hidden ${
                  integration.status === 'coming_soon' ? 'opacity-75' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${integration.iconBg} flex items-center justify-center shadow-lg`}>
                        <Icon className={`w-6 h-6 ${integration.iconColor}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <Badge 
                          variant={integration.status === 'active' ? 'default' : 'secondary'}
                          className={`mt-1 ${
                            integration.status === 'active' 
                              ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {integration.status === 'active' ? (
                            <Check className="w-3 h-3 mr-1" />
                          ) : (
                            <Clock className="w-3 h-3 mr-1" />
                          )}
                          {integration.statusLabel}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {integration.description}
                  </CardDescription>
                  
                  {integration.actionHref ? (
                    <Link href={integration.actionHref}>
                      <Button className="w-full" variant="outline">
                        <Settings className="w-4 h-4 mr-2" />
                        {integration.actionLabel}
                      </Button>
                    </Link>
                  ) : integration.onAction ? (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={integration.onAction}
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      {integration.actionLabel}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      disabled={integration.actionDisabled}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      {integration.actionLabel}
                    </Button>
                  )}
                </CardContent>

                {/* Badge de Coming Soon */}
                {integration.status === 'coming_soon' && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                    EM BREVE
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        {/* Nota */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <p className="text-sm text-blue-700">
              <strong>💡 Dica:</strong> Novas integrações estão sendo desenvolvidas constantemente. 
              Tem sugestões? Entre em contato com nosso suporte.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

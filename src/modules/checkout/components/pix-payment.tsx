'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, Clock, QrCode } from 'lucide-react'
import { checkPixPaymentStatus } from '@/modules/orders/actions-pix'
import Image from 'next/image'

interface PixPaymentProps {
  orderId: string
  qrCode: string
  qrCodeImage: string
  expiresAt: string
  storeSlug: string
}

export function PixPayment({ orderId, qrCode, qrCodeImage, expiresAt, storeSlug }: PixPaymentProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const expires = new Date(expiresAt)
      const diff = expires.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft('Expirado')
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  useEffect(() => {
    const checkPayment = async () => {
      if (checking) return
      
      setChecking(true)
      const result = await checkPixPaymentStatus(orderId)
      setChecking(false)

      if (result.success && result.isPaid) {
        router.push(`/${storeSlug}/pedido/${orderId}`)
      }
    }

    const interval = setInterval(checkPayment, 5000)
    return () => clearInterval(interval)
  }, [orderId, storeSlug, router, checking])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Erro ao copiar:', error)
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Pagamento via PIX
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Image
              src={qrCodeImage}
              alt="QR Code PIX"
              width={300}
              height={300}
              className="rounded-lg border"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Escaneie o QR Code ou copie o código abaixo
            </p>
            
            <div className="bg-muted p-3 rounded-lg break-all text-xs font-mono">
              {qrCode.substring(0, 60)}...
            </div>

            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="w-full"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar código PIX
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 text-amber-700">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Expira em:</span>
            </div>
            <Badge variant="outline" className="font-mono">
              {timeLeft}
            </Badge>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Aguardando confirmação do pagamento...</p>
            <p className="text-xs mt-1">Você será redirecionado automaticamente</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { randomUUID } from 'crypto'

export interface MimoPixCharge {
  id: string
  qrCode: string
  qrCodeImage: string
  expiresAt: Date
  status: 'pending' | 'paid' | 'expired'
  amount: number
  orderId: string
  createdAt: Date
}

class MimoClient {
  private charges: Map<string, MimoPixCharge> = new Map()

  async createPixCharge(params: {
    amount: number
    orderId: string
    customerName: string
    customerEmail?: string
    customerDocument?: string
  }): Promise<MimoPixCharge> {
    const chargeId = randomUUID()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos

    const pixCode = this.generatePixCode(params.amount, chargeId)
    const qrCodeImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`

    const charge: MimoPixCharge = {
      id: chargeId,
      qrCode: pixCode,
      qrCodeImage,
      expiresAt,
      status: 'pending',
      amount: params.amount,
      orderId: params.orderId,
      createdAt: new Date()
    }

    this.charges.set(chargeId, charge)

    console.log('[MIMO] PIX charge criado:', {
      chargeId,
      orderId: params.orderId,
      amount: params.amount,
      expiresAt
    })

    this.simulatePaymentAfter30Seconds(chargeId)

    return charge
  }

  async checkPaymentStatus(chargeId: string): Promise<MimoPixCharge | null> {
    const charge = this.charges.get(chargeId)
    
    if (!charge) {
      console.error('[MIMO] Charge não encontrado:', chargeId)
      return null
    }

    if (new Date() > charge.expiresAt && charge.status === 'pending') {
      charge.status = 'expired'
      console.log('[MIMO] Charge expirado:', chargeId)
    }

    return charge
  }

  private generatePixCode(amount: number, chargeId: string): string {
    const amountStr = amount.toFixed(2)
    return `00020126580014BR.GOV.BCB.PIX0136${chargeId}5204000053039865406${amountStr}5802BR5913PEDIU FOOD6008BRASILIA62070503***6304XXXX`
  }

  private simulatePaymentAfter30Seconds(chargeId: string): void {
    setTimeout(() => {
      const charge = this.charges.get(chargeId)
      if (charge && charge.status === 'pending') {
        charge.status = 'paid'
        console.log('[MIMO] Pagamento simulado confirmado:', chargeId)
        
        this.notifyWebhook(charge)
      }
    }, 30000)
  }

  private async notifyWebhook(charge: MimoPixCharge): Promise<void> {
    try {
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/mimo`
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chargeId: charge.id,
          status: charge.status,
          orderId: charge.orderId,
          amount: charge.amount,
          paidAt: new Date().toISOString()
        })
      })

      if (!response.ok) {
        console.error('[MIMO] Erro ao notificar webhook:', response.status)
      } else {
        console.log('[MIMO] Webhook notificado com sucesso:', charge.id)
      }
    } catch (error) {
      console.error('[MIMO] Erro ao chamar webhook:', error)
    }
  }
}

export const mimoClient = new MimoClient()

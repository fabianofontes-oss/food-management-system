export function paymentConfirmedTemplate({
  orderCode,
  customerName,
  amount,
  paymentMethod,
  storeName,
  trackingUrl
}: {
  orderCode: string
  customerName: string
  amount: number
  paymentMethod: string
  storeName: string
  trackingUrl: string
}) {
  const methodLabels: Record<string, string> = {
    pix: 'PIX',
    card: 'Cartão',
    cash: 'Dinheiro',
    card_on_delivery: 'Cartão na Entrega'
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Pagamento Confirmado</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">💰 Pagamento Confirmado!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Olá <strong>${customerName}</strong>,</p>
          
          <p>Recebemos seu pagamento com sucesso! 🎉</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #10b981;">Detalhes do Pagamento</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Pedido:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">#${orderCode}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Loja:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${storeName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Método:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${methodLabels[paymentMethod] || paymentMethod}</td>
              </tr>
              <tr style="border-top: 2px solid #10b981;">
                <td style="padding: 12px 0; font-size: 18px; font-weight: bold;">Valor Pago:</td>
                <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #10b981;">R$ ${amount.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46;">
              ✅ Seu pedido já está sendo preparado!
            </p>
          </div>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${trackingUrl}" style="display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Acompanhar Pedido
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Você receberá uma notificação quando seu pedido estiver pronto.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} Pediu. Todos os direitos reservados.
          </p>
        </div>
      </body>
    </html>
  `
}

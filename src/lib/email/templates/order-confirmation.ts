export function orderConfirmationTemplate({
  orderCode,
  customerName,
  items,
  total,
  storeName,
  trackingUrl
}: {
  orderCode: string
  customerName: string
  items: Array<{ name: string; quantity: number; price: number }>
  total: number
  storeName: string
  trackingUrl: string
}) {
  const itemsHtml = items
    .map(
      item => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.quantity}x ${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R$ ${item.price.toFixed(2)}</td>
        </tr>
      `
    )
    .join('')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Pedido Confirmado</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">✅ Pedido Confirmado!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Olá <strong>${customerName}</strong>,</p>
          
          <p>Seu pedido foi confirmado com sucesso! 🎉</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #667eea;">Pedido #${orderCode}</h2>
            <p style="color: #666; margin: 5px 0;">Loja: ${storeName}</p>
          </div>
          
          <h3 style="color: #333;">Itens do Pedido:</h3>
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
            ${itemsHtml}
            <tr>
              <td style="padding: 12px; font-weight: bold; font-size: 18px;">Total</td>
              <td style="padding: 12px; font-weight: bold; font-size: 18px; text-align: right; color: #667eea;">R$ ${total.toFixed(2)}</td>
            </tr>
          </table>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${trackingUrl}" style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Acompanhar Pedido
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Estamos preparando seu pedido com todo carinho. Você receberá atualizações por email.
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

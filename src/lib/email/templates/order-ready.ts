export function orderReadyTemplate({
  orderCode,
  customerName,
  storeName,
  storeAddress,
  pickupCode
}: {
  orderCode: string
  customerName: string
  storeName: string
  storeAddress: string
  pickupCode?: string
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Pedido Pronto</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🎉 Seu Pedido Está Pronto!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Olá <strong>${customerName}</strong>,</p>
          
          <p>Ótimas notícias! Seu pedido já está prontinho! 🍽️</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #10b981;">Pedido #${orderCode}</h2>
            ${pickupCode ? `
              <div style="background: #f0fdf4; border: 2px dashed #10b981; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center;">
                <p style="margin: 0; color: #666; font-size: 14px;">Código de Retirada</p>
                <p style="margin: 10px 0; font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 4px;">${pickupCode}</p>
              </div>
            ` : ''}
          </div>
          
          <h3 style="color: #333;">Local de Retirada:</h3>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #10b981;">${storeName}</p>
            <p style="margin: 10px 0 0 0; color: #666;">${storeAddress}</p>
          </div>
          
          <p style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; color: #92400e;">
            ⏰ <strong>Importante:</strong> Retire seu pedido o quanto antes para garantir a qualidade!
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

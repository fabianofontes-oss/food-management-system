export function newMerchantTemplate({
  merchantName,
  storeName,
  storeSlug,
  dashboardUrl
}: {
  merchantName: string
  storeName: string
  storeSlug: string
  dashboardUrl: string
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Bem-vindo ao Pediu</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🎉 Bem-vindo ao Pediu!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Olá <strong>${merchantName}</strong>,</p>
          
          <p>Parabéns! Sua loja <strong>${storeName}</strong> foi criada com sucesso! 🚀</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #667eea;">Sua Loja Online:</h3>
            <p style="margin: 10px 0;">
              <a href="https://${storeSlug}.pediu.food" style="color: #667eea; text-decoration: none; font-weight: bold;">
                ${storeSlug}.pediu.food
              </a>
            </p>
          </div>
          
          <h3 style="color: #333;">Próximos Passos:</h3>
          <ol style="background: white; padding: 20px 20px 20px 40px; border-radius: 8px; margin: 20px 0;">
            <li style="margin-bottom: 10px;">✅ Adicione produtos ao seu cardápio</li>
            <li style="margin-bottom: 10px;">📸 Faça upload de fotos dos produtos</li>
            <li style="margin-bottom: 10px;">⚙️ Configure métodos de pagamento</li>
            <li style="margin-bottom: 10px;">🚚 Configure opções de entrega</li>
            <li>🎨 Personalize as cores da sua loja</li>
          </ol>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${dashboardUrl}" style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Acessar Dashboard
            </a>
          </div>
          
          <div style="background: #e0e7ff; border-left: 4px solid #667eea; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #3730a3;">
              💡 <strong>Dica:</strong> Comece adicionando pelo menos 5 produtos para ter um cardápio atrativo!
            </p>
          </div>
          
          <h3 style="color: #333;">Precisa de Ajuda?</h3>
          <p>Nossa equipe está aqui para ajudar:</p>
          <ul style="background: white; padding: 20px 20px 20px 40px; border-radius: 8px;">
            <li>📚 <a href="https://pediufood.com/ajuda" style="color: #667eea;">Central de Ajuda</a></li>
            <li>💬 <a href="https://wa.me/5511999999999" style="color: #667eea;">WhatsApp Suporte</a></li>
            <li>📧 Email: suporte@pediufood.com</li>
          </ul>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} Pediu. Todos os direitos reservados.
          </p>
        </div>
      </body>
    </html>
  `
}

import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY

export const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function sendEmail({
  to,
  subject,
  html,
  from = 'Pediu <noreply@pediufood.com>'
}: {
  to: string
  subject: string
  html: string
  from?: string
}) {
  try {
    if (!resend) {
      console.log('[Email] Modo dev - Email não enviado (RESEND_API_KEY não configurada)')
      console.log('[Email] Para:', to)
      console.log('[Email] Assunto:', subject)
      console.log('[Email] HTML:', html.substring(0, 200) + '...')
      return { success: true, mode: 'dev' }
    }

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html
    })

    if (error) {
      console.error('[Email] Erro ao enviar:', error)
      return { success: false, error: error.message }
    }

    console.log('[Email] Enviado com sucesso:', data?.id)
    return { success: true, id: data?.id }
  } catch (error) {
    console.error('[Email] Erro geral:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

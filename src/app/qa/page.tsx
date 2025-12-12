import { notFound } from 'next/navigation'
import { QAHubClient } from './QAHubClient'

export default function QAHubPage() {
  // Proteção: apenas em desenvolvimento/preview
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  // Opcional: verificar email do usuário se QA_EMAILS estiver definido
  // const qaEmails = process.env.QA_EMAILS?.split(',') || []
  // if (qaEmails.length > 0) {
  //   const session = await getUserSession()
  //   if (!session || !qaEmails.includes(session.user.email || '')) {
  //     notFound()
  //   }
  // }

  return <QAHubClient />
}

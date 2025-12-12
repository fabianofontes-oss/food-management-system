import { notFound } from 'next/navigation'
import { QAHubClient } from './QAHubSimple'

export default function QAHubPage() {
  // Proteção: apenas em desenvolvimento/preview
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  return <QAHubClient />
}

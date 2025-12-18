'use client'

import { useParams } from 'next/navigation'
import PDVModerno from './PDVModerno'
import { useDashboardStoreId } from '../DashboardClient'

export default function POSPage() {
  const params = useParams()
  const slug = params.slug as string
  const storeId = useDashboardStoreId()

  if (!storeId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-lg font-semibold">Loja inválida</div>
          <div className="text-sm text-muted-foreground">Não foi possível carregar o PDV.</div>
        </div>
      </div>
    )
  }

  return <PDVModerno slug={slug} storeId={storeId} />
}

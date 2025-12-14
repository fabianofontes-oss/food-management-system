'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function SettingsPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  useEffect(() => {
    router.replace('/' + slug + '/dashboard/settings/modules')
  }, [slug, router])

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 flex items-center justify-center'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4'></div>
        <p className='text-gray-600'>Carregando Central de Configuracoes...</p>
      </div>
    </div>
  )
}

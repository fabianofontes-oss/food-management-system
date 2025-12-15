'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Copy, RefreshCw } from 'lucide-react'

type Props = {
  slug: string
  code: string
  storeId: string
  initialStatus: string
}

export function OrderStatusClient({ slug, code, storeId, initialStatus }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [status, setStatus] = useState<string>(initialStatus)
  const [link, setLink] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    setLink(`${window.location.origin}/${slug}/pedido/${code}`)
  }, [slug, code])

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      setIsRefreshing(true)
      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('store_id', storeId)
        .eq('code', code)
        .single()

      if (!cancelled) {
        if (!error && data?.status) setStatus(String(data.status))
        setIsRefreshing(false)
      }
    }

    const interval = window.setInterval(refresh, 5000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [supabase, storeId, code])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // fallback mínimo
      try {
        window.prompt('Copie o link do pedido:', link)
      } catch {
        // ignore
      }
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        <div className="font-medium text-foreground">Status agora</div>
        <div className="flex items-center gap-2">
          <span>{status}</span>
          {isRefreshing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <span className="text-xs">(atualiza a cada 5s)</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:items-end">
        <div className="text-xs text-muted-foreground break-all">{link}</div>
        <Button type="button" variant="secondary" onClick={handleCopy} className="gap-2">
          <Copy className="h-4 w-4" />
          {copied ? 'Copiado!' : 'Copiar link'}
        </Button>
      </div>
    </div>
  )
}

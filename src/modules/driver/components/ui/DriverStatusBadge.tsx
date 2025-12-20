import { cn } from '@/lib/utils'

type BadgeStatus = 'em_andamento' | 'concluida' | 'cancelada' | 'pendente' | 'aprovado' | 'em_analise'

interface DriverStatusBadgeProps {
  status: BadgeStatus | string
  className?: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  em_andamento: {
    label: 'EM ANDAMENTO',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  concluida: {
    label: 'CONCLUÍDA',
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  cancelada: {
    label: 'CANCELADA',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  pendente: {
    label: 'PENDENTE',
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  aprovado: {
    label: 'APROVADO',
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  em_analise: {
    label: 'EM ANÁLISE',
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
}

export function DriverStatusBadge({ status, className }: DriverStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status.toUpperCase(),
    className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }

  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded text-xs font-bold border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}

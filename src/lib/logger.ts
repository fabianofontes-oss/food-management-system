/**
 * Logger centralizado para o sistema
 * 
 * - Em produção: só logs de warn/error (sem spam de console)
 * - Em desenvolvimento: todos os níveis
 * - Preparado para integração com Sentry
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  level: LogLevel
  message: string
  context?: LogContext
  timestamp: string
  environment: string
}

const isProduction = process.env.NODE_ENV === 'production'
const isServer = typeof window === 'undefined'

// Níveis de log permitidos por ambiente
const allowedLevels: Record<string, LogLevel[]> = {
  production: ['warn', 'error'],
  development: ['debug', 'info', 'warn', 'error'],
  test: ['error'],
}

function shouldLog(level: LogLevel): boolean {
  const env = process.env.NODE_ENV || 'development'
  const levels = allowedLevels[env] || allowedLevels.development
  return levels.includes(level)
}

function formatLog(entry: LogEntry): string {
  const prefix = isServer ? '[SERVER]' : '[CLIENT]'
  const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
  return `${prefix} [${entry.level.toUpperCase()}] ${entry.message}${contextStr}`
}

async function sendToSentry(entry: LogEntry): Promise<void> {
  if (!isProduction) return
  
  // Integração com Sentry (quando configurado)
  try {
    const Sentry = await import('@sentry/nextjs').catch(() => null)
    if (Sentry) {
      if (entry.level === 'error') {
        Sentry.captureMessage(entry.message, {
          level: 'error',
          extra: entry.context,
        })
      } else if (entry.level === 'warn') {
        Sentry.captureMessage(entry.message, {
          level: 'warning',
          extra: entry.context,
        })
      }
    }
  } catch {
    // Sentry não configurado - ignorar silenciosamente
  }
}

function createLogEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
  return {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (!shouldLog('debug')) return
    const entry = createLogEntry('debug', message, context)
    console.debug(formatLog(entry))
  },

  info(message: string, context?: LogContext): void {
    if (!shouldLog('info')) return
    const entry = createLogEntry('info', message, context)
    console.info(formatLog(entry))
  },

  warn(message: string, context?: LogContext): void {
    if (!shouldLog('warn')) return
    const entry = createLogEntry('warn', message, context)
    console.warn(formatLog(entry))
    sendToSentry(entry)
  },

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!shouldLog('error')) return
    
    const errorContext: LogContext = {
      ...context,
      ...(error instanceof Error && {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      }),
    }
    
    const entry = createLogEntry('error', message, errorContext)
    console.error(formatLog(entry))
    sendToSentry(entry)
    
    // Capturar exceção no Sentry
    if (isProduction && error instanceof Error) {
      import('@sentry/nextjs')
        .then(Sentry => Sentry.captureException(error, { extra: context }))
        .catch(() => {})
    }
  },

  // Helper para Server Actions
  serverAction(actionName: string, context?: LogContext): {
    start: () => void
    success: (result?: unknown) => void
    failure: (error: Error | unknown) => void
  } {
    const startTime = Date.now()
    
    return {
      start: () => {
        logger.debug(`Server Action: ${actionName} started`, context)
      },
      success: (result?: unknown) => {
        const duration = Date.now() - startTime
        logger.info(`Server Action: ${actionName} completed`, {
          ...context,
          duration: `${duration}ms`,
          hasResult: result !== undefined,
        })
      },
      failure: (error: Error | unknown) => {
        const duration = Date.now() - startTime
        logger.error(`Server Action: ${actionName} failed`, error, {
          ...context,
          duration: `${duration}ms`,
        })
      },
    }
  },
}

export default logger

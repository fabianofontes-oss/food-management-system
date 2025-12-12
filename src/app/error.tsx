'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '24px',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: '#dc2626'
        }}>
          ⚠️ Algo deu errado!
        </h2>
        <p style={{ 
          color: '#6b7280', 
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte se o problema persistir.
        </p>
        {error.message && (
          <p style={{ 
            fontSize: '12px', 
            color: '#9ca3af',
            backgroundColor: '#f3f4f6',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '24px',
            fontFamily: 'monospace',
            wordBreak: 'break-word'
          }}>
            {error.message}
          </p>
        )}
        <button
          onClick={() => reset()}
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            width: '100%'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}

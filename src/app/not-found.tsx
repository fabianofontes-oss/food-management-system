import Link from 'next/link'

export default function NotFound() {
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
        <h1 style={{ 
          fontSize: '72px', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: '#6b7280'
        }}>
          404
        </h1>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: '#111827'
        }}>
          Página não encontrada
        </h2>
        <p style={{ 
          color: '#6b7280', 
          marginBottom: '32px',
          fontSize: '14px'
        }}>
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link 
          href="/"
          style={{
            display: 'inline-block',
            backgroundColor: '#10b981',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Voltar para o início
        </Link>
      </div>
    </div>
  )
}

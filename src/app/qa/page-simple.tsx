'use client'

import { useState, useEffect } from 'react'

export default function QAPage() {
  const [slug, setSlug] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('qa_store_slug') || ''
      setSlug(saved)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && slug) {
      localStorage.setItem('qa_store_slug', slug)
    }
  }, [slug])

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    alert('URL copiada!')
  }

  return (
    <div style={{ padding: '40px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>🔍 QA Hub</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>Links prontos para todas as rotas</p>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #e5e7eb' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>Store Slug:</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="ex: minha-loja"
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid #d1d5db', 
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
        </div>

        {slug && (
          <>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>🔗 Links Prontos (Clique para copiar)</h2>
              
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Público:</p>
                <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <code 
                    onClick={() => copyUrl(`http://localhost:3000/${slug}`)}
                    style={{ display: 'block', fontSize: '13px', cursor: 'pointer', marginBottom: '4px' }}
                  >
                    http://localhost:3000/{slug}
                  </code>
                  <code 
                    onClick={() => copyUrl(`http://localhost:3000/${slug}/cart`)}
                    style={{ display: 'block', fontSize: '13px', cursor: 'pointer', marginBottom: '4px' }}
                  >
                    http://localhost:3000/{slug}/cart
                  </code>
                  <code 
                    onClick={() => copyUrl(`http://localhost:3000/${slug}/checkout`)}
                    style={{ display: 'block', fontSize: '13px', cursor: 'pointer' }}
                  >
                    http://localhost:3000/{slug}/checkout
                  </code>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Dashboard:</p>
                <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <code 
                    onClick={() => copyUrl(`http://localhost:3000/${slug}/dashboard`)}
                    style={{ display: 'block', fontSize: '13px', cursor: 'pointer', marginBottom: '4px' }}
                  >
                    http://localhost:3000/{slug}/dashboard
                  </code>
                  <code 
                    onClick={() => copyUrl(`http://localhost:3000/${slug}/dashboard/products`)}
                    style={{ display: 'block', fontSize: '13px', cursor: 'pointer', marginBottom: '4px' }}
                  >
                    http://localhost:3000/{slug}/dashboard/products
                  </code>
                  <code 
                    onClick={() => copyUrl(`http://localhost:3000/${slug}/dashboard/orders`)}
                    style={{ display: 'block', fontSize: '13px', cursor: 'pointer', marginBottom: '4px' }}
                  >
                    http://localhost:3000/{slug}/dashboard/orders
                  </code>
                  <code 
                    onClick={() => copyUrl(`http://localhost:3000/${slug}/dashboard/kitchen`)}
                    style={{ display: 'block', fontSize: '13px', cursor: 'pointer', marginBottom: '4px' }}
                  >
                    http://localhost:3000/{slug}/dashboard/kitchen
                  </code>
                  <code 
                    onClick={() => copyUrl(`http://localhost:3000/${slug}/dashboard/delivery`)}
                    style={{ display: 'block', fontSize: '13px', cursor: 'pointer', marginBottom: '4px' }}
                  >
                    http://localhost:3000/{slug}/dashboard/delivery
                  </code>
                  <code 
                    onClick={() => copyUrl(`http://localhost:3000/${slug}/dashboard/crm`)}
                    style={{ display: 'block', fontSize: '13px', cursor: 'pointer', marginBottom: '4px' }}
                  >
                    http://localhost:3000/{slug}/dashboard/crm
                  </code>
                  <code 
                    onClick={() => copyUrl(`http://localhost:3000/${slug}/dashboard/pos`)}
                    style={{ display: 'block', fontSize: '13px', cursor: 'pointer', marginBottom: '4px' }}
                  >
                    http://localhost:3000/{slug}/dashboard/pos
                  </code>
                  <code 
                    onClick={() => copyUrl(`http://localhost:3000/${slug}/dashboard/reports`)}
                    style={{ display: 'block', fontSize: '13px', cursor: 'pointer', marginBottom: '4px' }}
                  >
                    http://localhost:3000/{slug}/dashboard/reports
                  </code>
                  <code 
                    onClick={() => copyUrl(`http://localhost:3000/${slug}/dashboard/coupons`)}
                    style={{ display: 'block', fontSize: '13px', cursor: 'pointer', marginBottom: '4px' }}
                  >
                    http://localhost:3000/{slug}/dashboard/coupons
                  </code>
                  <code 
                    onClick={() => copyUrl(`http://localhost:3000/${slug}/dashboard/team`)}
                    style={{ display: 'block', fontSize: '13px', cursor: 'pointer', marginBottom: '4px' }}
                  >
                    http://localhost:3000/{slug}/dashboard/team
                  </code>
                  <code 
                    onClick={() => copyUrl(`http://localhost:3000/${slug}/dashboard/settings`)}
                    style={{ display: 'block', fontSize: '13px', cursor: 'pointer' }}
                  >
                    http://localhost:3000/{slug}/dashboard/settings
                  </code>
                </div>
              </div>

              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Admin & Auth:</p>
                <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <code 
                    onClick={() => copyUrl('http://localhost:3000/admin')}
                    style={{ display: 'block', fontSize: '13px', cursor: 'pointer', marginBottom: '4px' }}
                  >
                    http://localhost:3000/admin
                  </code>
                  <code 
                    onClick={() => copyUrl('http://localhost:3000/admin/analytics')}
                    style={{ display: 'block', fontSize: '13px', cursor: 'pointer', marginBottom: '4px' }}
                  >
                    http://localhost:3000/admin/analytics
                  </code>
                  <code 
                    onClick={() => copyUrl('http://localhost:3000/login')}
                    style={{ display: 'block', fontSize: '13px', cursor: 'pointer', marginBottom: '4px' }}
                  >
                    http://localhost:3000/login
                  </code>
                  <code 
                    onClick={() => copyUrl('http://localhost:3000/signup')}
                    style={{ display: 'block', fontSize: '13px', cursor: 'pointer', marginBottom: '4px' }}
                  >
                    http://localhost:3000/signup
                  </code>
                  <code 
                    onClick={() => copyUrl('http://localhost:3000/select-store')}
                    style={{ display: 'block', fontSize: '13px', cursor: 'pointer' }}
                  >
                    http://localhost:3000/select-store
                  </code>
                </div>
              </div>
            </div>
          </>
        )}

        {!slug && (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
            Digite um store slug acima para ver os links
          </div>
        )}
      </div>
    </div>
  )
}

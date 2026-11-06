'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase.from('products').select('*')
        if (error) throw error
        setProducts(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <div style={{ background: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* ENCABEZADO */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', color: '#38bdf8', margin: '0 0 10px 0' }}>🛒 Supermercado Babilonia</h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>Sistema Cloud POS, Inventarios y E-commerce</p>
        </div>

        {/* MENÚ DE ACCESOS RÁPIDOS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '40px' }}>
          <a href="/pos" style={{ background: '#1e293b', border: '1px solid #334155', padding: '20px', borderRadius: '10px', textDecoration: 'none', color: 'white', textAlign: 'center', fontWeight: 'bold', display: 'block', transition: '0.2s' }}>
            <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>⚡</span>
            Terminal POS
          </a>
          <a href="/caja" style={{ background: '#1e293b', border: '1px solid #334155', padding: '20px', borderRadius: '10px', textDecoration: 'none', color: 'white', textAlign: 'center', fontWeight: 'bold', display: 'block' }}>
            <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>💰</span>
            Control de Caja
          </a>
          <a href="/productos" style={{ background: '#1e293b', border: '1px solid #334155', padding: '20px', borderRadius: '10px', textDecoration: 'none', color: 'white', textAlign: 'center', fontWeight: 'bold', display: 'block' }}>
            <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🏷️</span>
            Productos
          </a>
          <a href="/traslados" style={{ background: '#1e293b', border: '1px solid #334155', padding: '20px', borderRadius: '10px', textDecoration: 'none', color: 'white', textAlign: 'center', fontWeight: 'bold', display: 'block' }}>
            <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>📦</span>
            Traslados
          </a>
        </div>

        {/* ESTADO DE CONEXIÓN E INVENTARIO */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '25px' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 15px 0', color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
            📊 Estado del Sistema e Inventario Cloud
          </h2>

          {loading && <p style={{ color: '#94a3b8' }}>Conectando con Supabase Cloud...</p>}
          {error && <p style={{ color: '#fca5a5', fontWeight: 'bold' }}>❌ Error de conexión: {error}</p>}

          {!loading && !error && (
            <div>
              {products.length === 0 ? (
                <p style={{ color: '#64748b' }}>No hay productos registrados todavía. Ve a la sección de Productos para dar de alta el primero.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                  {products.map((product) => (
                    <div key={product.id} style={{ background: '#0f172a', padding: '12px 16px', borderRadius: '6px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <b style={{ color: '#f8fafc', fontSize: '15px' }}>{product.name}</b>
                        <span style={{ marginLeft: '10px', fontSize: '11px', background: '#334155', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px' }}>
                          SKU: {product.sku || 'N/A'}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontWeight: 'bold', color: '#34d399', fontSize: '15px' }}>
                          ${product.sale_price?.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          Bodega: {product.stock_bodega} | Estantería: {product.stock_estanteria}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
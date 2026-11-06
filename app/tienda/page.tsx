'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function TiendaPage() {
  const [products, setProducts] = useState<any[]>([])
  const [bestSellers, setBestSellers] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('todos')
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Formulario de cliente para el checkout exprés sin login
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    payment_method: 'efectivo'
  })

  useEffect(() => {
    fetchStoreProducts()
  }, [])

  async function fetchStoreProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error cargando productos:', error)
    } else if (data) {
      setProducts(data)
      // Top 5 inicial para la vitrina de más vendidos
      setBestSellers(data.slice(0, 5))
    }
  }

  const addToCart = (product: any) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id)
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  const totalCartAmount = cart.reduce((acc, item) => acc + (Number(item.sale_price) * item.quantity), 0)

  // Filtrar productos por búsqueda o categoría
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'todos' || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Enviar pedido al e-commerce
  async function handleCheckoutSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (cart.length === 0) return

    setLoading(true)
    setMessage('Enviando pedido...')

    const orderPayload = {
      customer_name: customer.name.trim(),
      customer_phone: customer.phone.trim(),
      customer_address: customer.address.trim(),
      payment_method: customer.payment_method,
      total_amount: totalCartAmount,
      items: cart,
      status: 'pending'
    }

    const { error } = await supabase
      .from('ecommerce_orders')
      .insert([orderPayload])

    setLoading(false)

    if (error) {
      setMessage(`❌ Error al realizar el pedido: ${error.message}`)
    } else {
      setMessage('✅ ¡Pedido realizado con éxito! Supermercado Babilonia lo preparará y despachará pronto.')
      setCart([])
      setCustomer({ name: '', phone: '', address: '', payment_method: 'efectivo' })
      setTimeout(() => {
        setIsCheckoutOpen(false)
        setMessage('')
      }, 4000)
    }
  }

  const categories = ['todos', 'Abarrotes', 'Lácteos', 'Carnes y Embutidos', 'Frutas y Verduras', 'Bebidas', 'Aseo Hogar']

  return (
    <div style={{ background: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '80px' }}>
      
      {/* HEADER FIJO */}
      <header style={{ background: '#1e293b', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', position: 'sticky', top: 0, zIndex: 100, gap: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#38bdf8', fontSize: '20px' }}>🛒 Supermercado Babilonia</h2>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Tienda Virtual Exprés</span>
        </div>
        
        <div style={{ flex: 1, maxWidth: '500px' }}>
          <input 
            type="text" 
            placeholder="¿Qué producto buscas hoy? (Ej. Arroz, Leche, Aceite...)" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', fontSize: '14px', outline: 'none' }}
          />
        </div>

        <button 
          onClick={() => setIsCheckoutOpen(true)}
          style={{ background: '#0284c7', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
        >
          🛒 Carrito ({cart.reduce((a, c) => a + c.quantity, 0)}) - ${totalCartAmount.toLocaleString()}
        </button>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 20px' }}>

        {/* MENSAJES DE ESTADO */}
        {message && (
          <div style={{ padding: '15px', borderRadius: '8px', marginBottom: '25px', fontWeight: 'bold', background: message.includes('❌') ? '#451a1a' : '#14532d', color: message.includes('❌') ? '#fca5a5' : '#86efac', border: `1px solid ${message.includes('❌') ? '#7f1d1d' : '#166534'}` }}>
            {message}
          </div>
        )}

        {/* BARRA DE CATEGORÍAS */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', marginBottom: '30px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{ background: selectedCategory === cat ? '#0284c7' : '#1e293b', color: selectedCategory === cat ? 'white' : '#94a3b8', border: '1px solid #334155', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap', textTransform: 'capitalize' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* VITRINA DE MÁS VENDIDOS (Solo si no hay búsqueda activa) */}
        {!searchTerm && selectedCategory === 'todos' && (
          <section style={{ marginBottom: '40px' }}>
            <h3 style={{ borderLeft: '4px solid #38bdf8', paddingLeft: '10px', marginBottom: '20px', fontSize: '18px' }}>
              🔥 Los Más Vendidos
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }} className="product-grid">
              {bestSellers.map(product => (
                <div key={product.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ background: '#0f172a', height: '90px', borderRadius: '6px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px', border: '1px solid #334155' }}>
                      📦 {product.category || 'Babilonia'}
                    </div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#f8fafc' }}>{product.name}</h4>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Presentación: 1 {product.unit_type || 'unidad'}</p>
                  </div>
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ fontWeight: 'bold', color: '#38bdf8', fontSize: '16px', marginBottom: '10px' }}>
                      ${product.sale_price?.toLocaleString()} <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>/ {product.unit_type || 'un'}</span>
                    </div>
                    <button 
                      onClick={() => addToCart(product)}
                      style={{ width: '100%', background: '#0284c7', color: 'white', border: 'none', padding: '9px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                    >
                      Agregar al Carrito
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CATÁLOGO GENERAL (GRILLA 5x5 EN PC, 2x2 EN MÓVIL) */}
        <section>
          <h3 style={{ borderLeft: '4px solid #38bdf8', paddingLeft: '10px', marginBottom: '20px', fontSize: '18px' }}>
            📦 Catálogo Disponible {selectedCategory !== 'todos' ? `(${selectedCategory})` : ''}
          </h3>
          
          {filteredProducts.length === 0 ? (
            <p style={{ color: '#64748b' }}>No se encontraron productos disponibles con ese criterio.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }} className="product-grid-general">
              {filteredProducts.map(product => (
                <div key={product.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ background: '#0f172a', height: '90px', borderRadius: '6px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px', border: '1px solid #334155' }}>
                      📦 {product.category || 'Babilonia'}
                    </div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#f8fafc' }}>{product.name}</h4>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Categoría: {product.category || 'General'}</p>
                  </div>
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ fontWeight: 'bold', color: '#38bdf8', fontSize: '16px', marginBottom: '10px' }}>
                      ${product.sale_price?.toLocaleString()} <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>/ {product.unit_type || 'un'}</span>
                    </div>
                    <button 
                      onClick={() => addToCart(product)}
                      style={{ width: '100%', background: '#0284c7', color: 'white', border: 'none', padding: '9px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                    >
                      Agregar al Carrito
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* MODAL DE CHECKOUT EXPRÉS (CARRITO Y DATOS DE ENVÍO) */}
      {isCheckoutOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '25px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '18px' }}>🛒 Resumen de tu Pedido</h3>
              <button onClick={() => setIsCheckoutOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            {cart.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '30px 0' }}>Tu carrito está vacío. Agrega productos para continuar.</p>
            ) : (
              <div>
                {/* LISTA DE ITEMS EN CARRITO */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ background: '#0f172a', padding: '10px 14px', borderRadius: '6px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <b style={{ color: '#f8fafc', fontSize: '14px', display: 'block' }}>{item.name}</b>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{item.quantity} x ${Number(item.sale_price).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>${(item.sale_price * item.quantity).toLocaleString()}</span>
                        <button onClick={() => removeFromCart(item.id)} style={{ background: '#7f1d1d', color: '#fca5a5', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Quitar</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid #334155', paddingTop: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', color: '#94a3b8' }}>Total a Pagar:</span>
                  <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#4ade80' }}>${totalCartAmount.toLocaleString()}</span>
                </div>

                {/* FORMULARIO DE DATOS DE CONTACTO (Sin Login) */}
                <form onSubmit={handleCheckoutSubmit} style={{ borderTop: '1px solid #334155', paddingTop: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#f8fafc', fontSize: '16px' }}>📍 Datos de Entrega y Pago</h4>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#94a3b8', fontSize: '13px' }}><b>Nombre Completo:</b></label>
                    <input 
                      type="text" 
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      placeholder="Ej. Carlos Carvajal"
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', color: 'white', border: '1px solid #475569', fontSize: '14px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#94a3b8', fontSize: '13px' }}><b>Celular / WhatsApp:</b></label>
                    <input 
                      type="text" 
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      placeholder="Ej. 3001234567"
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', color: 'white', border: '1px solid #475569', fontSize: '14px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#94a3b8', fontSize: '13px' }}><b>Dirección de Entrega:</b></label>
                    <input 
                      type="text" 
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      placeholder="Ej. Calle 100 # 15-20 Apto 302"
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', color: 'white', border: '1px solid #475569', fontSize: '14px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#94a3b8', fontSize: '13px' }}><b>Tipo de Pago:</b></label>
                    <select 
                      value={customer.payment_method}
                      onChange={(e) => setCustomer({ ...customer, payment_method: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', color: 'white', border: '1px solid #475569', fontSize: '14px' }}
                    >
                      <option value="efectivo">Efectivo contra entrega</option>
                      <option value="nequi_daviplata">Nequi / Daviplata</option>
                      <option value="datafono">Datáfono contra entrega</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', background: '#16a34a', color: 'white', border: 'none', padding: '14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? 'Procesando Pedido...' : 'Confirmar y Enviar Pedido'}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ESTILOS RESPONSIVOS: 2x2 en móvil, 5x5 en PC */}
      <style jsx>{`
        @media (min-width: 1024px) {
          .product-grid {
            grid-template-columns: repeat(5, 1fr) !important;
          }
          .product-grid-general {
            grid-template-columns: repeat(5, 1fr) !important;
          }
        }
      `}</style>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ProductosPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Estado del formulario ampliado con categoría y unidad de medida
  const [form, setForm] = useState({
    ean: '',
    sku: '',
    name: '',
    cost_price: '',
    sale_price: '',
    stock_bodega: '',
    stock_estanteria: '',
    unit_type: 'unidad',
    category: 'Abarrotes',
    is_bulk: false
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) console.error('Error cargando productos:', error)
    else setProducts(data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('Guardando producto...')

    const payload = {
      ean: form.ean.trim() || null,
      barcode: form.ean.trim() || null, // Sincronizado para lecturas POS
      sku: form.sku.trim() || null,
      name: form.name.trim(),
      cost_price: parseFloat(form.cost_price) || 0,
      sale_price: parseFloat(form.sale_price) || 0,
      stock_bodega: parseFloat(form.stock_bodega) || 0,
      stock_estanteria: parseFloat(form.stock_estanteria) || 0,
      unit_type: form.unit_type,
      category: form.category,
      is_bulk: form.is_bulk
    }

    const { error } = await supabase.from('products').insert([payload])

    if (error) {
      setMessage(`❌ Error al guardar: ${error.message}`)
    } else {
      setMessage('✅ ¡Producto registrado con éxito!')
      setForm({
        ean: '',
        sku: '',
        name: '',
        cost_price: '',
        sale_price: '',
        stock_bodega: '',
        stock_estanteria: '',
        unit_type: 'unidad',
        category: 'Abarrotes',
        is_bulk: false
      })
      fetchProducts()
    }
  }

  return (
    <div style={{ background: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif', padding: '30px 20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#38bdf8', fontSize: '24px' }}>🏷️ Gestión de Productos</h1>
            <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Catálogo maestro e inventario dual (Bodega / Estantería)</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="/traslados" style={{ color: '#38bdf8', textDecoration: 'none', background: '#1e293b', padding: '8px 16px', borderRadius: '6px', border: '1px solid #334155', fontWeight: 'bold', fontSize: '14px' }}>
              📦 Traslados
            </a>
            <a href="/pos" style={{ color: '#38bdf8', textDecoration: 'none', background: '#1e293b', padding: '8px 16px', borderRadius: '6px', border: '1px solid #334155', fontWeight: 'bold', fontSize: '14px' }}>
              &larr; Volver al POS
            </a>
          </div>
        </div>

        {/* MENSAJE DE ESTADO */}
        {message && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', background: message.includes('❌') ? '#451a1a' : '#14532d', color: message.includes('❌') ? '#fca5a5' : '#86efac', border: `1px solid ${message.includes('❌') ? '#7f1d1d' : '#166534'}` }}>
            {message}
          </div>
        )}

        {/* CONTENEDOR PRINCIPAL DOS COLUMNAS */}
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '25px' }} className="responsive-grid">
          
          {/* FORMULARIO EN MODO OSCURO */}
          <form onSubmit={handleSubmit} style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', border: '1px solid #334155', height: 'fit-content' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#f8fafc', fontSize: '18px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>Nuevo Producto</h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: '#94a3b8', fontSize: '13px' }}><b>Código EAN (Orbit):</b></label>
              <input
                type="text"
                value={form.ean}
                onChange={(e) => setForm({ ...form, ean: e.target.value })}
                placeholder="Escanea con el lector..."
                style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', color: 'white', border: '1px solid #475569', fontSize: '14px' }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#94a3b8', fontSize: '13px' }}><b>SKU Interno:</b></label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="Ej. ARR-002"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', color: 'white', border: '1px solid #475569', fontSize: '14px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#94a3b8', fontSize: '13px' }}><b>Categoría:</b></label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', color: 'white', border: '1px solid #475569', fontSize: '14px' }}
                >
                  <option value="Abarrotes">Abarrotes</option>
                  <option value="Lácteos">Lácteos</option>
                  <option value="Carnes y Embutidos">Carnes y Embutidos</option>
                  <option value="Frutas y Verduras">Frutas y Verduras</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Aseo Hogar">Aseo Hogar</option>
                  <option value="Cuidado Personal">Cuidado Personal</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: '#94a3b8', fontSize: '13px' }}><b>Nombre del Producto:</b></label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej. Leche Alquería 1100ml"
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', color: 'white', border: '1px solid #475569', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#94a3b8', fontSize: '13px' }}><b>P. Costo ($):</b></label>
                <input
                  type="number"
                  step="0.01"
                  value={form.cost_price}
                  onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                  placeholder="0"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', color: 'white', border: '1px solid #475569', fontSize: '14px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#94a3b8', fontSize: '13px' }}><b>P. Venta ($):</b></label>
                <input
                  type="number"
                  step="0.01"
                  value={form.sale_price}
                  onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                  placeholder="0"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', color: 'white', border: '1px solid #475569', fontSize: '14px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#94a3b8', fontSize: '13px' }}><b>Stock Bodega:</b></label>
                <input
                  type="number"
                  step="0.01"
                  value={form.stock_bodega}
                  onChange={(e) => setForm({ ...form, stock_bodega: e.target.value })}
                  placeholder="0"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', color: 'white', border: '1px solid #475569', fontSize: '14px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#94a3b8', fontSize: '13px' }}><b>Stock Estantería:</b></label>
                <input
                  type="number"
                  step="0.01"
                  value={form.stock_estanteria}
                  onChange={(e) => setForm({ ...form, stock_estanteria: e.target.value })}
                  placeholder="0"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', color: 'white', border: '1px solid #475569', fontSize: '14px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: '#94a3b8', fontSize: '13px' }}><b>Unidad de Medida:</b></label>
              <select
                value={form.unit_type}
                onChange={(e) => setForm({ ...form, unit_type: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', color: 'white', border: '1px solid #475569', fontSize: '14px' }}
              >
                <option value="unidad">Unidad (un)</option>
                <option value="kg">Kilogramos (kg)</option>
                <option value="g">Gramos (g)</option>
                <option value="lt">Litros (lt)</option>
                <option value="ml">Mililitros (ml)</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px', background: '#0f172a', padding: '10px', borderRadius: '6px', border: '1px solid #334155' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={form.is_bulk}
                  onChange={(e) => setForm({ ...form, is_bulk: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                ¿Producto a granel / líchigo (Kg/g)?
              </label>
            </div>

            <button 
              type="submit" 
              style={{ width: '100%', background: '#0284c7', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
            >
              Guardar en Base de Datos
            </button>
          </form>

          {/* TABLA DE PRODUCTOS EN MODO OSCURO */}
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', border: '1px solid #334155', overflowX: 'auto' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#f8fafc', fontSize: '18px' }}>
              Inventario Registrado ({products.length})
            </h3>

            {loading ? (
              <p style={{ color: '#94a3b8' }}>Cargando inventario...</p>
            ) : products.length === 0 ? (
              <p style={{ color: '#64748b' }}>No hay productos registrados en la base de datos.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '2px solid #334155' }}>
                    <th style={{ padding: '12px' }}>Producto</th>
                    <th style={{ padding: '12px' }}>Códigos (EAN/SKU)</th>
                    <th style={{ padding: '12px' }}>P. Venta</th>
                    <th style={{ padding: '12px' }}>Bodega</th>
                    <th style={{ padding: '12px' }}>Estantería</th>
                    <th style={{ padding: '12px' }}>Unidad</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '12px' }}>
                        <b style={{ color: '#f8fafc', display: 'block' }}>{p.name}</b>
                        <span style={{ fontSize: '11px', color: '#38bdf8' }}>{p.category || 'General'}</span>
                      </td>
                      <td style={{ padding: '12px', color: '#94a3b8', fontSize: '12px' }}>
                        EAN: {p.ean || p.barcode || 'N/A'}<br />
                        SKU: {p.sku || 'N/A'}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#38bdf8' }}>
                        ${p.sale_price?.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ background: '#451a03', color: '#fde047', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                          {p.stock_bodega || 0}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ background: '#14532d', color: '#86efac', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                          {p.stock_estanteria || 0}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#94a3b8' }}>
                        {p.unit_type || (p.is_bulk ? 'Granel' : 'Unidad')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>

      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .responsive-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
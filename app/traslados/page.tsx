'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function InventoryTransferPage() {
  const [products, setProducts] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [transfersHistory, setTransfersHistory] = useState<any[]>([])

  useEffect(() => {
    fetchProducts()
    fetchTransfersHistory()
  }, [])

  // Cargar lista de productos
  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, barcode, stock_bodega, stock_estanteria, unit_type')
      .order('name', { ascending: true })

    if (error) console.error('Error cargando productos:', error)
    else setProducts(data || [])
  }

  // Cargar historial reciente de traslados
  async function fetchTransfersHistory() {
    const { data, error } = await supabase
      .from('inventory_transfers')
      .select('id, quantity, transferred_at, notes, products(name, unit_type)')
      .order('transferred_at', { ascending: false })
      .limit(10)

    if (error) console.error('Error cargando historial de traslados:', error)
    else setTransfersHistory(data || [])
  }

  // Ejecutar el traslado Bodega ➡️ Estantería
  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    const qty = parseFloat(quantity)

    if (!selectedProductId) {
      setMessage('❌ Selecciona un producto.')
      return
    }

    if (isNaN(qty) || qty <= 0) {
      setMessage('❌ Ingresa una cantidad válida mayor a cero.')
      return
    }

    const selectedProduct = products.find(p => p.id === selectedProductId)
    if (!selectedProduct) return

    if (selectedProduct.stock_bodega < qty) {
      setMessage(`❌ Stock insuficiente en Bodega. Disponible: ${selectedProduct.stock_bodega}`)
      return
    }

    setLoading(true)
    setMessage('Procesando traslado...')

    // 1. Restar de bodega y sumar a estantería
    const newStockBodega = Number(selectedProduct.stock_bodega) - qty
    const newStockEstanteria = Number(selectedProduct.stock_estanteria || 0) + qty

    const { error: updateError } = await supabase
      .from('products')
      .update({
        stock_bodega: newStockBodega,
        stock_estanteria: newStockEstanteria
      })
      .eq('id', selectedProductId)

    if (updateError) {
      setMessage(`❌ Error actualizando stock: ${updateError.message}`)
      setLoading(false)
      return
    }

    // 2. Registrar el traslado en el historial
    const { error: logError } = await supabase
      .from('inventory_transfers')
      .insert([
        {
          product_id: selectedProductId,
          quantity: qty,
          notes: notes || 'Traslado directo a estantería'
        }
      ])

    if (logError) {
      console.error('Error guardando registro de traslado:', logError)
    }

    setMessage(`✅ ¡Se trasladaron ${qty} ${selectedProduct.unit_type || 'unidades'} de "${selectedProduct.name}" a estantería!`)
    setQuantity('')
    setNotes('')
    setSelectedProductId('')
    setLoading(false)

    // Recargar datos
    fetchProducts()
    fetchTransfersHistory()
  }

  const selectedProduct = products.find(p => p.id === selectedProductId)

  return (
    <div style={{ background: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif', padding: '30px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#38bdf8', fontSize: '24px' }}>📦 Traslado de Inventario</h1>
            <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Mover mercancía: Bodega ➡️ Estantería</p>
          </div>
          <a href="/pos" style={{ color: '#38bdf8', textDecoration: 'none', background: '#1e293b', padding: '8px 16px', borderRadius: '6px', border: '1px solid #334155', fontWeight: 'bold' }}>
            &larr; Volver al POS
          </a>
        </div>

        {/* MENSAJES DE ESTADO */}
        {message && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', background: message.includes('❌') ? '#451a1a' : '#14532d', color: message.includes('❌') ? '#fca5a5' : '#86efac', border: `1px solid ${message.includes('❌') ? '#7f1d1d' : '#166534'}` }}>
            {message}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          {/* FORMULARIO DE TRASLADO */}
          <form onSubmit={handleTransfer} style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#f8fafc', fontSize: '18px' }}>Nuevo Traslado</h3>
            
            {/* SELECCIÓN DE PRODUCTO */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}><b>Producto:</b></label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', color: 'white', border: '1px solid #475569', fontSize: '14px' }}
              >
                <option value="">-- Seleccionar producto --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Bodega: {p.stock_bodega} | Estantería: {p.stock_estanteria})
                  </option>
                ))}
              </select>
            </div>

            {/* DETALLE DE STOCK EN TIEMPO REAL */}
            {selectedProduct && (
              <div style={{ background: '#0f172a', padding: '12px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Stock Bodega:</span><br />
                  <b style={{ color: '#f59e0b', fontSize: '16px' }}>{selectedProduct.stock_bodega} {selectedProduct.unit_type || 'un'}</b>
                </div>
                <div style={{ borderLeft: '1px solid #334155', paddingLeft: '15px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Stock Estantería:</span><br />
                  <b style={{ color: '#22c55e', fontSize: '16px' }}>{selectedProduct.stock_estanteria} {selectedProduct.unit_type || 'un'}</b>
                </div>
              </div>
            )}

            {/* CANTIDAD A TRASLADAR */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}><b>Cantidad a enviar a estantería:</b></label>
              <input
                type="number"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ej. 10 o 2.5"
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', color: 'white', border: '1px solid #475569', fontSize: '14px' }}
              />
            </div>

            {/* NOTAS / OBSERVACIÓN */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}><b>Nota u Observación (Opcional):</b></label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Abastecimiento turno mañana"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', color: 'white', border: '1px solid #475569', fontSize: '14px' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: '#0284c7', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Procesando...' : 'Confirmar Traslado'}
            </button>
          </form>

          {/* HISTORIAL RECIENTE DE TRASLADOS */}
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#f8fafc', fontSize: '18px' }}>Últimos Traslados</h3>
            
            {transfersHistory.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '14px' }}>No hay traslados registrados aún.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                {transfersHistory.map((t: any) => (
                  <div key={t.id} style={{ background: '#0f172a', padding: '10px 14px', borderRadius: '6px', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <b style={{ color: '#38bdf8', fontSize: '14px' }}>{t.products?.name || 'Producto'}</b>
                      <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '14px' }}>+{t.quantity} {t.products?.unit_type || 'un'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                      <span>{t.notes}</span>
                      <span>{new Date(t.transferred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}
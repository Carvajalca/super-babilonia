'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PedidosAlertasPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  useEffect(() => {
    fetchOrders()

    // Suscripción en tiempo real a nuevos pedidos
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ecommerce_orders' },
        (payload) => {
          setOrders((prev) => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchOrders() {
    setLoading(true)
    const { data, error } = await supabase
      .from('ecommerce_orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error('Error cargando pedidos:', error)
    else setOrders(data || [])
    setLoading(false)
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    const { error } = await supabase
      .from('ecommerce_orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }))
      }
    }
  }

  const pendingCount = orders.filter((o) => o.status === 'pending').length

  return (
    <div style={{ background: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif', padding: '30px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HEADER CON ALERTA BADGE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ margin: 0, color: '#38bdf8', fontSize: '24px' }}>🔔 Pedidos E-commerce</h1>
              {pendingCount > 0 && (
                <span style={{ background: '#dc2626', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', animate: 'pulse' }}>
                  {pendingCount} Pendiente(s)
                </span>
              )}
            </div>
            <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Recepción y despacho de domicilios en tiempo real</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="/" style={{ color: '#38bdf8', textDecoration: 'none', background: '#1e293b', padding: '8px 16px', borderRadius: '6px', border: '1px solid #334155', fontWeight: 'bold', fontSize: '14px' }}>
              &larr; Menú Principal
            </a>
            <a href="/tienda" target="_blank" style={{ color: '#38bdf8', textDecoration: 'none', background: '#1e293b', padding: '8px 16px', borderRadius: '6px', border: '1px solid #334155', fontWeight: 'bold', fontSize: '14px' }}>
              🌐 Ver Tienda Web
            </a>
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1fr 400px' : '1fr', gap: '20px' }}>
          
          {/* LISTA DE PEDIDOS */}
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', border: '1px solid #334155', overflowX: 'auto' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#f8fafc', fontSize: '18px' }}>Historial de Domicilios</h3>

            {loading ? (
              <p style={{ color: '#94a3b8' }}>Cargando pedidos...</p>
            ) : orders.length === 0 ? (
              <p style={{ color: '#64748b' }}>No se han recibido pedidos aún.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '2px solid #334155' }}>
                    <th style={{ padding: '12px' }}>Cliente</th>
                    <th style={{ padding: '12px' }}>Contacto / Dirección</th>
                    <th style={{ padding: '12px' }}>Método Pago</th>
                    <th style={{ padding: '12px' }}>Total</th>
                    <th style={{ padding: '12px' }}>Estado</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #334155', background: selectedOrder?.id === o.id ? '#334155' : 'transparent' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#f8fafc' }}>
                        {o.customer_name}
                        <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>
                          {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#94a3b8', fontSize: '13px' }}>
                        📞 {o.customer_phone}<br />
                        📍 {o.customer_address}
                      </td>
                      <td style={{ padding: '12px', textTransform: 'capitalize' }}>
                        <span style={{ background: '#0f172a', color: '#38bdf8', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid #334155' }}>
                          {o.payment_method}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#4ade80' }}>
                        ${Number(o.total_amount).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          background: o.status === 'pending' ? '#7f1d1d' : o.status === 'dispatched' ? '#713f12' : '#14532d',
                          color: o.status === 'pending' ? '#fca5a5' : o.status === 'dispatched' ? '#fde047' : '#86efac',
                          padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase'
                        }}>
                          {o.status === 'pending' ? 'Pendiente' : o.status === 'dispatched' ? 'En camino' : 'Completado'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedOrder(o)}
                          style={{ background: '#0284c7', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                        >
                          Ver Productos
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* DETALLE Y CAMBIO DE ESTADO */}
          {selectedOrder && (
            <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', border: '1px solid #334155', height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '16px' }}>Detalle del Pedido</h3>
                <button onClick={() => setSelectedOrder(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}>✕</button>
              </div>

              <div style={{ background: '#0f172a', padding: '12px', borderRadius: '6px', marginBottom: '15px', fontSize: '13px', color: '#94a3b8' }}>
                <p style={{ margin: '0 0 5px 0' }}><b>Cliente:</b> <span style={{ color: '#f8fafc' }}>{selectedOrder.customer_name}</span></p>
                <p style={{ margin: '0 0 5px 0' }}><b>Teléfono:</b> <span style={{ color: '#38bdf8' }}>{selectedOrder.customer_phone}</span></p>
                <p style={{ margin: '0 0 5px 0' }}><b>Dirección:</b> <span style={{ color: '#f8fafc' }}>{selectedOrder.customer_address}</span></p>
                <p style={{ margin: 0 }}><b>Pago:</b> <span style={{ textTransform: 'capitalize', color: 'white' }}>{selectedOrder.payment_method}</span></p>
              </div>

              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#f8fafc' }}>Artículos solicitados:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }}>
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', background: '#0f172a', padding: '8px 10px', borderRadius: '4px' }}>
                    <div>
                      <b style={{ color: '#f8fafc', display: 'block' }}>{item.name}</b>
                      <span style={{ color: '#94a3b8', fontSize: '11px' }}>{item.quantity} x ${Number(item.sale_price).toLocaleString()}</span>
                    </div>
                    <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>${(item.sale_price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* GESTIÓN DE ESTADO */}
              <div style={{ borderTop: '1px solid #334155', paddingTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '13px' }}><b>Cambiar Estado del Pedido:</b></label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'dispatched')}
                    style={{ flex: 1, background: '#713f12', color: '#fde047', border: '1px solid #a16207', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                  >
                    Despachar
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                    style={{ flex: 1, background: '#14532d', color: '#86efac', border: '1px solid #15803d', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                  >
                    Completar
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  )
}
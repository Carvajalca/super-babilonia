'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function VentasReportePage() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSale, setSelectedSale] = useState<any>(null)
  
  // Totales calculados
  const [totals, setTotals] = useState({
    totalAmount: 0,
    efectivo: 0,
    nequi: 0,
    datafono: 0,
    count: 0
  })

  useEffect(() => {
    fetchSales()
  }, [])

  async function fetchSales() {
    setLoading(true)

    // Consultar ventas e ítems
    const { data, error } = await supabase
      .from('sales')
      .select(`
        id,
        created_at,
        total_amount,
        payment_method,
        sale_items (
          id,
          quantity,
          unit_price,
          subtotal,
          products ( name )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error cargando ventas:', error)
    } else if (data) {
      setSales(data)

      // Calcular métricas del reporte
      let tot = 0
      let ef = 0
      let nq = 0
      let dat = 0

      data.forEach((s: any) => {
        const amt = Number(s.total_amount) || 0
        tot += amt
        if (s.payment_method === 'efectivo') ef += amt
        else if (s.payment_method === 'nequi_daviplata') nq += amt
        else if (s.payment_method === 'datafono') dat += amt
      })

      setTotals({
        totalAmount: tot,
        efectivo: ef,
        nequi: nq,
        datafono: dat,
        count: data.length
      })
    }
    setLoading(false)
  }

  return (
    <div style={{ background: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif', padding: '30px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#38bdf8', fontSize: '24px' }}>📊 Historial de Ventas y Reportes</h1>
            <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Supermercado Babilonia - Auditoría de Ingresos</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="/" style={{ color: '#38bdf8', textDecoration: 'none', background: '#1e293b', padding: '8px 16px', borderRadius: '6px', border: '1px solid #334155', fontWeight: 'bold', fontSize: '14px' }}>
              &larr; Menú Principal
            </a>
            <a href="/pos" style={{ color: '#38bdf8', textDecoration: 'none', background: '#1e293b', padding: '8px 16px', borderRadius: '6px', border: '1px solid #334155', fontWeight: 'bold', fontSize: '14px' }}>
              ⚡ Ir al POS
            </a>
          </div>
        </div>

        {/* TARJETAS DE RESUMEN DE VENTAS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '30px' }}>
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', border: '1px solid #334155' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Ventas Totales</span>
            <h2 style={{ margin: '5px 0 0 0', color: '#38bdf8', fontSize: '24px' }}>${totals.totalAmount.toLocaleString()}</h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>{totals.count} transacciones</span>
          </div>

          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', border: '1px solid #334155' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>💵 Efectivo en Caja</span>
            <h2 style={{ margin: '5px 0 0 0', color: '#4ade80', fontSize: '24px' }}>${totals.efectivo.toLocaleString()}</h2>
          </div>

          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', border: '1px solid #334155' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>📱 Nequi / Daviplata</span>
            <h2 style={{ margin: '5px 0 0 0', color: '#c084fc', fontSize: '24px' }}>${totals.nequi.toLocaleString()}</h2>
          </div>

          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', border: '1px solid #334155' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>💳 Datáfono / Tarjetas</span>
            <h2 style={{ margin: '5px 0 0 0', color: '#facc15', fontSize: '24px' }}>${totals.datafono.toLocaleString()}</h2>
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL: TABLA + DETALLE */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedSale ? '1fr 380px' : '1fr', gap: '20px' }}>
          
          {/* TABLA DE VENTAS */}
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', border: '1px solid #334155', overflowX: 'auto' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#f8fafc', fontSize: '18px' }}>Registro de Facturas</h3>

            {loading ? (
              <p style={{ color: '#94a3b8' }}>Cargando historial...</p>
            ) : sales.length === 0 ? (
              <p style={{ color: '#64748b' }}>No hay ventas registradas aún.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '2px solid #334155' }}>
                    <th style={{ padding: '12px' }}>ID Ticket</th>
                    <th style={{ padding: '12px' }}>Fecha y Hora</th>
                    <th style={{ padding: '12px' }}>Método</th>
                    <th style={{ padding: '12px' }}>Total</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #334155', background: selectedSale?.id === s.id ? '#334155' : 'transparent' }}>
                      <td style={{ padding: '12px', fontFamily: 'monospace', color: '#38bdf8' }}>
                        #{s.id.toString().slice(0, 8)}
                      </td>
                      <td style={{ padding: '12px', color: '#94a3b8', fontSize: '13px' }}>
                        {new Date(s.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textTransform: 'capitalize' }}>
                        <span style={{ background: s.payment_method === 'efectivo' ? '#14532d' : s.payment_method === 'nequi_daviplata' ? '#581c87' : '#713f12', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                          {s.payment_method}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#f8fafc' }}>
                        ${Number(s.total_amount).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedSale(s)}
                          style={{ background: '#0284c7', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* PANEL DETALLE DE TICKET SELECCIONADO */}
          {selectedSale && (
            <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', border: '1px solid #334155', height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '16px' }}>Detalle de Ticket</h3>
                <button onClick={() => setSelectedSale(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}>✕</button>
              </div>

              <div style={{ background: '#0f172a', padding: '12px', borderRadius: '6px', marginBottom: '15px', fontSize: '13px', color: '#94a3b8' }}>
                <p style={{ margin: '0 0 5px 0' }}><b>ID:</b> <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{selectedSale.id}</span></p>
                <p style={{ margin: '0 0 5px 0' }}><b>Fecha:</b> {new Date(selectedSale.created_at).toLocaleString()}</p>
                <p style={{ margin: 0 }}><b>Método:</b> <span style={{ textTransform: 'capitalize', color: 'white' }}>{selectedSale.payment_method}</span></p>
              </div>

              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#f8fafc' }}>Artículos Vendidos:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {selectedSale.sale_items?.map((item: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', background: '#0f172a', padding: '8px 10px', borderRadius: '4px' }}>
                    <div>
                      <b style={{ color: '#f8fafc', display: 'block' }}>{item.products?.name || 'Producto'}</b>
                      <span style={{ color: '#94a3b8', fontSize: '11px' }}>{item.quantity} x ${Number(item.unit_price).toLocaleString()}</span>
                    </div>
                    <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>${Number(item.subtotal).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #334155', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>Total Venta:</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#4ade80' }}>${Number(selectedSale.total_amount).toLocaleString()}</span>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
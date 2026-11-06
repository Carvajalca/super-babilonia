'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CashShiftPage() {
  const [activeShift, setActiveShift] = useState<any>(null)
  const [initialCashInput, setInitialCashInput] = useState('')
  const [finalCashInput, setFinalCashInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    checkActiveShift()
  }, [])

  async function checkActiveShift() {
    setLoading(true)
    const { data, error } = await supabase
      .from('cash_shifts')
      .select('*')
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error buscando turno:', error)
    } else if (data && data.length > 0) {
      setActiveShift(data[0])
    } else {
      setActiveShift(null)
    }
    setLoading(false)
  }

  async function handleOpenShift(e: React.FormEvent) {
    e.preventDefault()
    const cash = parseFloat(initialCashInput)
    if (isNaN(cash)) return

    setMessage('Abriendo turno...')

    const { data, error } = await supabase
      .from('cash_shifts')
      .insert([
        {
          initial_cash: cash,
          status: 'open',
          cash_register_id: '00000000-0000-0000-0000-000000000001' // ID temporal de caja
        }
      ])
      .select()

    if (error) {
      setMessage(`❌ Error al abrir caja: ${error.message}`)
    } else {
      setMessage('✅ ¡Turno abierto con éxito!')
      setInitialCashInput('')
      setActiveShift(data[0])
    }
  }

  async function handleCloseShift(e: React.FormEvent) {
    e.preventDefault()
    const finalCash = parseFloat(finalCashInput)
    if (isNaN(finalCash)) return

    setMessage('Cerrando turno y calculando arqueo...')

    const { error } = await supabase
      .from('cash_shifts')
      .update({
        closed_at: new Date().toISOString(),
        final_cash_declared: finalCash,
        status: 'closed'
      })
      .eq('id', activeShift.id)

    if (error) {
      setMessage(`❌ Error al cerrar caja: ${error.message}`)
    } else {
      setMessage('✅ ¡Turno cerrado y arqueo registrado correctamente!')
      setFinalCashInput('')
      setActiveShift(null)
    }
  }

  if (loading) {
    return (
      <div style={{ background: '#0f172a', color: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        Cargando estado de caja...
      </div>
    )
  }

  return (
    <div style={{ background: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif', padding: '30px 20px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#38bdf8', fontSize: '24px' }}>💰 Gestión de Caja</h1>
            <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Supermercado Babilonia - Control de Turnos</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="/pos" style={{ color: '#38bdf8', textDecoration: 'none', background: '#1e293b', padding: '8px 16px', borderRadius: '6px', border: '1px solid #334155', fontWeight: 'bold', fontSize: '14px' }}>
              &larr; Volver al POS
            </a>
          </div>
        </div>

        {/* MENSAJES DE ESTADO */}
        {message && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', background: message.includes('❌') ? '#451a1a' : '#14532d', color: message.includes('❌') ? '#fca5a5' : '#86efac', border: `1px solid ${message.includes('❌') ? '#7f1d1d' : '#166534'}` }}>
            {message}
          </div>
        )}

        {/* CONTENEDOR PRINCIPAL */}
        {!activeShift ? (
          <form onSubmit={handleOpenShift} style={{ background: '#1e293b', padding: '25px', borderRadius: '10px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#f8fafc', fontSize: '18px' }}>🔓 Apertura de Turno (Caja Cerrada)</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
              Ingrese el fondo de efectivo inicial con el que cuenta la caja para dar cambio al iniciar el turno.
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}><b>Fondo Inicial en Efectivo ($):</b></label>
              <input
                type="number"
                step="0.01"
                value={initialCashInput}
                onChange={(e) => setInitialCashInput(e.target.value)}
                placeholder="Ej. 100000"
                required
                style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '6px', background: '#0f172a', color: 'white', border: '1px solid #475569', outline: 'none' }}
              />
            </div>

            <button 
              type="submit"
              style={{ width: '100%', background: '#0284c7', color: 'white', padding: '14px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', border: 'none', borderRadius: '6px' }}
            >
              Abrir Turno
            </button>
          </form>
        ) : (
          <form onSubmit={handleCloseShift} style={{ background: '#1e293b', padding: '25px', borderRadius: '10px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#f8fafc', fontSize: '18px' }}>🔒 Cierre de Turno / Arqueo (Caja Abierta)</h3>
            
            <div style={{ background: '#0f172a', padding: '15px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #334155', fontSize: '14px', color: '#94a3b8' }}>
              <p style={{ margin: '0 0 8px 0' }}><b>Turno abierto desde:</b> <span style={{ color: '#f8fafc' }}>{new Date(activeShift.opened_at).toLocaleString()}</span></p>
              <p style={{ margin: 0 }}><b>Fondo inicial:</b> <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>${Number(activeShift.initial_cash).toLocaleString()}</span></p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}><b>Dinero total contado en gaveta (Efectivo físico):</b></label>
              <input
                type="number"
                step="0.01"
                value={finalCashInput}
                onChange={(e) => setFinalCashInput(e.target.value)}
                placeholder="Ej. 450000"
                required
                style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '6px', background: '#0f172a', color: 'white', border: '1px solid #475569', outline: 'none' }}
              />
            </div>

            <button 
              type="submit"
              style={{ width: '100%', background: '#dc2626', color: 'white', padding: '14px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', border: 'none', borderRadius: '6px' }}
            >
              Cerrar Turno y Finalizar Arqueo
            </button>
          </form>
        )}

      </div>
    </div>
  )
}
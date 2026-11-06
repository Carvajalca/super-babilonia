'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function GlobalOrderAlert() {
  const pathname = usePathname()
  const [pendingOrders, setPendingOrders] = useState<any[]>([])
  const [isMinimized, setIsMinimized] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isShaking, setIsShaking] = useState(false)

  // 1. Ocultar la alerta en la tienda pública
  if (pathname === '/tienda') return null

  useEffect(() => {
    fetchPendingOrders()

    const channel = supabase
      .channel('global-orders-alert-siri')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ecommerce_orders' },
        (payload) => {
          if (payload.new.status === 'pending') {
            setPendingOrders((prev) => [payload.new, ...prev])
            setIsMinimized(false)
            triggerMSNAndSiriZumbido()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Temporizador de prueba (Cada 30s zumbido, 60s des-minimizar, 180s bloqueo)
  useEffect(() => {
    if (pendingOrders.length === 0) {
      setElapsedSeconds(0)
      return
    }

    const interval = setInterval(() => {
      const oldestOrder = pendingOrders[pendingOrders.length - 1]
      if (oldestOrder) {
        const diffMs = Date.now() - new Date(oldestOrder.created_at).getTime()
        const secs = Math.floor(diffMs / 1000)
        setElapsedSeconds(secs)

        if (secs > 0 && secs % 30 === 0) {
          triggerMSNAndSiriZumbido()
        }

        if (secs >= 60 && isMinimized && secs < 180) {
          setIsMinimized(false)
          triggerMSNAndSiriZumbido()
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [pendingOrders, isMinimized])

  async function fetchPendingOrders() {
    const { data } = await supabase
      .from('ecommerce_orders')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      setPendingOrders(data)
    }
  }

  // ZUMBIDO MSN + VOZ TIPO SIRI 1RA GENERACIÓN ("BABILONIA")
  function triggerMSNAndSiriZumbido() {
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 900)

    try {
      // 1. Reproducir Zumbido Metálico MSN
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        const ctx = new AudioCtx()
        const playTone = (freq: number, start: number, duration: number, type: OscillatorType = 'sawtooth') => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = type
          osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
          gain.gain.setValueAtTime(0.15, ctx.currentTime + start)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(ctx.currentTime + start)
          osc.stop(ctx.currentTime + start + duration)
        }

        const now = 0
        playTone(950, now, 0.12)
        playTone(700, now + 0.12, 0.12)
        playTone(1100, now + 0.24, 0.15)
        playTone(650, now + 0.39, 0.15)
        playTone(850, now + 0.54, 0.25)
      }

      // 2. Voz robótica plana tipo Siri v1 diciendo "Babilonia"
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance("Babilonia.")
        utterance.rate = 0.95 // Velocidad normal pero cortante
        utterance.pitch = 0.8 // Tono medio-bajo robótico
        utterance.volume = 1.0

        // Intentar buscar una voz en español de tono neutro/robótico
        const voices = window.speechSynthesis.getVoices()
        const roboticVoice = voices.find(v => v.name.includes('Microsoft') || v.name.includes('Google') || v.lang.startsWith('es'))
        if (roboticVoice) {
          utterance.voice = roboticVoice
        }

        setTimeout(() => {
          window.speechSynthesis.speak(utterance)
        }, 500) // Justo tras terminar el zumbido
      }

    } catch (e) {
      console.log('Audio no soportado o esperando interacción.')
    }
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    const { error } = await supabase
      .from('ecommerce_orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (!error) {
      setPendingOrders((prev) => prev.filter((o) => o.id !== orderId))
    }
  }

  if (pendingOrders.length === 0) return null

  const isBlocked = elapsedSeconds >= 180
  const currentOrder = pendingOrders[0]
  const minsDisplay = Math.floor(elapsedSeconds / 60)
  const secsDisplay = elapsedSeconds % 60

  return (
    <div
      style={{
        position: 'fixed',
        bottom: isMinimized && !isBlocked ? '20px' : 'auto',
        right: isMinimized && !isBlocked ? '20px' : 'auto',
        top: !isMinimized || isBlocked ? '0' : 'auto',
        left: !isMinimized || isBlocked ? '0' : 'auto',
        width: !isMinimized || isBlocked ? '100vw' : 'auto',
        height: !isMinimized || isBlocked ? '100vh' : 'auto',
        background: !isMinimized || isBlocked ? 'rgba(15, 23, 42, 0.88)' : 'transparent',
        backdropFilter: !isMinimized || isBlocked ? 'blur(6px)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'sans-serif'
      }}
    >
      {/* MODO MINIMIZADO */}
      {isMinimized && !isBlocked ? (
        <div
          onClick={() => {
            setIsMinimized(false)
            triggerMSNAndSiriZumbido()
          }}
          style={{
            background: '#991b1b',
            color: 'white',
            padding: '14px 22px',
            borderRadius: '30px',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(153, 27, 27, 0.7)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontWeight: 'bold',
            fontSize: '14px',
            border: '2px solid #ef4444',
            animation: isShaking ? 'msn-shake 0.15s ease-in-out infinite' : 'pulse 1.5s infinite'
          }}
        >
          <span>🤖 ¡ZUMBIDO SIRI! Pedido Pendiente ({pendingOrders.length})</span>
          <span style={{ background: '#450a0a', padding: '3px 9px', borderRadius: '12px', fontSize: '12px' }}>
            {minsDisplay}m {secsDisplay}s
          </span>
        </div>
      ) : (
        /* MODO ALERTA COMPLETA */
        <div
          style={{
            background: '#1e293b',
            border: isBlocked ? '3px solid #dc2626' : '2px solid #ef4444',
            borderRadius: '12px',
            width: '92%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '25px',
            boxShadow: '0 15px 40px rgba(0,0,0,0.8)',
            color: '#f8fafc',
            animation: isShaking ? 'msn-shake 0.12s ease-in-out infinite' : 'none'
          }}
        >
          {/* HEADER DE LA ALERTA */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>🤖</span>
              <div>
                <h3 style={{ margin: 0, color: isBlocked ? '#fca5a5' : '#f87171', fontSize: '18px' }}>
                  {isBlocked ? '⚠️ URGENTE: ATENCIÓN BLOQUEADA (3+ MIN)' : '¡ZUMBIDO DE DOMICILIO - BABILONIA!'}
                </h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Tiempo transcurrido: <b>{minsDisplay} min {secsDisplay} seg</b> (Bloqueo al min 3)
                </span>
              </div>
            </div>

            {!isBlocked ? (
              <button
                onClick={() => setIsMinimized(true)}
                style={{ background: '#334155', color: '#94a3b8', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
              >
                Minimizar ➖
              </button>
            ) : (
              <span style={{ background: '#7f1d1d', color: '#fca5a5', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                Bloqueo Activo
              </span>
            )}
          </div>

          {/* DATOS DEL CLIENTE */}
          <div style={{ background: '#0f172a', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <b style={{ color: '#f8fafc', fontSize: '16px' }}>👤 {currentOrder.customer_name}</b>
              <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '18px' }}>${Number(currentOrder.total_amount).toLocaleString()}</span>
            </div>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#94a3b8' }}>📞 Celular: <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{currentOrder.customer_phone}</span></p>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#94a3b8' }}>📍 Dirección: <span style={{ color: '#f8fafc' }}>{currentOrder.customer_address}</span></p>
            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>💳 Tipo de Pago: <span style={{ textTransform: 'capitalize', color: '#fde047', fontWeight: 'bold' }}>{currentOrder.payment_method}</span></p>
          </div>

          {/* LISTA DETALLADA DE PRODUCTOS */}
          <div style={{ marginBottom: '20px', background: '#0f172a', padding: '15px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#38bdf8', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
              📦 Productos a alistar en estantería ({currentOrder.items?.length || 0} ítems):
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {currentOrder.items?.map((item: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}>
                  <div>
                    <b style={{ color: '#f8fafc', display: 'block' }}>{item.name}</b>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Presentación: {item.unit_type || 'Unidad'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ background: '#0284c7', color: 'white', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                      x{item.quantity}
                    </span>
                    <span style={{ display: 'block', fontSize: '12px', color: '#38bdf8', marginTop: '2px', fontWeight: 'bold' }}>
                      ${(item.sale_price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleStatusChange(currentOrder.id, 'dispatched')}
              style={{ flex: 1, background: '#16a34a', color: 'white', border: 'none', padding: '14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
            >
              🚀 Confirmar y Despachar Pedido
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              style={{ background: '#334155', color: '#38bdf8', border: '1px solid #475569', padding: '14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
              🔄 Transferir a Otra Caja
            </button>
          </div>

        </div>
      )}

      {/* ESTILOS DE ANIMACIÓN DE TEMBLOR */}
      <style jsx global>{`
        @keyframes msn-shake {
          0% { transform: translate(0, 0) rotate(0deg); }
          20% { transform: translate(-12px, 5px) rotate(-1.5deg); }
          40% { transform: translate(12px, -5px) rotate(1.5deg); }
          60% { transform: translate(-10px, -3px) rotate(0deg); }
          80% { transform: translate(10px, 4px) rotate(1.5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
      `}</style>
    </div>
  )
}
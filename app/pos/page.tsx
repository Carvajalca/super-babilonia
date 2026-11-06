'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function POSPage() {
  const [barcodeInput, setBarcodeInput] = useState('')
  const [cart, setCart] = useState<any[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'nequi_daviplata' | 'datafono'>('efectivo')
  const [message, setMessage] = useState('')
  const [lastSale, setLastSale] = useState<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Mantener el foco permanentemente en el input del lector
  const keepFocus = () => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  useEffect(() => {
    keepFocus()
    const handleGlobalClick = () => keepFocus()
    window.addEventListener('click', handleGlobalClick)
    return () => window.removeEventListener('click', handleGlobalClick)
  }, [])

  // Buscar y agregar producto por EAN o SKU
  async function processBarCode(codeToSearch: string) {
    const code = codeToSearch.trim()
    if (!code) return

    setMessage(`Buscando ${code}...`)

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`ean.eq.${code},sku.eq.${code},barcode.eq.${code}`)
      .limit(1)

    if (error || !data || data.length === 0) {
      setMessage(`❌ Producto no encontrado: ${code}`)
      setBarcodeInput('')
      keepFocus()
      return
    }

    const product = data[0]

    if (product.stock_estanteria <= 0) {
      setMessage(`⚠️ Sin stock en estantería para: ${product.name}`)
      setBarcodeInput('')
      keepFocus()
      return
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === product.id)
      if (existingIndex > -1) {
        const updated = [...prevCart]
        if (updated[existingIndex].quantity < product.stock_estanteria) {
          updated[existingIndex].quantity += 1
        } else {
          setMessage(`⚠️ Límite de stock en estantería alcanzado`)
        }
        return updated
      } else {
        return [...prevCart, { ...product, quantity: 1 }]
      }
    })

    setMessage(`✅ Agregado: ${product.name}`)
    setBarcodeInput('')
    keepFocus()
  }

  // Interceptar el Enter del lector Orbit o del teclado
  async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      await processBarCode(barcodeInput)
    }
  }

  const totalAmount = cart.reduce((acc, item) => acc + item.sale_price * item.quantity, 0)

  async function handleCheckout() {
    if (cart.length === 0) return
    setMessage('Procesando venta...')

    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert([{ total_amount: totalAmount, payment_method: paymentMethod }])
      .select()

    if (saleError) {
      setMessage(`❌ Error al registrar venta: ${saleError.message}`)
      keepFocus()
      return
    }

    const saleId = saleData[0].id

    for (const item of cart) {
      await supabase.from('sale_items').insert([
        {
          sale_id: saleId,
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.sale_price,
          subtotal: item.sale_price * item.quantity
        }
      ])

      const newStock = item.stock_estanteria - item.quantity
      await supabase
        .from('products')
        .update({ stock_estanteria: newStock })
        .eq('id', item.id)
    }

    setLastSale({
      id: saleId,
      date: new Date().toLocaleString(),
      items: [...cart],
      total: totalAmount,
      method: paymentMethod
    })

    setMessage('¡Venta cobrada con éxito!')
    setCart([])

    setTimeout(() => {
      window.print()
      keepFocus()
    }, 200)
  }

  return (
    <div style={{ background: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif', padding: '30px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* VISTA OPERATIVA (Se oculta al imprimir) */}
        <div className="no-print">
          
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
            <div>
              <h1 style={{ margin: 0, color: '#38bdf8', fontSize: '24px' }}>⚡ Terminal POS - Caja</h1>
              <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Supermercado Babilonia</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <a href="/caja" style={{ color: '#38bdf8', textDecoration: 'none', background: '#1e293b', padding: '8px 16px', borderRadius: '6px', border: '1px solid #334155', fontWeight: 'bold', fontSize: '14px' }}>
                💰 Turno y Caja
              </a>
              <a href="/productos" style={{ color: '#38bdf8', textDecoration: 'none', background: '#1e293b', padding: '8px 16px', borderRadius: '6px', border: '1px solid #334155', fontWeight: 'bold', fontSize: '14px' }}>
                🏷️ Productos
              </a>
              <a href="/traslados" style={{ color: '#38bdf8', textDecoration: 'none', background: '#1e293b', padding: '8px 16px', borderRadius: '6px', border: '1px solid #334155', fontWeight: 'bold', fontSize: '14px' }}>
                📦 Traslados
              </a>
            </div>
          </div>

          {/* INPUT LECTOR ORBIT */}
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', border: '1px solid #334155', marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '14px' }}>
              <b>Escanear con Lector Orbit (Automático con Enter):</b>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escanee aquí el código de barras..."
              style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '6px', background: '#0f172a', color: 'white', border: '1px solid #38bdf8', outline: 'none' }}
            />
          </div>

          {/* MENSAJES DE ESTADO */}
          {message && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', background: message.includes('❌') || message.includes('⚠️') ? '#451a1a' : '#14532d', color: message.includes('❌') || message.includes('⚠️') ? '#fca5a5' : '#86efac', border: `1px solid ${message.includes('❌') || message.includes('⚠️') ? '#7f1d1d' : '#166534'}` }}>
              {message}
            </div>
          )}

          {/* CARRITO DE COMPRA */}
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', border: '1px solid #334155', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#f8fafc', fontSize: '18px' }}>Carrito de Venta Actual</h3>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '2px solid #334155' }}>
                  <th style={{ padding: '12px' }}>Producto</th>
                  <th style={{ padding: '12px' }}>Precio Unit.</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Cantidad</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      El carrito está vacío. Escanee un producto con la pistola lectora.
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '12px', color: '#f8fafc', fontWeight: 'bold' }}>{item.name}</td>
                      <td style={{ padding: '12px', color: '#94a3b8' }}>${item.sale_price?.toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ background: '#0f172a', color: '#38bdf8', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', border: '1px solid #334155' }}>
                          {item.quantity}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#38bdf8' }}>
                        ${(item.sale_price * item.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TOTALES Y COBRO */}
          {cart.length > 0 && (
            <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>Total a Pagar:</span>
                <h2 style={{ margin: '5px 0 0 0', color: '#38bdf8', fontSize: '32px' }}>${totalAmount.toLocaleString()}</h2>
              </div>
              
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}><b>Medio de Pago:</b></label>
                  <select 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    style={{ padding: '10px', borderRadius: '6px', background: '#0f172a', color: 'white', border: '1px solid #475569', fontSize: '14px' }}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="nequi_daviplata">Nequi / Daviplata</option>
                    <option value="datafono">Datáfono</option>
                  </select>
                </div>

                <button 
                  onClick={handleCheckout}
                  style={{ background: '#16a34a', color: 'white', padding: '14px 25px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', border: 'none', borderRadius: '6px', marginTop: '18px' }}
                >
                  Cobrar e Imprimir Ticket
                </button>
              </div>
            </div>
          )}

        </div>

        {/* TICKET TÉRMICO PARA IMPRESIÓN (80mm) */}
        <div className="ticket-print">
          {lastSale && (
            <div style={{ width: '72mm', fontFamily: 'monospace', fontSize: '12px', color: '#000', padding: '5px', background: 'white' }}>
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>SUPERMERCADO BABILONIA</h3>
                <p style={{ margin: '2px 0' }}>NIT: 900.000.000-1</p>
                <p style={{ margin: '2px 0' }}>Domicilios y Ventas Directas</p>
                <p style={{ margin: '5px 0' }}>Fecha: {lastSale.date}</p>
                <p style={{ margin: '2px 0' }}>Ticket ID: #{lastSale.id.toString().slice(0, 8)}</p>
              </div>
              <hr style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />
              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>ITEM</th>
                    <th style={{ textAlign: 'center' }}>CANT</th>
                    <th style={{ textAlign: 'right' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {lastSale.items.map((i: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ paddingBottom: '3px' }}>{i.name}</td>
                      <td style={{ textAlign: 'center', verticalAlign: 'top' }}>{i.quantity}</td>
                      <td style={{ textAlign: 'right', verticalAlign: 'top' }}>${i.sale_price * i.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <hr style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                <span>TOTAL:</span>
                <span>${lastSale.total}</span>
              </div>
              <p style={{ margin: '5px 0', textTransform: 'uppercase' }}>Método de Pago: {lastSale.method}</p>
              <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '11px' }}>
                <p style={{ margin: 0 }}>¡Gracias por su compra!</p>
                <p style={{ margin: '2px 0' }}>Conserve este ticket para cambios</p>
              </div>
            </div>
          )}
        </div>

        {/* ESTILOS DE IMPRESIÓN */}
        <style jsx global>{`
          .ticket-print {
            display: none;
          }

          @media print {
            body {
              background: white;
              margin: 0;
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
            .ticket-print {
              display: block !important;
            }
            @page {
              margin: 0;
              size: 80mm auto;
            }
          }
        `}</style>
      </div>
    </div>
  )
}
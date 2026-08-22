import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSummary } from '../utils/api'
import ReceiptPrinter from './ReceiptPrinter'

export default function Summary() {
  const { ownerToken } = useParams()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    getSummary(ownerToken)
      .then(setSummary)
      .catch(() => setError('No se pudo cargar el resumen.'))
      .finally(() => setLoading(false))
  }, [ownerToken])

  if (loading) return <div className="loading"><div className="spinner" />Calculando…</div>
  if (error) return <div className="page"><div className="error-box">{error}</div></div>

  const receiptData = summary ? {
    id: ownerToken?.slice(0, 8) || '0000',
    storeName: summary.group_name || 'AllSplits',
    date: new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }),
    members: summary.members.map(m => ({
    name: m.member_name,
    items: m.items.map(item => ({
      name: item.name,
      qty: item.quantity,
      price: item.line_total
    })),
    total: m.total
  })),
  total: summary.grand_total,
  paymentMethod: 'Revolut'
} : null;

  const handlePayment = () => {
    setIsPaid(true); // Triggers the receipt animation
  };

  return (
    <>
      <nav className="topbar">
        <Link to="/" className="topbar-logo">All<span>Splits</span></Link>
        <Link to={`/manage/${ownerToken}`} className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>
          ← Return
        </Link>
      </nav>

      <div className="page">
        <div className="summary-header">
          <p style={{ color: '#94A3B8', fontSize: '.85rem', marginBottom: '.5rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            Cuenta Final
          </p>
          <h2>{summary.group_name}</h2>
          <div className="grand-total">{summary.grand_total.toFixed(2)}€</div>
          <p style={{ color: '#94A3B8', fontSize: '.9rem' }}>
            {summary.tip_percentage > 0 ? `Incluye ${summary.tip_percentage}% de propina` : 'Sin propina'}
            {' · '}{summary.members.length} {summary.members.length === 1 ? 'persona' : 'personas'}
          </p>
        </div>

        {/* 4. Payment Action Button (Visible until paid) */}
        {!isPaid ? (
          <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
            <button 
              onClick={handlePayment} 
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1.05rem',
                fontWeight: 'bold',
                backgroundColor: 'var(--amber)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              💳 Pagar y Confirmar Liquidación
            </button>
          </div>
        ) : (
          receiptData && <ReceiptPrinter orderData={receiptData} />
        )}

        {/* Breakdown by members */}
        {summary.members.length === 0
          ? (
            <div className="card">
              <div className="empty"><div className="empty-icon">🙋</div>Ningún miembro ha pedido todavía.</div>
            </div>
          )
          : summary.members.map(m => (
            <div key={m.member_id} className="member-bill-card">
              <div className="member-bill-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--amber-lt)', color: 'var(--amber-dk)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '.9rem'
                  }}>
                    {m.member_name[0].toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 600 }}>{m.member_name}</span>
                </div>
                <span className="badge badge-amber">{m.total.toFixed(2)}€</span>
              </div>

              <div className="member-bill-body">
                {m.items.length === 0
                  ? <p style={{ color: 'var(--slate-lt)', fontSize: '.85rem' }}>Sin pedidos</p>
                  : m.items.map((item, i) => (
                    <div key={i} className="bill-line">
                      <span>{item.name} {item.quantity > 1 && <span style={{ color: 'var(--slate-lt)' }}>× {item.quantity}</span>}</span>
                      <span>{item.line_total.toFixed(2)}€</span>
                    </div>
                  ))
                }

                <div className="bill-total-row">
                  <span>Subtotal</span>
                  <span>{m.subtotal.toFixed(2)}€</span>
                </div>
                {m.tip_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--slate-mid)', fontSize: '.88rem', marginTop: '.35rem' }}>
                    <span>Propina</span>
                    <span>+ {m.tip_amount.toFixed(2)}€</span>
                  </div>
                )}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginTop: '.5rem', paddingTop: '.5rem',
                  borderTop: '2px solid var(--amber)', fontWeight: 700, fontSize: '1.05rem'
                }}>
                  <span>Total a pagar</span>
                  <span style={{ color: 'var(--amber-dk)' }}>{m.total.toFixed(2)}€</span>
                </div>
              </div>
            </div>
          ))
        }

        <div style={{ textAlign: 'center', marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '.75rem', alignItems: 'center' }}>
          <Link to="/donate" className="btn btn-primary">
            💛 Donar a organizaciones solidarias
          </Link>
          <Link to="/" className="btn btn-ghost">Crear nuevo grupo</Link>
        </div>
      </div>
    </>
  )
}
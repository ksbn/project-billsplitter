import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getGroupByJoinToken, getMemberByToken, getMySelections, upsertSelection, saveGroupToken } from '../utils/api'

export default function Join() {
  const { joinToken } = useParams()
  const [group, setGroup] = useState(null)
  const [member, setMember] = useState(null)
  const [selections, setSelections] = useState({}) // { menu_item_id: quantity }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const load = useCallback(async () => {
    try {
      const [g, m, sels] = await Promise.all([
        getGroupByJoinToken(joinToken),
        getMemberByToken(joinToken),
        getMySelections(joinToken),
      ])
      setGroup(g)
      setMember(m)

      if (g && g.owner_token) {
      saveGroupToken(g.owner_token)
      }

      const map = {}
      sels.forEach(s => { map[s.menu_item_id] = s.quantity })
      setSelections(map)
    } catch (err) {
      setError('Invalid or expired link.')
    } finally {
      setLoading(false)
    }
  }, [joinToken])

useEffect(() => { 
  load()
}, [load])

  async function changeQty(itemId, delta) {
    const current = selections[itemId] || 0
    const next = Math.max(0, current + delta)
    setSaving(itemId)
    try {
      await upsertSelection(joinToken, itemId, next)
      setSelections(prev => ({ ...prev, [itemId]: next }))
      showToast(next === 0 ? 'Removed' : `× ${next}`)
    } catch (err) {
      showToast('Error: ' + err.message)
    } finally {
      setSaving(null)
    }
  }

  const myTotal = group
    ? group.menu_items.reduce((sum, item) => {
        const qty = selections[item.id] || 0
        return sum + item.price * qty
      }, 0)
    : 0

  const tipAmt = group ? myTotal * (group.tip_percentage / 100) : 0

  if (loading) return <div className="loading"><div className="spinner" />Loading menu…</div>
  if (error) return (
    <div className="page" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <div className="error-box">{error}</div>
      <Link to="/" className="btn btn-ghost" style={{ marginTop: '1rem' }}>← Home</Link>
    </div>
  )

  return (
    <>
      <nav className="topbar">
        <Link to="/" className="topbar-logo">All<span>Splits</span></Link>
        {group.is_closed && <span className="badge badge-slate" style={{ marginLeft: 'auto' }}>Closed</span>}
      </nav>

      {toast && <div className="toast">{toast}</div>}

      <div className="page" style={{ maxWidth: 520 }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <p className="section-label">You're dining at</p>
          <h1 style={{ fontSize: '1.75rem' }}>{group.name}</h1>
          <p style={{ color: 'var(--slate-mid)', marginTop: '.35rem' }}>
            Hey <strong>{member.name}</strong> — tap what you ordered 👇
          </p>
        </div>

        {group.is_closed && (
          <div className="error-box" style={{ marginBottom: '1rem' }}>
            This group has been closed. Your selections are locked in.
          </div>
        )}

        {group.menu_items.length === 0
          ? (
            <div className="card">
              <div className="empty"><div className="empty-icon">📋</div>The menu is empty — check back soon.</div>
            </div>
          )
          : (
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>🍽 Menu</h3>
              <ul className="item-list">
                {group.menu_items.map(item => {
                  const qty = selections[item.id] || 0
                  const isSaving = saving === item.id
                  return (
                    <li key={item.id} className="item-row" style={{ opacity: isSaving ? .6 : 1 }}>
                      <span className="item-name">{item.name}</span>
                      <span className="item-price">{item.price.toFixed(2)}€</span>
                      {!group.is_closed && (
                        <div className="stepper">
                          <button
                            className="stepper-btn"
                            onClick={() => changeQty(item.id, -1)}
                            disabled={qty === 0 || isSaving}
                          >−</button>
                          <span className="stepper-qty">{qty}</span>
                          <button
                            className="stepper-btn"
                            onClick={() => changeQty(item.id, +1)}
                            disabled={isSaving}
                          >+</button>
                        </div>
                      )}
                      {group.is_closed && qty > 0 && (
                        <span className="badge badge-amber">× {qty}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

        {/* My running total */}
        <div className="card" style={{ background: 'var(--slate)', color: 'var(--white)' }}>
          <h3 style={{ color: 'var(--white)', marginBottom: '1rem' }}>Tu cuenta hasta ahora</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem', color: '#94A3B8' }}>
            <span>Subtotal</span>
            <span>{myTotal.toFixed(2)}€</span>
          </div>
          {group.tip_percentage > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem', color: '#94A3B8' }}>
              <span>Propina ({group.tip_percentage}%)</span>
              <span>{tipAmt.toFixed(2)}€</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '.75rem', borderTop: '1px solid #334155', fontWeight: 700, fontSize: '1.2rem' }}>
            <span>Tu total</span>
            <span style={{ color: 'var(--amber)' }}>{(myTotal + tipAmt).toFixed(2)}€</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/donate" style={{ fontSize: '.85rem', color: 'var(--slate-lt)', textDecoration: 'none' }}>
            💛 Considera donar a organizaciones solidarias
          </Link>
        </div>
      </div>
    </>
  )
}

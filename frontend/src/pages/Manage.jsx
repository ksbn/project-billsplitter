import { useState, useEffect, useCallback } from 'react'
import FreeScanner from '../pages/FreeScanner';
import { useParams, Link, useNavigate } from 'react-router-dom'
import { UtensilsCrossed, ClipboardList, Percent, Users, Lock, CreditCard, X, Check } from 'lucide-react'
import {
  getGroupByOwner, addMember, addMenuItem,
  deleteMenuItem, updateTip, closeGroup, saveGroupToken
} from '../utils/api'

function CopyBox({ value, label }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div style={{ marginTop: '.4rem' }}>
      {label && <div style={{ fontSize: '.75rem', color: 'var(--slate-lt)', marginBottom: '.25rem' }}>{label}</div>}
      <div className="share-box" onClick={copy}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
        {copied ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
            <Check size={14} /> Copied!
          </span>
        ) : value}
      </div>
    </div>
  )
}

export default function Manage() {
  const { ownerToken } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [memberName, setMemberName] = useState('')
  const [revolutLink, setRevolutLink] = useState('')
  const [itemName, setItemName] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [tip, setTip] = useState(0)
  const [toast, setToast] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const load = useCallback(async () => {
    try {
      const g = await getGroupByOwner(ownerToken)
      setGroup(g)
      setTip(g.tip_percentage)
    } catch {
      setError('Group not found.')
    } finally {
      setLoading(false)
    }
  }, [ownerToken])

  useEffect(() => { 
    if (ownerToken) {
    saveGroupToken(ownerToken) 
  }
  load()
}, [ownerToken, load])

  async function handleScannedItems(scannedData) {
    if (!scannedData.items || scannedData.items.length === 0) {
      showToast('No dishes were found on the receipt.')
      return
    }

    try {
      for (const item of scannedData.items) {
        if (item.name && item.price) {
          await addMenuItem(ownerToken, item.name.trim(), Number(item.price))
        }
      }
      showToast(`¡${scannedData.items.length} extra dishes on the bill!`)
      load() 
    } catch (err) {
      showToast('Error adding the scanned items.')
    }
  }

  async function handleAddMember(e) {
    e.preventDefault()
    if (!memberName.trim()) return
    try {
      await addMember(ownerToken, memberName.trim(), revolutLink)
      setMemberName('')
      setRevolutLink('')
      load() 
    } catch (err) {
      showToast('Error adding member: ' + err.message)
    }
  }

  async function handleAddItem(e) {
    e.preventDefault()
    if (!itemName.trim() || !itemPrice) return
    await addMenuItem(ownerToken, itemName.trim(), parseFloat(itemPrice))
    setItemName('')
    setItemPrice('')
    showToast('item added!')
    load()
  }

  async function handleDeleteItem(id) {
    await deleteMenuItem(id, ownerToken)
    load()
  }

  async function handleTipBlur() {
    await updateTip(ownerToken, tip)
    showToast(`Tips: ${tip}%`)
    load()
  }

  async function handleClose() {
    if (!confirm('Close the group? No further changes can be made.')) return
    await closeGroup(ownerToken)
    navigate(`/summary/${ownerToken}`)
  }

  const origin = window.location.origin

  if (loading) return <div className="loading"><div className="spinner" />Loading group…</div>
  if (error) return <div className="page"><div className="error-box">{error}</div></div>

  return (
    <>
      <nav className="topbar">
        <Link to="/" className="topbar-logo">All<span>Splits</span></Link>
        <span className="badge badge-amber" style={{ marginLeft: 'auto' }}>Host's view</span>
        {group.is_closed && <span className="badge badge-slate">Closed</span>}
      </nav>

      {toast && <div className="toast">{toast}</div>}

      <div className="page-wide">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.9rem' }}>{group.name}</h1>
            <p style={{ color: 'var(--slate-mid)', fontSize: '.9rem', marginTop: '.25rem' }}>
              {group.members.length} members · {group.menu_items.length} menu items
            </p>
          </div>
          <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
            <Link to={`/summary/${ownerToken}`} className="btn btn-ghost">
              View summary
            </Link>
            {!group.is_closed && (
              <button className="btn btn-danger" onClick={handleClose}>
                Close and finish
              </button>
            )}
          </div>
        </div>

        <div className="two-col">
          {/* LEFT */}
          <div>
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <UtensilsCrossed size={18} color="var(--accent)" /> Menu
                </h3>
              </div>
                {/* Free Scanner Button Rendered Here */}
                {!group.is_closed && (
                  <form onSubmit={handleAddItem}>
                    <div className="input-row" style={{ marginBottom: '.75rem' }}>
                      <input
                        type="text"
                        placeholder="Menu item"
                        value={itemName}
                        onChange={e => setItemName(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Price €"
                        min="0.01"
                        step="0.01"
                        value={itemPrice}
                        onChange={e => setItemPrice(e.target.value)}
                        style={{ maxWidth: '100px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={!itemName || !itemPrice}>
                        + Add menu item
                      </button>

                      <span style={{ marginLeft: ' 2rem' }}>
                      <FreeScanner onItemsExtracted={handleScannedItems} />
                      </span>
                    </div>
                </form>
              )}
              <hr className="divider" />
              {group.menu_items.length === 0
                ? (
                  <div className="empty">
                    <div className="empty-icon"><ClipboardList size={28} color="var(--ink-lt)" /></div>
                    No items yet
                  </div>
                )
                : (
                  <ul className="item-list">
                    {group.menu_items.map(item => (
                      <li key={item.id} className="item-row">
                        <span className="item-name">{item.name}</span>
                        <span className="item-price">{item.price.toFixed(2)}€</span>
                        {!group.is_closed && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteItem(item.id)}>
                            <X size={14} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <Percent size={18} color="var(--accent)" /> Tips
              </h3>
              <div className="tip-row">
                <input
                  type="range" min="0" max="30" step="1"
                  value={tip}
                  onChange={e => setTip(Number(e.target.value))}
                  onMouseUp={handleTipBlur}
                  onTouchEnd={handleTipBlur}
                  disabled={group.is_closed}
                />
                <span className="tip-value">{tip}%</span>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <Users size={18} color="var(--accent)" /> Members
            </h3>
             {!group.is_closed && (
             <form onSubmit={handleAddMember}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem', marginBottom: '.75rem' }}>
              <input
                type="text"
                placeholder="Name *"
                value={memberName}
                onChange={e => setMemberName(e.target.value)}
                required
              />
              
              <input
                type="url"
                placeholder="https://revolut.me/username)"
                value={revolutLink}
                onChange={e => setRevolutLink(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm btn-full" disabled={!memberName.trim()}>
            + Add Member
          </button>
        </div>
      </form>
    )}

    {group.members.length === 0
      ? (
        <div className="empty" style={{ padding: '1.5rem 0 0' }}>
          <div className="empty-icon"><Users size={28} color="var(--ink-lt)" /></div>
          Sin personas todavía
        </div>
      )
      : (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {group.members.map(m => (
            <div key={m.id} style={{ paddingBottom: '.75rem', borderBottom: '1px solid var(--border, #e2e8f0)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.35rem' }}>
                <span style={{ fontWeight: 600 }}>{m.name}</span>
                {m.revolut_link && (
                  <a
                    href={m.revolut_link.startsWith('http') ? m.revolut_link : `https://${m.revolut_link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '.75rem',
                      color: '#0075FF',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '.3rem'
                    }}
                  >
                    <CreditCard size={13} /> Revolut
                  </a>
                )}
              </div>
              <CopyBox
                value={`${origin}/join/${m.join_token}`}
                label="Link to share"
              />
            </div>
          ))}
        </div>
      )}
  </div>

            <div className="card">
              <h3 style={{ marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <Lock size={16} color="var(--accent)" /> Your host link
              </h3>
              <p style={{ fontSize: '.82rem', color: 'var(--slate-mid)', marginBottom: '.75rem' }}>
              Save this link — it’s the only way to manage this group.
              </p>
              <CopyBox value={`${origin}/manage/${ownerToken}`} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

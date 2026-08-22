import { useState } from 'react'
import { Link } from 'react-router-dom'

const ORGS = [
  {
    id: 'banco-alimentos',
    name: 'Banco de Alimentos de Madrid',
    tagline: 'Fighting hunger in Spain since 1994',
    description:
      'The Spanish Federation of Food Banks collects surplus food and redistributes it to more than 1,700 charities throughout Spain, helping more than a million people in vulnerable situations.',
    icon: '🥣',
    url: 'https://www.fesbal.org/donacion/',
    color: '#f8af33',
    impact: 'With €1, you can provide up to 3 kg of food to families in need.',
    amounts: [5, 10, 25, 50],
  },
  {
    id: 'cruz-roja',
    name: 'Cruz Roja Española',
    tagline: 'Humanitarian aid across Europe',
    description:
      'The Spanish Red Cross leads food security, social care and emergency response programmes in Spain and across Europe, reaching more than three million people a year.',
    icon: '🧣',
    url: 'https://www.cruzroja.es/principal/web/cruz-roja/hazte-socio',
    color: '#EF4444',
    impact: 'For just €10 a month, you can help a family meet their basic needs.',
    amounts: [5, 10, 30, 60],
  },
]

function OrgCard({ org }) {
  const [selected, setSelected] = useState(null)
  const [custom, setCustom] = useState('')
  const [copied, setCopied] = useState(false)

  const displayAmt = custom || selected

  function handleDonate() {
    window.open(org.url, '_blank', 'noopener,noreferrer')
  }

  function handleCopy() {
    navigator.clipboard.writeText(org.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card" style={{ borderTop: `4px solid ${org.color}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{org.icon}</span>
        <div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '.2rem' }}>{org.name}</h3>
          <p style={{ fontSize: '.85rem', color: 'var(--slate-mid)' }}>{org.tagline}</p>
        </div>
      </div>

      <p style={{ fontSize: '.9rem', color: 'var(--slate-mid)', lineHeight: 1.6, marginBottom: '1rem' }}>
        {org.description}
      </p>

      <div
        style={{
          background: 'var(--cream)',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '.65rem 1rem',
          fontSize: '.85rem',
          color: 'var(--slate-mid)',
          marginBottom: '1.25rem',
          display: 'flex',
          gap: '.5rem',
          alignItems: 'center',
        }}
      >
        <span>💡</span>
        <span>{org.impact}</span>
      </div>

      <div className="section-label">Choose a quantity</div>
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
        {org.amounts.map((amt) => (
          <button
            key={amt}
            className="btn btn-ghost btn-sm"
            onClick={() => { setSelected(amt); setCustom('') }}
            style={
              selected === amt && !custom
                ? { background: 'var(--amber-lt)', borderColor: 'var(--amber)', color: 'var(--amber-dk)' }
                : {}
            }
          >
            {amt}€
          </button>
        ))}
      </div>

      <div className="field" style={{ marginBottom: '1.25rem' }}>
        <label>or enter a custom amount</label>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--slate-lt)', fontWeight: 600
          }}>€</span>
          <input
            type="number"
            min="1"
            placeholder="0,00"
            value={custom}
            onChange={(e) => { setCustom(e.target.value); setSelected(null) }}
            style={{ paddingRight: '2rem' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
        <button
          className="btn btn-primary"
          onClick={handleDonate}
          style={{ flex: 1 }}
          disabled={!displayAmt}
        >
          Donate {displayAmt ? `${displayAmt}€` : ''} →
        </button>
        <button className="btn btn-ghost btn-sm" onClick={handleCopy} title="Copy the link">
          {copied ? '✓ Copied' : '🔗 Copy the link'}
        </button>
      </div>
    </div>
  )
}

export default function Donate() {
  return (
    <>
      <nav className="topbar">
        <Link to="/" className="topbar-logo">
          All<span>Splits</span>
        </Link>
        <span className="badge badge-amber" style={{ marginLeft: 'auto' }}>Solidarity</span>
      </nav>

      <div className="page">
        <div style={{ textAlign: 'center', padding: '2.5rem 0 2rem' }}>
          <p className="hero-eyebrow">Make a difference</p>
          <h1>
            Split the bill,<br />
            <em style={{ fontStyle: 'normal', color: 'var(--amber)' }}>share the good.</em>
          </h1>
          <p className="hero-sub">
            After serving dinner, please consider helping those most in need.
            100% of your donation goes directly to the organization.
          </p>
        </div>

        <hr className="divider" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {ORGS.map((org) => (
            <OrgCard key={org.id} org={org} />
          ))}
        </div>

        <div style={{
          textAlign: 'center',
          padding: '1.5rem',
          background: 'var(--white)',
          borderRadius: 'var(--radius)',
          border: '1px solid #E2E8F0',
        }}>
          <p style={{ fontSize: '.85rem', color: 'var(--slate-mid)', lineHeight: 1.6 }}>
            AllSplits has no affiliation with these organizations and does not receive any commission.
            Clicking on Donate opens each organization’s official website in a new tab.
          </p>
          <Link to="/" className="btn btn-ghost btn-sm" style={{ marginTop: '1rem' }}>
            ← Return
          </Link>
        </div>
      </div>
    </>
  )
}

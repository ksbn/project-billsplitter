import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createGroup, saveGroupToken } from '../utils/api'

export default function Home() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      const group = await createGroup(name.trim(), 0)
      if (group?.owner_token) {
        saveGroupToken(group.owner_token)
      }

      navigate(`/manage/${group.owner_token}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { icon: '📝', text: 'Create a group and add the dishes from the menu' },
    { icon: '🔗', text: 'Share a unique link with each person' },
    { icon: '☑️', text: 'Everyone ticks off what they’ve ordered' },
    { icon: '🧾', text: 'See the final breakdown straight away, including tip' },
  ]

  return (
    <>
      <nav className="topbar">
        <span className="topbar-logo">All<span>Splits</span></span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem' }}>
          <Link to="/groups" className="btn btn-ghost btn-sm">
            📂 My Groups
          </Link>
          <Link to="/donate" className="btn btn-ghost btn-sm">
            💜 Donate
          </Link>
        </div>
      </nav>

      <div className="page">
        <div className="hero">
          <p className="hero-eyebrow">No registration required</p>
          <h1>Split the check<br /><em>without any inconvenience</em></h1>
          <p className="hero-sub">
            Create a group, add what each person ordered, and get the breakdown in euros — tip included.
          </p>
        </div>

        <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Create new group</h2>

          {error && <div className="error-box" style={{ marginBottom: '1rem' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field" style={{ marginBottom: '1.25rem' }}>
              <label>Name of the group</label>
              <input
                type="text"
                placeholder='p.ej. "Dinner at Mario"'
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>
            
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading || !name.trim()}
            >
              {loading ? 'Creating…' : 'Create group →'}
            </button>
          </form>
        </div>

        <div style={{ maxWidth: 480, margin: '3rem auto 0', textAlign: 'center' }}>
          <p className="section-label">How it works</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', textAlign: 'left' }}>
            {steps.map((step) => (
              <div 
                key={step.text} 
                style={{ display: 'flex', gap: '.75rem', alignItems: 'center', padding: '.65rem 0', borderBottom: '1px solid #E2E8F0' }}
              >
                <span style={{ fontSize: '1.25rem' }}>{step.icon}</span>
                <span style={{ color: 'var(--slate-mid)', fontSize: '.9rem' }}>{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
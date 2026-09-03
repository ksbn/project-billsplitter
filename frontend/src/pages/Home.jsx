import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FilePlus2, Link2, CheckSquare, Receipt, FolderOpen, Heart } from 'lucide-react'
import { createGroup, saveGroupToken } from '../utils/api'
import { IconBadge } from './IconBadge'

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
    {
      icon: FilePlus2,
      title: 'Create a group',
      text: 'Add the dishes from the menu, with prices.',
    },
    {
      icon: Link2,
      title: 'Share the link',
      text: 'Send a unique link to each person in the group.',
    },
    {
      icon: CheckSquare,
      title: 'Everyone ticks their order',
      text: 'No app, no login — just tap what they had.',
    },
    {
      icon: Receipt,
      title: 'Get the breakdown',
      text: 'See exactly who owes what, tip included.',
    },
  ]

  return (
    <>
      <nav className="topbar">
        <span className="topbar-logo">All<span>Splits</span></span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem' }}>
          <Link to="/groups" className="btn btn-ghost btn-sm">
            <FolderOpen size={15} /> My Groups
          </Link>
          <Link to="/donate" className="btn btn-ghost btn-sm">
            <Heart size={15} /> Donate
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

        <div style={{ maxWidth: 480, margin: '3rem auto 0' }}>
          <p className="section-label" style={{ textAlign: 'center' }}>How it works</p>
          <div className="card" style={{ padding: '.5rem 1.5rem' }}>
            {steps.map((step, i) => (
              <div
                key={step.title}
                style={{
                  display: 'flex',
                  gap: '.85rem',
                  alignItems: 'flex-start',
                  padding: '1rem 0',
                  borderBottom: i < steps.length - 1 ? '1px solid var(--accent-lt)' : 'none',
                }}
              >
                <IconBadge icon={step.icon} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: '.92rem', color: 'var(--ink)' }}>{step.title}</p>
                  <p style={{ color: 'var(--ink-mid)', fontSize: '.85rem', marginTop: '.15rem' }}>{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllSavedGroups } from '../utils/api'

export default function GroupList() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadGroups() {
      try {
        const data = await getAllSavedGroups()
        setGroups(data)
      } catch (err) {
        console.error('Error loading groups:', err)
      } finally {
        setLoading(false)
      }
    }
    loadGroups()
  }, [])

  if (loading) return <div className="loading"><div className="spinner" />Loading groups...</div>

  return (
    <>
      <nav className="topbar">
        <Link to="/" className="topbar-logo">All<span>Splits</span></Link>
      </nav>
      
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1>My Groups</h1>
          <Link to="/" className="btn btn-primary btn-sm">+ Create New</Link>
        </div>

        {groups.length === 0 ? (
          <div className="card empty">
            <div className="empty-icon">📂</div>
            <p>You don’t have any groups saved on this device.</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Create Group</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {groups.map((group) => (
              <div key={group.owner_token} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{group.name}</h3>
                  <p style={{ color: 'var(--slate-mid)', fontSize: '.85rem', marginTop: '.25rem' }}>
                    {group.members?.length || 0} personas · {group.menu_items?.length || 0} platos
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                  {group.is_closed ? (
                    <span className="badge badge-slate">Closed</span>
                  ) : (
                    <span className="badge badge-amber">Active</span>
                  )}
                  <Link to={`/manage/${group.owner_token}`} className="btn btn-ghost btn-sm">
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
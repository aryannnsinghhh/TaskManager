import { NavLink } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

const initials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

export default function TopBar({ darkMode, onToggleTheme, onLogout, orgName, isAdmin, currentUser }) {
  const [open, setOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  return (
    <header className="top-bar">
      <div className="top-bar-brand">
        <p className="brand">TeamTaskManager</p>
        <h1>{orgName || 'Workspace'}</h1>
      </div>

      <nav>
        <NavLink to="/home" className={({ isActive }) => (isActive ? 'active' : '')}>Home</NavLink>
        <NavLink to="/org/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>Organisation</NavLink>
        <NavLink to="/projects" className={({ isActive }) => (isActive ? 'active' : '')}>Projects</NavLink>
        {isAdmin ? <NavLink to="/requests" className={({ isActive }) => (isActive ? 'active' : '')}>Requests</NavLink> : null}
        <NavLink to="/members" className={({ isActive }) => (isActive ? 'active' : '')}>Members</NavLink>
        <NavLink to="/my-tasks" className={({ isActive }) => (isActive ? 'active' : '')}>My Tasks</NavLink>

        {currentUser && (
          <div className="top-bar-profile" ref={menuRef}>
            <button type="button" className="top-bar-avatar" onClick={() => setOpen((v) => !v)} aria-expanded={open} title={currentUser.name}>
              {initials(currentUser.name)}
            </button>
            {open ? (
              <div className="profile-menu">
                <div className="profile-menu-header">
                  <div className="profile-avatar-large">{initials(currentUser.name)}</div>
                  <div className="profile-meta">
                    <strong>{currentUser.name}</strong>
                    <span className="muted-line" style={{ margin: 0 }}>{currentUser.email}</span>
                  </div>
                </div>
                <div className="profile-menu-actions">
                  <button type="button" className="profile-menu-item top-bar-logout" onClick={onLogout}>Log out</button>
                </div>
              </div>
            ) : null}

            {showProfile ? (
              <div className="profile-modal-backdrop" onClick={() => setShowProfile(false)}>
                <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
                  <header style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div className="profile-avatar-large">{initials(currentUser.name)}</div>
                    <div>
                      <h3 style={{ margin: 0 }}>{currentUser.name}</h3>
                      <div className="muted-line">{currentUser.email}</div>
                    </div>
                  </header>
                  <section style={{ marginTop: '1rem' }}>
                    <p><strong>Role:</strong> {currentUser.role || 'Member'}</p>
                    {/* Add more profile details here if available */}
                  </section>
                  <footer style={{ marginTop: '1rem', textAlign: 'right' }}>
                    <button type="button" className="db-open-btn" onClick={() => setShowProfile(false)}>Close</button>
                  </footer>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </nav>
    </header>
  )
}

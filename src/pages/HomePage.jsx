import { useState } from 'react'

export default function HomePage({
  organizations,
  currentRoleByOrg,
  onSelectOrg,
  onCreateOrg,
  onJoinByLink,
}) {
  const [tab, setTab] = useState('orgs')
  const [joinError, setJoinError] = useState('')

  const handleJoin = async (event) => {
    event.preventDefault()
    try {
      await onJoinByLink(event)
      setJoinError('')
    } catch (error) {
      setJoinError(error?.message || 'That invite could not be used.')
    }
  }

  return (
    <section className="home-shell">
      <div className="home-header">
        <div>
          <p className="db-eyebrow">Home</p>
          <h2 className="db-title">Your Organizations</h2>
        </div>
      </div>

      <div className="home-tabs">
        <button type="button" className={`home-tab ${tab === 'orgs' ? 'home-tab-active' : ''}`} onClick={() => setTab('orgs')}>
          My Organisations
        </button>
        <button type="button" className={`home-tab ${tab === 'create' ? 'home-tab-active' : ''}`} onClick={() => setTab('create')}>
          Create Organisation
        </button>
        <button type="button" className={`home-tab ${tab === 'join' ? 'home-tab-active' : ''}`} onClick={() => setTab('join')}>
          Join via Invite
        </button>
      </div>

      {tab === 'orgs' && (
        <div>
          {organizations.length === 0 ? (
            <div className="home-empty">
              <p>You are not in any organisation yet.</p>
              <div className="home-empty-actions">
                <button type="button" className="home-action-btn" onClick={() => setTab('create')}>Create one</button>
                <button type="button" className="home-action-btn home-action-ghost" onClick={() => setTab('join')}>Join with invite</button>
              </div>
            </div>
          ) : (
            <div className="db-grid">
              {organizations.map((org) => (
                <button key={org.id} type="button" className="db-project-card home-org-card" onClick={() => onSelectOrg(org.id)}>
                  <div className="db-card-bar" />
                  <div className="db-card-body">
                    <strong className="db-card-name">{org.name}</strong>
                    <span className="home-role-chip">{currentRoleByOrg[org.id]}</span>
                    <span className="home-go">Go to organisation →</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'create' && (
        <form className="home-form" onSubmit={onCreateOrg}>
          <div className="home-form-inner">
            <p className="home-form-title">Create a new organisation</p>
            <p className="home-form-sub">You'll be set as admin and a default project will be created.</p>
            <label className="home-label">
              Organisation name
              <input name="orgName" placeholder="e.g. Acme Corp" required />
            </label>
            <button type="submit">Create organisation</button>
          </div>
        </form>
      )}

      {tab === 'join' && (
        <form className="home-form" onSubmit={handleJoin}>
          <div className="home-form-inner">
            <p className="home-form-title">Join via invite link</p>
            <p className="home-form-sub">Paste the invite code or full invite URL shared by your admin. It only works for the email it was sent to.</p>
            <label className="home-label">
              Invite code or link
              <input name="inviteLink" placeholder="e.g. ACMECORP-4F2A or full URL" required />
            </label>
            {joinError ? <p style={{ color: '#b42318', margin: '0.25rem 0 0' }}>{joinError}</p> : null}
            <button type="submit">Join organisation</button>
          </div>
        </form>
      )}
    </section>
  )
}

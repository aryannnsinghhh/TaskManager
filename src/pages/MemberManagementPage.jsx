import { useMemo, useRef, useState } from 'react'

export default function MemberManagementPage({ projects, selectedProjectId, members, isAdmin, onGenerateCode, onSelectProject, onRemove }) {
  const [memberSearchInput, setMemberSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [projectQuery, setProjectQuery] = useState('')
  const [showProjectOptions, setShowProjectOptions] = useState(false)
  const [selectedCodeProjectId, setSelectedCodeProjectId] = useState('')
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const projectSelectorRef = useRef(null)
  const codeProjectSelectorRef = useRef(null)
  const [codeProjectQuery, setCodeProjectQuery] = useState('')
  const [showCodeProjectOptions, setShowCodeProjectOptions] = useState(false)

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null

  const filteredProjects = useMemo(() => {
    const q = projectQuery.trim().toLowerCase()
    return q ? projects.filter((p) => p.name.toLowerCase().includes(q)) : projects
  }, [projectQuery, projects])

  const filteredCodeProjects = useMemo(() => {
    const q = codeProjectQuery.trim().toLowerCase()
    return q ? projects.filter((p) => p.name.toLowerCase().includes(q)) : projects
  }, [codeProjectQuery, projects])

  const filteredMembers = (list, query) => {
    const q = String(query || '').trim().toLowerCase()
    if (!q) return list
    return list.filter((m) =>
      [m.name, m.email, m.role, m.status].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    )
  }

  const displayedMembers = searchPerformed ? (searchResults || []) : []

  const handleSearch = (event) => {
    if (event?.preventDefault) event.preventDefault()
    setError('')
    setInfoMessage('')
    setSearching(true)
    setSearchPerformed(true)
    try {
      const q = String(memberSearchInput || '').trim()
      if (!q && !selectedProjectId) {
        setSearchResults([])
        setInfoMessage('Please select a project or enter a name/email to search.')
        return
      }
      const results = filteredMembers(members, q)
      setSearchResults(results)
      if (results.length === 0) setInfoMessage('No match found.')
    } finally {
      setSearching(false)
    }
  }

  const handleGenerateCode = async () => {
    setError('')
    setInfoMessage('')
    if (!selectedCodeProjectId) {
      setError('Select a project to generate a code for.')
      return
    }
    try {
      await onGenerateCode(selectedCodeProjectId)
      setInfoMessage('Code generated. Open the project board to view and copy it.')
    } catch (err) {
      setError(err?.message || 'Failed to generate code.')
    }
  }

  return (
    <section className="panel">
      <h2>Project Members</h2>

      <div className="db-project-card home-org-card" style={{ marginBottom: '1rem', cursor: 'default' }}>
        <div className="db-card-bar" />
        <div className="db-card-body">
          <strong className="db-card-name">Search members</strong>
          <div className="search-select-wrap" ref={projectSelectorRef}>
            <label className="home-label">
              Select project
              <div className="search-select-shell">
                <input
                  type="search"
                  value={projectQuery}
                  onFocus={() => setShowProjectOptions(true)}
                  onChange={(e) => { setProjectQuery(e.target.value); setShowProjectOptions(true) }}
                  onKeyDown={(e) => { if (e.key === 'Escape') setShowProjectOptions(false) }}
                  placeholder="Search or choose a project"
                  autoComplete="off"
                />
                <button type="button" className="search-select-toggle" onClick={() => setShowProjectOptions((v) => !v)}>▾</button>
              </div>
            </label>
            {showProjectOptions && (
              <div className="search-select-menu">
                {filteredProjects.length === 0 ? (
                  <button type="button" className="search-select-item search-select-empty" disabled>No matching projects</button>
                ) : filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`search-select-item ${p.id === selectedProjectId ? 'search-select-item-active' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { onSelectProject(p.id); setProjectQuery(p.name); setShowProjectOptions(false) }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <label className="home-label search-row">
            Search members
            <input
              type="search"
              value={memberSearchInput}
              onChange={(e) => setMemberSearchInput(e.target.value)}
              placeholder="Search by name, email, role, or status"
            />
            <button type="button" className="search-btn" onClick={handleSearch}>
              <span className="search-btn-label">{searching ? 'Searching…' : 'Search'}</span>
            </button>
          </label>
        </div>
      </div>

      {isAdmin && (
        <div className="db-project-card home-org-card" style={{ marginBottom: '1rem', cursor: 'default' }}>
          <div className="db-card-bar" />
          <div className="db-card-body">
            <strong className="db-card-name">Generate project invite code</strong>
            <div className="search-select-wrap" ref={codeProjectSelectorRef}>
              <label className="home-label">
                Select project
                <div className="search-select-shell">
                  <input
                    type="search"
                    value={codeProjectQuery}
                    onFocus={() => setShowCodeProjectOptions(true)}
                    onChange={(e) => { setCodeProjectQuery(e.target.value); setShowCodeProjectOptions(true); setSelectedCodeProjectId('') }}
                    onKeyDown={(e) => { if (e.key === 'Escape') setShowCodeProjectOptions(false) }}
                    placeholder="Search or choose a project"
                    autoComplete="off"
                  />
                  <button type="button" className="search-select-toggle" onClick={() => setShowCodeProjectOptions((v) => !v)}>▾</button>
                </div>
              </label>
              {showCodeProjectOptions && (
                <div className="search-select-menu">
                  {filteredCodeProjects.length === 0 ? (
                    <button type="button" className="search-select-item search-select-empty" disabled>No matching projects</button>
                  ) : filteredCodeProjects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`search-select-item ${p.id === selectedCodeProjectId ? 'search-select-item-active' : ''}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setSelectedCodeProjectId(p.id); setCodeProjectQuery(p.name); setShowCodeProjectOptions(false) }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              className="search-btn"
              onClick={handleGenerateCode}
              disabled={!selectedCodeProjectId}
              style={{ marginTop: '0.5rem' }}
            >
              Generate Code
            </button>
            {!selectedCodeProjectId && <p className="muted-line">Select a project to generate an invite code.</p>}
          </div>
        </div>
      )}

      {infoMessage && <p className="muted-line">{infoMessage}</p>}
      {error && <p className="muted-line" style={{ color: '#b42318' }}>{error}</p>}

      {!selectedProject && <p className="muted-line">Select a project to view its members.</p>}

      <div className="list-grid">
        {!searchPerformed && displayedMembers.length === 0 ? (
          <p className="muted-line">No members found for this project yet.</p>
        ) : null}
        {displayedMembers.map((member) => (
          <div key={member.id} className="db-project-card home-org-card" style={{ cursor: 'default' }}>
            <div className="db-card-bar" />
            <div className="db-card-body">
              {isAdmin && member.role !== 'admin' && (
                <button
                  type="button"
                  className="card-remove-small"
                  onClick={() => onRemove(selectedProjectId, member.id)}
                  disabled={!selectedProjectId}
                >
                  Remove
                </button>
              )}
              <strong className="db-card-name">{member.name}</strong>
              <span>{member.email}</span>
              <div className="row-actions">
                <span className="home-role-chip">{member.role}</span>
                <span className="home-role-chip">
                  {member.status === 'joined' ? 'Joined' : member.status === 'rejected' ? 'Rejected' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
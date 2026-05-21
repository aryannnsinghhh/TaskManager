export default function OrgDashboardPage({ orgName, role, projects, memberCount, onOpenProject }) {
  const hasOrg = orgName && orgName !== 'Org'

  if (!hasOrg) {
    return (
      <section className="db-shell">
        <div className="db-header">
          <div>
            <p className="db-eyebrow">Organisation</p>
            <h2 className="db-title">Not a part of any Organisation's Project</h2>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="db-shell">
      <div className="db-header">
        <div>
          <p className="db-eyebrow">Organisation</p>
          <h2 className="db-title">{orgName}</h2>
        </div>
        <div className="db-meta">
          <span className="db-chip">{role}</span>
          <span className="db-chip">{memberCount} members</span>
          <span className="db-chip">{projects.length} projects</span>
          <span className="db-live-dot" />
        </div>
      </div>

      <div className="db-grid">
        {projects.map((project) => (
          <div key={project.id} className="db-project-card">
            <div className="db-card-bar" />
            <div className="db-card-body">
              <strong className="db-card-name">{project.name}</strong>
              <button type="button" className="db-open-btn" onClick={() => onOpenProject(project.id)}>
                Open Project →
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
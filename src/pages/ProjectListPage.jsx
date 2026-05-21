import { useMemo, useState } from 'react'

const statusLabel = {
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
  none: 'Request Access',
}

export default function ProjectListPage({
  projects,
  isAdmin,
  accessByProject,
  onOpenProject,
  onCreateProject,
  onDeleteProject,
  onRequestAccess,
}) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () => projects.filter((project) => project.name.toLowerCase().includes(search.toLowerCase())),
    [projects, search],
  )

  return (
    <section className="panel">
      <h2>Projects</h2>
      <input
        className="search-input"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search projects by name"
      />

      {isAdmin ? (
        <form className="inline-form" onSubmit={onCreateProject}>
          <input name="projectName" placeholder="New project name" required />
          <button type="submit">Create project</button>
        </form>
      ) : null}

      <div className="db-grid">
        {filtered.map((project) => {
          const status = accessByProject[project.id] || 'none'
          const canOpen = isAdmin || status === 'approved'

          return (
            <div key={project.id} className="db-project-card">
              <div className="db-card-bar" />
              <div className="db-card-body">
                <strong className="db-card-name">{project.name}</strong>
                {!isAdmin ? <span className={`badge badge-${status}`}>{statusLabel[status]}</span> : null}
                <div className="row-actions">
                  <button type="button" className="db-open-btn" disabled={!canOpen} onClick={() => onOpenProject(project.id)}>
                    Enter task manager
                  </button>
                  {!isAdmin && status !== 'approved' ? (
                    <button type="button" className="db-open-btn" onClick={() => onRequestAccess(project.id)}>
                      {status === 'pending' ? 'Requested' : 'Request Access'}
                    </button>
                  ) : null}
                  {isAdmin ? (
                    <button type="button" className="db-open-btn danger" onClick={() => onDeleteProject(project.id)}>
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

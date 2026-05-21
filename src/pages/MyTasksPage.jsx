export default function MyTasksPage({ tasks, userMap, projectMap, onOpenProject }) {
  return (
    <section className="panel">
      <h2>My Tasks</h2>
      <p className="muted-line">Cross-project tasks assigned to you.</p>
      <div className="db-grid">
        {tasks.map((task) => (
          <div key={task.id} className="db-project-card">
            <div className="db-card-bar" />
            <div className="db-card-body">
                <div className="db-card-name">{task.title}</div>
                <div className="muted-line">{task.description}</div>

                <div style={{ display: 'grid', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <div><strong>Project:</strong> {projectMap[task.projectId]}</div>
                  <div><strong>Status:</strong> {task.status}</div>
                  <div><strong>Due:</strong> {task.dueDate || '—'}</div>
                  <div><strong>Assignee:</strong> {userMap[task.assigneeId]}</div>
                </div>

                <div className="row-actions" style={{ marginTop: '0.8rem' }}>
                  <button type="button" className="db-open-btn" onClick={() => onOpenProject(task.projectId)}>
                    Open Project →
                  </button>
                </div>
              </div>
          </div>
        ))}
      </div>
    </section>
  )
}

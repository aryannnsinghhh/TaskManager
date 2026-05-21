import { useEffect } from 'react'

export default function AccessRequestsPage({ groupedRequests, onDecision, onLoad }) {
  useEffect(() => {
    onLoad?.()
  }, [])

  return (
    <section className="panel">
      <h2>Project Access Requests</h2>
      {groupedRequests.length === 0 ? <p className="muted-line">No pending requests.</p> : null}

      <div className="db-grid">
        {groupedRequests.map((group) => (
          <div key={group.projectId} className="db-project-card">
            <div className="db-card-bar" />
            <div className="db-card-body">
              <strong className="db-card-name">{group.projectName}</strong>
              {group.requests.map((request) => (
                <div key={request.userId} className="request-row">
                  <span>{request.userName} ({request.userEmail})</span>
                  <div className="row-actions">
                    <button type="button" className="db-open-btn" onClick={() => onDecision(group.projectId, request.userId, 'approved')}>
                      Approve
                    </button>
                    <button type="button" className="db-open-btn danger" onClick={() => onDecision(group.projectId, request.userId, 'rejected')}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
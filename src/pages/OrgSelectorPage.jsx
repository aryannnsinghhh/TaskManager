export default function OrgSelectorPage({ organizations, currentRoleByOrg, onSelectOrg, canInvite, onInvite }) {
  return (
    <section className="panel">
      <h2>Select Organisation</h2>
      <div className="list-grid">
        {organizations.map((org) => (
          <button key={org.id} className="list-card" type="button" onClick={() => onSelectOrg(org.id)}>
            <strong>{org.name}</strong>
            <span>Role: {currentRoleByOrg[org.id]}</span>
          </button>
        ))}
      </div>

      {canInvite ? (
        <form className="inline-form" onSubmit={onInvite}>
          <input name="inviteEmail" type="email" placeholder="Invite user by email" required />
          <button type="submit">Invite to organisation</button>
        </form>
      ) : null}
    </section>
  )
}

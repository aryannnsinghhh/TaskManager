export default function WorkspaceSetupPage({ onCreateOrg, onJoinByLink }) {
  return (
    <section className="panel">
      <h2>Welcome</h2>
      <p className="muted-line">You are not in any organisation yet. Create one or join via invite link.</p>

      <div className="setup-grid">
        <form className="list-card static" onSubmit={onCreateOrg}>
          <strong>Create an Organisation</strong>
          <input name="orgName" placeholder="Organisation name" required />
          <button type="submit">Create organisation</button>
        </form>

        <form className="list-card static" onSubmit={onJoinByLink}>
          <strong>Join via Invite Link</strong>
          <input name="inviteLink" placeholder="Paste invite code or full link" required />
          <button type="submit">Join organisation</button>
        </form>
      </div>
    </section>
  )
}

import { Link } from 'react-router-dom'

const stats = [
  { value: '10k+', label: 'Teams onboarded' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '< 2min', label: 'Avg. setup time' },
  { value: '4.9★', label: 'User rating' },
]

const features = [
  {
    tag: 'Access Control',
    title: 'Organisation-scoped roles that actually make sense',
    text: 'Be admin in one organisation, member in another. Permissions are workspace-local — never bleed across teams.',
    accent: '#4f46e5',
    bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
    border: '#c7d2fe',
  },
  {
    tag: 'Project Gates',
    title: 'Request → Review → Approve pipeline',
    text: 'Members request access, admins approve or reject. Full visibility at every step, zero ambiguity.',
    accent: '#7c3aed',
    bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
    border: '#ddd6fe',
  },
  {
    tag: 'Task Safety',
    title: 'Only approved members get assigned',
    text: 'Tasks can only be assigned to people with approved project access. No accidental data exposure.',
    accent: '#0891b2',
    bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
    border: '#a5f3fc',
  },
]

const flow = [
  { n: '01', title: 'Create account', desc: 'Sign up in seconds, land on your organisation.' },
  { n: '02', title: 'Create or join an organisation', desc: 'Start fresh or paste an invite link.' },
  { n: '03', title: 'Request project access', desc: 'Members request, admins approve.' },
  { n: '04', title: 'Ship work', desc: 'Open the board, drag tasks, get things done.' },
]

export default function LandingPage({ isLoggedIn, hasOrgs }) {
  return (
    <main className="lp-shell">

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-copy">
          <h1 className="lp-headline">
            The task manager<br />
            <span className="lp-headline-gradient">built for real teams.</span>
          </h1>
          <p className="lp-subtext">
            Multi-organisation workspaces, role-based access, project approval pipelines —
            everything your team needs without the enterprise price tag.
          </p>
          <div className="lp-cta-row">
            <Link className="lp-btn-primary" to="/auth">Get started free</Link>
            {isLoggedIn
              ? <Link className="lp-btn-ghost" to={hasOrgs ? '/org/dashboard' : '/welcome'}>Continue workspace →</Link>
              : <Link className="lp-btn-ghost" to="/auth">Sign in →</Link>
            }
          </div>
        </div>

        <div className="lp-hero-visual">
          <div className="lp-mockup">
            <div className="lp-mockup-bar">
              <span className="lp-dot lp-dot-red" />
              <span className="lp-dot lp-dot-yellow" />
              <span className="lp-dot lp-dot-green" />
              <span className="lp-mockup-title">TeamTaskManager — PixelForge Studio</span>
            </div>

            <div className="lp-mockup-body">
              <div className="lp-mockup-col">
                <p className="lp-col-label">To Do</p>
                <div className="lp-task-chip lp-chip-high">Design system audit <span>High</span></div>
                <div className="lp-task-chip lp-chip-med">Update onboarding flow <span>Med</span></div>
              </div>
              <div className="lp-mockup-col">
                <p className="lp-col-label">In Progress</p>
                <div className="lp-task-chip lp-chip-high">API rate limiting <span>High</span></div>
                <div className="lp-task-chip lp-chip-low">Write release notes <span>Low</span></div>
              </div>
              <div className="lp-mockup-col">
                <p className="lp-col-label">Done</p>
                <div className="lp-task-chip lp-chip-done">Auth flow redesign <span>✓</span></div>
                <div className="lp-task-chip lp-chip-done">DB migrations <span>✓</span></div>
              </div>
            </div>

            <div className="lp-mockup-footer">
              <span className="lp-avatar">JD</span>
              <span className="lp-avatar lp-av2">AK</span>
              <span className="lp-avatar lp-av3">NR</span>
              <span className="lp-member-count">3 members active</span>
              <span className="lp-live-dot" />
            </div>
          </div>

          <div className="lp-glow" />
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="lp-stats-bar">
        {stats.map((s) => (
          <div key={s.label} className="lp-stat">
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── FEATURES ── */}
      <section className="lp-features">
        {features.map((f) => (
          <article
            key={f.title}
            className="lp-feature-card"
            style={{ background: f.bg, borderColor: f.border }}
          >
            <span className="lp-feature-tag" style={{ color: f.accent, background: `${f.accent}18`, borderColor: `${f.accent}30` }}>{f.tag}</span>
            <h3 className="lp-feature-title" style={{ color: f.accent }}>{f.title}</h3>
            <p className="lp-feature-text">{f.text}</p>
          </article>
        ))}
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-flow">
        <p className="lp-section-eyebrow">How it works</p>
        <h2 className="lp-section-title">Up and running in minutes</h2>
        <div className="lp-flow-steps">
          {flow.map((step, i) => (
            <div key={step.n} className="lp-step">
              <span className="lp-step-num">{step.n}</span>
              {i < flow.length - 1 && <span className="lp-step-line" />}
              <strong>{step.title}</strong>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </main>
  )
}

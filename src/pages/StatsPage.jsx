import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from 'recharts'

const pieColors = ['#2f9e89', '#d97706']

export default function StatsPage({ stats }) {
  return (
    <section className="stats-grid">
      <article className="stat-card tall">
        <h3>Completion Ratio</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={stats.pieData} dataKey="value" nameKey="name" outerRadius={90}>
              {stats.pieData.map((entry, index) => (
                <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </article>

      <article className="stat-card">
        <h3>Overdue vs Upcoming</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats.barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="overdue" fill="#e11d48" />
            <Bar dataKey="upcoming" fill="#0f766e" />
          </BarChart>
        </ResponsiveContainer>
      </article>

      <article className="stat-card wide">
        <h3>Tasks Created Over Time</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={stats.lineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#0f766e" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </article>
    </section>
  )
}

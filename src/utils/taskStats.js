const toMonthLabel = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', { month: 'short' })
}

export function buildStats(tasks) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const completed = tasks.filter((task) => task.status === 'done').length
  const active = tasks.length - completed
  const overdue = tasks.filter(
    (task) => task.status !== 'done' && new Date(task.dueDate) < today,
  ).length
  const upcoming = tasks.filter(
    (task) => task.status !== 'done' && new Date(task.dueDate) >= today,
  ).length

  const pieData = [
    { name: 'Completed', value: completed || 0 },
    { name: 'Active', value: active || 0 },
  ]

  const barData = [{ name: 'Tasks', overdue, upcoming }]

  const monthMap = tasks.reduce((acc, task) => {
    const key = toMonthLabel(task.createdAt)
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const lineData = Object.entries(monthMap).map(([month, count]) => ({
    month,
    count,
  }))

  return { pieData, barData, lineData, completed, active, overdue, upcoming }
}

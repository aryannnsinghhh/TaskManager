export const seedTasks = [
  {
    id: 't1',
    title: 'Draft onboarding checklist',
    description: 'Outline first-session flow for new team members.',
    status: 'todo',
    priority: 'High',
    dueDate: '2026-05-22',
    createdAt: '2026-05-18',
  },
  {
    id: 't2',
    title: 'Refine mobile nav states',
    description: 'Adjust spacing and active states for tab links.',
    status: 'inprogress',
    priority: 'Medium',
    dueDate: '2026-05-24',
    createdAt: '2026-05-15',
  },
  {
    id: 't3',
    title: 'Prepare sprint demo notes',
    description: 'Capture outcomes and blockers for Friday demo.',
    status: 'done',
    priority: 'Low',
    dueDate: '2026-05-19',
    createdAt: '2026-05-12',
  },
  {
    id: 't4',
    title: 'Create billing settings screen',
    description: 'Build account billing form and validation states.',
    status: 'todo',
    priority: 'High',
    dueDate: '2026-05-27',
    createdAt: '2026-05-19',
  },
  {
    id: 't5',
    title: 'QA due date reminders',
    description: 'Verify reminder badge logic for overdue tasks.',
    status: 'inprogress',
    priority: 'Medium',
    dueDate: '2026-05-20',
    createdAt: '2026-05-16',
  },
]

export const statusOrder = ['todo', 'inprogress', 'done']

export const statusLabels = {
  todo: 'To Do',
  inprogress: 'In Progress',
  done: 'Done',
}

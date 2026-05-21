import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const priorityConfig = {
  High:   { cls: 'tc-high',   label: 'High' },
  Medium: { cls: 'tc-med',    label: 'Med' },
  Low:    { cls: 'tc-low',    label: 'Low' },
}

const initials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

export default function TaskCard({ task, canDrag, canDelete, canReassign, assignees, onReassign, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !canDrag,
    data: { type: 'task', task },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserDrag: 'none',
  }
  const p = priorityConfig[task.priority] || priorityConfig.Medium

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`tc-card ${isDragging ? 'tc-dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="tc-top">
        <span className={`tc-priority ${p.cls}`}>{p.label}</span>
        <span className="tc-date">Due {task.dueDate}</span>
      </div>

      <p className="tc-title">{task.title}</p>
      {task.description && <p className="tc-desc">{task.description}</p>}

      <div className="tc-bottom">
        {canReassign ? (
          <select className="tc-reassign" value={task.assigneeId} onChange={(e) => onReassign(task.id, e.target.value)}>
            {assignees.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        ) : (
          <span className="tc-assignee-name" title={task.assigneeName}>{task.assigneeName}</span>
        )}
        {canDelete && (
          <button type="button" className="tc-delete" onClick={() => onDelete(task.id)}>✕</button>
        )}
      </div>
    </article>
  )
}

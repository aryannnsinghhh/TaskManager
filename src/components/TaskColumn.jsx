import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'

const colAccent = {
  todo:       '#4f46e5',
  inprogress: '#0891b2',
  done:       '#059669',
}

export default function TaskColumn({ status, title, tasks, canDragTask, canDelete, canReassign, assignees, onReassign, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: 'column', status } })
  const accent = colAccent[status] || '#4f46e5'

  return (
    <section ref={setNodeRef} className={`tc-column ${isOver ? 'tc-column-over' : ''}`}>
      <header className="tc-col-header">
        <div className="tc-col-label-row">
          <span className="tc-col-dot" style={{ background: accent }} />
          <h3 className="tc-col-title">{title}</h3>
        </div>
        <span className="tc-col-count" style={{ background: `${accent}18`, color: accent }}>{tasks.length}</span>
      </header>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="tc-stack">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              canDrag={canDragTask(task)}
              canDelete={canDelete}
              canReassign={canReassign}
              assignees={assignees}
              onReassign={onReassign}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </section>
  )
}

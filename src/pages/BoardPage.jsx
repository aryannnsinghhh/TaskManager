import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useState } from 'react'
import AddTaskForm from '../components/AddTaskForm'
import TaskColumn from '../components/TaskColumn'
import { statusLabels, statusOrder } from '../data/workflow'

const createTaskByStatus = (tasks) =>
  statusOrder.reduce((acc, status) => {
    acc[status] = tasks.filter((task) => task.status === status)
    return acc
  }, {})

export default function BoardPage({
  tasks,
  assignees,
  userMap,
  onAddTask,
  onReorderTasks,
  onReassignTask,
  onDeleteTask,
  isAdmin,
  currentUserId,
  inviteCode,
}) {
  const [activeTaskId, setActiveTaskId] = useState(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const byStatus = createTaskByStatus(tasks)
  const activeTask = tasks.find((task) => task.id === activeTaskId) ?? null

  const canDragTask = (task) => isAdmin || task.assigneeId === currentUserId

  const handleDragStart = ({ active }) => {
    const task = tasks.find((item) => item.id === active.id)
    if (task && canDragTask(task)) setActiveTaskId(active.id)
  }

  const handleDragCancel = () => setActiveTaskId(null)

  const handleDragEnd = ({ active, over }) => {
    setActiveTaskId(null)
    if (!over || active.id === over.id) return
    const activeTaskRef = tasks.find((task) => task.id === active.id)
    if (!activeTaskRef || !canDragTask(activeTaskRef)) return
    const overTask = tasks.find((task) => task.id === over.id)
    const nextStatus = overTask ? overTask.status : over.id
    const inSameStatus = activeTaskRef.status === nextStatus
    if (inSameStatus && overTask) {
      const list = byStatus[activeTaskRef.status]
      const oldIndex = list.findIndex((task) => task.id === active.id)
      const newIndex = list.findIndex((task) => task.id === over.id)
      const moved = arrayMove(list, oldIndex, newIndex)
      const merged = tasks.filter((task) => task.status !== activeTaskRef.status).concat(moved)
      onReorderTasks(merged)
      return
    }
    const movedTask = { ...activeTaskRef, status: nextStatus }
    const updated = tasks.map((task) => (task.id === active.id ? movedTask : task))
    onReorderTasks(updated)
  }

  return (
    <>
      <AddTaskForm
        onAddTask={onAddTask}
        assignees={assignees}
        defaultAssigneeId={currentUserId}
        inviteCode={isAdmin ? inviteCode : null}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <section className="board-grid">
          {statusOrder.map((status) => (
            <TaskColumn
              key={status}
              status={status}
              title={statusLabels[status]}
              tasks={byStatus[status].map((task) => ({ ...task, assigneeName: userMap[task.assigneeId] }))}
              canDragTask={canDragTask}
              canDelete={isAdmin}
              canReassign={isAdmin}
              assignees={assignees}
              onReassign={onReassignTask}
              onDelete={onDeleteTask}
            />
          ))}
        </section>
        <DragOverlay>
          {activeTask ? (
            <article className="tc-card tc-overlay">
              <div className="tc-top">
                <span className={`tc-priority ${{ High: 'tc-high', Medium: 'tc-med', Low: 'tc-low' }[activeTask.priority] || 'tc-med'}`}>
                  {{ High: 'High', Medium: 'Med', Low: 'Low' }[activeTask.priority]}
                </span>
                <span className="tc-date">Due {activeTask.dueDate}</span>
              </div>
              <p className="tc-title">{activeTask.title}</p>
              {activeTask.description && <p className="tc-desc">{activeTask.description}</p>}
              <div className="tc-bottom">
                <span className="tc-avatar">
                  {(userMap[activeTask.assigneeId] || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
            </article>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  )
}
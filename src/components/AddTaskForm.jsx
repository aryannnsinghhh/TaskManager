import { useEffect, useState } from 'react'

export default function AddTaskForm({ onAddTask, assignees, defaultAssigneeId, inviteCode }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState(defaultAssigneeId ?? '')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setAssigneeId(defaultAssigneeId ?? assignees[0]?.id ?? '')
  }, [defaultAssigneeId, assignees])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!title.trim() || !assigneeId) return
    onAddTask({
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate: dueDate || new Date().toISOString().slice(0, 10),
      assigneeId,
    })
    setTitle('')
    setDescription('')
    setPriority('Medium')
    setDueDate('')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {inviteCode && (
        <div className="invite-code-bar">
          <span className="invite-code-label">Project invite code:</span>
          <code className="invite-code-value">{inviteCode}</code>
          <button type="button" className="invite-code-copy" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      <form className="add-task-form" onSubmit={handleSubmit}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a new task" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Task description" />
        <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
          {assignees.map((member) => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option>High</option><option>Medium</option><option>Low</option>
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <button type="submit">Add</button>
      </form>
    </>
  )
}
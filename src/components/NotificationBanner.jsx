import { useEffect } from 'react'

export default function NotificationBanner({ notifications, onDismiss }) {
  useEffect(() => {
    if (notifications.length === 0) return
    const timer = setTimeout(() => {
      onDismiss(notifications[0].id)
    }, 6000)
    return () => clearTimeout(timer)
  }, [notifications, onDismiss])

  if (notifications.length === 0) return null

  return (
    <div className="notif-stack">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`notif-banner notif-${n.kind}`}
          onClick={() => onDismiss(n.id)}
        >
          {n.message}
        </div>
      ))}
    </div>
  )
}
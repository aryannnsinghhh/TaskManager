import { useEffect, useRef, useCallback } from 'react'
import { getToken } from '../api/client'

const WS_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/^http/, 'ws').replace('/api', '')
  : 'ws://localhost:8000'

const MAX_BACKOFF_MS = 30_000

export function useProjectSocket(projectId, onEvent) {
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)
  const attemptRef = useRef(0)
  const closedIntentionally = useRef(false)

  // onEvent will be a new function reference on every render of the caller.
  // We store it in a ref so the WebSocket callback always calls the latest
  // version without needing to re-open the connection.
  const onEventRef = useRef(onEvent)
  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  const connect = useCallback(() => {
    if (!projectId) return

    const token = getToken()
    if (!token) return

    const url = `${WS_BASE}/ws/project/${projectId}?t=${token}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      // connection established — reset backoff counter
      attemptRef.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data)
        onEventRef.current(parsed)
      } catch {
        // malformed message — ignore
      }
    }

    ws.onclose = (event) => {
      // 4001 = unauthorized — don't retry, token is bad
      if (event.code === 4001) return
      // intentional close (navigating away) — don't retry
      if (closedIntentionally.current) return

      // otherwise schedule a reconnect with exponential backoff
      const delay = Math.min(1000 * 2 ** attemptRef.current, MAX_BACKOFF_MS)
      attemptRef.current += 1
      reconnectTimer.current = setTimeout(connect, delay)
    }

    ws.onerror = () => {
      // onerror always fires before onclose — let onclose handle the retry
      // we just swallow the error here to avoid console noise
    }
  }, [projectId])

  useEffect(() => {
    closedIntentionally.current = false
    connect()

    return () => {
      // cleanup: close connection when component unmounts (user leaves board)
      closedIntentionally.current = true
      clearTimeout(reconnectTimer.current)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])
}
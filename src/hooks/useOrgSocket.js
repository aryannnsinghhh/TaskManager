import { useEffect, useRef, useCallback } from 'react'
import { getToken } from '../api/client'

const WS_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/^http/, 'ws').replace('/api', '')
  : 'ws://localhost:8000'

const MAX_BACKOFF_MS = 30_000

export function useOrgSocket(orgId, onEvent) {
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)
  const attemptRef = useRef(0)
  const closedIntentionally = useRef(false)

  const onEventRef = useRef(onEvent)
  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  const connect = useCallback(() => {
    if (!orgId) return
    const token = getToken()
    if (!token) return

    const url = `${WS_BASE}/ws/org/${orgId}?t=${token}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      attemptRef.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data)
        onEventRef.current(parsed)
      } catch {
        // ignore malformed
      }
    }

    ws.onclose = (event) => {
      if (event.code === 4001) return
      if (closedIntentionally.current) return
      const delay = Math.min(1000 * 2 ** attemptRef.current, MAX_BACKOFF_MS)
      attemptRef.current += 1
      reconnectTimer.current = setTimeout(connect, delay)
    }

    ws.onerror = () => {}
  }, [orgId])

  useEffect(() => {
    closedIntentionally.current = false
    connect()
    return () => {
      closedIntentionally.current = true
      clearTimeout(reconnectTimer.current)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])
}
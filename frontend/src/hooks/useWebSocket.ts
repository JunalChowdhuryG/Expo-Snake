"use client"

import { useEffect, useRef, useCallback, useState } from "react"

interface Message {
  action: string
  [key: string]: any
}

export function useWebSocket(url: string, onMessage: (message: Message) => void) {
  const ws = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const onMessageRef = useRef(onMessage)
  
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    try {
      ws.current = new WebSocket(url)

      ws.current.onopen = () => {
        console.log("[v0] WebSocket conectado")
        setIsConnected(true)
      }

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log("[v0] Mensaje recibido:", message)
          onMessageRef.current(message)
        } catch (error) {
          console.error("[v0] Error parseando mensaje:", error)
        }
      }

      ws.current.onerror = (error) => {
        console.error("[v0] Error WebSocket:", error)
        setIsConnected(false)
      }

      ws.current.onclose = () => {
        console.log("[v0] WebSocket desconectado")
        setIsConnected(false)
      }
    } catch (error) {
      console.error("[v0] Error conectando WebSocket:", error)
      setIsConnected(false)
    }

    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [url])

  const sendMessage = useCallback((message: Message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log("[v0] Enviando mensaje:", message)
      ws.current.send(JSON.stringify(message))
    } else {
      console.warn("[v0] WebSocket no está conectado")
    }
  }, [])

  return { sendMessage, isConnected }
}

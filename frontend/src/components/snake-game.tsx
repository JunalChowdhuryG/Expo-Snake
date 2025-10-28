"use client"

import { useState, useEffect, useRef } from "react"
import { useWebSocket } from "../hooks/useWebSocket"

interface GameObject {
  x: number
  y: number
  width: number
  height: number
  type: string
  playerId: number
  color?: string
  health?: number
}

export default function SnakePeludo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameObjects, setGameObjects] = useState<GameObject[]>([])
  const [playerScores, setPlayerScores] = useState<Record<number, number>>({})
  const [playerNames, setPlayerNames] = useState<Record<number, string>>({})
  const [gameOver, setGameOver] = useState(false)
  const [gameInProgress, setGameInProgress] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("Conectando...")
  const [myScore, setMyScore] = useState(0)
  const [myPlayerId, setMyPlayerId] = useState<number | null>(null)

  const hasSentJoin = useRef(false)
  const gameStartedTriggered = useRef(false)

  const { sendMessage, isConnected } = useWebSocket("ws://localhost:12345", (message) => {
    if (message.action === "PLAYER_ID") {
      setMyPlayerId(message.playerId)
      if (!gameStartedTriggered.current) {
        gameStartedTriggered.current = true
        sendMessage({ action: "START_GAME" })
      }
    } else if (message.action === "UPDATE_STATE") {
      setGameObjects(message.objects || [])
      setGameOver(message.gameOver || false)
      setGameInProgress(message.gameInProgress || false)
      setPlayerScores(message.playerScores || {})
      setPlayerNames(message.playerNames || {})
      if (myPlayerId !== null) {
        setMyScore(message.playerScores?.[myPlayerId] || 0)
      }
    }
  })

  // --- UNIÓN AL JUEGO ---
  useEffect(() => {
    if (isConnected && !hasSentJoin.current) {
      setConnectionStatus("Conectado")
      hasSentJoin.current = true
      sendMessage({
        action: "JOIN_GAME",
        playerName: "Peludo"
      })
    } else if (!isConnected) {
      setConnectionStatus("Desconectado")
      hasSentJoin.current = false
      gameStartedTriggered.current = false
    }
  }, [isConnected, sendMessage])

  // --- CONTROLES ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " ") {
        setIsPaused(p => !p)
        e.preventDefault()
        return
      }

      if (gameOver && e.key === "Enter") {
        sendMessage({ action: "RESTART_GAME" })
        return
      }

      if (!gameInProgress || gameOver || isPaused) return

      let direction: string | null = null
      switch (e.key.toLowerCase()) {
        case "arrowleft":
        case "a":
          direction = "LEFT"
          break
        case "arrowright":
        case "d":
          direction = "RIGHT"
          break
        case "arrowup":
        case "w":
          direction = "UP"
          break
        case "arrowdown":
        case "s":
          direction = "DOWN"
          break
      }

      if (direction) {
        e.preventDefault()
        sendMessage({
          action: "PLAYER_INPUT",
          input: direction
        })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameInProgress, gameOver, isPaused, sendMessage])

  // --- RENDERIZADO (TU ESTILO ORIGINAL) ---
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Fondo
    const gradient = ctx.createLinearGradient(0, 0, 800, 600)
    gradient.addColorStop(0, "#0a2e0a")
    gradient.addColorStop(1, "#0a1a0a")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 800, 600)

    // Grid sutil
    ctx.strokeStyle = "rgba(0, 100, 0, 0.2)"
    ctx.lineWidth = 1
    for (let i = 0; i < 800; i += 50) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, 600)
      ctx.stroke()
    }
    for (let i = 0; i < 600; i += 50) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(800, i)
      ctx.stroke()
    }

    // Dibujar objetos del backend
    gameObjects.forEach(obj => {
      if (obj.type === "SNAKE_HEAD" || obj.type === "SNAKE_BODY") {
        const isMySnake = obj.playerId === myPlayerId
        const baseColor = parseColor(obj.color || "GREEN")
        const bright = adjustBrightness(baseColor, 30)
        const dark = adjustBrightness(baseColor, -30)

        // Cuerpo peludo
        const grad = ctx.createLinearGradient(obj.x, obj.y, obj.x + 16, obj.y + 16)
        grad.addColorStop(0, bright)
        grad.addColorStop(1, dark)
        ctx.fillStyle = grad
        ctx.fillRect(obj.x, obj.y, 16, 16)

        // Pelitos
        ctx.strokeStyle = dark
        ctx.lineWidth = 1
        for (let i = 0; i < 15; i++) {
          const px = obj.x + Math.random() * 16
          const py = obj.y + Math.random() * 16
          const angle = Math.random() * Math.PI * 2
          ctx.beginPath()
          ctx.moveTo(px, py)
          ctx.lineTo(px + Math.cos(angle) * 4, py + Math.sin(angle) * 4)
          ctx.stroke()
        }

        if (obj.type === "SNAKE_HEAD") {
          // Ojos
          ctx.fillStyle = "#ffffff"
          ctx.beginPath()
          ctx.arc(obj.x + 4, obj.y + 4, 3, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(obj.x + 12, obj.y + 4, 3, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = "#000000"
          ctx.beginPath()
          ctx.arc(obj.x + 4, obj.y + 4, 1.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(obj.x + 12, obj.y + 4, 1.5, 0, Math.PI * 2)
          ctx.fill()

          // Boca
          ctx.strokeStyle = "#ef4444"
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(obj.x + 3, obj.y + 12)
          ctx.quadraticCurveTo(obj.x + 8, obj.y + 14, obj.x + 13, obj.y + 12)
          ctx.stroke()

          // Brillo si es mi serpiente
          if (isMySnake) {
            ctx.shadowBlur = 15
            ctx.shadowColor = "#22c55e"
          }
        }
      }

      if (obj.type === "FRUIT") {
        ctx.shadowBlur = 15
        ctx.shadowColor = "rgba(239,68,68,0.6)"
        ctx.fillStyle = "#ef4444"
        ctx.beginPath()
        ctx.arc(obj.x + 8, obj.y + 8, 10, 0, Math.PI * 2)
        ctx.fill()

        ctx.shadowBlur = 0
        const grad = ctx.createRadialGradient(obj.x + 4, obj.y + 4, 0, obj.x + 8, obj.y + 8, 10)
        grad.addColorStop(0, 'rgba(255,255,255,0.8)')
        grad.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(obj.x + 8, obj.y + 8, 10, 0, Math.PI * 2)
        ctx.fill()

        // Tallo
        ctx.fillStyle = '#84cc16'
        ctx.fillRect(obj.x + 6, obj.y - 4, 4, 8)

        // Valor
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 12px Arial'
        const value = obj.health?.toString() || '1'
        const metrics = ctx.measureText(value)
        ctx.fillText(value, obj.x + (16 - metrics.width) / 2, obj.y + 11)
      }

      if (obj.type === "WALL") {
        ctx.fillStyle = "#666666"
        ctx.fillRect(obj.x, obj.y, 16, 16)
      }
    })

    ctx.shadowBlur = 0
  }, [gameObjects, myPlayerId])

  const parseColor = (colorName: string) => {
    const colors: Record<string, string> = {
      CYAN: "#06b6d4",
      MAGENTA: "#d946ef",
      YELLOW: "#eab308",
      ORANGE: "#f97316",
      PINK: "#ec4899",
      GREEN: "#22c55e",
      BLUE: "#3b82f6",
      RED: "#ef4444",
      WHITE: "#ffffff"
    }
    return colors[colorName.toUpperCase()] || "#22c55e"
  }

  const adjustBrightness = (hex: string, percent: number): string => {
    hex = hex.replace(/^#/, '')
    let r = parseInt(hex.substring(0, 2), 16)
    let g = parseInt(hex.substring(2, 4), 16)
    let b = parseInt(hex.substring(4, 6), 16)

    r = Math.min(255, Math.max(0, r + (r * percent / 100)))
    g = Math.min(255, Math.max(0, g + (g * percent / 100)))
    b = Math.min(255, Math.max(0, b + (b * percent / 100)))

    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-green-900 to-teal-950 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-400">
              Snacke Game
            </h1>
            <p className="text-green-400/70 text-sm mt-1">Usa ← → / A D para girar. ↑ ↓ / W S para subir/bajar.</p>
            <p className="text-xs text-gray-400 mt-1">
              Estado: <span className={isConnected ? "text-green-500" : "text-red-500"}>{connectionStatus}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black text-green-300">{myScore}</div>
            <div className="text-xs text-green-400/70">PUNTOS</div>
          </div>
        </div>

        {/* Canvas */}
        <div className="relative bg-gradient-to-br from-green-950/60 to-emerald-950/60 backdrop-blur-xl border-2 border-green-500/30 rounded-2xl p-4 shadow-2xl">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full rounded-lg shadow-inner"
            style={{ imageRendering: 'crisp-edges' }}
          />

          {/* Overlays */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
              <div className="text-center space-y-4">
                <div className="text-6xl font-black text-red-400">¡GAME OVER!</div>
                <div className="text-3xl text-green-300">Puntuación: {myScore}</div>
                <button
                  onClick={() => sendMessage({ action: "RESTART_GAME" })}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-xl rounded-xl shadow-lg hover:scale-105 transition-transform"
                >
                  Jugar de Nuevo
                </button>
              </div>
            </div>
          )}

          {isPaused && !gameOver && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
              <div className="text-6xl font-black text-green-300">PAUSADO</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
"use client"

import { useState, useEffect, useRef } from "react"
import { useWebSocket } from "../hooks/useWebSocket"

interface SnakeGameProps {
  player: { id: string; name: string }
  onBack: () => void
}

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

const TILE_SIZE = 16
const ROWS = 40
const COLUMNS = 40
const BOARD_WIDTH = TILE_SIZE * COLUMNS
const BOARD_HEIGHT = TILE_SIZE * ROWS

export default function SnakeGame({ player, onBack }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameObjects, setGameObjects] = useState<GameObject[]>([])
  const [playerScores, setPlayerScores] = useState<Record<number, number>>({})
  const [gameOver, setGameOver] = useState(false)
  const [gameInProgress, setGameInProgress] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("Conectando...")
  const [myScore, setMyScore] = useState(0)

  const { sendMessage, isConnected } = useWebSocket("ws://localhost:12345", (message) => {
    if (message.action === "PLAYER_ID") {
      console.log("[v0] Recibido ID del jugador:", message.playerId)
    } else if (message.action === "UPDATE_STATE") {
      setGameObjects(message.objects || [])
      setGameOver(message.gameOver || false)
      setGameInProgress(message.gameInProgress || false)
      setPlayerScores(message.playerScores || {})

      // Actualizar mi puntuación
      const myPlayerId = Number.parseInt(player.id.split("-")[1] || "0")
      setMyScore(message.playerScores?.[myPlayerId] || 0)
    }
  })

  // Unirse al juego cuando se conecte
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus("Conectado")
      sendMessage({
        action: "JOIN_GAME",
        playerName: player.name,
      })
    } else {
      setConnectionStatus("Desconectado")
    }
  }, [isConnected, player.name, sendMessage])

  // Iniciar el juego
  const handleStartGame = () => {
    sendMessage({
      action: "START_GAME",
    })
  }

  // Reiniciar el juego
  const handleRestart = () => {
    sendMessage({
      action: "RESTART_GAME",
    })
  }

  // Manejar entrada del teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameInProgress || gameOver) return

      const key = e.key.toUpperCase()
      let direction: string | null = null

      if (key === "ARROWUP" || key === "W") {
        direction = "UP"
      } else if (key === "ARROWDOWN" || key === "S") {
        direction = "DOWN"
      } else if (key === "ARROWLEFT" || key === "A") {
        direction = "LEFT"
      } else if (key === "ARROWRIGHT" || key === "D") {
        direction = "RIGHT"
      }

      if (direction) {
        e.preventDefault()
        sendMessage({
          action: "PLAYER_INPUT",
          input: direction,
        })
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [gameInProgress, gameOver, sendMessage])

  // Dibujar el juego en canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Limpiar canvas
    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Dibujar grid
    ctx.strokeStyle = "#1a1a1a"
    ctx.lineWidth = 0.5
    for (let i = 0; i <= COLUMNS; i++) {
      ctx.beginPath()
      ctx.moveTo(i * TILE_SIZE, 0)
      ctx.lineTo(i * TILE_SIZE, canvas.height)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, i * TILE_SIZE)
      ctx.lineTo(canvas.width, i * TILE_SIZE)
      ctx.stroke()
    }

    // Dibujar objetos del juego
    gameObjects.forEach((obj) => {
      switch (obj.type) {
        case "SNAKE_HEAD":
          ctx.fillStyle = obj.color || "#22c55e"
          ctx.shadowColor = obj.color || "#22c55e"
          ctx.shadowBlur = 10
          ctx.fillRect(obj.x + 1, obj.y + 1, obj.width - 2, obj.height - 2)
          break

        case "SNAKE_BODY":
          ctx.fillStyle = obj.color ? adjustBrightness(obj.color, -30) : "#16a34a"
          ctx.shadowColor = "transparent"
          ctx.fillRect(obj.x + 1, obj.y + 1, obj.width - 2, obj.height - 2)
          break

        case "FRUIT":
          ctx.fillStyle = "#f97316"
          ctx.shadowColor = "#f97316"
          ctx.shadowBlur = 8
          ctx.beginPath()
          ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 2 - 2, 0, Math.PI * 2)
          ctx.fill()

          // Dibujar valor de la fruta
          ctx.fillStyle = "#ffffff"
          ctx.font = "bold 10px Arial"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(String(obj.health || 1), obj.x + obj.width / 2, obj.y + obj.height / 2)
          break

        case "WALL":
          ctx.fillStyle = "#666666"
          ctx.fillRect(obj.x, obj.y, obj.width, obj.height)
          break
      }
    })

    ctx.shadowColor = "transparent"
  }, [gameObjects])

  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-500">🐍 SNAKE GAME</h1>
            <p className="text-sm text-gray-400">{player.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">
              Estado: <span className={isConnected ? "text-green-500" : "text-red-500"}>{connectionStatus}</span>
            </p>
            <button
              onClick={onBack}
              className="mt-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg border border-gray-600 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>

        {/* Game Container */}
        <div className="bg-slate-800 border-2 border-green-500/30 rounded-xl p-6 mb-6 shadow-xl">
          <div className="flex gap-6">
            {/* Canvas */}
            <div className="flex-1">
              <canvas
                ref={canvasRef}
                width={BOARD_WIDTH}
                height={BOARD_HEIGHT}
                className="w-full border-2 border-green-500/50 rounded-lg bg-black"
              />
            </div>

            {/* Stats Sidebar */}
            <div className="w-40 space-y-4">
              <div className="bg-slate-700 rounded-lg p-4 text-center border border-green-500/20">
                <p className="text-xs text-gray-400 mb-1">Mi Puntuación</p>
                <p className="text-3xl font-bold text-green-500">{myScore}</p>
              </div>

              <div className="bg-slate-700 rounded-lg p-4 text-center border border-blue-500/20">
                <p className="text-xs text-gray-400 mb-1">Estado</p>
                <p className="text-sm font-bold text-blue-500">
                  {gameOver ? "GAME OVER" : gameInProgress ? "JUGANDO" : "LOBBY"}
                </p>
              </div>

              {/* Scoreboard */}
              <div className="bg-slate-700 rounded-lg p-3 border border-orange-500/20">
                <p className="text-xs text-gray-400 mb-2 font-bold">Puntuaciones</p>
                <div className="space-y-1 text-xs">
                  {Object.entries(playerScores).map(([id, score]) => (
                    <div key={id} className="flex justify-between text-gray-300">
                      <span>P{id}:</span>
                      <span className="text-orange-500 font-bold">{score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3">
          {!gameInProgress && !gameOver && (
            <button
              onClick={handleStartGame}
              className="w-full py-4 text-lg font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Iniciar Juego
            </button>
          )}

          {gameOver && (
            <div className="bg-red-900/30 border-2 border-red-500 rounded-lg p-4 text-center">
              <p className="text-red-500 font-bold text-lg">¡GAME OVER!</p>
              <p className="text-sm text-gray-300 mt-1">Puntuación final: {myScore}</p>
            </div>
          )}

          {gameOver && (
            <button
              onClick={handleRestart}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors"
            >
              Reiniciar Juego
            </button>
          )}

          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>Controles: Flechas o WASD para mover</p>
            <p>Come la comida naranja para crecer y ganar puntos</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Función auxiliar para ajustar brillo de color
function adjustBrightness(color: string, percent: number): string {
  const colorMap: Record<string, string> = {
    CYAN: "#06b6d4",
    MAGENTA: "#d946ef",
    YELLOW: "#eab308",
    ORANGE: "#ea580c",
    PINK: "#ec4899",
    GREEN: "#22c55e",
    BLUE: "#3b82f6",
    RED: "#ef4444",
    WHITE: "#ffffff",
  }
  return colorMap[color] || "#ffffff"
}

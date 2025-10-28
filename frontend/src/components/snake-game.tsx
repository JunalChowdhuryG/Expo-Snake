"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"

interface SnakeGameProps {
  player: { id: string; name: string }
  onBack: () => void
}

const GRID_SIZE = 20
const CELL_SIZE = 20

interface Position {
  x: number
  y: number
}

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"

export default function SnakeGame({ player, onBack }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }])
  const [food, setFood] = useState<Position>({ x: 15, y: 15 })
  const [direction, setDirection] = useState<Direction>("RIGHT")
  const [nextDirection, setNextDirection] = useState<Direction>("RIGHT")
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)

  // Generate random food position
  const generateFood = useCallback(() => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      }
    } while (snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }, [snake])

  // Lógica para guardar estadísticas al terminar (necesaria para el Lobby)
  useEffect(() => {
    if (gameOver && score > 0) {
      const statsKey = `player-stats-${player.id}`
      const savedStats = localStorage.getItem(statsKey)
      const currentStats = savedStats
        ? JSON.parse(savedStats)
        : { gamesPlayed: 0, highScore: 0, totalScore: 0 }

      const newStats = {
        gamesPlayed: currentStats.gamesPlayed + 1,
        highScore: Math.max(currentStats.highScore, score),
        totalScore: currentStats.totalScore + score,
      }

      localStorage.setItem(statsKey, JSON.stringify(newStats))
    }
  }, [gameOver, score, player.id])

  // Handle keyboard input (sin cambios)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase()
      if (key === "ARROWUP" || key === "W") {
        setNextDirection("UP")
        e.preventDefault()
      } else if (key === "ARROWDOWN" || key === "S") {
        setNextDirection("DOWN")
        e.preventDefault()
      } else if (key === "ARROWLEFT" || key === "A") {
        setNextDirection("LEFT")
        e.preventDefault()
      } else if (key === "ARROWRIGHT" || key === "D") {
        setNextDirection("RIGHT")
        e.preventDefault()
      } else if (key === " ") {
        setIsPaused((prev) => !prev)
        e.preventDefault()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [])

  // Handle touch controls for mobile (sin cambios)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y
    const minSwipeDistance = 30

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        setNextDirection(deltaX > 0 ? "RIGHT" : "LEFT")
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        setNextDirection(deltaY > 0 ? "DOWN" : "UP")
      }
    }

    setTouchStart(null)
  }

  // Game loop (sin cambios)
  useEffect(() => {
    if (gameOver || isPaused) return

    gameLoopRef.current = setInterval(() => {
      setSnake((prevSnake) => {
        let newDirection = nextDirection

        if (
          (newDirection === "UP" && direction === "DOWN") ||
          (newDirection === "DOWN" && direction === "UP") ||
          (newDirection === "LEFT" && direction === "RIGHT") ||
          (newDirection === "RIGHT" && direction === "LEFT")
        ) {
          newDirection = direction
        }

        setDirection(newDirection)

        const head = prevSnake[0]
        const newHead: Position = { ...head }

        switch (newDirection) {
          case "UP":
            newHead.y = (head.y - 1 + GRID_SIZE) % GRID_SIZE
            break
          case "DOWN":
            newHead.y = (head.y + 1) % GRID_SIZE
            break
          case "LEFT":
            newHead.x = (head.x - 1 + GRID_SIZE) % GRID_SIZE
            break
          case "RIGHT":
            newHead.x = (head.x + 1) % GRID_SIZE
            break
        }

        if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true)
          return prevSnake
        }

        const newSnake = [newHead, ...prevSnake]

        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((prev) => prev + 10)
          setFood(generateFood())
        } else {
          newSnake.pop()
        }

        return newSnake
      })
    }, 100)

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    }
  }, [direction, nextDirection, food, gameOver, isPaused, generateFood])

  // Draw game (Lógica de dibujo actualizada)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 1. Fondo Verde Oscuro (Requisito: Fondo Verde)
    ctx.fillStyle = "#0d3b1a" // Verde Oscuro
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 2. Dibujar cuadrícula sutil
    ctx.strokeStyle = "#1a5c2e"
    ctx.lineWidth = 0.5
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, canvas.height)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(canvas.width, i * CELL_SIZE)
      ctx.stroke()
    }

    // 3. Dibujar Serpiente
    snake.forEach((segment, index) => {
      if (index === 0) {
        // Cabeza - Verde brillante con sombra
        ctx.fillStyle = "#10b981"
        ctx.shadowColor = "#10b981"
        ctx.shadowBlur = 15
      } else {
        // Cuerpo - Verde medio
        ctx.fillStyle = "#059669"
        ctx.shadowColor = "transparent"
      }
      ctx.fillRect(segment.x * CELL_SIZE + 1, segment.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2)
    })

    // 4. Dibujar Fruta (Requisito: Agregar frutas - estilizado como fruta)
    ctx.fillStyle = "#fbbf24" // Amarillo Dorado (Color de fruta/manzana)
    ctx.shadowColor = "#fbbf24"
    ctx.shadowBlur = 12
    ctx.beginPath()
    ctx.arc(food.x * CELL_SIZE + CELL_SIZE / 2, food.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 - 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // Simular un pequeño tallo verde
    ctx.fillStyle = "#a3e635"
    ctx.fillRect(food.x * CELL_SIZE + CELL_SIZE / 2 - 1, food.y * CELL_SIZE + 2, 2, 4);

  }, [snake, food])

  const handleRestart = () => {
    setSnake([{ x: 10, y: 10 }])
    setFood(generateFood())
    setDirection("RIGHT")
    setNextDirection("RIGHT")
    setScore(0)
    setGameOver(false)
    setIsPaused(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-3 sm:p-4 md:p-6 flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-3 sm:mb-4 md:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-200">
              🐍 SNAKE GAME
            </h1>
            <p className="text-xs sm:text-sm text-emerald-300/70">{player.name}</p>
          </div>
          <Button
            onClick={onBack}
            variant="outline"
            className="border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/20 bg-green-950/60 backdrop-blur-sm text-xs sm:text-sm px-3 sm:px-4"
          >
            Volver
          </Button>
        </div>

        {/* Game Container (Aplica el estilo verde al borde del contenedor) */}
        <div className="bg-green-950/60 backdrop-blur-md border border-emerald-400/30 rounded-xl p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 md:gap-6">
            {/* Canvas */}
            <div className="flex-1">
              <canvas
                ref={canvasRef}
                width={GRID_SIZE * CELL_SIZE}
                height={GRID_SIZE * CELL_SIZE}
                // El fondo interior es verde oscuro a través de Canvas
                className="w-full max-w-full aspect-square border-2 border-emerald-500/30 rounded-lg shadow-lg"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              />
            </div>

            {/* Stats Sidebar (Con el fondo verde oscuro solicitado) */}
            <div className="flex lg:flex-col gap-3 sm:gap-4 lg:w-32">
              <div className="flex-1 lg:flex-none bg-green-900/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center border border-emerald-400/20">
                <p className="text-xs text-green-200/70 mb-1">Puntuación</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-300">{score}</p>
              </div>

              <div className="flex-1 lg:flex-none bg-green-900/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center border border-cyan-400/20">
                <p className="text-xs text-green-200/70 mb-1">Longitud</p>
                <p className="text-xl sm:text-2xl font-black text-cyan-300">{snake.length}</p>
              </div>

              <div className="flex-1 lg:flex-none bg-green-900/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center border border-yellow-400/20">
                <p className="text-xs text-green-200/70 mb-1">Estado</p>
                <p className="text-xs sm:text-sm font-bold text-yellow-300">
                  {gameOver ? "GAME OVER" : isPaused ? "PAUSADO" : "JUGANDO"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controles de Juego */}
        <div className="space-y-3">
          {gameOver && (
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/40 rounded-lg p-3 sm:p-4 text-center">
              <p className="text-red-300 font-bold text-lg sm:text-xl">¡GAME OVER!</p>
              <p className="text-sm text-red-200/70 mt-1">Puntuación final: {score}</p>
            </div>
          )}

          <div className="flex gap-2 sm:gap-3">
            <Button
              onClick={handleRestart}
              className="flex-1 py-5 sm:py-6 text-sm sm:text-base font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg shadow-lg"
            >
              {gameOver ? "🔄 Reiniciar" : "🎮 Nuevo Juego"}
            </Button>
            <Button
              onClick={() => setIsPaused(!isPaused)}
              disabled={gameOver}
              variant="outline"
              className="flex-1 py-5 sm:py-6 text-sm sm:text-base font-bold border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/20 bg-green-950/60 backdrop-blur-sm disabled:opacity-50 rounded-lg"
            >
              {isPaused ? "▶️ Reanudar" : "⏸️ Pausar"}
            </Button>
          </div>

          <div className="bg-green-950/40 backdrop-blur-sm border border-emerald-400/20 rounded-lg p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-green-100 text-center space-y-2">
              <p className="font-semibold text-emerald-300">📱 Móvil: Desliza en el canvas</p>
              <p className="font-semibold text-cyan-300">⌨️ PC: Flechas o WASD</p>
              <p className="text-green-200/70">Come la comida dorada 🟡 para crecer y ganar puntos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
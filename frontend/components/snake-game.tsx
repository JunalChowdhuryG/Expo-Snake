"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"

interface SnakeGameProps {
  player: { id: string; name: string }
  onBack: () => void
}

const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 600
const SEGMENT_SIZE = 15
const SEGMENT_SPACING = 8

interface Position {
  x: number
  y: number
}

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"

export default function SnakeGame({ player, onBack }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [snake, setSnake] = useState<Position[]>([
    { x: 300, y: 300 },
    { x: 292, y: 300 },
    { x: 284, y: 300 },
    { x: 276, y: 300 },
    { x: 268, y: 300 },
  ])
  const [food, setFood] = useState<Position>({ x: 400, y: 400 })
  const [direction, setDirection] = useState<Direction>("RIGHT")
  const [nextDirection, setNextDirection] = useState<Direction>("RIGHT")
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const speed = 3

  // Generate random food position
  const generateFood = useCallback(() => {
    return {
      x: Math.random() * (CANVAS_WIDTH - 40) + 20,
      y: Math.random() * (CANVAS_HEIGHT - 40) + 20,
    }
  }, [])

  // Guardar estadísticas
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

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase()
      if (key === "ARROWUP" || key === "W") {
        if (direction !== "DOWN") setNextDirection("UP")
        e.preventDefault()
      } else if (key === "ARROWDOWN" || key === "S") {
        if (direction !== "UP") setNextDirection("DOWN")
        e.preventDefault()
      } else if (key === "ARROWLEFT" || key === "A") {
        if (direction !== "RIGHT") setNextDirection("LEFT")
        e.preventDefault()
      } else if (key === "ARROWRIGHT" || key === "D") {
        if (direction !== "LEFT") setNextDirection("RIGHT")
        e.preventDefault()
      } else if (key === " ") {
        setIsPaused((prev) => !prev)
        e.preventDefault()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [direction])

  // Handle touch controls
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
        const newDir = deltaX > 0 ? "RIGHT" : "LEFT"
        if ((newDir === "RIGHT" && direction !== "LEFT") || (newDir === "LEFT" && direction !== "RIGHT")) {
          setNextDirection(newDir)
        }
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        const newDir = deltaY > 0 ? "DOWN" : "UP"
        if ((newDir === "DOWN" && direction !== "UP") || (newDir === "UP" && direction !== "DOWN")) {
          setNextDirection(newDir)
        }
      }
    }

    setTouchStart(null)
  }

  // Game loop
  useEffect(() => {
    if (gameOver || isPaused) return

    gameLoopRef.current = setInterval(() => {
      setSnake((prevSnake) => {
        setDirection(nextDirection)

        const head = prevSnake[0]
        let newHead: Position = { ...head }

        switch (nextDirection) {
          case "UP":
            newHead.y -= speed
            break
          case "DOWN":
            newHead.y += speed
            break
          case "LEFT":
            newHead.x -= speed
            break
          case "RIGHT":
            newHead.x += speed
            break
        }

        // Colisión con paredes
        if (newHead.x < 0 || newHead.x > CANVAS_WIDTH || newHead.y < 0 || newHead.y > CANVAS_HEIGHT) {
          setGameOver(true)
          return prevSnake
        }

        // Colisión consigo mismo
        for (let i = 3; i < prevSnake.length; i++) {
          const segment = prevSnake[i]
          const dist = Math.sqrt(Math.pow(newHead.x - segment.x, 2) + Math.pow(newHead.y - segment.y, 2))
          if (dist < SEGMENT_SIZE) {
            setGameOver(true)
            return prevSnake
          }
        }

        const newSnake = [newHead]

        // Seguir la cabeza con el resto del cuerpo
        for (let i = 0; i < prevSnake.length - 1; i++) {
          const current = prevSnake[i]
          const next = prevSnake[i + 1]

          const dx = current.x - next.x
          const dy = current.y - next.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist > SEGMENT_SPACING) {
            const ratio = SEGMENT_SPACING / dist
            newSnake.push({
              x: current.x - dx * ratio,
              y: current.y - dy * ratio,
            })
          } else {
            newSnake.push(next)
          }
        }

        // Verificar si comió la comida
        const distToFood = Math.sqrt(Math.pow(newHead.x - food.x, 2) + Math.pow(newHead.y - food.y, 2))
        if (distToFood < SEGMENT_SIZE + 5) {
          setScore((prev) => prev + 10)
          setFood(generateFood())

          // Agregar segmentos al comer
          for (let i = 0; i < 3; i++) {
            const lastSegment = newSnake[newSnake.length - 1]
            newSnake.push({ ...lastSegment })
          }
        }

        return newSnake
      })
    }, 20)

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    }
  }, [nextDirection, food, gameOver, isPaused, generateFood])

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Fondo oscuro
    ctx.fillStyle = "#0a2410"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Dibujar serpiente con círculos superpuestos para efecto fluido
    if (snake.length > 0) {
      // Primero dibujamos círculos a lo largo del camino para crear cuerpo grueso
      const drawSnakePath = (width: number, color: string, blur: number) => {
        ctx.shadowColor = color
        ctx.shadowBlur = blur
        ctx.fillStyle = color

        // Dibujar círculos en cada segmento
        snake.forEach((segment, index) => {
          ctx.beginPath()
          ctx.arc(segment.x, segment.y, width, 0, Math.PI * 2)
          ctx.fill()
        })

        // Dibujar círculos interpolados entre segmentos para suavizar
        for (let i = 0; i < snake.length - 1; i++) {
          const current = snake[i]
          const next = snake[i + 1]
          const steps = 3

          for (let j = 1; j < steps; j++) {
            const t = j / steps
            const x = current.x + (next.x - current.x) * t
            const y = current.y + (next.y - current.y) * t

            ctx.beginPath()
            ctx.arc(x, y, width, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      // Capa 1: Resplandor exterior muy suave
      drawSnakePath(SEGMENT_SIZE * 1.8, "#7ef542", 30)

      // Capa 2: Cuerpo principal brillante
      drawSnakePath(SEGMENT_SIZE * 1.4, "#7ef542", 20)

      // Capa 3: Highlight verde claro
      drawSnakePath(SEGMENT_SIZE * 1.1, "#a3e635", 12)

      // Capa 4: Centro brillante
      drawSnakePath(SEGMENT_SIZE * 0.8, "#bbf7d0", 8)

      // Capa 5: Brillo central blanco
      ctx.shadowBlur = 0
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
      snake.forEach((segment) => {
        const gradient = ctx.createRadialGradient(
          segment.x - SEGMENT_SIZE * 0.3,
          segment.y - SEGMENT_SIZE * 0.3,
          0,
          segment.x,
          segment.y,
          SEGMENT_SIZE * 0.6
        )
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.6)")
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)")
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(segment.x, segment.y, SEGMENT_SIZE * 0.6, 0, Math.PI * 2)
        ctx.fill()
      })

      // Dibujar cabeza con ojos
      ctx.shadowBlur = 0
      const head = snake[0]

      // Determinar dirección de los ojos
      let eyeAngle = 0
      if (direction === "RIGHT") eyeAngle = 0
      else if (direction === "DOWN") eyeAngle = Math.PI / 2
      else if (direction === "LEFT") eyeAngle = Math.PI
      else if (direction === "UP") eyeAngle = -Math.PI / 2

      const eyeDistance = SEGMENT_SIZE * 0.6
      const eyeSize = SEGMENT_SIZE * 0.4
      const pupilSize = SEGMENT_SIZE * 0.2

      const eye1X = head.x + Math.cos(eyeAngle + Math.PI / 6) * eyeDistance
      const eye1Y = head.y + Math.sin(eyeAngle + Math.PI / 6) * eyeDistance
      const eye2X = head.x + Math.cos(eyeAngle - Math.PI / 6) * eyeDistance
      const eye2Y = head.y + Math.sin(eyeAngle - Math.PI / 6) * eyeDistance

      // Ojo 1 con borde
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)"
      ctx.lineWidth = 2
      ctx.fillStyle = "white"
      ctx.beginPath()
      ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = "black"
      ctx.beginPath()
      ctx.arc(eye1X + eyeSize * 0.1, eye1Y, pupilSize, 0, Math.PI * 2)
      ctx.fill()

      // Brillo en ojo
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
      ctx.beginPath()
      ctx.arc(eye1X - eyeSize * 0.2, eye1Y - eyeSize * 0.2, pupilSize * 0.4, 0, Math.PI * 2)
      ctx.fill()

      // Ojo 2 con borde
      ctx.fillStyle = "white"
      ctx.beginPath()
      ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = "black"
      ctx.beginPath()
      ctx.arc(eye2X + eyeSize * 0.1, eye2Y, pupilSize, 0, Math.PI * 2)
      ctx.fill()

      // Brillo en ojo
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
      ctx.beginPath()
      ctx.arc(eye2X - eyeSize * 0.2, eye2Y - eyeSize * 0.2, pupilSize * 0.4, 0, Math.PI * 2)
      ctx.fill()
    }

    // Dibujar comida
    ctx.shadowColor = "#fbbf24"
    ctx.shadowBlur = 20
    ctx.fillStyle = "#fbbf24"
    ctx.beginPath()
    ctx.arc(food.x, food.y, 10, 0, Math.PI * 2)
    ctx.fill()

    // Highlight en comida
    ctx.shadowBlur = 0
    const foodGradient = ctx.createRadialGradient(
      food.x - 3,
      food.y - 3,
      0,
      food.x,
      food.y,
      10
    )
    foodGradient.addColorStop(0, "rgba(255, 255, 255, 0.6)")
    foodGradient.addColorStop(1, "rgba(255, 255, 255, 0)")
    ctx.fillStyle = foodGradient
    ctx.beginPath()
    ctx.arc(food.x, food.y, 10, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "#a3e635"
    ctx.fillRect(food.x - 1, food.y - 12, 2, 5)

  }, [snake, food, direction])

  const handleRestart = () => {
    setSnake([
      { x: 300, y: 300 },
      { x: 292, y: 300 },
      { x: 284, y: 300 },
      { x: 276, y: 300 },
      { x: 268, y: 300 },
    ])
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

        <div className="bg-green-950/60 backdrop-blur-md border border-emerald-400/30 rounded-xl p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 md:gap-6">
            <div className="flex-1">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="w-full max-w-full aspect-square border-2 border-emerald-500/30 rounded-lg shadow-lg bg-[#0a2410]"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              />
            </div>

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
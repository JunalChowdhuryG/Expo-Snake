import { useState, useEffect, useRef } from 'react'

export default function SnakePeludo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const gameStateRef = useRef({
    snake: [
      { x: 300, y: 300 },
      { x: 295, y: 300 },
      { x: 290, y: 300 },
      { x: 285, y: 300 },
      { x: 280, y: 300 },
    ],
    velocity: { x: 2, y: 0 },
    food: { x: 450, y: 300 },
    keys: new Set<string>()
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Controles
    const handleKeyDown = (e: KeyboardEvent) => {
      gameStateRef.current.keys.add(e.key)
      if (e.key === ' ') {
        setIsPaused(p => !p)
        e.preventDefault()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys.delete(e.key)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // Game loop
    let animationId: number
    let lastTime = 0

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      if (!isPaused && !gameOver) {
        update()
      }
      draw(ctx)
      animationId = requestAnimationFrame(gameLoop)
    }

    const update = () => {
      const state = gameStateRef.current
      const { snake, velocity, food, keys } = state

      // Controles suaves
      const turnSpeed = 0.15

      if (keys.has('ArrowLeft') || keys.has('a')) {
        const angle = Math.atan2(velocity.y, velocity.x)
        const newAngle = angle - turnSpeed
        const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2)
        velocity.x = Math.cos(newAngle) * speed
        velocity.y = Math.sin(newAngle) * speed
      }
      if (keys.has('ArrowRight') || keys.has('d')) {
        const angle = Math.atan2(velocity.y, velocity.x)
        const newAngle = angle + turnSpeed
        const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2)
        velocity.x = Math.cos(newAngle) * speed
        velocity.y = Math.sin(newAngle) * speed
      }
      if (keys.has('ArrowUp') || keys.has('w')) {
        const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2)
        const maxSpeed = 3
        if (speed < maxSpeed) {
          velocity.x *= 1.05
          velocity.y *= 1.05
        }
      }
      if (keys.has('ArrowDown') || keys.has('s')) {
        const minSpeed = 1
        const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2)
        if (speed > minSpeed) {
          velocity.x *= 0.95
          velocity.y *= 0.95
        }
      }

      // Mover cabeza
      const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y }

      // Wrap around
      if (head.x < 0) head.x = 800
      if (head.x > 800) head.x = 0
      if (head.y < 0) head.y = 600
      if (head.y > 600) head.y = 0

      // Verificar colisión con comida
      const distToFood = Math.sqrt((head.x - food.x) ** 2 + (head.y - food.y) ** 2)
      if (distToFood < 20) {
        setScore(s => s + 10)
        state.food = {
          x: Math.random() * 750 + 25,
          y: Math.random() * 550 + 25
        }
        // Agregar segmentos
        for (let i = 0; i < 5; i++) {
          snake.push({ ...snake[snake.length - 1] })
        }
      }

      // Actualizar cuerpo
      snake.unshift(head)

      // Mantener longitud
      while (snake.length > 50 + score) {
        snake.pop()
      }

      // Seguimiento suave del cuerpo
      for (let i = 1; i < snake.length; i++) {
        const prev = snake[i - 1]
        const current = snake[i]
        const dx = prev.x - current.x
        const dy = prev.y - current.y
        const distance = Math.sqrt(dx ** 2 + dy ** 2)
        const targetDistance = 3

        if (distance > targetDistance) {
          const ratio = (distance - targetDistance) / distance
          current.x += dx * ratio * 0.3
          current.y += dy * ratio * 0.3
        }
      }

      // Colisión con el cuerpo
      for (let i = 20; i < snake.length; i++) {
        const segment = snake[i]
        const dist = Math.sqrt((head.x - segment.x) ** 2 + (head.y - segment.y) ** 2)
        if (dist < 15) {
          setGameOver(true)
        }
      }
    }

    const draw = (ctx: CanvasRenderingContext2D) => {
      const state = gameStateRef.current
      const { snake, velocity, food } = state

      // Fondo
      ctx.fillStyle = '#0a1f0a'
      ctx.fillRect(0, 0, 800, 600)

      // Grid sutil
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.05)'
      ctx.lineWidth = 1
      for (let i = 0; i < 800; i += 40) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, 600)
        ctx.stroke()
      }
      for (let i = 0; i < 600; i += 40) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(800, i)
        ctx.stroke()
      }

      if (snake.length === 0) return

      // Dibujar serpiente peluda - múltiples pasadas para efecto difuso
      const drawFuzzySnake = (radius: number, color: string, blur: number, alpha: number) => {
        ctx.shadowColor = color
        ctx.shadowBlur = blur
        ctx.globalAlpha = alpha
        ctx.fillStyle = color

        for (let i = 0; i < snake.length; i++) {
          const segment = snake[i]

          // Radio decreciente hacia la cola
          const t = i / snake.length
          const r = radius * (1 - t * 0.5)

          ctx.beginPath()
          ctx.arc(segment.x, segment.y, r, 0, Math.PI * 2)
          ctx.fill()

          // Círculos intermedios para suavizar
          if (i < snake.length - 1) {
            const next = snake[i + 1]
            const steps = 2
            for (let j = 1; j <= steps; j++) {
              const tt = j / (steps + 1)
              const ix = segment.x + (next.x - segment.x) * tt
              const iy = segment.y + (next.y - segment.y) * tt
              ctx.beginPath()
              ctx.arc(ix, iy, r, 0, Math.PI * 2)
              ctx.fill()
            }
          }
        }
      }

      // Capa 1: Resplandor exterior muy difuso
      drawFuzzySnake(22, '#7ef542', 40, 0.3)

      // Capa 2: Resplandor medio
      drawFuzzySnake(18, '#7ef542', 30, 0.5)

      // Capa 3: Cuerpo principal
      drawFuzzySnake(14, '#7ef542', 20, 0.8)

      // Capa 4: Highlight
      drawFuzzySnake(11, '#a3e635', 15, 0.7)

      // Capa 5: Centro brillante
      drawFuzzySnake(8, '#bbf7d0', 10, 0.6)

      // Capa 6: Core blanco
      drawFuzzySnake(5, '#ffffff', 8, 0.4)

      ctx.globalAlpha = 1
      ctx.shadowBlur = 0

      // Ojos
      const head = snake[0]
      const angle = Math.atan2(velocity.y, velocity.x)
      const eyeDistance = 10
      const eyeSize = 5
      const pupilSize = 3

      const eye1X = head.x + Math.cos(angle + Math.PI / 4) * eyeDistance
      const eye1Y = head.y + Math.sin(angle + Math.PI / 4) * eyeDistance
      const eye2X = head.x + Math.cos(angle - Math.PI / 4) * eyeDistance
      const eye2Y = head.y + Math.sin(angle - Math.PI / 4) * eyeDistance

      // Ojo 1
      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.arc(eye1X + 1, eye1Y, pupilSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.beginPath()
      ctx.arc(eye1X - 1, eye1Y - 1, 1.5, 0, Math.PI * 2)
      ctx.fill()

      // Ojo 2
      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.arc(eye2X + 1, eye2Y, pupilSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.beginPath()
      ctx.arc(eye2X - 1, eye2Y - 1, 1.5, 0, Math.PI * 2)
      ctx.fill()

      // Comida
      ctx.shadowColor = '#fbbf24'
      ctx.shadowBlur = 25
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(food.x, food.y, 12, 0, Math.PI * 2)
      ctx.fill()

      ctx.shadowBlur = 0
      const foodGrad = ctx.createRadialGradient(food.x - 4, food.y - 4, 0, food.x, food.y, 12)
      foodGrad.addColorStop(0, 'rgba(255,255,255,0.8)')
      foodGrad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = foodGrad
      ctx.beginPath()
      ctx.arc(food.x, food.y, 12, 0, Math.PI * 2)
      ctx.fill()

      // Tallo
      ctx.fillStyle = '#84cc16'
      ctx.fillRect(food.x - 2, food.y - 16, 4, 8)
    }

    animationId = requestAnimationFrame(gameLoop)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isPaused, gameOver])

  const restart = () => {
    gameStateRef.current = {
      snake: [
        { x: 300, y: 300 },
        { x: 295, y: 300 },
        { x: 290, y: 300 },
        { x: 285, y: 300 },
        { x: 280, y: 300 },
      ],
      velocity: { x: 2, y: 0 },
      food: { x: 450, y: 300 },
      keys: new Set<string>()
    }
    setScore(0)
    setGameOver(false)
    setIsPaused(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-green-900 to-teal-950 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-400">
              🐍 SERPIENTE PELUDA
            </h1>
            <p className="text-green-400/70 text-sm mt-1">Controla con flechas o WASD</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black text-green-300">{score}</div>
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
                <div className="text-3xl text-green-300">Puntuación: {score}</div>
                <button
                  onClick={restart}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-xl rounded-xl shadow-lg hover:scale-105 transition-transform"
                >
                  🔄 Jugar de Nuevo
                </button>
              </div>
            </div>
          )}

          {isPaused && !gameOver && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
              <div className="text-6xl font-black text-green-300">⏸️ PAUSADO</div>
            </div>
          )}
        </div>

        {/* Controles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-green-950/50 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 text-center">
            <div className="text-green-300 font-bold mb-1">⬅️ ➡️</div>
            <div className="text-xs text-green-400/70">Girar</div>
          </div>
          <div className="bg-green-950/50 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 text-center">
            <div className="text-green-300 font-bold mb-1">⬆️</div>
            <div className="text-xs text-green-400/70">Acelerar</div>
          </div>
          <div className="bg-green-950/50 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 text-center">
            <div className="text-green-300 font-bold mb-1">⬇️</div>
            <div className="text-xs text-green-400/70">Frenar</div>
          </div>
          <div className="bg-green-950/50 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 text-center">
            <div className="text-green-300 font-bold mb-1">ESPACIO</div>
            <div className="text-xs text-green-400/70">Pausar</div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-gradient-to-r from-green-950/50 to-emerald-950/50 backdrop-blur-sm border border-green-500/20 rounded-xl p-4">
          <div className="text-green-300 text-sm space-y-2">
            <p>💡 <span className="font-semibold">Gira suavemente</span> con las flechas izquierda/derecha</p>
            <p>🚀 <span className="font-semibold">Acelera y frena</span> con flecha arriba/abajo</p>
            <p>🍎 <span className="font-semibold">Come la comida dorada</span> para crecer y sumar puntos</p>
            <p>⚠️ <span className="font-semibold">No te choques contigo mismo</span> o perderás</p>
          </div>
        </div>
      </div>
    </div>
  )
}
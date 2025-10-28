import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

export default function SnakePeludo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  type GameState = {
    snake: Array<{ x: number; y: number }>
    velocity: { x: number; y: number }
    food: Array<{ x: number; y: number }>
    keys: Set<string>
    baseSpeed: number
  }

  const gameStateRef = useRef<GameState>({
    snake: [
      { x: 300, y: 300 },
      { x: 295, y: 300 },
      { x: 290, y: 300 },
      { x: 285, y: 300 },
      { x: 280, y: 300 },
    ],
    velocity: { x: 1.8, y: 0 },
    food: [
      { x: 450, y: 300 },
      { x: 200, y: 150 },
      { x: 600, y: 450 }
    ],
    keys: new Set<string>(),
    baseSpeed: 1.8
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Controles
    const handleKeyDown = (e: KeyboardEvent) => {
      gameStateRef.current.keys.add(e.key.toLowerCase())
      if (e.key === ' ') {
        setIsPaused(p => !p)
        e.preventDefault()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys.delete(e.key.toLowerCase())
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
      const { snake, velocity, keys } = state
      const food = state.food

      const W = 800; // Ancho del Canvas
      const H = 600; // Alto del Canvas
      const wrapMargin = 50; // Margen de seguridad para traspaso suave

      // 1. Lógica de Movimiento y Giro
      const speedIncrease = Math.floor(score / 50) * 0.2
      const currentSpeed = state.baseSpeed + speedIncrease
      const turnSpeed = 0.1; // 🚀 Giro más rápido para mejor respuesta

      let newAngle = Math.atan2(velocity.y, velocity.x);
      let cardinalOverride = false;

      // 🛑 1. MOVIMIENTO CARDINAL (W/S o ↑/↓) - Prioridad Alta para Subir/Bajar
      if (keys.has('arrowup') || keys.has('w')) {
        newAngle = -Math.PI / 2; // UP
        cardinalOverride = true;
      } else if (keys.has('arrowdown') || keys.has('s')) {
        newAngle = Math.PI / 2; // DOWN
        cardinalOverride = true;
      }

      // 🛑 2. MOVIMIENTO ANGULAR (A/D o ←/→) - Solo si W/S NO está activo
      if (!cardinalOverride) {
        if (keys.has('arrowleft') || keys.has('a')) {
          newAngle -= turnSpeed; // Gira a la izquierda (counter-clockwise)
        }
        if (keys.has('arrowright') || keys.has('d')) {
          newAngle += turnSpeed; // Gira a la derecha (clockwise)
        }
      }

      // Aplicar Nueva Velocidad y Dirección
      velocity.x = Math.cos(newAngle) * currentSpeed;
      velocity.y = Math.sin(newAngle) * currentSpeed;


      // Mover cabeza
      const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y }

      // 🛑 TRASPASO DE BORDES SUAVE (Wrap Around)
      if (head.x < -wrapMargin) head.x = W + wrapMargin;
      if (head.x > W + wrapMargin) head.x = -wrapMargin;
      if (head.y < -wrapMargin) head.y = H + wrapMargin;
      if (head.y > H + wrapMargin) head.y = -wrapMargin;


      // Verificar colisión con comida
      for (let i = 0; i < food.length; i++) {
        const foodItem = food[i]
        const distToFood = Math.sqrt((head.x - foodItem.x) ** 2 + (head.y - foodItem.y) ** 2)
        if (distToFood < 20) {
          setScore(s => s + 10)
          food[i] = {
            x: Math.random() * 750 + 25,
            y: Math.random() * 550 + 25
          }
        }
      }

      // Actualizar cuerpo
      snake.unshift(head)

      const targetLength = 15 + Math.floor(score / 2)
      while (snake.length > targetLength) {
        snake.pop()
      }

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

      // La auto-colisión está eliminada por solicitud previa.
    }

    const draw = (ctx: CanvasRenderingContext2D) => {
      const state = gameStateRef.current
      const { snake, velocity } = state
      const food = state.food

      // Fondo y Grid
      ctx.fillStyle = '#0a1f0a'
      ctx.fillRect(0, 0, 800, 600)
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.05)'
      ctx.lineWidth = 1
      for (let i = 0; i < 800; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 600); ctx.stroke() }
      for (let i = 0; i < 600; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke() }

      if (snake.length === 0) return

      // --- DIBUJO DE SERPIENTE PELUDA ---

      const drawFuzzySnakeSegment = (segment: { x: number, y: number }, r: number, color: string, blur: number, alpha: number) => {
        ctx.shadowColor = color
        ctx.shadowBlur = blur
        ctx.globalAlpha = alpha
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(segment.x, segment.y, r, 0, Math.PI * 2)
        ctx.fill()
      }

      for (let i = 0; i < snake.length; i++) {
        const segment = snake[i]
        const t = i / snake.length
        const radius = 14 * (1 - t * 0.4)

        // Capa 1: Resplandor exterior
        drawFuzzySnakeSegment(segment, radius, '#7ef542', 30, 0.3)

        // Capa 2: Cuerpo principal
        drawFuzzySnakeSegment(segment, radius * 0.8, '#7ef542', 20, 0.7)

        // Capa 3: Highlight interior
        drawFuzzySnakeSegment(segment, radius * 0.6, '#a3e635', 8, 0.9)

        // Capa 4: Core blanco/verde
        drawFuzzySnakeSegment(segment, radius * 0.4, '#bbf7d0', 5, 0.8)

        // Dibujar el punto de conexión (para continuidad)
        if (i > 0) {
          const prev = snake[i - 1]
          ctx.strokeStyle = '#a3e635';
          ctx.lineWidth = radius * 2 * 0.8;
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(segment.x, segment.y);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1
      ctx.shadowBlur = 0

      // Ojos (Solo en la cabeza)
      const head = snake[0]
      const angle = Math.atan2(velocity.y, velocity.x)
      const eyeDistance = 10
      const eyeSize = 5
      const pupilSize = 3

      const anglePerp = angle + Math.PI / 2;
      const eye1X = head.x + Math.cos(anglePerp) * eyeDistance * 0.5
      const eye1Y = head.y + Math.sin(anglePerp) * eyeDistance * 0.5
      const eye2X = head.x - Math.cos(anglePerp) * eyeDistance * 0.5
      const eye2Y = head.y - Math.sin(anglePerp) * eyeDistance * 0.5

      // Dibuja la parte blanca del ojo
      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2)
      ctx.fill()

      // Dibuja la pupila negra (ligeramente desplazada)
      ctx.fillStyle = '#1a1a1a'
      const pupilOffset = 1;
      const pupilX = Math.cos(angle) * pupilOffset;
      const pupilY = Math.sin(angle) * pupilOffset;

      ctx.beginPath()
      ctx.arc(eye1X + pupilX, eye1Y + pupilY, pupilSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(eye2X + pupilX, eye2Y + pupilY, pupilSize, 0, Math.PI * 2)
      ctx.fill()


      // Comida (Fruta)
      for (const foodItem of food) {
        ctx.shadowColor = '#fbbf24'
        ctx.shadowBlur = 25
        ctx.fillStyle = '#fbbf24'
        ctx.beginPath()
        ctx.arc(foodItem.x, foodItem.y, 12, 0, Math.PI * 2)
        ctx.fill()

        ctx.shadowBlur = 0
        const foodGrad = ctx.createRadialGradient(foodItem.x - 4, foodItem.y - 4, 0, foodItem.x, foodItem.y, 12)
        foodGrad.addColorStop(0, 'rgba(255,255,255,0.8)')
        foodGrad.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = foodGrad
        ctx.beginPath()
        ctx.arc(foodItem.x, foodItem.y, 12, 0, Math.PI * 2)
        ctx.fill()

        // Tallo
        ctx.fillStyle = '#84cc16'
        ctx.fillRect(foodItem.x - 2, foodItem.y - 16, 4, 8)
      }
    }

    animationId = requestAnimationFrame(gameLoop)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isPaused, gameOver, score])

  const restart = () => {
    gameStateRef.current = {
      snake: [
        { x: 300, y: 300 },
        { x: 295, y: 295 },
        { x: 290, y: 290 },
        { x: 285, y: 285 },
        { x: 280, y: 280 },
      ],
      velocity: { x: 1.8, y: 0 },
      food: [
        { x: 450, y: 300 },
        { x: 200, y: 150 },
        { x: 600, y: 450 }
      ],
      keys: new Set<string>(),
      baseSpeed: 1.8
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
            <p className="text-green-400/70 text-sm mt-1">Usa ← → / A D para girar. ↑ ↓ / W S para subir/bajar.</p>
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
      </div>
    </div>
  )
}
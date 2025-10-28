import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface GameLobbyProps {
  player: { id: string; name: string }
  onStartGame: () => void
  onLogout: () => void
}

interface PlayerStats {
  gamesPlayed: number
  highScore: number
  totalScore: number
}

export default function GameLobby({ player, onStartGame, onLogout }: GameLobbyProps) {
  const [stats, setStats] = useState<PlayerStats>({
    gamesPlayed: 0,
    highScore: 0,
    totalScore: 0,
  })

  useEffect(() => {
    // Cargar estadísticas persistentes desde localStorage (simulando estadísticas "reales")
    const savedStats = localStorage.getItem(`player-stats-${player.id}`)
    if (savedStats) {
      setStats(JSON.parse(savedStats))
    }
  }, [player.id])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-3 sm:p-4 md:p-6 flex items-center justify-center">
      <div className="max-w-3xl w-full mx-auto">
        {/* Header (Centrado y con estilo degradado) */}
        <div className="flex justify-between items-center mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-200">
            🐍 SNAKE GAME
          </h1>
          <Button
            onClick={onLogout}
            variant="outline"
            className="border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/20 bg-green-950/60 backdrop-blur-sm text-sm sm:text-base px-3 sm:px-4"
          >
            Salir
          </Button>
        </div>

        {/* Player Card (Estadísticas) */}
        <div className="bg-green-950/60 backdrop-blur-md border border-emerald-400/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 shadow-2xl shadow-emerald-500/20">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6 sm:mb-8 text-center sm:text-left">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-3xl sm:text-4xl shadow-lg shadow-emerald-400/50">
              🐍
            </div>
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">{player.name}</h2>
              <p className="text-xs sm:text-sm text-emerald-300/70">ID: {player.id}</p>
            </div>
          </div>

          {/* Stats Grid con colores temáticos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-green-900/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-5 text-center border border-emerald-400/20 hover:border-emerald-400/40 transition-all">
              <p className="text-2xl sm:text-3xl font-black text-emerald-300">{stats.gamesPlayed}</p>
              <p className="text-xs text-green-200/70 mt-2 font-medium">Juegos Jugados</p>
            </div>
            <div className="bg-green-900/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-5 text-center border border-cyan-400/20 hover:border-cyan-400/40 transition-all">
              <p className="text-2xl sm:text-3xl font-black text-cyan-300">{stats.highScore}</p>
              <p className="text-xs text-green-200/70 mt-2 font-medium">Puntuación Máxima</p>
            </div>
            <div className="bg-green-900/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-5 text-center border border-yellow-400/20 hover:border-yellow-400/40 transition-all">
              <p className="text-2xl sm:text-3xl font-black text-yellow-300">{stats.totalScore}</p>
              <p className="text-xs text-green-200/70 mt-2 font-medium">Puntuación Total</p>
            </div>
          </div>
        </div>

        {/* Guía de Juego */}
        <div className="bg-green-950/60 backdrop-blur-md border border-emerald-400/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 shadow-xl">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 justify-center sm:justify-start">
            <span className="text-xl sm:text-2xl">🎮</span>
            Cómo Jugar
          </h3>
          <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base text-green-100">
            <li className="flex gap-2 sm:gap-3 items-start">
              <span className="text-emerald-300 text-base sm:text-lg mt-0.5 flex-shrink-0">▸</span>
              <span>Usa las flechas del teclado o <span className="text-emerald-300 font-semibold">WASD</span> para mover la serpiente</span>
            </li>
            <li className="flex gap-2 sm:gap-3 items-start">
              <span className="text-cyan-300 text-base sm:text-lg mt-0.5 flex-shrink-0">▸</span>
              <span>Come la comida para crecer y ganar puntos</span>
            </li>
            <li className="flex gap-2 sm:gap-3 items-start">
              <span className="text-yellow-300 text-base sm:text-lg mt-0.5 flex-shrink-0">▸</span>
              <span>Evita chocar con las paredes y contigo mismo</span>
            </li>
            <li className="flex gap-2 sm:gap-3 items-start">
              <span className="text-orange-300 text-base sm:text-lg mt-0.5 flex-shrink-0">▸</span>
              <span>Intenta conseguir la puntuación más alta</span>
            </li>
          </ul>
        </div>

        {/* Start Button */}
        <Button
          onClick={onStartGame}
          className="w-full py-6 sm:py-8 text-lg sm:text-xl font-black bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white rounded-xl sm:rounded-2xl shadow-2xl shadow-emerald-400/50 hover:shadow-emerald-400/70 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          🚀 Comenzar Juego
        </Button>
      </div>
    </div>
  )
}
import { useState, useEffect } from "react"

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
    // Simulando estadísticas guardadas
    const savedStats = {
      gamesPlayed: 5,
      highScore: 120,
      totalScore: 450
    }
    setStats(savedStats)
  }, [player.id])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-4 flex items-center justify-center overflow-x-hidden">
      <div className="max-w-2xl w-full mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-200">
            🐍 SNAKE GAME
          </h1>
          <button
            onClick={onLogout}
            className="border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/20 bg-green-950/60 backdrop-blur-sm text-sm px-4 py-2 rounded-lg transition-all"
          >
            Salir
          </button>
        </div>

        {/* Player Card */}
        <div className="bg-green-950/60 backdrop-blur-md border border-emerald-400/30 rounded-xl p-5 mb-4 shadow-2xl shadow-emerald-500/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-emerald-400/50">
              🐍
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{player.name}</h2>
              <p className="text-xs text-emerald-300/70">ID: {player.id}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-900/50 backdrop-blur-sm rounded-lg p-3 text-center border border-emerald-400/20">
              <p className="text-xl font-black text-emerald-300">{stats.gamesPlayed}</p>
              <p className="text-xs text-green-200/70 mt-1">Juegos</p>
            </div>
            <div className="bg-green-900/50 backdrop-blur-sm rounded-lg p-3 text-center border border-cyan-400/20">
              <p className="text-xl font-black text-cyan-300">{stats.highScore}</p>
              <p className="text-xs text-green-200/70 mt-1">Máximo</p>
            </div>
            <div className="bg-green-900/50 backdrop-blur-sm rounded-lg p-3 text-center border border-yellow-400/20">
              <p className="text-xl font-black text-yellow-300">{stats.totalScore}</p>
              <p className="text-xs text-green-200/70 mt-1">Total</p>
            </div>
          </div>
        </div>

        {/* Guía de Juego */}
        <div className="bg-green-950/60 backdrop-blur-md border border-emerald-400/30 rounded-xl p-5 mb-4 shadow-xl">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-lg">🎮</span>
            Cómo Jugar
          </h3>
          <ul className="space-y-2 text-sm text-green-100">
            <li className="flex gap-2 items-start">
              <span className="text-emerald-300 mt-0.5">▸</span>
              <span>Usa las flechas o <span className="text-emerald-300 font-semibold">WASD</span> para mover</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-cyan-300 mt-0.5">▸</span>
              <span>Come la comida para crecer y ganar puntos</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-yellow-300 mt-0.5">▸</span>
              <span>Evita chocar con las paredes y contigo mismo</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-orange-300 mt-0.5">▸</span>
              <span>Intenta conseguir la puntuación más alta</span>
            </li>
          </ul>
        </div>

        {/* Start Button */}
        <button
          onClick={onStartGame}
          className="w-full py-5 text-lg font-black bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white rounded-xl shadow-2xl shadow-emerald-400/50 hover:shadow-emerald-400/70 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          🚀 Comenzar Juego
        </button>
      </div>
    </div>
  )
}
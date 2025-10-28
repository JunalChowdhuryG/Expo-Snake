"use client"

import { useState, useEffect } from "react"

interface GameLobbyProps {
  player: { id: string; name: string }
  onStartGame: () => void
  onLogout: () => void
}

export default function GameLobby({ player, onStartGame, onLogout }: GameLobbyProps) {
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    highScore: 0,
    totalScore: 0,
  })

  useEffect(() => {
    // Simular carga de estadísticas del backend
    setStats({
      gamesPlayed: Math.floor(Math.random() * 50),
      highScore: Math.floor(Math.random() * 5000) + 1000,
      totalScore: Math.floor(Math.random() * 50000) + 10000,
    })
  }, [])

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-green-500">🐍 SNAKE GAME</h1>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg border border-gray-600 transition-colors"
          >
            Salir
          </button>
        </div>

        {/* Player Card */}
        <div className="bg-slate-800 border-2 border-green-500/30 rounded-xl p-6 mb-6 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-3xl shadow-lg">
              🐍
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{player.name}</h2>
              <p className="text-sm text-gray-400">ID: {player.id}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-700 rounded-lg p-4 text-center border border-green-500/20">
              <p className="text-3xl font-bold text-green-500">{stats.gamesPlayed}</p>
              <p className="text-xs text-gray-400 mt-1">Juegos Jugados</p>
            </div>
            <div className="bg-slate-700 rounded-lg p-4 text-center border border-orange-500/20">
              <p className="text-3xl font-bold text-orange-500">{stats.highScore}</p>
              <p className="text-xs text-gray-400 mt-1">Puntuación Máxima</p>
            </div>
            <div className="bg-slate-700 rounded-lg p-4 text-center border border-blue-500/20">
              <p className="text-3xl font-bold text-blue-500">{stats.totalScore}</p>
              <p className="text-xs text-gray-400 mt-1">Puntuación Total</p>
            </div>
          </div>
        </div>

        {/* Game Info */}
        <div className="bg-slate-800 border-2 border-green-500/30 rounded-xl p-6 mb-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4">Cómo Jugar</h3>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex gap-3">
              <span className="text-green-500 font-bold">▸</span>
              <span>Usa las flechas del teclado o WASD para mover la serpiente</span>
            </li>
            <li className="flex gap-3">
              <span className="text-orange-500 font-bold">▸</span>
              <span>Come la comida para crecer y ganar puntos</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-500 font-bold">▸</span>
              <span>Evita chocar con las paredes y contigo mismo</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-500 font-bold">▸</span>
              <span>Intenta conseguir la puntuación más alta</span>
            </li>
          </ul>
        </div>

        {/* Start Button */}
        <button
          onClick={onStartGame}
          className="w-full py-4 text-xl font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg transition-colors"
        >
          Comenzar Juego
        </button>
      </div>
    </div>
  )
}

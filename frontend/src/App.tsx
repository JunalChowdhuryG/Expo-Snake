"use client"

import { useState } from "react"
import QRScanner from "./components/qr-scanner"
import GameLobby from "./components/game-lobby"
import SnakeGame from "./components/snake-game"

type GameState = "qr-scan" | "lobby" | "playing"

interface PlayerData {
  id: string
  name: string
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>("qr-scan")
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)

  const handleQRScanned = (data: PlayerData) => {
    setPlayerData(data)
    setGameState("lobby")
  }

  const handleStartGame = () => {
    setGameState("playing")
  }

  const handleBackToLobby = () => {
    setGameState("lobby")
  }

  const handleLogout = () => {
    setPlayerData(null)
    setGameState("qr-scan")
  }

  return (
    <main className="min-h-screen">
      {gameState === "qr-scan" && <QRScanner onScanned={handleQRScanned} />}
      {gameState === "lobby" && playerData && (
        <GameLobby player={playerData} onStartGame={handleStartGame} onLogout={handleLogout} />
      )}
      {gameState === "playing" && playerData && <SnakeGame player={playerData} onBack={handleBackToLobby} />}
    </main>
  )
}

"use client"

import { useState, useRef } from "react"
// Importar Button si es necesario, pero lo manejamos con etiqueta <button> simple aquí.

interface QRScannerProps {
  onScanned: (data: { id: string; name: string }) => void
}

export default function QRScanner({ onScanned }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [manualInput, setManualInput] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      alert("No se pudo acceder a la cámara")
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      setIsScanning(false)
    }
  }

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      try {
        const data = JSON.parse(manualInput)
        onScanned({ id: data.id || "player-1", name: data.name || "Player" })
      } catch {
        onScanned({ id: "player-" + Date.now(), name: manualInput })
      }
      setManualInput("")
    }
  }

  return (
    // Contenedor principal: Centrado y responsive
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6">
      {/* Contenedor central con separación aumentada (space-y-10) */}
      <div className="w-full max-w-sm mx-auto space-y-10">

        {/* Header (Separado del contenido inferior por space-y-10) */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-400 drop-shadow-lg">
            🐍 SNAKE GAME
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">Inicia tu sesión de juego.</p>
        </div>

        {/* CARD DE ENTRADA MANUAL (Con Padding Interno) */}
        <div className="bg-slate-800/80 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 space-y-6 shadow-2xl">

          <div className="text-center">
            <p className="text-sm font-medium text-white mb-2">Ingresa tu Nombre para Jugar:</p>
          </div>

          {/* Manual Input (Separado) */}
          <div className="space-y-4"> {/* Separación entre input y botón */}
            <input
              type="text"
              placeholder="Máximo 6 letras"
              maxLength={6}
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleManualSubmit()}
              className="w-full px-4 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white placeholder-slate-400 text-center text-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualInput.trim()}
              className="w-full py-3 text-base font-bold rounded-lg transition-all 
              bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white shadow-lg shadow-orange-600/30"
            >
              🚀 Ingresar al Juego
            </button>
          </div>
        </div>

        {/* Footer (Separado por space-y-10 del contenido superior) */}
        <div className="text-center text-xs text-gray-500">
          <p>Asegúrate de que el servidor WebSocket esté activo en localhost:12345.</p>
        </div>
      </div>
    </div>
  )
}
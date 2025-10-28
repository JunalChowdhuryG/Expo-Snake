"use client"

import { useState, useRef } from "react"

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-green-500 mb-2 drop-shadow-lg">🐍 SNAKE GAME</h1>
          <p className="text-gray-300 text-lg">Escanea el QR para comenzar</p>
        </div>

        {/* QR Scanner Card */}
        <div className="bg-slate-800 border-2 border-green-500/30 rounded-xl p-6 mb-6 shadow-xl">
          {!isScanning ? (
            <div className="space-y-4">
              <div className="aspect-square bg-slate-700 rounded-lg flex items-center justify-center border-2 border-dashed border-green-500/20">
                <div className="text-center">
                  <div className="text-6xl mb-2">📱</div>
                  <p className="text-sm text-gray-400">Cámara desactivada</p>
                </div>
              </div>
              <button
                onClick={startCamera}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
              >
                Activar Cámara
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full aspect-square rounded-lg bg-black border-2 border-green-500/50"
              />
              <button
                onClick={stopCamera}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg border border-gray-600 transition-colors"
              >
                Detener Cámara
              </button>
            </div>
          )}
        </div>

        {/* Manual Input */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="O ingresa tu nombre manualmente"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleManualSubmit()}
              className="w-full px-4 py-3 bg-slate-700 border-2 border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
            />
          </div>
          <button
            onClick={handleManualSubmit}
            disabled={!manualInput.trim()}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
          >
            Ingresar
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Conectando a servidor WebSocket en localhost:12345</p>
        </div>
      </div>
    </div>
  )
}

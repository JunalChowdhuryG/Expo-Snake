"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"

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
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-card">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">SNAKE GAME</h1>
          <p className="text-muted-foreground">Escanea el QR para comenzar</p>
        </div>

        {/* QR Scanner Card */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          {!isScanning ? (
            <div className="space-y-4">
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">📱</div>
                  <p className="text-sm text-muted-foreground">Cámara desactivada</p>
                </div>
              </div>
              <Button onClick={startCamera} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Activar Cámara
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <video ref={videoRef} autoPlay playsInline className="w-full aspect-square rounded-lg bg-black" />
              <Button
                onClick={stopCamera}
                variant="outline"
                className="w-full border-border text-foreground hover:bg-muted bg-transparent"
              >
                Detener Cámara
              </Button>
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
              className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button
            onClick={handleManualSubmit}
            disabled={!manualInput.trim()}
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground disabled:opacity-50"
          >
            Ingresar
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Conectado a backend Java</p>
        </div>
      </div>
    </div>
  )
}

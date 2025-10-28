import { useState } from "react"

interface QRScannerProps {
  onScanned: (data: { id: string; name: string }) => void
}

export default function QRScanner({ onScanned }: QRScannerProps) {
  const [manualInput, setManualInput] = useState("")

  const handleSubmit = () => {
    if (manualInput.trim()) {
      onScanned({
        id: "player-" + Date.now(),
        name: manualInput.trim().toUpperCase()
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-4">

      <div className="w-full max-w-lg">

        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4 mb-4">
            <div className="text-4xl">🐍</div>
            <div className="text-left">
              <div className="text-3xl font-black text-emerald-400 tracking-tight leading-none mb-0.5">
                SNAKE
              </div>
              <div className="text-3xl font-black text-emerald-400 tracking-tight leading-none">
                GAME
              </div>
            </div>
          </div>
          <p className="text-slate-400 text-base mt-3">
            Inicia tu sesión de juego
          </p>
        </div>

        {/* MAIN CARD */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-700/50">

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              Ingresa tu Nombre
            </h2>
            <p className="text-slate-400 text-sm">
              Máximo 6 letras para jugar
            </p>
          </div>

          <div className="space-y-5">

            <div className="space-y-3">
              <label
                htmlFor="playerName"
                className="block text-base font-semibold text-emerald-400 text-left"
              >
                Nombre del Jugador
              </label>

              <input
                id="playerName"
                type="text"
                placeholder="Ej: SNAKE"
                maxLength={6}
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
                className="w-full h-14 px-6 bg-slate-900/90 border-2 border-slate-600 rounded-xl text-white placeholder-slate-500 text-center text-xl font-bold uppercase tracking-[0.3em] focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/30 transition-all duration-200"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!manualInput.trim()}
              className="w-full h-14 text-lg font-bold rounded-xl transition-all duration-200 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:shadow-none flex items-center justify-center gap-3"
            >
              <span className="text-2xl">🎮</span>
              <span>Ingresar al Juego</span>
            </button>

          </div>

          <div className="flex items-center justify-center gap-3 mt-6 pt-6 border-t border-slate-700/50">
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/60"></div>
            <p className="text-slate-400 font-medium text-sm">
              Listo para jugar
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-slate-500 text-xs">
            Asegúrate de que el servidor WebSocket esté activo
          </p>
          <p className="text-emerald-400/70 font-mono text-sm font-semibold">
            localhost:12345
          </p>
        </div>

      </div>
    </div>
  )
}
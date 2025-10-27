import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Lobby from './components/Lobby';
import Game from './components/Game';
import GameOver from './components/GameOver';
import gameService from './services/GameService';

function App() {
  const [gameState, setGameState] = useState({
    gameObjects: [],
    playerScores: {},
    players: {},
    isGameOver: false,
    isGameInProgress: false,
    playerId: null,
    isHost: false
  });
  
  const [screen, setScreen] = useState('login');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Suscribirse a cambios en el estado del juego
    const unsubscribe = gameService.subscribe(newState => {
      setGameState(newState);
      
      // Cambiar pantalla según el estado del juego
      if (newState.isGameInProgress) {
        setScreen('game');
      } else if (newState.isGameOver) {
        setScreen('gameOver');
      } else if (newState.playerId !== null) {
        setScreen('lobby');
      }
    });

    // Configurar controles de teclado
    const handleKeyDown = (e) => {
      if (!gameState.isGameInProgress) return;
      
      switch (e.key) {
        case 'ArrowUp':
          gameService.sendDirection('UP');
          break;
        case 'ArrowDown':
          gameService.sendDirection('DOWN');
          break;
        case 'ArrowLeft':
          gameService.sendDirection('LEFT');
          break;
        case 'ArrowRight':
          gameService.sendDirection('RIGHT');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Limpiar suscripciones
    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState.isGameInProgress]);

  const handleJoin = async (playerName) => {
    try {
      // Conectar al servidor WebSocket
      const serverUrl = `ws://${window.location.hostname}:12345`;
      await gameService.connect(serverUrl);
      setConnected(true);
      
      // Unirse al juego con el nombre proporcionado
      gameService.joinGame(playerName);
    } catch (error) {
      console.error('Error al conectar:', error);
      alert('No se pudo conectar al servidor. Inténtalo de nuevo.');
    }
  };

  const handleStartGame = () => {
    gameService.startGame();
  };

  const handleRestart = () => {
    gameService.restartGame();
  };

  // Renderizar pantalla según el estado actual
  const renderScreen = () => {
    switch (screen) {
      case 'login':
        return <Login onJoin={handleJoin} />;
      case 'lobby':
        return (
          <Lobby 
            players={gameState.players} 
            isHost={gameState.isHost} 
            onStartGame={handleStartGame} 
          />
        );
      case 'game':
        return (
          <Game 
            gameObjects={gameState.gameObjects} 
            playerId={gameState.playerId} 
            isGameOver={gameState.isGameOver} 
          />
        );
      case 'gameOver':
        return (
          <GameOver 
            scores={gameState.playerScores} 
            onRestart={handleRestart} 
          />
        );
      default:
        return <div>Cargando...</div>;
    }
  };

  return (
    <div className="App">
      {renderScreen()}
      
      {/* Controles táctiles para dispositivos móviles */}
      {screen === 'game' && (
        <div className="mobile-controls">
          <button className="control-btn up" onClick={() => gameService.sendDirection('UP')}>▲</button>
          <div className="horizontal-controls">
            <button className="control-btn left" onClick={() => gameService.sendDirection('LEFT')}>◀</button>
            <button className="control-btn right" onClick={() => gameService.sendDirection('RIGHT')}>▶</button>
          </div>
          <button className="control-btn down" onClick={() => gameService.sendDirection('DOWN')}>▼</button>
        </div>
      )}
    </div>
  );
}

export default App;

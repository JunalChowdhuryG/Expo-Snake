import React from 'react';
import './GameOver.css';

const GameOver = ({ scores, onRestart }) => {
  // Ordenar puntuaciones de mayor a menor
  const sortedScores = Object.entries(scores)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA);

  return (
    <div className="game-over-screen">
      <div className="game-over-container">
        <h1>Game Over</h1>
        
        <div className="scores-container">
          <h2>Puntuaciones</h2>
          <ul className="scores-list">
            {sortedScores.map(([playerId, score], index) => (
              <li key={playerId} className={index === 0 ? 'winner' : ''}>
                {index === 0 && <span className="crown">👑</span>}
                Jugador {playerId}: {score} puntos
              </li>
            ))}
          </ul>
        </div>
        
        <button className="restart-button" onClick={onRestart}>
          Volver al Lobby
        </button>
      </div>
    </div>
  );
};

export default GameOver;
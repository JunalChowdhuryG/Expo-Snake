import React from 'react';
import './Lobby.css';

const Lobby = ({ players, isHost, onStartGame }) => {
  return (
    <div className="lobby-screen">
      <div className="lobby-container">
        <h2>Sala de Espera</h2>
        <p>Esperando a que el Host inicie el juego...</p>
        
        <div className="player-list-container">
          <h3>Jugadores</h3>
          <ul className="player-list">
            {Object.entries(players).map(([id, name]) => (
              <li key={id} className={id === '0' ? 'host' : ''}>
                {name} {id === '0' ? '(Host)' : ''}
              </li>
            ))}
          </ul>
        </div>
        
        {isHost && (
          <button className="start-button" onClick={onStartGame}>
            ¡Comenzar Juego!
          </button>
        )}
      </div>
    </div>
  );
};

export default Lobby;
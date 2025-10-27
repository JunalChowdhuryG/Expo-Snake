import React, { useState } from 'react';
import './Login.css';

const Login = ({ onJoin }) => {
  const [playerName, setPlayerName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      onJoin(playerName.trim().substring(0, 6));
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <h1>Snake-Snakes</h1>
        <h2>¡Bienvenido!</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="playerName">Escribe tu nombre (máx. 6 letras):</label>
            <input
              type="text"
              id="playerName"
              maxLength="6"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="JUGADOR"
              required
            />
          </div>
          <button type="submit" className="join-button">Unirse al Juego</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
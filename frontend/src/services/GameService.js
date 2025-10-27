import webSocketService from './WebSocketService';

class GameService {
  constructor() {
    this.gameState = {
      gameObjects: [],
      playerScores: {},
      players: {},
      isGameOver: false,
      isGameInProgress: false,
      playerId: null,
      isHost: false
    };
    
    this.listeners = [];
    this._setupWebSocketHandlers();
  }

  _setupWebSocketHandlers() {
    webSocketService.on('update', this._handleUpdate.bind(this));
    webSocketService.on('playerJoined', this._handlePlayerJoined.bind(this));
    webSocketService.on('playerLeft', this._handlePlayerLeft.bind(this));
    webSocketService.on('gameStarted', this._handleGameStarted.bind(this));
    webSocketService.on('gameOver', this._handleGameOver.bind(this));
    webSocketService.on('assignId', this._handleAssignId.bind(this));
  }

  _notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.gameState);
      } catch (error) {
        console.error('Error en listener del juego:', error);
      }
    });
  }

  _handleUpdate(data) {
    this.gameState.gameObjects = data.gameObjects || [];
    this.gameState.playerScores = data.scores || {};
    this._notifyListeners();
  }

  _handlePlayerJoined(data) {
    const { playerId, playerName } = data;
    this.gameState.players = {
      ...this.gameState.players,
      [playerId]: playerName
    };
    this._notifyListeners();
  }

  _handlePlayerLeft(data) {
    const { playerId } = data;
    const players = { ...this.gameState.players };
    delete players[playerId];
    this.gameState.players = players;
    this._notifyListeners();
  }

  _handleGameStarted() {
    this.gameState.isGameInProgress = true;
    this.gameState.isGameOver = false;
    this._notifyListeners();
  }

  _handleGameOver(data) {
    this.gameState.isGameOver = true;
    this.gameState.isGameInProgress = false;
    this.gameState.playerScores = data.finalScores || this.gameState.playerScores;
    this._notifyListeners();
  }

  _handleAssignId(data) {
    this.gameState.playerId = data.playerId;
    this.gameState.isHost = data.playerId === 0;
    this._notifyListeners();
  }

  connect(serverUrl) {
    return webSocketService.connect(serverUrl);
  }

  disconnect() {
    webSocketService.disconnect();
  }

  joinGame(playerName) {
    webSocketService.send({
      type: 'join',
      playerName
    });
  }

  startGame() {
    if (this.gameState.isHost) {
      webSocketService.send({
        type: 'startGame'
      });
    }
  }

  restartGame() {
    webSocketService.send({
      type: 'restart'
    });
  }

  sendDirection(direction) {
    webSocketService.send({
      type: 'input',
      direction
    });
  }

  subscribe(listener) {
    this.listeners.push(listener);
    // Notificar inmediatamente con el estado actual
    listener(this.gameState);
    
    // Devolver función para cancelar suscripción
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

// Singleton para usar en toda la aplicación
const gameService = new GameService();
export default gameService;
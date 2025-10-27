class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.messageHandlers = {};
    this.serverUrl = null;
  }

  connect(serverUrl) {
    this.serverUrl = serverUrl;
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(serverUrl);

        this.socket.onopen = () => {
          console.log('Conexión WebSocket establecida');
          this.isConnected = true;
          resolve();
        };

        this.socket.onclose = (event) => {
          console.log('Conexión WebSocket cerrada:', event.code, event.reason);
          this.isConnected = false;
          this._notifyHandlers('disconnect', { code: event.code, reason: event.reason });
        };

        this.socket.onerror = (error) => {
          console.error('Error en WebSocket:', error);
          reject(error);
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this._notifyHandlers(message.type, message);
          } catch (error) {
            console.error('Error al procesar mensaje:', error);
          }
        };
      } catch (error) {
        console.error('Error al conectar WebSocket:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket && this.isConnected) {
      this.socket.close();
      this.isConnected = false;
    }
  }

  send(message) {
    if (!this.isConnected) {
      console.error('No se puede enviar mensaje: WebSocket no conectado');
      return false;
    }

    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      return false;
    }
  }

  on(messageType, handler) {
    if (!this.messageHandlers[messageType]) {
      this.messageHandlers[messageType] = [];
    }
    this.messageHandlers[messageType].push(handler);
  }

  off(messageType, handler) {
    if (!this.messageHandlers[messageType]) return;
    
    if (handler) {
      this.messageHandlers[messageType] = this.messageHandlers[messageType]
        .filter(h => h !== handler);
    } else {
      delete this.messageHandlers[messageType];
    }
  }

  _notifyHandlers(messageType, data) {
    const handlers = this.messageHandlers[messageType];
    if (handlers && handlers.length > 0) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error en handler para ${messageType}:`, error);
        }
      });
    }
  }
}

// Singleton para usar en toda la aplicación
const webSocketService = new WebSocketService();
export default webSocketService;
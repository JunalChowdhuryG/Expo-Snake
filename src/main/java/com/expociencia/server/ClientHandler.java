package com.expociencia.server;
import java.net.*;

import com.expociencia.messages.Message;
import com.expociencia.game.GameState;

import java.io.*;

public class ClientHandler extends Thread {
    private Socket socket;
    private ObjectOutputStream out;
    private ObjectInputStream in;
    private GameState gameState;
    private int playerId;
    private volatile boolean running = true;

    public ClientHandler(Socket socket, GameState gameState, int playerId) throws IOException {
        this.socket = socket;
        this.gameState = gameState;
        this.playerId = playerId;

        try {
            // Set socket timeout to avoid hanging on read operations
            socket.setSoTimeout(10000); // 10 seconds timeout

            // Initialize output stream first
            this.out = new ObjectOutputStream(socket.getOutputStream());
            this.out.flush();

            // Initialize input stream
            this.in = new ObjectInputStream(socket.getInputStream());

            // Send player ID to client
            this.out.writeInt(playerId);
            this.out.flush();

            // Add player to game state
            gameState.addPlayer(playerId);

            // Send initial game state
            sendInitialState();

            ServerLogger.log("Manejador de cliente inicializado para el jugador: " + playerId);
        } catch (IOException e) {
            ServerLogger.error("Error initializing client handler for player " + playerId + ": " + e.getMessage(), e);
            closeResources();
            throw e;
        }
    }

    private void sendInitialState() throws IOException {
        Message initialState = new Message("UPDATE_STATE");
        initialState.setObjects(gameState.getGameObjects());
        initialState.setGameOver(gameState.isGameOver());
        initialState.setPlayerScores(gameState.getPlayerScores());
        sendMessage(initialState);
        ServerLogger.log("Estado inicial del juego enviado al jugador: " + playerId);
    }

    @Override
    public void run() {
        try {
            while (running && !socket.isClosed()) {
                try {
                    Object obj = in.readObject();
                    if (obj instanceof Message) {
                        Message message = (Message) obj;
                        ServerLogger.log("Mensaje recibido del jugador " + playerId + ": " + message);

                        if (message.getAction().equals("PLAYER_INPUT")) {
                            ServerLogger.log("Entrada del jugador " + playerId + ": " + message.getInput());
                            gameState.handleInput(playerId, message.getInput());

                            // Send immediate update after input
                            sendMessage(createUpdateMessage());
                        }
                    } else {
                        ServerLogger.error("Received unknown object type from player " + playerId + ": " + (obj != null ? obj.getClass().getName() : "null"), null);
                    }
                } catch (ClassNotFoundException e) {
                    ServerLogger.error("Error reading message from client " + playerId + ": " + e.getMessage(), e);
                } catch (SocketTimeoutException e) {
                    ServerLogger.log("Tiempo de espera del socket para el jugador " + playerId + " - verificando estado de la conexión");
                    if (!checkConnection()) {
                        throw new IOException("Client not responding");
                    }
                }
            }
        } catch (IOException e) {
            ServerLogger.error("Client " + playerId + " disconnected: " + e.getMessage(), null);
        } finally {
            disconnect();
        }
    }

    private boolean checkConnection() {
        try {
            if (socket.isClosed() || !socket.isConnected()) {
                return false;
            }
            // Send a ping message to check if client is still responsive
            Message ping = new Message("PING");
            sendMessage(ping);
            return true;
        } catch (IOException e) {
            ServerLogger.error("Connection check failed for player " + playerId + ": " + e.getMessage(), e);
            return false;
        }
    }

    private Message createUpdateMessage() {
        Message update = new Message("UPDATE_STATE");
        update.setObjects(gameState.getGameObjects());
        update.setGameOver(gameState.isGameOver());
        update.setPlayerScores(gameState.getPlayerScores());
        return update;
    }

    public void sendMessage(Message message) throws IOException {
        if (socket.isClosed()) {
            throw new IOException("Socket is closed for player " + playerId);
        }

        try {
            synchronized (out) {
                out.writeObject(message);
                out.flush();
                out.reset();
            }
        } catch (IOException e) {
            ServerLogger.error("Error sending message to client " + playerId + ": " + e.getMessage(), e);
            disconnect();
            throw e;
        }
    }

    private void disconnect() {
        running = false;
        closeResources();
        gameState.removePlayer(playerId);
        ServerLogger.log("Manejador de cliente para el jugador " + playerId + " desconectado");
    }

    private void closeResources() {
        try {
            if (in != null) {
                in.close();
            }
        } catch (IOException e) {
            ServerLogger.error("Error closing input stream for player " + playerId + ": " + e.getMessage(), e);
        }
        try {
            if (out != null) {
                out.close();
            }
        } catch (IOException e) {
            ServerLogger.error("Error closing output stream for player " + playerId + ": " + e.getMessage(), e);
        }
        try {
            if (socket != null && !socket.isClosed()) {
                socket.close();
                ServerLogger.log("Socket del cliente cerrado para el jugador: " + playerId);
            }
        } catch (IOException e) {
            ServerLogger.error("Error closing socket for player " + playerId + ": " + e.getMessage(), e);
        }
    }

    @Override
    public void interrupt() {
        super.interrupt();
        disconnect();
    }
}
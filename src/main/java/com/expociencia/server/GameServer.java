package com.expociencia.server;

import java.net.*;
import java.util.*;
import java.io.*;
import java.util.concurrent.ConcurrentHashMap;
import com.google.gson.Gson;
import java.util.concurrent.CopyOnWriteArraySet;
import java.net.InetSocketAddress;
import com.expociencia.game.GameState;
import com.expociencia.messages.Message;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

public class GameServer extends WebSocketServer {

    private GameState gameState;
    private Timer gameTimer;
    private int updateInterval = 150;

    // Almacena conexiones (clientes) que se han unido al juego
    private Map<WebSocket, Integer> playerConnections = new ConcurrentHashMap<>();
    private int nextPlayerId = 0;
    private Gson gson = new Gson();

    public GameServer(int port) throws IOException {
        super(new InetSocketAddress(port));
        gameState = new GameState();
        ServerLogger.log("Servidor WebSocket iniciado en el puerto " + port);
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        // NO añadir al jugador todavía. Solo esperar a que envíe su nombre.
        ServerLogger.log("Nueva conexión entrante: " + conn.getRemoteSocketAddress());
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        Integer playerId = playerConnections.remove(conn);
        if (playerId != null) {
            gameState.removePlayer(playerId);
            ServerLogger.log("Cliente desconectado: Jugador " + playerId);
            broadcastState(); // Notificar a todos que el jugador se fue
        } else {
            ServerLogger.log("Conexión (no unida) cerrada: " + conn.getRemoteSocketAddress());
        }
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        try {
            Message inputMessage = gson.fromJson(message, Message.class);
            Integer playerId = playerConnections.get(conn); // Puede ser null si aún no se une

            // --- Lógica de Mensajes Múltiples ---
            switch (inputMessage.getAction()) {
                case "JOIN_GAME":
                    if (playerId == null) { // Nuevo jugador
                        int newPlayerId = nextPlayerId++;
                        playerConnections.put(conn, newPlayerId);

                        String playerName = inputMessage.getPlayerName();
                        if (playerName == null || playerName.trim().isEmpty()) {
                            playerName = "Player " + newPlayerId;
                        }
                        // Truncar a 6 caracteres
                        if (playerName.length() > 6) {
                            playerName = playerName.substring(0, 6);
                        }

                        gameState.addPlayer(newPlayerId);

                        // Enviar al jugador su ID
                        Message idMessage = new Message("PLAYER_ID");
                        idMessage.setPlayerId(newPlayerId);
                        conn.send(gson.toJson(idMessage));

                        ServerLogger.log("Jugador " + newPlayerId + " (" + playerName + ") se unió.");
                        broadcastState(); // Enviar estado del lobby a todos
                    }
                    break;

                case "PLAYER_INPUT":
                    if (playerId != null) {
                        gameState.handleInput(playerId, inputMessage.getInput());
                    }
                    break;

                case "START_GAME":
                    // Solo el primer jugador (ID 0) puede iniciar el juego
                    if (playerId != null && playerId == 0 && !gameState.isGameInProgress()) {
                        ServerLogger.log("Jugador 0 inició el juego.");
                        gameState.startGame();
                        broadcastState(); // Notificar a todos que el juego comenzó
                    }
                    break;

                case "RESTART_GAME":
                    // Cualquiera puede reiniciar si el juego terminó
                    if (playerId != null && gameState.isGameOver()) {
                        ServerLogger.log("Juego reiniciado por Jugador " + playerId);
                        gameState.resetGame();
                        broadcastState(); // Enviar a todos de vuelta al lobby
                    }
                    break;
            }

        } catch (Exception e) {
            ServerLogger.error("Error procesando mensaje JSON: " + message, e);
        }
    }

    @Override
    public void onError(WebSocket conn, Exception ex) {
        ServerLogger.error("Error en WebSocket", ex);
        if (conn != null) {
            onClose(conn, 0, "error", false); // Manejar el cierre
        }
    }

    @Override
    public void onStart() {
        ServerLogger.log("Servidor WebSocket arrancado exitosamente.");
    }

    // --- LÓGICA DEL JUEGO (Tus métodos) ---

    private void scheduleGameLoop() {
        if (gameTimer != null) {
            gameTimer.cancel();
        }
        gameTimer = new Timer("GameLoop");
        gameTimer.schedule(new TimerTask() {
            @Override
            public void run() {
                try {
                    gameState.update();

                    if (gameState.hasLevelChanged()) {
                        updateInterval = Math.max(50, 150 - (gameState.getCurrentLevel() - 1) * 20);
                        ServerLogger.log("Nivel cambiado. Nuevo intervalo de actualización: " + updateInterval + "ms.");
                        scheduleGameLoop(); // Re-planificar el bucle con la nueva velocidad
                        return;
                    }

                    if (!playerConnections.isEmpty()) {
                        broadcastState();
                    }
                } catch (Exception e) {
                    ServerLogger.error("Error en el bucle del juego: " + e.getMessage(), e);
                }
            }
        }, 0, this.updateInterval);
    }

    private void broadcastState() {
        if (playerConnections.isEmpty())
            return;

        Message message = new Message("UPDATE_STATE");
        message.setObjects(gameState.getGameObjects());
        message.setGameOver(gameState.isGameOver());

        // --- NUEVO ---
        message.setGameInProgress(gameState.isGameInProgress());
        message.setPlayerScores(gameState.getPlayerScores());
        message.setPlayerNames(gameState.getPlayerNames());
        // --- FIN NUEVO ---

        String jsonState = gson.toJson(message);

        for (WebSocket client : playerConnections.keySet()) {
            client.send(jsonState);
        }
    }

    @Override
    public void stop(int timeout) throws InterruptedException {
        ServerLogger.log("Deteniendo el servidor WebSocket...");

        // 1. Detener el bucle del juego
        if (gameTimer != null) {
            gameTimer.cancel();
            ServerLogger.log("Bucle del juego detenido.");
        }

        // 2. Detener el WebSocketServer (esto cierra todas las conexiones)
        super.stop(timeout);

        ServerLogger.log("Servidor detenido.");
        ServerLogger.close();
    }

    // Sobrecargamos stop() para el ShutdownHook
    public void stop() {
        try {
            stop(1000); // Espera 1 segundo
        } catch (InterruptedException e) {
            ServerLogger.error("Error al detener el servidor", e);
            Thread.currentThread().interrupt();
        }
    }

    // --- PUNTO DE ENTRADA (MAIN) ---

    public static void main(String[] args) {
        int wsPort = 12345;
        int httpPort = 8080;
        try {
            GameServer server = new GameServer(wsPort);

            // 1. Inicia el servidor WebSocket (en un hilo separado)
            server.start();
            // 'onStart()' será llamado cuando esté listo.

            // --- CORRECCIÓN: Iniciar el bucle del juego ---
            // Esto faltaba en tu código. Lo iniciamos después del servidor.
            server.scheduleGameLoop();

            // 2. Iniciar el servidor HTTP para los archivos web
            HttpServer httpServer = HttpServer.create(new InetSocketAddress(httpPort), 0);

            httpServer.createContext("/", exchange -> serveFile(exchange, "/public/index.html", "text/html"));
            httpServer.createContext("/game.js",
                    exchange -> serveFile(exchange, "/public/game.js", "application/javascript"));

            httpServer.setExecutor(null);
            httpServer.start();
            System.out.println("Servidor HTTP iniciado en puerto " + httpPort + ". ¡Listo para escanear!");

            // 3. Hook de apagado (llama al método stop() corregido)
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                System.out.println("Apagando el servidor...");
                server.stop();
            }));

        } catch (IOException e) {
            System.err.println("El servidor no pudo iniciarse: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // --- SERVIDOR DE ARCHIVOS (Sin cambios) ---

    private static void serveFile(HttpExchange exchange, String resourcePath, String contentType) throws IOException {
        InputStream is = GameServer.class.getResourceAsStream(resourcePath);

        if (is == null) {
            String response = "404 (Not Found: " + resourcePath + ")";
            exchange.sendResponseHeaders(404, response.length());
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response.getBytes());
            }
            return;
        }

        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        int nRead;
        byte[] data = new byte[1024];
        while ((nRead = is.read(data, 0, data.length)) != -1) {
            buffer.write(data, 0, nRead);
        }
        buffer.flush();
        byte[] fileBytes = buffer.toByteArray();
        is.close();

        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(200, fileBytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(fileBytes);
        }
    }
}
package com.expociencia.game;

import com.expociencia.server.ServerLogger;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class GameState {
    private static final int TILE_SIZE = 16;
    private static final int ROWS = 40;
    private static final int COLUMNS = 40;
    public static final int BOARD_WIDTH = TILE_SIZE * COLUMNS;
    public static final int BOARD_HEIGHT = TILE_SIZE * ROWS;

    // --- Estructuras de Datos (sin cambios) ---
    private final Map<Integer, List<GameObject>> snakes = new ConcurrentHashMap<>();
    private final Map<Integer, String> snakeDirections = new ConcurrentHashMap<>();
    private final Map<Integer, Boolean> playerAliveStatus = new ConcurrentHashMap<>();
    private final Map<Integer, Integer> playerScores = new ConcurrentHashMap<>();
    private final Map<Integer, Integer> snakeGrowthCounters = new ConcurrentHashMap<>();
    private final List<GameObject> fruits = Collections.synchronizedList(new ArrayList<>());
    private final List<GameObject> walls = Collections.synchronizedList(new ArrayList<>());
    private final Map<Integer, String> playerNames = new ConcurrentHashMap<>();
    private volatile boolean gameInProgress = false;

    private int currentLevel = 1;
    private boolean levelChanged = false;
    private static final int MAX_LEVEL = 5; // Puedes subir esto si quieres más niveles de velocidad
    private boolean gameOver = false;
    private final Random random = new Random();
    private final Object gameStateLock = new Object();

    public GameState() {
        // No generes frutas ni mapa hasta que el juego comience
        //loadLevelMap(1); // Carga los muros (si el nivel 1 tuviera)
    }

    // --- Lógica de Frutas (sin cambios) ---
    private void spawnInitialFruits(int numberOfFruits) {
        for (int i = 0; i < numberOfFruits; i++) {
            spawnFruit();
        }
    }
    private void spawnFruit() {
        synchronized (gameStateLock) {
            int x, y;
            boolean positionOccupied;
            do {
                positionOccupied = false;
                x = random.nextInt(COLUMNS) * TILE_SIZE;
                y = random.nextInt(ROWS) * TILE_SIZE;

                // Evitar que la fruta aparezca sobre una serpiente o sobre otra fruta
                for (List<GameObject> snake : snakes.values()) {
                    for (GameObject segment : snake) {
                        if (segment.getX() == x && segment.getY() == y) {
                            positionOccupied = true;
                            break;
                        }
                    }
                    if (positionOccupied) break;
                }
                if (!positionOccupied) {
                    for(GameObject fruit : fruits) {
                        if (fruit.getX() == x && fruit.getY() == y) {
                            positionOccupied = true;
                            break;
                        }
                    }
                }
                // Evitar muros
                if (!positionOccupied) {
                    for (GameObject wall : walls) {
                        if (wall.getX() == x && wall.getY() == y) {
                            positionOccupied = true;
                            break;
                        }
                    }
                }
            } while (positionOccupied);

            int fruitValue = random.nextInt(9) + 1; // Frutas con valor de 1 a 9
            GameObject fruit = new GameObject(x, y, TILE_SIZE, TILE_SIZE, "FRUIT", -1);
            fruit.setHealth(fruitValue); // Usamos 'health' para guardar el valor
            fruits.add(fruit);
        }
    }

    // --- Lógica de Jugadores (ACTUALIZADA) ---
    public void addPlayer(int playerId, String playerName) {
        synchronized (gameStateLock) {
            int startX = (random.nextInt(COLUMNS / 2) + COLUMNS / 4) * TILE_SIZE;
            int startY = (random.nextInt(ROWS / 2) + ROWS / 4) * TILE_SIZE;

            List<GameObject> snake = new ArrayList<>();
            GameObject head = new GameObject(startX, startY, TILE_SIZE, TILE_SIZE, "SNAKE_HEAD", playerId);
            head.setColor(getRandomColor());
            snake.add(head);
            snake.add(new GameObject(startX - TILE_SIZE, startY, TILE_SIZE, TILE_SIZE, "SNAKE_BODY", playerId));

            snakes.put(playerId, snake);
            snakeDirections.put(playerId, "RIGHT");
            playerAliveStatus.put(playerId, true);
            playerScores.putIfAbsent(playerId, 0);
            snakeGrowthCounters.put(playerId, 2);

            // Guardar nombre
            playerNames.put(playerId, playerName);

            if (gameOver) {
                gameOver = false;
            }
            ServerLogger.log("Jugador " + playerId + " (" + playerName + ") añadido.");
        }
    }

    private String getRandomColor() {
        String[] colors = {"CYAN", "MAGENTA", "YELLOW", "ORANGE", "PINK", "GREEN", "BLUE", "RED", "WHITE"};
        return colors[random.nextInt(colors.length)];
    }

    public void removePlayer(int playerId) {
        synchronized (gameStateLock) {
            snakes.remove(playerId);
            snakeDirections.remove(playerId);
            playerAliveStatus.remove(playerId);
            playerScores.remove(playerId);
            snakeGrowthCounters.remove(playerId);
            playerNames.remove(playerId); // Limpiar nombre
            ServerLogger.log("Jugador " + playerId + " eliminado.");
            checkGameOver();
        }
    }

    public void handleInput(int playerId, String input) {
        synchronized (gameStateLock) {
            if (!playerAliveStatus.getOrDefault(playerId, false)) {
                // Si está muerto, no puede mover la serpiente
                // (La lógica de RESTART está en GameServer)
                return;
            }

            String currentDirection = snakeDirections.get(playerId);
            if (input.equals("UP") && !currentDirection.equals("DOWN")) {
                snakeDirections.put(playerId, "UP");
            } else if (input.equals("DOWN") && !currentDirection.equals("UP")) {
                snakeDirections.put(playerId, "DOWN");
            } else if (input.equals("LEFT") && !currentDirection.equals("RIGHT")) {
                snakeDirections.put(playerId, "LEFT");
            } else if (input.equals("RIGHT") && !currentDirection.equals("LEFT")) {
                snakeDirections.put(playerId, "RIGHT");
            }
        }
    }

    // --- Bucle del Juego (CORREGIDO) ---
    public void update() {
        synchronized (gameStateLock) {
            // ¡IMPORTANTE! No hacer nada si el juego no ha comenzado o terminó
            if (gameOver || !gameInProgress) {
                return;
            }
            if (snakes.isEmpty() && !playerAliveStatus.isEmpty()) {
                checkGameOver();
                return;
            }

            // --- INICIO DE LA LÓGICA DE ACTUALIZACIÓN ---
            // (Este era el código que faltaba)

            // Mover cada serpiente
            for (Integer playerId : snakes.keySet()) {
                if (!playerAliveStatus.getOrDefault(playerId, false)) {
                    continue;
                }

                List<GameObject> snake = snakes.get(playerId);
                GameObject head = snake.get(0);
                String direction = snakeDirections.get(playerId);

                int newX = head.getX();
                int newY = head.getY();

                switch (direction) {
                    case "UP": newY -= TILE_SIZE; break;
                    case "DOWN": newY += TILE_SIZE; break;
                    case "LEFT": newX -= TILE_SIZE; break;
                    case "RIGHT": newX += TILE_SIZE; break;
                }

                // Lógica de "Wrap-Around" para el Nivel 1
                if (currentLevel == 1) {
                    if (newX < 0) newX = BOARD_WIDTH - TILE_SIZE;
                    if (newX >= BOARD_WIDTH) newX = 0;
                    if (newY < 0) newY = BOARD_HEIGHT - TILE_SIZE;
                    if (newY >= BOARD_HEIGHT) newY = 0;
                }

                // Detección de colisiones
                if (detectCollision(newX, newY, playerId)) {
                    eliminatePlayer(playerId);
                    continue;
                }

                GameObject newHead = new GameObject(newX, newY, TILE_SIZE, TILE_SIZE, "SNAKE_HEAD", playerId);
                newHead.setColor(head.getColor());
                head.setType("SNAKE_BODY");
                snake.add(0, newHead);

                // Comprobar si come fruta
                Iterator<GameObject> fruitIterator = fruits.iterator();
                while (fruitIterator.hasNext()) {
                    GameObject fruit = fruitIterator.next();
                    if (newHead.getX() == fruit.getX() && newHead.getY() == fruit.getY()) {
                        int fruitValue = fruit.getHealth();
                        playerScores.compute(playerId, (k, v) -> v == null ? fruitValue : v + fruitValue);
                        snakeGrowthCounters.compute(playerId, (k, v) -> v == null ? fruitValue : v + fruitValue);

                        fruitIterator.remove();
                        spawnFruit();
                        break;
                    }
                }

                // Gestionar crecimiento
                if (snakeGrowthCounters.getOrDefault(playerId, 0) > 0) {
                    snakeGrowthCounters.compute(playerId, (k, v) -> v - 1);
                } else {
                    snake.remove(snake.size() - 1);
                }
            }
            checkGameOver();
            checkLevelUp();
            // --- FIN DE LA LÓGICA DE ACTUALIZACIÓN ---
        }
    }

    // --- Lógica de Colisión y Niveles (Sin cambios) ---

    private boolean detectCollision(int x, int y, int playerId) {
        // Colisión con los bordes del tablero (solo a partir del nivel 2)
        if (currentLevel > 1 && (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT)) {
            return true;
        }

        // Colisión con los muros del nivel
        for (GameObject wall : walls) {
            if (wall.getX() == x && wall.getY() == y) {
                return true;
            }
        }

        for (Map.Entry<Integer, List<GameObject>> entry : snakes.entrySet()) {
            List<GameObject> snake = entry.getValue();
            for (int i = 0; i < snake.size(); i++) {
                GameObject segment = snake.get(i);
                if (segment.getX() == x && segment.getY() == y) {
                    if (entry.getKey().equals(playerId) && i == snake.size() - 1) {
                        // Es la punta de la cola propia, que se moverá, así que no es colisión
                        continue;
                    }
                    return true;
                }
            }
        }
        return false;
    }

    private void eliminatePlayer(int playerId) {
        playerAliveStatus.put(playerId, false);
        snakes.remove(playerId); // Eliminar la serpiente del tablero
        ServerLogger.log("Jugador " + playerId + " eliminado.");
    }

    private void checkGameOver() {
        if (playerAliveStatus.isEmpty()) return;

        long alivePlayers = playerAliveStatus.values().stream().filter(alive -> alive).count();
        int totalPlayers = playerAliveStatus.size();

        if (totalPlayers > 1 && alivePlayers <= 1) {
            gameOver = true;
            ServerLogger.log("Fin del juego. Solo queda un jugador o ninguno.");
        } else if (totalPlayers == 1 && alivePlayers == 0) {
            gameOver = true;
            ServerLogger.log("Fin del juego. El único jugador ha sido eliminado.");
        }
    }

    private void checkLevelUp() {
        // El nivel máximo ahora solo limita la velocidad
        if (currentLevel >= MAX_LEVEL) {
            return;
        }
        int totalScore = playerScores.values().stream().mapToInt(Integer::intValue).sum();
        int scoreThreshold = currentLevel * 50; // Siguiente nivel cada 50 puntos

        if (totalScore >= scoreThreshold) {
            currentLevel++;
            levelChanged = true; // Avisa a GameServer para que acelere
            ServerLogger.log("Subiendo a Nivel de Velocidad " + currentLevel);

            // --- CAMBIO AQUÍ ---
            // loadLevelMap(currentLevel); // <--- LÍNEA ELIMINADA
            // Ya no cargamos un mapa nuevo.
            // --- FIN DEL CAMBIO ---

            spawnFruit(); // Añadimos una fruta extra por subir de nivel
        }
    }

    public int getCurrentLevel() {
        return currentLevel;
    }

    public boolean hasLevelChanged() {
        if (levelChanged) {
            levelChanged = false; // Resetear bandera después de leerla
            return true;
        }
        return false;
    }

    private void loadLevelMap(int level) {
        walls.clear();
        switch (level) {
            case 1:
                // Nivel 1: Sin muros (Wraparound)
                break;
            default:
                // Si por algún error subimos de nivel, no hacemos nada
                break;
        }
        ServerLogger.log("Mapa para el Nivel " + level + " cargado con " + walls.size() + " muros.");
    }

    // --- NUEVAS FUNCIONES DE ESTADO ---
    public void startGame() {
        synchronized (gameStateLock) {
            if (gameInProgress) return; // No empezar si ya empezó

            ServerLogger.log("Iniciando el juego...");
            gameInProgress = true;
            gameOver = false;
            currentLevel = 1;
            levelChanged = false;

            // Cargar mapa y frutas AHORA
            // (Asegúrate de que los jugadores existentes no tengan puntajes)
            for (Integer playerId : playerScores.keySet()) {
                playerScores.put(playerId, 0);
                snakeGrowthCounters.put(playerId, 2);
                playerAliveStatus.put(playerId, true);
            }

            loadLevelMap(1);
            spawnInitialFruits(5 + playerNames.size()); // Más frutas si hay más jugadores
        }
    }

    public void resetGame() {
        synchronized (gameStateLock) {
            Set<Integer> playerIds = new HashSet<>(playerScores.keySet());
            Map<Integer, String> names = new HashMap<>(playerNames); // Guardar nombres

            snakes.clear();
            snakeDirections.clear();
            playerAliveStatus.clear();
            playerScores.clear();
            snakeGrowthCounters.clear();
            fruits.clear();
            walls.clear();
            playerNames.clear(); // Limpiar nombres

            // --- Resetear Banderas ---
            gameInProgress = false; // Volver al Lobby
            gameOver = false;
            currentLevel = 1;
            levelChanged = false;

            // Re-añadir jugadores (para que estén listos para la siguiente ronda)
            for (int id : playerIds) {
                addPlayer(id, names.getOrDefault(id, "Player " + id));
            }

            ServerLogger.log("Juego reiniciado. Volviendo al lobby.");
        }
    }

    // --- Getters (ACTUALIZADOS) ---

    public ArrayList<GameObject> getGameObjects() {
        synchronized (gameStateLock) {
            ArrayList<GameObject> objects = new ArrayList<>();
            // Solo mostrar objetos si el juego está en marcha O terminado
            // (pero no en el lobby)
            if (gameInProgress || gameOver) {
                for (List<GameObject> snake : snakes.values()) {
                    objects.addAll(snake);
                }
                objects.addAll(fruits);
                objects.addAll(walls);
            }
            return objects;
        }
    }

    public Map<Integer, Integer> getPlayerScores() {
        synchronized (gameStateLock) {
            return new HashMap<>(playerScores);
        }
    }

    // Nuevo getter para nombres
    public Map<Integer, String> getPlayerNames() {
        synchronized (gameStateLock) {
            return new HashMap<>(playerNames);
        }
    }

    public boolean isGameOver() {
        return gameOver;
    }

    // Nuevo getter para el estado del juego
    public boolean isGameInProgress() {
        return gameInProgress;
    }
}
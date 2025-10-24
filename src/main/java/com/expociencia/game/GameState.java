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

    // Estructuras de datos para el estado del juego Snake
    private final Map<Integer, List<GameObject>> snakes = new ConcurrentHashMap<>();
    private final Map<Integer, String> snakeDirections = new ConcurrentHashMap<>();
    private final Map<Integer, Boolean> playerAliveStatus = new ConcurrentHashMap<>();
    private final Map<Integer, Integer> playerScores = new ConcurrentHashMap<>();
    private final Map<Integer, Integer> snakeGrowthCounters = new ConcurrentHashMap<>();
    private final List<GameObject> fruits = Collections.synchronizedList(new ArrayList<>());
    private final List<GameObject> walls = Collections.synchronizedList(new ArrayList<>());

    private int currentLevel = 1;
    private boolean levelChanged = false;
    private static final int MAX_LEVEL = 5;

    private boolean gameOver = false;
    private final Random random = new Random();
    private final Object gameStateLock = new Object();

    public GameState() {
        spawnInitialFruits(5); // Iniciar con 5 frutas en el tablero
        loadLevelMap(1);
    }

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
            } while (positionOccupied);

            int fruitValue = random.nextInt(9) + 1; // Frutas con valor de 1 a 9
            GameObject fruit = new GameObject(x, y, TILE_SIZE, TILE_SIZE, "FRUIT", -1);
            fruit.setHealth(fruitValue); // Usamos 'health' para guardar el valor
            fruits.add(fruit);
        }
    }

    public void addPlayer(int playerId) {
        synchronized (gameStateLock) {
            // Crear una nueva serpiente para el jugador
            int startX = (random.nextInt(COLUMNS / 2) + COLUMNS / 4) * TILE_SIZE;
            int startY = (random.nextInt(ROWS / 2) + ROWS / 4) * TILE_SIZE;

            List<GameObject> snake = new ArrayList<>();
            GameObject head = new GameObject(startX, startY, TILE_SIZE, TILE_SIZE, "SNAKE_HEAD", playerId);
            head.setColor(getRandomColor());
            snake.add(head);
            snake.add(new GameObject(startX - TILE_SIZE, startY, TILE_SIZE, TILE_SIZE, "SNAKE_BODY", playerId));

            snakes.put(playerId, snake);
            snakeDirections.put(playerId, "RIGHT"); // Dirección inicial
            playerAliveStatus.put(playerId, true);
            playerScores.putIfAbsent(playerId, 0);
            snakeGrowthCounters.put(playerId, 2); // Crecimiento inicial de 2 segmentos

            if (gameOver) {
                gameOver = false;
            }
            ServerLogger.log("Jugador " + playerId + " añadido.");
        }
    }

    private String getRandomColor() {
        String[] colors = {"CYAN", "MAGENTA", "YELLOW", "ORANGE", "PINK", "GREEN"};
        return colors[random.nextInt(colors.length)];
    }

    public void removePlayer(int playerId) {
        synchronized (gameStateLock) {
            snakes.remove(playerId);
            snakeDirections.remove(playerId);
            playerAliveStatus.remove(playerId);
            playerScores.remove(playerId);
            snakeGrowthCounters.remove(playerId);
            ServerLogger.log("Jugador " + playerId + " eliminado.");
            checkGameOver();
        }
    }

    public void handleInput(int playerId, String input) {
        synchronized (gameStateLock) {
            if (!playerAliveStatus.getOrDefault(playerId, false)) {
                if (input.equals("RESTART")) {
                    resetGame();
                }
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

    public void update() {
        synchronized (gameStateLock) {
            if (gameOver) {
                return;
            }
            if (snakes.isEmpty() && !playerAliveStatus.isEmpty()) {
                 checkGameOver();
                 return;
            }


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
        }
    }

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
        snakes.remove(playerId);
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
        if (currentLevel >= MAX_LEVEL) {
            return;
        }
        int totalScore = playerScores.values().stream().mapToInt(Integer::intValue).sum();
        int scoreThreshold = currentLevel * 50; // Siguiente nivel cada 50 puntos de score total

        if (totalScore >= scoreThreshold) {
            currentLevel++;
            levelChanged = true;
            ServerLogger.log("Subiendo al Nivel " + currentLevel);
            loadLevelMap(currentLevel);
            spawnFruit();
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
                // Nivel 1: Sin muros
                break;
            case 2:
                // Nivel 2: Un borde simple
                for (int i = 0; i < COLUMNS; i++) {
                    walls.add(new GameObject(i * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE, "WALL", -1));
                    walls.add(new GameObject(i * TILE_SIZE, (ROWS - 1) * TILE_SIZE, TILE_SIZE, TILE_SIZE, "WALL", -1));
                }
                for (int i = 1; i < ROWS - 1; i++) {
                    walls.add(new GameObject(0, i * TILE_SIZE, TILE_SIZE, TILE_SIZE, "WALL", -1));
                    walls.add(new GameObject((COLUMNS - 1) * TILE_SIZE, i * TILE_SIZE, TILE_SIZE, TILE_SIZE, "WALL", -1));
                }
                break;
            case 3:
                // Nivel 3: Dos barreras verticales
                for (int i = 0; i < ROWS / 2 - 2; i++) {
                    walls.add(new GameObject(COLUMNS / 3 * TILE_SIZE, (ROWS / 4 + i) * TILE_SIZE, TILE_SIZE, TILE_SIZE, "WALL", -1));
                    walls.add(new GameObject(COLUMNS * 2 / 3 * TILE_SIZE, (ROWS / 4 + i) * TILE_SIZE, TILE_SIZE, TILE_SIZE, "WALL", -1));
                }
                break;
            case 4:
                // Nivel 4: Un laberinto simple
                for (int i = 5; i < COLUMNS - 5; i++) {
                    walls.add(new GameObject(i * TILE_SIZE, 5 * TILE_SIZE, TILE_SIZE, TILE_SIZE, "WALL", -1));
                    walls.add(new GameObject(i * TILE_SIZE, (ROWS - 6) * TILE_SIZE, TILE_SIZE, TILE_SIZE, "WALL", -1));
                }
                break;
            case 5:
                // Nivel 5: Cajas concéntricas
                for (int i = 3; i < COLUMNS - 3; i++) {
                    walls.add(new GameObject(i * TILE_SIZE, 3 * TILE_SIZE, TILE_SIZE, TILE_SIZE, "WALL", -1));
                    walls.add(new GameObject(i * TILE_SIZE, (ROWS - 4) * TILE_SIZE, TILE_SIZE, TILE_SIZE, "WALL", -1));
                }
                for (int i = 4; i < ROWS - 4; i++) {
                    walls.add(new GameObject(3 * TILE_SIZE, i * TILE_SIZE, TILE_SIZE, TILE_SIZE, "WALL", -1));
                    walls.add(new GameObject((COLUMNS - 4) * TILE_SIZE, i * TILE_SIZE, TILE_SIZE, TILE_SIZE, "WALL", -1));
                }
                 for (int i = 8; i < COLUMNS - 8; i++) {
                    walls.add(new GameObject(i * TILE_SIZE, 8 * TILE_SIZE, TILE_SIZE, TILE_SIZE, "WALL", -1));
                    walls.add(new GameObject(i * TILE_SIZE, (ROWS - 9) * TILE_SIZE, TILE_SIZE, TILE_SIZE, "WALL", -1));
                }
                break;
        }
        ServerLogger.log("Mapa para el Nivel " + level + " cargado con " + walls.size() + " muros.");
    }

    public void resetGame() {
        synchronized (gameStateLock) {
            Set<Integer> playerIds = new HashSet<>(playerScores.keySet());
            snakes.clear();
            snakeDirections.clear();
            playerAliveStatus.clear();
            playerScores.clear();
            snakeGrowthCounters.clear();
            fruits.clear();
            walls.clear();

            spawnInitialFruits(5);
            loadLevelMap(1);
            for (int id : playerIds) {
                addPlayer(id);
            }
            gameOver = false;
            currentLevel = 1;
            levelChanged = false;
            ServerLogger.log("Juego reiniciado.");
        }
    }

    public ArrayList<GameObject> getGameObjects() {
        synchronized (gameStateLock) {
            ArrayList<GameObject> objects = new ArrayList<>();
            for (List<GameObject> snake : snakes.values()) {
                objects.addAll(snake);
            }
            objects.addAll(fruits);
            objects.addAll(walls);
            return objects;
        }
    }

    public Map<Integer, Integer> getPlayerScores() {
        synchronized (gameStateLock) {
            return new HashMap<>(playerScores);
        }
    }

    public boolean isGameOver() {
        return gameOver;
    }
}
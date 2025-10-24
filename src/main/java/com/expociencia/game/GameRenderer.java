package com.expociencia.game;

import java.awt.*;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

public class GameRenderer {

    public void render(Graphics g, ArrayList<GameObject> objects, Map<Integer, Integer> playerScores, boolean gameOver, int ownPlayerId) {
        Graphics2D g2d = (Graphics2D) g;
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Dibujar todos los objetos del juego
        for (GameObject obj : objects) {
            switch (obj.getType()) {
                case "SNAKE_HEAD":
                    drawSnakeSegment(g2d, obj, true);
                    break;
                case "SNAKE_BODY":
                    drawSnakeSegment(g2d, obj, false);
                    break;
                case "FRUIT":
                    drawFruit(g2d, obj);
                    break;
                case "WALL":
                    drawWall(g2d, obj);
                    break;
            }
        }

        // Dibujar el tablero de puntuaciones
        drawScoreboard(g2d, playerScores, ownPlayerId);

        // Dibujar el mensaje de Game Over
        if (gameOver) {
            g2d.setColor(Color.RED);
            g2d.setFont(new Font("Arial", Font.BOLD, 48));
            FontMetrics metrics = g.getFontMetrics();
            String gameOverMsg = "Game Over";
            g2d.drawString(gameOverMsg, (GameState.BOARD_WIDTH - metrics.stringWidth(gameOverMsg)) / 2, GameState.BOARD_HEIGHT / 2);

            g2d.setFont(new Font("Arial", Font.PLAIN, 20));
            metrics = g.getFontMetrics();
            String restartMsg = "Press ENTER to play again";
            g2d.drawString(restartMsg, (GameState.BOARD_WIDTH - metrics.stringWidth(restartMsg)) / 2, GameState.BOARD_HEIGHT / 2 + 30);
        }
    }

    private Color parseColor(String colorName) {
        if (colorName == null) return Color.WHITE;
        switch (colorName.toUpperCase()) {
            case "CYAN": return Color.CYAN;
            case "MAGENTA": return Color.MAGENTA;
            case "YELLOW": return Color.YELLOW;
            case "ORANGE": return Color.ORANGE;
            case "PINK": return Color.PINK;
            case "GREEN": return Color.GREEN;
            default: return Color.WHITE;
        }
    }

    private void drawSnakeSegment(Graphics2D g, GameObject segment, boolean isHead) {
        g.setColor(parseColor(segment.getColor()));
        g.fillRect(segment.getX(), segment.getY(), segment.getWidth(), segment.getHeight());

        g.setColor(Color.DARK_GRAY);
        g.drawRect(segment.getX(), segment.getY(), segment.getWidth(), segment.getHeight());

        if (isHead) {
            g.setColor(Color.BLACK);
            g.fillOval(segment.getX() + 3, segment.getY() + 3, 4, 4);
            g.fillOval(segment.getX() + segment.getWidth() - 7, segment.getY() + 3, 4, 4);
        }
    }

    private void drawFruit(Graphics2D g, GameObject fruit) {
        g.setColor(Color.RED);
        g.fillOval(fruit.getX(), fruit.getY(), fruit.getWidth(), fruit.getHeight());

        g.setColor(Color.WHITE);
        g.setFont(new Font("Arial", Font.BOLD, 12));
        String value = String.valueOf(fruit.getHealth());
        FontMetrics metrics = g.getFontMetrics();
        int x = fruit.getX() + (fruit.getWidth() - metrics.stringWidth(value)) / 2;
        int y = fruit.getY() + ((fruit.getHeight() - metrics.getHeight()) / 2) + metrics.getAscent();
        g.drawString(value, x, y);
    }

    private void drawScoreboard(Graphics2D g, Map<Integer, Integer> scores, int ownPlayerId) {
        g.setFont(new Font("Arial", Font.BOLD, 14));
        g.setColor(new Color(0, 0, 0, 128)); // Fondo semitransparente
        g.fillRect(5, 5, 120, 20 + (scores.size() * 15));

        g.setColor(Color.WHITE);
        int y = 20;
        g.drawString("Scores:", 10, y);
        y += 20;

        List<Map.Entry<Integer, Integer>> sortedScores = scores.entrySet().stream()
            .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
            .collect(Collectors.toList());

        for (Map.Entry<Integer, Integer> entry : sortedScores) {
            String scoreText = "Player " + entry.getKey() + ": " + entry.getValue();
            if (entry.getKey() == ownPlayerId) {
                g.setColor(Color.YELLOW);
                g.drawString("-> " + scoreText, 10, y);
            } else {
                g.setColor(Color.WHITE);
                g.drawString(scoreText, 10, y);
            }
            y += 15;
        }
    }

    private void drawWall(Graphics2D g, GameObject wall) {
        g.setColor(Color.GRAY);
        g.fillRect(wall.getX(), wall.getY(), wall.getWidth(), wall.getHeight());
    }
}
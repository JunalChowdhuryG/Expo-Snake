package com.expociencia.messages;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import com.expociencia.game.GameObject;

public class Message implements Serializable {
    private static final long serialVersionUID = 4L; // Versión actualizada

    private String action; // e.g., "JOIN_GAME", "PLAYER_INPUT", "START_GAME", "RESTART_GAME"
    private ArrayList<GameObject> objects;
    private boolean gameOver;
    private String input; // e.g., "UP", "DOWN"
    private int playerId;

    // --- NUEVOS CAMPOS ---
    private String playerName; // Para enviar el nombre del jugador al unirse
    private Map<Integer, Integer> playerScores = new HashMap<>();
    private Map<Integer, String> playerNames = new HashMap<>(); // Para la tabla de puntuación
    private boolean gameInProgress; // Para saber si estamos en el lobby o jugando

    public Message(String action) {
        this.action = action;
        this.objects = new ArrayList<>();
        this.gameOver = false;
        this.input = "";
        this.playerId = -1;
    }

    // --- Getters y Setters para todos los campos ---
    // (Asegúrate de tenerlos para todos: action, objects, gameOver, input,
    // playerId,
    // playerName, playerScores, playerNames, gameInProgress)

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public ArrayList<GameObject> getObjects() {
        return objects;
    }

    public void setObjects(ArrayList<GameObject> objects) {
        this.objects = objects;
    }

    public boolean isGameOver() {
        return gameOver;
    }

    public void setGameOver(boolean gameOver) {
        this.gameOver = gameOver;
    }

    public String getInput() {
        return input;
    }

    public void setInput(String input) {
        this.input = input;
    }

    public int getPlayerId() {
        return playerId;
    }

    public void setPlayerId(int playerId) {
        this.playerId = playerId;
    }

    public String getPlayerName() {
        return playerName;
    }

    public void setPlayerName(String playerName) {
        this.playerName = playerName;
    }

    public Map<Integer, Integer> getPlayerScores() {
        return playerScores;
    }

    public void setPlayerScores(Map<Integer, Integer> playerScores) {
        this.playerScores = playerScores;
    }

    public Map<Integer, String> getPlayerNames() {
        return playerNames;
    }

    public void setPlayerNames(Map<Integer, String> playerNames) {
        this.playerNames = playerNames;
    }

    public boolean isGameInProgress() {
        return gameInProgress;
    }

    public void setGameInProgress(boolean gameInProgress) {
        this.gameInProgress = gameInProgress;
    }
}
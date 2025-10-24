package com.expociencia.client;
import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.util.Random;
import com.expociencia.game.GameObject;
import com.expociencia.game.GameRenderer;

public class GameClient extends JPanel implements KeyListener {
    private ClientNetworkHandler networkHandler;
    private GameRenderer renderer;
    private int playerId;
    private boolean connectedToServer = false;
    private boolean playerEliminated = false;

    public GameClient(String ip, int port) throws Exception {
        setPreferredSize(new Dimension(640, 640)); // Aumentado a 40x40 tiles * 16px
        setBackground(Color.black);
        setFocusable(true);
        addKeyListener(this);

        try {
            networkHandler = new ClientNetworkHandler(ip, port);
            networkHandler.setClient(this);
            renderer = new GameRenderer();
            playerId = networkHandler.getPlayerId();
            connectedToServer = true;
            networkHandler.start();
            System.out.println("Cliente inicializado para playerId: " + playerId);
        } catch (Exception e) {
            System.err.println("Falló la inicialización del cliente: " + e.getMessage());
            throw e;
        }
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        if (connectedToServer) {
            renderer.render(g, networkHandler.getGameObjects(), networkHandler.getPlayerScores(), networkHandler.isGameOver(), playerId);

            boolean playerSnakeExists = false;
            for (GameObject obj : networkHandler.getGameObjects()) {
                if (obj.getType().equals("SNAKE_HEAD") && obj.getPlayerId() == playerId) {
                    playerSnakeExists = true;
                    break;
                }
            }
            playerEliminated = !playerSnakeExists;

        } else {
            g.setColor(Color.RED);
            g.setFont(new Font("Arial", Font.BOLD, 24));
            g.drawString("Desconectado del servidor", 100, 250);
            g.setFont(new Font("Arial", Font.PLAIN, 16));
            g.drawString("Reinicia la aplicación para volver a conectar", 80, 280);
        }
    }

    @Override
    public void keyPressed(KeyEvent e) {
        if (!connectedToServer) return;

        if (playerEliminated && e.getKeyCode() != KeyEvent.VK_ENTER) {
            return;
        }

        if (networkHandler.isGameOver()) {
            if (e.getKeyCode() == KeyEvent.VK_ENTER) {
                networkHandler.sendInput("RESTART");
                playerEliminated = false;
                return;
            }
        }

        switch (e.getKeyCode()) {
            case KeyEvent.VK_UP:
                networkHandler.sendInput("UP");
                break;
            case KeyEvent.VK_DOWN:
                networkHandler.sendInput("DOWN");
                break;
            case KeyEvent.VK_LEFT:
                networkHandler.sendInput("LEFT");
                break;
            case KeyEvent.VK_RIGHT:
                networkHandler.sendInput("RIGHT");
                break;
        }
    }

    @Override
    public void keyTyped(KeyEvent e) {}

    @Override
    public void keyReleased(KeyEvent e) {}

    public void connectionLost() {
        connectedToServer = false;
        repaint();
        JOptionPane.showMessageDialog(this,
                "Se ha perdido la conexión con el servidor.\nReinicia la aplicación para volver a conectar.",
                "Error de Conexión", JOptionPane.ERROR_MESSAGE);
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            String ip = JOptionPane.showInputDialog("Introduce la dirección IP del servidor:", "localhost");
            if (ip == null || ip.trim().isEmpty()) {
                System.exit(0);
            }
            int port = 12345;
            JFrame frame = new JFrame("Snake vs Snakes - Cliente");
            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            frame.setResizable(false);
            try {
                GameClient client = new GameClient(ip, port);
                frame.add(client);
                frame.pack();
                frame.setLocationRelativeTo(null);
                frame.setVisible(true);
                client.requestFocus();
            } catch (Exception e) {
                e.printStackTrace();
                JOptionPane.showMessageDialog(null,
                        "Error al conectar con el servidor: " + e.getMessage(),
                        "Error de Conexión", JOptionPane.ERROR_MESSAGE);
                System.exit(1);
            }
        });
    }
}
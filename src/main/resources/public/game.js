// --- Elementos de la UI ---
const gameContainer = document.getElementById('gameContainer');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const loginScreen = document.getElementById('loginScreen');
const lobbyScreen = document.getElementById('lobbyScreen');
const gameOverScreen = document.getElementById('gameOverScreen');

const playerNameInput = document.getElementById('playerNameInput');
const joinButton = document.getElementById('joinButton');
const playerList = document.getElementById('playerList');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');

// --- Estado del Juego (Cliente) ---
const TILE_SIZE = 16;
let myPlayerId = -1;
let playerNames = {};
let playerScores = {};
let gameObjects = [];
let isGameOver = false;
let isGameInProgress = false;
let ws; // WebSocket

// --- Pantalla de Login (Inicio) ---
joinButton.onclick = () => {
    let playerName = playerNameInput.value.trim().toUpperCase();
    if (playerName.length === 0) {
        playerName = "PLAYER";
    }
    // Trunca a 6 caracteres (aunque el input ya tiene maxlength)
    playerName = playerName.substring(0, 6);

    // Conectar al servidor AHORA
    connectWebSocket(playerName);
};

// --- Conexión WebSocket ---
function connectWebSocket(playerName) {
    // Obtiene la IP/host del navegador y se conecta al puerto WebSocket
    ws = new WebSocket(`ws://${window.location.hostname}:12345`);

    ws.onopen = () => {
        console.log('Conectado al servidor WebSocket. Enviando datos de unión...');
        // 1. Enviar mensaje de "unión" con el nombre
        sendCommand("JOIN_GAME", { playerName: playerName });
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        switch (message.action) {
            case "PLAYER_ID":
                // 2. El servidor nos da nuestro ID
                myPlayerId = message.playerId;
                console.log('Asignado Player ID: ' + myPlayerId);
                // Ir al lobby
                loginScreen.classList.add('hidden');
                lobbyScreen.classList.remove('hidden');
                break;

            case "UPDATE_STATE":
                // 3. Recibir actualización de estado (Lobby, Juego, o Fin)
                gameObjects = message.objects;
                isGameOver = message.gameOver;
                isGameInProgress = message.gameInProgress;
                playerNames = message.playerNames;
                playerScores = message.playerScores;

                // Actualizar la UI basado en el estado
                updateUI();
                break;
        }
    };

    ws.onclose = () => {
        console.log('Desconectado del servidor');
        // Mostrar un error en la pantalla de login
        loginScreen.classList.remove('hidden');
        lobbyScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        canvas.classList.add('hidden');
        loginScreen.querySelector('h2').innerText = '¡Desconectado! Refresca la página.';
        loginScreen.querySelector('h2').style.color = '#F44336';
    };
}

// --- Envío de Comandos al Servidor ---
function sendCommand(action, data = {}) {
    const message = {
        action: action,
        ...data // Añade datos (ej. playerName, input)
    };
    ws.send(JSON.stringify(message));
}

// --- Manejador Principal de UI ---
function updateUI() {
    // Ocultar canvas por defecto
    canvas.style.display = "none";

    if (isGameOver) {
        // --- ESTADO 3: Fin del Juego ---
        lobbyScreen.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
        // Mostrar el canvas detrás del overlay de Game Over
        canvas.style.display = "block";
        renderGame(); // Dibuja el estado final del juego
    }
    else if (isGameInProgress) {
        // --- ESTADO 2: Juego en Progreso ---
        loginScreen.classList.add('hidden');
        lobbyScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');

        // ¡Mostrar el canvas y dibujar el juego!
        canvas.style.display = "block";
        renderGame();
    }
    else {
        // --- ESTADO 1: Lobby ---
        loginScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        lobbyScreen.classList.remove('hidden');

        // Actualizar lista de jugadores en el lobby
        playerList.innerHTML = ''; // Limpiar lista
        Object.keys(playerNames).forEach(id => {
            const li = document.createElement('li');
            li.textContent = playerNames[id];
            playerList.appendChild(li);
        });

        // Mostrar botón de "Start" SOLO al Host (Jugador 0)
        if (myPlayerId === 0) {
            startButton.classList.remove('hidden');
        } else {
            startButton.classList.add('hidden');
        }
    }
}

// --- Botones del Lobby y Game Over ---
startButton.onclick = () => {
    sendCommand("START_GAME");
};

restartButton.onclick = () => {
    sendCommand("RESTART_GAME");
};

// --- CONTROLES DE TECLADO (Para Laptops) ---
document.addEventListener('keydown', (e) => {
    if (e.key.startsWith("Arrow") || e.key === "Enter") {
        e.preventDefault();
    }

    // Si el juego no está en marcha, no enviar inputs de movimiento
    if (!isGameInProgress || isGameOver) {
        // Permitir "Enter" para reiniciar desde el teclado
        if (isGameOver && e.key === "Enter") {
            sendCommand("RESTART_GAME");
        }
        return;
    }

    switch (e.key) {
        case 'ArrowUp': sendCommand("PLAYER_INPUT", { input: "UP" }); break;
        case 'ArrowDown': sendCommand("PLAYER_INPUT", { input: "DOWN" }); break;
        case 'ArrowLeft': sendCommand("PLAYER_INPUT", { input: "LEFT" }); break;
        case 'ArrowRight': sendCommand("PLAYER_INPUT", { input: "RIGHT" }); break;
    }
});

// --- ¡NUEVO! CONTROLES TÁCTILES (Para Móviles) ---

let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); touchStartX = e.changedTouches[0].screenX; touchStartY = e.changedTouches[0].screenY; }, { passive: false });
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });
canvas.addEventListener('touchend', (e) => {
    e.preventDefault();

    // Si el juego no está en marcha, no hacer nada
    if (!isGameInProgress || isGameOver) return;

    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;
    handleSwipe(touchEndX - touchStartX, touchEndY - touchStartY);
}, { passive: false });



function handleSwipe(deltaX, deltaY) {
    const minSwipeDistance = 40; // Menos distancia para más sensibilidad

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > minSwipeDistance) sendCommand("PLAYER_INPUT", { input: "RIGHT" });
        else if (deltaX < -minSwipeDistance) sendCommand("PLAYER_INPUT", { input: "LEFT" });
    } else {
        if (deltaY > minSwipeDistance) sendCommand("PLAYER_INPUT", { input: "DOWN" });
        else if (deltaY < -minSwipeDistance) sendCommand("PLAYER_INPUT", { input: "UP" });
    }
}

// --- LÓGICA DE RENDERIZADO (Reemplazo de GameRenderer.java) ---

function renderGame() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameObjects) {
        for (const obj of gameObjects) {
            const isOwnSnake = (obj.playerId === myPlayerId);
            switch (obj.type) {
                case 'SNAKE_HEAD':
                    drawSnakeSegment(obj, true, isOwnSnake);
                    break;
                case 'SNAKE_BODY':
                    drawSnakeSegment(obj, false, isOwnSnake);
                    break;
                case 'FRUIT':
                    drawFruit(obj);
                    break;
                case 'WALL':
                    drawWall(obj);
                    break;
            }
        }
    }
    // Pasar los nombres de los jugadores al scoreboard
    drawScoreboard(playerScores || {}, playerNames || {}, myPlayerId);
}

function parseColor(colorName) {
    if (!colorName) return 'white';
    return colorName.toLowerCase();
}

function drawSnakeSegment(segment, isHead, isOwnSnake) {
    ctx.fillStyle = parseColor(segment.color);
    ctx.fillRect(segment.x, segment.y, segment.width, segment.height);

    // --- ¡NUEVO! Identificador de Jugador ---
    if (isOwnSnake) {
        ctx.strokeStyle = 'yellow'; // Borde amarillo brillante
        ctx.lineWidth = 2;
    } else {
        ctx.strokeStyle = 'darkgray';
        ctx.lineWidth = 1;
    }
    ctx.strokeRect(segment.x, segment.y, segment.width, segment.height);
    // --- FIN NUEVO ---

    if (isHead) {
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(segment.x + 5, segment.y + 5, 2, 0, 2 * Math.PI);
        ctx.arc(segment.x + segment.width - 5, segment.y + 5, 2, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function drawFruit(fruit) {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    // Dibuja un círculo para la fruta
    ctx.arc(fruit.x + TILE_SIZE / 2, fruit.y + TILE_SIZE / 2, TILE_SIZE / 2, 0, 2 * Math.PI);
    ctx.fill();

    // Mostrar el valor de la fruta
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fruit.health, fruit.x + TILE_SIZE / 2, fruit.y + TILE_SIZE / 2 + 1);
}

function drawWall(wall) {
    ctx.fillStyle = 'gray';
    ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
}

function drawScoreboard(scores, names, ownId) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(5, 5, 130, 20 + (Object.keys(scores).length * 15));

    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Scores:', 10, 10);

    let y = 30;

    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    for (const [id, score] of sortedScores) {
        let idNum = parseInt(id, 10);
        // --- ¡NUEVO! Mostrar Nombre ---
        let name = names[idNum] || 'Player ' + idNum;

        ctx.fillStyle = (idNum === ownId) ? 'yellow' : 'white';
        ctx.fillText(`${name}: ${score}`, 10, y);
        y += 15;
    }
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'red';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Press ENTER or TAP to play again', canvas.width / 2, canvas.height / 2 + 30);
}

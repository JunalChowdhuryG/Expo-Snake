// --- Configuración del Canvas ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 16; // De GameState.java
let ownPlayerId = -1;
let gameObjects = [];
let playerScores = {};
let isGameOver = false;

// --- Configuración del WebSocket ---
// Obtiene la IP/host del navegador (ej. 192.168.1.12)
// y se conecta al puerto WebSocket (12345)
const ws = new WebSocket(`ws://${window.location.hostname}:12345`);

ws.onopen = () => {
    console.log('Conectado al servidor WebSocket');
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.action === 'PLAYER_ID') {
        ownPlayerId = message.playerId;
        console.log('Mi ID de jugador es: ' + ownPlayerId);
    }
    else if (message.action === 'UPDATE_STATE') {
        gameObjects = message.objects;
        isGameOver = message.gameOver;
        playerScores = message.playerScores;

        // Volver a dibujar el juego con los datos nuevos
        renderGame();
    }
};

ws.onclose = () => {
    console.log('Desconectado del servidor');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'red';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Desconectado del Servidor', canvas.width / 2, canvas.height / 2);
};

// --- Función de Envío de Input ---
function sendInput(input) {
    // No enviar movimiento si el juego terminó (excepto RESTART)
    if (isGameOver && input !== 'RESTART') return;

    const message = {
        action: 'PLAYER_INPUT',
        input: input
    };
    ws.send(JSON.stringify(message));
}

// --- CONTROLES DE TECLADO (Para Laptops) ---
document.addEventListener('keydown', (e) => {
    // Evita que las flechas muevan la página web
    if (e.key.startsWith("Arrow") || e.key === "Enter") {
        e.preventDefault();
    }

    switch (e.key) {
        case 'ArrowUp': sendInput('UP'); break;
        case 'ArrowDown': sendInput('DOWN'); break;
        case 'ArrowLeft': sendInput('LEFT'); break;
        case 'ArrowRight': sendInput('RIGHT'); break;
        case 'Enter':
            if (isGameOver) sendInput('RESTART');
            break;
    }
});

// --- ¡NUEVO! CONTROLES TÁCTILES (Para Móviles) ---

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

// Evita que el navegador haga "scroll" o "zoom"
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}, { passive: false });

function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 50; // Mínimo de 50px para contar como swipe

    // Comprobar si el swipe fue más horizontal que vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > minSwipeDistance) {
            sendInput('RIGHT');
        } else if (deltaX < -minSwipeDistance) {
            sendInput('LEFT');
        }
    }
    // Fue más vertical
    else {
        if (deltaY > minSwipeDistance) {
            sendInput('DOWN');
        } else if (deltaY < -minSwipeDistance) {
            sendInput('UP');
        }
    }

    // Si el usuario toca "Enter" en el teclado virtual (ej. en Game Over)
    if (isGameOver && deltaX === 0 && deltaY === 0) {
        sendInput('RESTART');
    }
}


// --- LÓGICA DE RENDERIZADO (Reemplazo de GameRenderer.java) ---

function renderGame() {
    // Limpiar pantalla
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar objetos
    if (gameObjects) {
        for (const obj of gameObjects) {
            switch (obj.type) {
                case 'SNAKE_HEAD':
                    drawSnakeSegment(obj, true);
                    break;
                case 'SNAKE_BODY':
                    drawSnakeSegment(obj, false);
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

    drawScoreboard(playerScores || {}, ownPlayerId);

    if (isGameOver) {
        drawGameOver();
    }
}

function parseColor(colorName) {
    if (!colorName) return 'white';
    return colorName.toLowerCase();
}

function drawSnakeSegment(segment, isHead) {
    ctx.fillStyle = parseColor(segment.color);
    ctx.fillRect(segment.x, segment.y, segment.width, segment.height);
    ctx.strokeStyle = 'darkgray';
    ctx.strokeRect(segment.x, segment.y, segment.width, segment.height);

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

function drawScoreboard(scores, ownId) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(5, 5, 120, 20 + (Object.keys(scores).length * 15));

    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Scores:', 10, 10);

    let y = 30;

    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    for (const [id, score] of sortedScores) {
        let idNum = parseInt(id, 10);
        ctx.fillStyle = (idNum === ownId) ? 'yellow' : 'white';
        ctx.fillText(`Player ${id}: ${score}`, 10, y);
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

// --- Configuración del Canvas ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerScoreEl = document.getElementById('player-score');
const highScoreEl = document.getElementById('high-score');
const muteButton = document.getElementById('mute-button');
const volumeOnIcon = document.getElementById('volume-on');
const volumeOffIcon = document.getElementById('volume-off');

const TILE_SIZE = 16;
let ownPlayerId = -1;
let gameObjects = [];
let playerScores = {};
let isGameOver = false;
let isMuted = false;
let highScore = localStorage.getItem('snakeHighScore') || 0;
highScoreEl.textContent = highScore;

// --- Configuración del WebSocket ---
const ws = new WebSocket(`ws://${window.location.hostname}:12345`);

ws.onopen = () => {
    console.log('Conectado al servidor WebSocket');
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.action === 'PLAYER_ID') {
        ownPlayerId = message.playerId;
    } else if (message.action === 'UPDATE_STATE') {
        gameObjects = message.objects;
        isGameOver = message.gameOver;
        playerScores = message.playerScores;
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
    if (isGameOver && input !== 'RESTART') return;
    ws.send(JSON.stringify({ action: 'PLAYER_INPUT', input: input }));
}

// --- CONTROLES ---
document.addEventListener('keydown', (e) => {
    if (e.key.startsWith("Arrow") || e.key === "Enter") e.preventDefault();
    switch (e.key) {
        case 'ArrowUp': sendInput('UP'); break;
        case 'ArrowDown': sendInput('DOWN'); break;
        case 'ArrowLeft': sendInput('LEFT'); break;
        case 'ArrowRight': sendInput('RIGHT'); break;
        case 'Enter': if (isGameOver) sendInput('RESTART'); break;
    }
});

let touchStartX = 0;
let touchStartY = 0;
canvas.addEventListener('touchstart', e => { e.preventDefault(); touchStartX = e.changedTouches[0].screenX; touchStartY = e.changedTouches[0].screenY; }, { passive: false });
canvas.addEventListener('touchend', e => {
    e.preventDefault();
    const deltaX = e.changedTouches[0].screenX - touchStartX;
    const deltaY = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 50) sendInput('RIGHT'); else if (deltaX < -50) sendInput('LEFT');
    } else {
        if (deltaY > 50) sendInput('DOWN'); else if (deltaY < -50) sendInput('UP');
    }
    if (isGameOver && deltaX === 0 && deltaY === 0) sendInput('RESTART');
}, { passive: false });

// --- MUTE ---
muteButton.addEventListener('click', () => {
    isMuted = !isMuted;
    volumeOnIcon.style.display = isMuted ? 'none' : 'block';
    volumeOffIcon.style.display = isMuted ? 'block' : 'none';
    console.log(isMuted ? "Audio Muted" : "Audio Unmuted");
});

// --- LÓGICA DE RENDERIZADO ---
function renderGame() {
    drawBackground();
    if (gameObjects) {
        for (const obj of gameObjects) {
            switch (obj.type) {
                case 'SNAKE_HEAD': drawSnakeSegment(obj, true); break;
                case 'SNAKE_BODY': drawSnakeSegment(obj, false); break;
                case 'FRUIT': drawFruit(obj); break;
                case 'WALL': drawWall(obj); break;
            }
        }
    }
    updateScoreboard(playerScores || {}, ownPlayerId);
    if (isGameOver) drawGameOver();
}

function drawBackground() {
    for (let x = 0; x < canvas.width / TILE_SIZE; x++) {
        for (let y = 0; y < canvas.height / TILE_SIZE; y++) {
            ctx.fillStyle = (x + y) % 2 === 0 ? '#AAD751' : '#A2D149';
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
}

function drawWall(wall) {
    ctx.fillStyle = 'gray';
    ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
}

function drawSnakeSegment(segment, isHead) {
    const x = segment.x;
    const y = segment.y;
    ctx.fillStyle = '#4A75C6';
    ctx.strokeStyle = '#436AB3';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

    if (isHead) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(segment.name, x + TILE_SIZE / 2, y - 5);

        ctx.beginPath();
        ctx.arc(x + 4, y + 5, 2.5, 0, 2 * Math.PI);
        ctx.arc(x + TILE_SIZE - 4, y + 5, 2.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(x + 4, y + 5, 1, 0, 2 * Math.PI);
        ctx.arc(x + TILE_SIZE - 4, y + 5, 1, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function drawFruit(fruit) {
    const x = fruit.x + TILE_SIZE / 2;
    const y = fruit.y + TILE_SIZE / 2;

    switch (fruit.fruitType) {
        case 'APPLE':
            ctx.fillStyle = '#D9453B';
            ctx.beginPath();
            ctx.arc(x, y, TILE_SIZE / 2.2, 0, 2 * Math.PI);
            ctx.fill();
            break;
        case 'PEAR':
            ctx.fillStyle = '#D2E252';
            ctx.beginPath();
            ctx.moveTo(x, y - TILE_SIZE / 3);
            ctx.arc(x, y, TILE_SIZE / 2.5, 0.8 * Math.PI, 0.2 * Math.PI, false);
            ctx.closePath();
            ctx.fill();
            break;
        case 'CHERRY':
            ctx.fillStyle = '#C22323';
            ctx.beginPath();
            ctx.arc(x - 3, y, TILE_SIZE / 3, 0, 2 * Math.PI);
            ctx.arc(x + 3, y, TILE_SIZE / 3, 0, 2 * Math.PI);
            ctx.fill();
            break;
    }
}

function updateScoreboard(scores, ownId) {
    const myScore = scores[ownId] || 0;
    const currentMaxScore = Math.max(0, ...Object.values(scores));

    if (currentMaxScore > highScore) {
        highScore = currentMaxScore;
        localStorage.setItem('snakeHighScore', highScore);
    }

    playerScoreEl.textContent = myScore;
    highScoreEl.textContent = highScore;
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(170, 215, 81, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '24px Arial';
    ctx.fillText('Tap to play again', canvas.width / 2, canvas.height / 2 + 30);
}
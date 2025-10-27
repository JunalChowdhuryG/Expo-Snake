import React, { useRef, useEffect } from 'react';
import './Game.css';

const Game = ({ gameObjects, playerId, isGameOver }) => {
  const canvasRef = useRef(null);
  const TILE_SIZE = 16;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar el canvas
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar objetos del juego
    gameObjects.forEach(obj => {
      switch (obj.type) {
        case 'SNAKE_HEAD':
          drawSnakeSegment(ctx, obj, true, obj.playerId === playerId);
          break;
        case 'SNAKE_BODY':
          drawSnakeSegment(ctx, obj, false, obj.playerId === playerId);
          break;
        case 'FRUIT':
          drawFruit(ctx, obj);
          break;
        case 'WALL':
          drawWall(ctx, obj);
          break;
        default:
          break;
      }
    });
  }, [gameObjects, playerId]);

  const drawSnakeSegment = (ctx, segment, isHead, isOwnSnake) => {
    ctx.fillStyle = parseColor(segment.color);
    ctx.fillRect(segment.x, segment.y, segment.width, segment.height);

    if (isOwnSnake) {
      ctx.strokeStyle = 'yellow';
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = 'darkgray';
      ctx.lineWidth = 1;
    }
    ctx.strokeRect(segment.x, segment.y, segment.width, segment.height);

    if (isHead) {
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(segment.x + 5, segment.y + 5, 2, 0, 2 * Math.PI);
      ctx.arc(segment.x + segment.width - 5, segment.y + 5, 2, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const drawFruit = (ctx, fruit) => {
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(
      fruit.x + TILE_SIZE / 2,
      fruit.y + TILE_SIZE / 2,
      TILE_SIZE / 2,
      0,
      2 * Math.PI
    );
    ctx.fill();
  };

  const drawWall = (ctx, wall) => {
    ctx.fillStyle = '#555';
    ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
  };

  const parseColor = (colorName) => {
    if (!colorName) return 'white';
    return colorName.toLowerCase();
  };

  return (
    <div className="game-container">
      <canvas 
        ref={canvasRef} 
        width={640} 
        height={640} 
        className="game-canvas"
      />
    </div>
  );
};

export default Game;
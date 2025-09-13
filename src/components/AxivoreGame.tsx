import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, RotateCcw, Trophy, Zap, Play, Pause, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface AxivoreGameProps {
  currentMode: string;
  currentUser: string | null;
  onShowAuthModal?: () => void;
}

const GRID_SIZE = 19;
const INITIAL_SNAKE: Position[] = [{ x: 9, y: 9 }];
const INITIAL_DIRECTION: Position = { x: 1, y: 0 };

export const AxivoreGame: React.FC<AxivoreGameProps> = ({ currentMode, currentUser, onShowAuthModal }) => {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Position>(INITIAL_DIRECTION);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [speed, setSpeed] = useState(200);
  const [obstacles, setObstacles] = useState<Position[]>([]);
  const [showGame, setShowGame] = useState(false);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);


  // Generate random position that doesn't overlap with snake or obstacles
  const generateRandomPosition = useCallback((excludePositions: Position[] = []): Position => {
    let newPos: Position;
    do {
      newPos = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (
      excludePositions.some(pos => pos.x === newPos.x && pos.y === newPos.y) ||
      snake.some(segment => segment.x === newPos.x && segment.y === newPos.y)
    );
    return newPos;
  }, [snake]);

  // Generate obstacles based on level
  const generateObstacles = useCallback((currentLevel: number): Position[] => {
    const newObstacles: Position[] = [];
    
    if (currentLevel >= 5) {
      // Simple obstacles from level 5
      const simpleObstacleCount = Math.min(3 + Math.floor(currentLevel / 3), 8);
      for (let i = 0; i < simpleObstacleCount; i++) {
        newObstacles.push(generateRandomPosition([...newObstacles, food]));
      }
    }
    
    if (currentLevel >= 20) {
      // Complex obstacles from level 20 - create walls
      const wallCount = Math.min(Math.floor((currentLevel - 20) / 5) + 1, 3);
      
      for (let w = 0; w < wallCount; w++) {
        const wallLength = 3 + Math.floor(Math.random() * 3);
        const isHorizontal = Math.random() > 0.5;
        const startX = Math.floor(Math.random() * (GRID_SIZE - (isHorizontal ? wallLength : 1)));
        const startY = Math.floor(Math.random() * (GRID_SIZE - (isHorizontal ? 1 : wallLength)));
        
        for (let i = 0; i < wallLength; i++) {
          const wallPos = {
            x: startX + (isHorizontal ? i : 0),
            y: startY + (isHorizontal ? 0 : i)
          };
          
          // Don't place walls on snake or food
          if (!snake.some(s => s.x === wallPos.x && s.y === wallPos.y) &&
              !(food.x === wallPos.x && food.y === wallPos.y)) {
            newObstacles.push(wallPos);
          }
        }
      }
    }
    
    return newObstacles;
  }, [generateRandomPosition, snake, food]);

  // Check collision with walls, self, or obstacles
  const checkCollision = useCallback((head: Position): boolean => {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    
    // Self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      return true;
    }
    
    // Obstacle collision
    if (obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y)) {
      return true;
    }
    
    return false;
  }, [snake, obstacles]);

  // Game loop
  const gameLoop = useCallback(() => {
    setSnake(currentSnake => {
      if (currentSnake.length === 0) return currentSnake;

      const newSnake = [...currentSnake];
      const head = {
        x: newSnake[0].x + direction.x,
        y: newSnake[0].y + direction.y
      };

      // Check collisions
      if (checkCollision(head)) {
        setGameRunning(false);
        setGameOver(true);
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        // Snake grows, don't remove tail
        const newScore = score + 10;
        setScore(newScore);
        
        // Level up every 50 points
        const newLevel = Math.floor(newScore / 50) + 1;
        if (newLevel > level) {
          setLevel(newLevel);
          // Increase speed gradually
          setSpeed(prevSpeed => Math.max(prevSpeed - 8, 80));
          
          // Generate new obstacles for new level
          setTimeout(() => {
            setObstacles(generateObstacles(newLevel));
          }, 100);
        }
        
        // Generate new food
        setFood(generateRandomPosition([...newSnake, ...obstacles]));
      } else {
        // Remove tail (snake doesn't grow)
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, score, level, checkCollision, generateRandomPosition, obstacles, generateObstacles]);

  // Start/stop game loop
  useEffect(() => {
    if (gameRunning && !gameOver) {
      gameLoopRef.current = setInterval(gameLoop, speed);
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameRunning, gameOver, gameLoop, speed]);

  // Reset game
  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood({ x: 15, y: 15 });
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setLevel(1);
    setSpeed(200);
    setObstacles([]);
    setGameRunning(false);
    setGameOver(false);
  };

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameRunning && !gameOver && e.key === ' ') {
        setGameRunning(true);
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          if (direction.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    if (showGame) {
      window.addEventListener('keydown', handleKeyPress);
    }
    
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameRunning, gameOver, showGame]);

  // Touch/swipe controls for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const minSwipeDistance = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0 && direction.x !== -1) {
          setDirection({ x: 1, y: 0 }); // Right
        } else if (deltaX < 0 && direction.x !== 1) {
          setDirection({ x: -1, y: 0 }); // Left
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0 && direction.y !== -1) {
          setDirection({ x: 0, y: 1 }); // Down
        } else if (deltaY < 0 && direction.y !== 1) {
          setDirection({ x: 0, y: -1 }); // Up
        }
      }
    }

    // Start game on first swipe
    if (!gameRunning && !gameOver) {
      setGameRunning(true);
    }

    touchStartRef.current = null;
  };

  // Handle clicks outside game area to close
  const handleOutsideClick = (e: React.MouseEvent) => {
    if (gameAreaRef.current && !gameAreaRef.current.contains(e.target as Node)) {
      setShowGame(false);
      setGameRunning(false);
    }
  };

  const handleDirectionClick = (newDirection: {x: number, y: number}) => {
    if (
      (direction.x === 1 && newDirection.x === -1) ||
      (direction.x === -1 && newDirection.x === 1) ||
      (direction.y === 1 && newDirection.y === -1) ||
      (direction.y === -1 && newDirection.y === 1)
    ) {
      return; // Prevent reversing direction
    }
    
    setDirection(newDirection);
    
    // Start game if not running
    if (!gameRunning && !gameOver) {
      setGameRunning(true);
    }
  };

  const handleEnterAxivore = () => {
    setShowGame(true);
  };

  if (!showGame) {
    // Preview section on homepage
    return (
      <div 
        className="w-full p-6 rounded-xl mb-6 cursor-pointer hover:scale-[1.02] transition-all duration-300"
        style={{ 
          backgroundColor: '#0a1a2f',
          boxShadow: '0 0 24px var(--accent-glow)',
          border: '1px solid var(--accent)',
          background: `
            radial-gradient(circle at 20% 80%, var(--accent)12 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, var(--accent)08 0%, transparent 50%),
            linear-gradient(135deg, rgba(10, 26, 47, 0.95) 0%, rgba(18, 42, 63, 0.95) 100%)
          `
        }}
        onClick={() => setShowGame(true)}
      >
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="text-4xl">🐍</div>
            <Zap size={32} style={{ color: 'var(--accent)' }} />
            <Trophy size={32} style={{ color: 'var(--accent)' }} />
          </div>
          
          <div 
            className="text-2xl font-bold mb-2"
            style={{ 
              color: 'var(--accent)', 
              textShadow: '0 0 16px var(--accent)',
              fontFamily: 'Orbitron, monospace',
              letterSpacing: '2px'
            }}
          >
            🐍 AXIVORE
          </div>
          
          <div className="text-sm mb-4" style={{ color: 'var(--accent)', opacity: 0.8 }}>
            Pattern Interruption Protocol
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4 max-w-md mx-auto">
            <div 
              className="p-3 rounded-lg border"
              style={{ 
                backgroundColor: 'rgba(var(--accent), 0.1)',
                borderColor: 'var(--accent-glow)'
              }}
            >
              <div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                19×19
              </div>
              <div className="text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                Grid Size
              </div>
            </div>
            
            <div 
              className="p-3 rounded-lg border"
              style={{ 
                backgroundColor: 'rgba(var(--accent), 0.1)',
                borderColor: 'var(--accent-glow)'
              }}
            >
              <div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                ∞
              </div>
              <div className="text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                Levels
              </div>
            </div>
            
            <div 
              className="p-3 rounded-lg border"
              style={{ 
                backgroundColor: 'rgba(var(--accent), 0.1)',
                borderColor: 'var(--accent-glow)'
              }}
            >
              <div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                📱
              </div>
              <div className="text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                Swipe Ready
              </div>
            </div>
          </div>
          
          <div 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all duration-300 hover:scale-105"
            style={{
              background: 'var(--accent)',
              color: '#0a1a2f',
              boxShadow: '0 0 20px var(--accent-glow)'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowGame(true);
            }}
          >
            🐍 Enter AXIVORE
          </div>
        </div>
      </div>
    );
  }

  // Full game interface
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
      onClick={handleOutsideClick}
    >
      <div 
        ref={gameAreaRef}
        className="relative p-6 rounded-xl max-w-2xl w-full mx-4"
        style={{ 
          background: '#0a1a2f',
          boxShadow: '0 0 40px var(--accent-glow)',
          border: '2px solid var(--accent)'
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 
              className="text-2xl font-bold flex items-center gap-2"
              style={{ 
                color: 'var(--accent)', 
                textShadow: '0 0 8px var(--accent)',
                fontFamily: 'Orbitron, monospace'
              }}
            >
              🐍 AXIVORE
            </h2>
            <div className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
              Neural network growth simulation
            </div>
          </div>
          
          <button
            onClick={() => setShowGame(false)}
            className="p-2 rounded-md transition-all duration-200 hover:bg-[var(--accent-glow)]"
            style={{ color: 'var(--accent)' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div 
            className="p-3 rounded-lg text-center"
            style={{ 
              backgroundColor: 'rgba(var(--accent), 0.1)',
              border: '1px solid var(--accent-glow)'
            }}
          >
            <div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
              {score}
            </div>
            <div className="text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>
              Score
            </div>
          </div>
          
          <div 
            className="p-3 rounded-lg text-center"
            style={{ 
              backgroundColor: 'rgba(var(--accent), 0.1)',
              border: '1px solid var(--accent-glow)'
            }}
          >
            <div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
              {level}
            </div>
            <div className="text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>
              Level
            </div>
          </div>
          
          <div 
            className="p-3 rounded-lg text-center"
            style={{ 
              backgroundColor: 'rgba(var(--accent), 0.1)',
              border: '1px solid var(--accent-glow)'
            }}
          >
            <div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
              {snake.length}
            </div>
            <div className="text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>
              Length
            </div>
          </div>
        </div>

        {/* Game Over Overlay */}
        {gameOver && (
          <div 
            className="absolute inset-0 flex items-center justify-center z-10 rounded-xl"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
          >
            <div className="text-center p-6">
              <div className="text-3xl font-bold mb-4" style={{ color: '#ff4757' }}>
                NEURAL NETWORK COLLAPSED
              </div>
              <div className="text-xl mb-2" style={{ color: 'var(--accent)' }}>
                Final Score: {score}
              </div>
              <div className="text-lg mb-4" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                Level Reached: {level} • Length: {snake.length}
              </div>
              <button
                onClick={resetGame}
                className="px-6 py-3 rounded-md font-bold transition-all duration-200"
                style={{
                  background: 'var(--button-bg)',
                  color: '#0a1a2f'
                }}
              >
                <RotateCcw size={16} className="inline mr-2" />
                Restart Neural Network
              </button>
            </div>
          </div>
        )}

        {/* Game Grid */}
        <div 
          className="grid gap-0 mx-auto border-2 mb-4"
          onClick={() => {
            if (!currentUser) {
              setShowLoginPrompt(true);
            }
          }}
          style={{ 
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            borderColor: 'var(--accent)',
            maxWidth: '400px',
            aspectRatio: '1'
          }}
        >
          {Array(GRID_SIZE * GRID_SIZE).fill(null).map((_, index) => {
            const x = index % GRID_SIZE;
            const y = Math.floor(index / GRID_SIZE);
            const isSnake = snake.some(segment => segment.x === x && segment.y === y);
            const isHead = snake[0]?.x === x && snake[0]?.y === y;
            const isFood = food.x === x && food.y === y;
            const isObstacle = obstacles.some(obstacle => obstacle.x === x && obstacle.y === y);
            
            let backgroundColor = '#1a1a1a';
            let boxShadow = 'none';
            
            if (isHead) {
              backgroundColor = '#00ff00';
              boxShadow = '0 0 8px #00ff00';
            } else if (isSnake) {
              backgroundColor = 'var(--accent)';
              boxShadow = '0 0 4px var(--accent)';
            } else if (isFood) {
              backgroundColor = '#ff4757';
              boxShadow = '0 0 8px #ff4757';
            } else if (isObstacle) {
              backgroundColor = '#666';
              boxShadow = '0 0 4px #666';
            }
            
            return (
              <div
                key={index}
                className="aspect-square border border-gray-800"
                style={{
                  backgroundColor,
                  boxShadow,
                  minWidth: '8px',
                  minHeight: '8px'
                }}
              />
            );
          })}
        </div>

        {/* Controls */}
        <div className="text-center">
          {!gameRunning && !gameOver && (
            <button
              onClick={() => {
                setGameRunning(true);
              }}
              className="px-6 py-3 rounded-md font-bold transition-all duration-200 mr-3"
              style={{
                background: 'var(--button-bg)',
                color: '#0a1a2f'
              }}
            >
              Start Neural Growth
            </button>
          )}
          
          {gameRunning && (
            <button
              onClick={() => {
                setGameRunning(false);
              }}
              className="px-6 py-3 rounded-md font-bold transition-all duration-200 mr-3"
              style={{
                background: 'var(--button-bg)',
                color: '#0a1a2f'
              }}
            >
              Pause
            </button>
          )}
          
          <button
            onClick={resetGame}
            className="px-6 py-3 rounded-md border transition-all duration-200"
            style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
          >
            <RotateCcw size={16} className="inline mr-2" />
            Reset
          </button>
        </div>

        {/* Mobile Controls */}
        <div className="mt-4 max-w-[200px] mx-auto">
          <div className="grid grid-cols-3 gap-2">
            {/* Up */}
            <div className="col-start-2">
              <button
                onClick={() => {
                  handleDirectionClick({x: 0, y: -1});
                }}
                className="w-full p-3 rounded-md"
                style={{
                  backgroundColor: 'rgba(var(--accent), 0.1)',
                  border: '1px solid var(--accent-glow)',
                  color: 'var(--accent)'
                }}
              >
                <ArrowUp size={20} className="mx-auto" />
              </button>
            </div>
            
            {/* Left */}
            <div className="col-start-1">
              <button
                onClick={() => {
                  handleDirectionClick({x: -1, y: 0});
                }}
                className="w-full p-3 rounded-md"
                style={{
                  backgroundColor: 'rgba(var(--accent), 0.1)',
                  border: '1px solid var(--accent-glow)',
                  color: 'var(--accent)'
                }}
              >
                <ArrowLeft size={20} className="mx-auto" />
              </button>
            </div>
            
            {/* Down */}
            <div className="col-start-2">
              <button
                onClick={() => {
                  handleDirectionClick({x: 0, y: 1});
                }}
                className="w-full p-3 rounded-md"
                style={{
                  backgroundColor: 'rgba(var(--accent), 0.1)',
                  border: '1px solid var(--accent-glow)',
                  color: 'var(--accent)'
                }}
              >
                <ArrowDown size={20} className="mx-auto" />
              </button>
            </div>
            
            {/* Right */}
           <div className="col-start-3">
             <button
                onClick={() => {
                  handleDirectionClick({x: 1, y: 0});
                }}
                className="w-full p-3 rounded-md"
                style={{
                  backgroundColor: 'rgba(var(--accent), 0.1)',
                  border: '1px solid var(--accent-glow)',
                  color: 'var(--accent)'
                }}
              >
                <ArrowRight size={20} className="mx-auto" />
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center text-xs" style={{ color: 'var(--accent)', opacity: 0.8 }}>
          <div className="mb-2">
            <strong>Desktop:</strong> Arrow keys to control • Space to start
          </div>
          <div className="mb-2">
            <strong>Mobile:</strong> Swipe to control • Tap outside to close
          </div>
          <div className="mb-2">
            <strong>Progression:</strong> Level 5+: Simple obstacles • Level 20+: Complex mazes
          </div>
          <div className="text-green-400">
            🎮 No signup required - Play instantly!
          </div>
        </div>
      </div>
    </div>
  );
};
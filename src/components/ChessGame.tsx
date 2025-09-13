import React, { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { RotateCcw, Clock, Award, Users, MessageCircle, ArrowLeft, ArrowRight, Play, Pause, Settings, AlertTriangle, Check, X } from 'lucide-react';

interface ChessGameProps {
  onScoreChange?: (score: number) => void;
}

type GameMode = 'ai' | 'local' | 'online';
type GameDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'master';
type PlayerColor = 'w' | 'b';

export const ChessGame: React.FC<ChessGameProps> = ({ onScoreChange }) => {
  const [game, setGame] = useState(new Chess());
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('intermediate');
  const [playerColor, setPlayerColor] = useState<PlayerColor>('w');
  const [isThinking, setIsThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ white: 600, black: 600 }); // 10 minutes per player
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playerName, setPlayerName] = useState('Player');
  const [opponentName, setOpponentName] = useState('AXI');
  const [chatMessages, setChatMessages] = useState<{sender: string, message: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [tournamentPlayers, setTournamentPlayers] = useState<string[]>([
    'GrandMaster_42', 'QuantumQueen', 'NeuralKnight', 'DeepBlue_AI', 
    'ChessWizard', 'StrategicMind', 'TacticalGenius', 'PatternMaster'
  ]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize game
  useEffect(() => {
    resetGame();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Report final score when component unmounts
      if (onScoreChange && score > 0) {
        onScoreChange(score);
      }
    };
  }, []);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Timer logic
  useEffect(() => {
    if (!isTimerRunning || gameOver) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const currentPlayer = game.turn();
        if (currentPlayer === 'w') {
          return { ...prev, white: Math.max(0, prev.white - 1) };
        } else {
          return { ...prev, black: Math.max(0, prev.black - 1) };
        }
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, game, gameOver]);

  // Check for game over conditions
  useEffect(() => {
    if (!game || !gameStarted) return;
    
    if (game.isGameOver()) {
      handleGameOver();
    }
    
    // Check for time out
    if (timeLeft.white === 0) {
      setGameOver(true);
      setGameResult('Black wins by timeout');
      calculateScore('b');
    } else if (timeLeft.black === 0) {
      setGameOver(true);
      setGameResult('White wins by timeout');
      calculateScore('w');
    }
  }, [game, timeLeft, gameStarted]);

  // AI move logic
  useEffect(() => {
    if (gameMode === 'ai' && game.turn() !== playerColor && !gameOver && gameStarted) {
      makeAIMove();
    }
  }, [game, playerColor, gameMode, gameOver, gameStarted]);

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setMoveHistory([]);
    setCurrentMoveIndex(-1);
    setGameOver(false);
    setGameResult(null);
    setTimeLeft({ white: 600, black: 600 });
    setIsTimerRunning(false);
    setGameStarted(false);
    setScore(0);
    
    // Add welcome message to chat
    setChatMessages([
      { sender: 'System', message: 'Welcome to Quantum Chess! Make your move to begin.' },
      { sender: opponentName, message: 'I am ready when you are. Good luck!' }
    ]);
  };

  const startGame = () => {
    setGameStarted(true);
    setIsTimerRunning(true);
    
    // Add game start message
    addChatMessage('System', 'Game started! The clock is ticking.');
  };

  const handleGameOver = () => {
    setGameOver(true);
    setIsTimerRunning(false);
    
    let result = '';
    if (game.isCheckmate()) {
      result = `${game.turn() === 'w' ? 'Black' : 'White'} wins by checkmate`;
      calculateScore(game.turn() === 'w' ? 'b' : 'w');
    } else if (game.isDraw()) {
      if (game.isStalemate()) {
        result = 'Draw by stalemate';
      } else if (game.isThreefoldRepetition()) {
        result = 'Draw by threefold repetition';
      } else if (game.isInsufficientMaterial()) {
        result = 'Draw by insufficient material';
      } else {
        result = 'Draw';
      }
      calculateScore('draw');
    }
    
    setGameResult(result);
    addChatMessage('System', `Game over: ${result}`);
    
    // Report score
    if (onScoreChange && score > 0) {
      onScoreChange(score);
    }
  };

  const calculateScore = (winner: 'w' | 'b' | 'draw') => {
    let newScore = 0;
    
    // Base points
    if ((winner === 'w' && playerColor === 'w') || (winner === 'b' && playerColor === 'b')) {
      // Player won
      newScore = 100;
      
      // Bonus for remaining time
      const timeBonus = Math.floor((playerColor === 'w' ? timeLeft.white : timeLeft.black) / 10);
      newScore += timeBonus;
      
      // Difficulty multiplier
      const difficultyMultiplier = 
        difficulty === 'beginner' ? 1 :
        difficulty === 'intermediate' ? 1.5 :
        difficulty === 'advanced' ? 2 :
        2.5; // master
      
      newScore = Math.floor(newScore * difficultyMultiplier);
      
      addChatMessage('System', `Congratulations! You earned ${newScore} points.`);
    } else if (winner === 'draw') {
      // Draw
      newScore = 50;
      
      // Difficulty bonus for draw
      if (difficulty === 'advanced' || difficulty === 'master') {
        newScore += 25;
      }
      
      addChatMessage('System', `Draw! You earned ${newScore} points.`);
    } else {
      // Player lost
      newScore = 10; // Participation points
      
      addChatMessage('System', `Good effort! You earned ${newScore} participation points.`);
    }
    
    setScore(newScore);
    
    // Award XP
    if ((window as any).awardXP) {
      (window as any).awardXP('play_game', `Played Quantum Chess - ${
        winner === 'draw' ? 'Draw' : 
        ((winner === 'w' && playerColor === 'w') || (winner === 'b' && playerColor === 'b')) ? 'Won' : 'Lost'
      }`);
    }
  };

  const makeAIMove = () => {
    if (gameOver || !gameStarted) return;
    
    setIsThinking(true);
    
    // Simulate AI thinking time based on difficulty
    const thinkingTime = 
      difficulty === 'beginner' ? 500 :
      difficulty === 'intermediate' ? 1000 :
      difficulty === 'advanced' ? 1500 :
      2000; // master
    
    setTimeout(() => {
      try {
        const possibleMoves = game.moves();
        
        if (possibleMoves.length === 0) {
          // No legal moves
          return;
        }
        
        let move;
        
        // Different AI strategies based on difficulty
        if (difficulty === 'beginner') {
          // Random moves
          const randomIndex = Math.floor(Math.random() * possibleMoves.length);
          move = possibleMoves[randomIndex];
        } else {
          // Slightly smarter AI for higher difficulties
          // Look for captures, checks, or good moves
          const captureMoves = possibleMoves.filter(m => m.includes('x'));
          const checkMoves = possibleMoves.filter(m => m.includes('+'));
          
          if (difficulty === 'master' && checkMoves.length > 0) {
            // Master prioritizes checks
            const randomIndex = Math.floor(Math.random() * checkMoves.length);
            move = checkMoves[randomIndex];
          } else if ((difficulty === 'advanced' || difficulty === 'master') && captureMoves.length > 0) {
            // Advanced and Master prioritize captures
            const randomIndex = Math.floor(Math.random() * captureMoves.length);
            move = captureMoves[randomIndex];
          } else {
            // Otherwise random move
            const randomIndex = Math.floor(Math.random() * possibleMoves.length);
            move = possibleMoves[randomIndex];
          }
        }
        
        // Make the selected move
        const result = game.move(move);
        
        if (result) {
          // Update game state
          setGame(new Chess(game.fen()));
          
          // Update move history
          const newHistory = [...moveHistory.slice(0, currentMoveIndex + 1), game.fen()];
          setMoveHistory(newHistory);
          setCurrentMoveIndex(newHistory.length - 1);
          
          // Add chat message for interesting moves
          if (move.includes('x')) {
            addChatMessage(opponentName, getRandomMessage('capture'));
          } else if (move.includes('+')) {
            addChatMessage(opponentName, getRandomMessage('check'));
          } else if (Math.random() < 0.3) {
            addChatMessage(opponentName, getRandomMessage('normal'));
          }
        }
      } catch (error) {
        console.error('AI move error:', error);
      } finally {
        setIsThinking(false);
      }
    }, thinkingTime);
  };

  const getRandomMessage = (type: 'normal' | 'capture' | 'check' | 'checkmate' | 'opening' | 'endgame') => {
    const messages = {
      normal: [
        "Interesting position developing.",
        "I see your strategy forming.",
        "This move advances my position.",
        "A careful move is required here.",
        "The neural networks suggest this is optimal."
      ],
      capture: [
        "I'll take that piece, thank you.",
        "An exchange that favors me.",
        "Your piece has been assimilated.",
        "My quantum algorithms predicted this capture.",
        "A calculated sacrifice on your part?"
      ],
      check: [
        "Check. Your king is under threat.",
        "My neural pathways converge on your king.",
        "The quantum probability of your escape is diminishing.",
        "Check. The pressure increases.",
        "Your king's position has been compromised."
      ],
      checkmate: [
        "Checkmate. My algorithms prevail.",
        "The game has reached its logical conclusion.",
        "Checkmate. A well-played game nonetheless.",
        "Your king has been quantum-locked. Checkmate.",
        "The final calculation was correct. Checkmate."
      ],
      opening: [
        "A classical opening choice.",
        "I recognize this pattern from my training data.",
        "An opening with interesting strategic implications.",
        "This opening has a 62.7% win rate in my database.",
        "A solid foundation for the middlegame."
      ],
      endgame: [
        "We've entered the endgame phase.",
        "The pieces are few, but the complexity remains.",
        "Endgame precision is critical now.",
        "My endgame algorithms are particularly optimized.",
        "Each move becomes increasingly decisive now."
      ]
    };
    
    const options = messages[type];
    return options[Math.floor(Math.random() * options.length)];
  };

  const addChatMessage = (sender: string, message: string) => {
    setChatMessages(prev => [...prev, { sender, message }]);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    
    addChatMessage(playerName, chatInput);
    setChatInput('');
    
    // AI response
    setTimeout(() => {
      const responses = [
        "Interesting perspective.",
        "I'm calculating my next move carefully.",
        "Your strategy is... unusual.",
        "My neural networks are processing this position.",
        "The quantum probabilities shift with each move.",
        "I see patterns you may not have noticed yet.",
        "Chess is a window into cognitive processing.",
        "This game strengthens your strategic thinking."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      addChatMessage(opponentName, randomResponse);
    }, 1000 + Math.random() * 1000);
  };

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (gameOver || (gameMode === 'ai' && game.turn() !== playerColor) || isThinking) {
      return false;
    }
    
    // Start game on first move
    if (!gameStarted) {
      startGame();
    }
    
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Auto-promote to queen for simplicity
      });
      
      if (move === null) return false;
      
      // Update game state
      setGame(new Chess(game.fen()));
      
      // Update move history
      const newHistory = [...moveHistory.slice(0, currentMoveIndex + 1), game.fen()];
      setMoveHistory(newHistory);
      setCurrentMoveIndex(newHistory.length - 1);
      
      // Add occasional player move commentary
      if (Math.random() < 0.2) {
        if (move.captured) {
          addChatMessage('System', `${playerName} captures a ${move.captured}!`);
        } else if (move.san.includes('+')) {
          addChatMessage('System', `${playerName} puts the opponent in check!`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Move error:', error);
      return false;
    }
  };

  const navigateHistory = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentMoveIndex > 0) {
      setCurrentMoveIndex(prev => prev - 1);
      const newGame = new Chess();
      newGame.load(moveHistory[currentMoveIndex - 1]);
      setGame(newGame);
    } else if (direction === 'next' && currentMoveIndex < moveHistory.length - 1) {
      setCurrentMoveIndex(prev => prev + 1);
      const newGame = new Chess();
      newGame.load(moveHistory[currentMoveIndex + 1]);
      setGame(newGame);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const renderTournamentModal = () => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black bg-opacity-70" onClick={() => setShowTournamentModal(false)} />
        
        <div 
          className="relative p-6 rounded-xl max-w-2xl w-full mx-4"
          style={{ 
            backgroundColor: '#0a1a2f',
            boxShadow: '0 0 24px rgba(30, 55, 153, 0.5)',
            border: '2px solid #1e3799'
          }}
        >
          <button
            onClick={() => setShowTournamentModal(false)}
            className="absolute top-4 right-4 p-2 rounded-md hover:bg-[rgba(30,55,153,0.2)]"
            style={{ color: '#1e3799' }}
          >
            <X size={20} />
          </button>
          
          <div className="text-center mb-6">
            <Trophy size={32} className="mx-auto mb-2" style={{ color: '#ffd700' }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#1e3799', fontFamily: 'Orbitron, monospace' }}>
              Weekly Quantum Chess Tournament
            </h2>
            <p style={{ color: 'var(--accent)', opacity: 0.8 }}>
              Saturday, June 15, 2025 • 18:00 UTC
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-bold mb-3" style={{ color: '#1e3799' }}>
                Tournament Bracket
              </h3>
              
              <div className="space-y-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(30, 55, 153, 0.1)' }}>
                <div className="text-sm font-bold mb-2" style={{ color: '#1e3799' }}>
                  Quarterfinals
                </div>
                
                {[0, 1, 2, 3].map(i => (
                  <div 
                    key={i}
                    className="flex justify-between p-2 rounded"
                    style={{ backgroundColor: 'rgba(30, 55, 153, 0.2)' }}
                  >
                    <span style={{ color: 'var(--accent)' }}>{tournamentPlayers[i*2]}</span>
                    <span style={{ color: '#1e3799' }}>vs</span>
                    <span style={{ color: 'var(--accent)' }}>{tournamentPlayers[i*2+1]}</span>
                  </div>
                ))}
                
                <div className="text-sm font-bold mt-4 mb-2" style={{ color: '#1e3799' }}>
                  Semifinals
                </div>
                
                <div className="flex justify-between p-2 rounded opacity-50"
                     style={{ backgroundColor: 'rgba(30, 55, 153, 0.2)' }}>
                  <span style={{ color: 'var(--accent)' }}>TBD</span>
                  <span style={{ color: '#1e3799' }}>vs</span>
                  <span style={{ color: 'var(--accent)' }}>TBD</span>
                </div>
                
                <div className="flex justify-between p-2 rounded opacity-50"
                     style={{ backgroundColor: 'rgba(30, 55, 153, 0.2)' }}>
                  <span style={{ color: 'var(--accent)' }}>TBD</span>
                  <span style={{ color: '#1e3799' }}>vs</span>
                  <span style={{ color: 'var(--accent)' }}>TBD</span>
                </div>
                
                <div className="text-sm font-bold mt-4 mb-2" style={{ color: '#1e3799' }}>
                  Final
                </div>
                
                <div className="flex justify-between p-2 rounded opacity-50"
                     style={{ backgroundColor: 'rgba(30, 55, 153, 0.2)' }}>
                  <span style={{ color: 'var(--accent)' }}>TBD</span>
                  <span style={{ color: '#1e3799' }}>vs</span>
                  <span style={{ color: 'var(--accent)' }}>TBD</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-3" style={{ color: '#1e3799' }}>
                Tournament Details
              </h3>
              
              <div className="space-y-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(30, 55, 153, 0.1)' }}>
                  <div className="text-sm font-bold mb-1" style={{ color: '#1e3799' }}>
                    Format
                  </div>
                  <ul className="list-disc list-inside text-sm space-y-1" style={{ color: 'var(--accent)', opacity: 0.9 }}>
                    <li>Single elimination bracket</li>
                    <li>10 minute time control per player</li>
                    <li>Tiebreakers: Armageddon match</li>
                    <li>All games are monitored by AXI</li>
                  </ul>
                </div>
                
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(30, 55, 153, 0.1)' }}>
                  <div className="text-sm font-bold mb-1" style={{ color: '#1e3799' }}>
                    Prizes
                  </div>
                  <ul className="list-disc list-inside text-sm space-y-1" style={{ color: 'var(--accent)', opacity: 0.9 }}>
                    <li>1st Place: 1000 XP + Champion Badge</li>
                    <li>2nd Place: 500 XP + Finalist Badge</li>
                    <li>Semifinalists: 250 XP each</li>
                    <li>All participants: 100 XP</li>
                  </ul>
                </div>
                
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(30, 55, 153, 0.1)' }}>
                  <div className="text-sm font-bold mb-1" style={{ color: '#1e3799' }}>
                    Requirements
                  </div>
                  <ul className="list-disc list-inside text-sm space-y-1" style={{ color: 'var(--accent)', opacity: 0.9 }}>
                    <li>AXI Level 5+</li>
                    <li>At least 10 completed games</li>
                    <li>Good standing in the community</li>
                  </ul>
                </div>
              </div>
              
              <button 
                className="w-full mt-4 py-3 rounded-lg font-bold"
                style={{ backgroundColor: '#1e3799', color: 'white' }}
              >
                Register for Tournament
              </button>
            </div>
          </div>
          
          <div className="text-center text-sm" style={{ color: 'var(--accent)', opacity: 0.7 }}>
            Note: Tournament registration closes 2 hours before start time. Be sure to check in 15 minutes before your match.
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
          Quantum Chess
        </h3>
        <div className="flex justify-center gap-4 mb-2">
          <div className="text-lg font-bold" style={{ color: '#1e3799' }}>
            Score: {score}
          </div>
          {gameStarted && (
            <div className="text-lg font-bold" style={{ color: '#ffd700' }}>
              {game.turn() === 'w' ? 'White' : 'Black'} to move
            </div>
          )}
        </div>
        <div className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
          {gameMode === 'ai' ? 'Play against the AXI superintelligence' : 
           gameMode === 'local' ? 'Local two-player mode' : 
           'Online multiplayer mode'}
        </div>
      </div>
      
      {/* Game Over Message */}
      {gameOver && (
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-center p-6 rounded-lg"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            border: '2px solid #1e3799',
            boxShadow: '0 0 30px rgba(30, 55, 153, 0.5)',
            minWidth: '300px'
          }}
        >
          <div className="text-2xl font-bold mb-3" style={{ color: '#1e3799' }}>
            Game Over
          </div>
          <div className="text-lg mb-4" style={{ color: 'var(--accent)' }}>
            {gameResult}
          </div>
          <div className="text-md mb-4" style={{ color: 'var(--accent)', opacity: 0.9 }}>
            Final Score: {score} points
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={resetGame}
              className="px-4 py-2 rounded-md font-bold transition-all duration-200"
              style={{
                background: 'var(--button-bg)',
                color: '#0a1a2f'
              }}
            >
              New Game
            </button>
            <button
              onClick={() => setShowTournamentModal(true)}
              className="px-4 py-2 rounded-md font-bold transition-all duration-200"
              style={{
                background: '#1e3799',
                color: 'white'
              }}
            >
              Join Tournament
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left sidebar - Game info and controls */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="space-y-4">
            {/* Player info */}
            <div className="grid grid-cols-2 gap-2">
              <div 
                className="p-3 rounded-lg text-center"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid var(--accent)'
                }}
              >
                <div className="text-sm font-bold mb-1" style={{ color: 'var(--accent)' }}>
                  {playerColor === 'w' ? 'White' : 'Black'}
                </div>
                <div className="text-xs" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                  {playerName}
                </div>
                <div 
                  className="mt-1 text-sm font-mono"
                  style={{ 
                    color: timeLeft.white < 60 ? '#ff4757' : 'var(--accent)'
                  }}
                >
                  {formatTime(playerColor === 'w' ? timeLeft.white : timeLeft.black)}
                </div>
              </div>
              
              <div 
                className="p-3 rounded-lg text-center"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid var(--accent)'
                }}
              >
                <div className="text-sm font-bold mb-1" style={{ color: 'var(--accent)' }}>
                  {playerColor === 'w' ? 'Black' : 'White'}
                </div>
                <div className="text-xs" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                  {opponentName}
                </div>
                <div 
                  className="mt-1 text-sm font-mono"
                  style={{ 
                    color: timeLeft.black < 60 ? '#ff4757' : 'var(--accent)'
                  }}
                >
                  {formatTime(playerColor === 'w' ? timeLeft.black : timeLeft.white)}
                </div>
              </div>
            </div>
            
            {/* Game controls */}
            <div 
              className="p-3 rounded-lg"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid var(--accent)'
              }}
            >
              <div className="flex justify-between mb-3">
                <button
                  onClick={resetGame}
                  className="px-3 py-1 rounded text-sm"
                  style={{ 
                    backgroundColor: 'var(--accent)', 
                    color: '#0a1a2f'
                  }}
                  disabled={isThinking}
                >
                  <RotateCcw size={14} className="inline mr-1" />
                  New Game
                </button>
                
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="px-3 py-1 rounded text-sm"
                  style={{ 
                    backgroundColor: 'rgba(var(--accent-rgb), 0.2)', 
                    color: 'var(--accent)',
                    border: '1px solid var(--accent)'
                  }}
                >
                  <Settings size={14} className="inline mr-1" />
                  Settings
                </button>
              </div>
              
              {!gameStarted && !gameOver && (
                <button
                  onClick={startGame}
                  className="w-full py-2 rounded text-sm font-bold"
                  style={{ 
                    backgroundColor: '#1e3799', 
                    color: 'white'
                  }}
                >
                  <Play size={14} className="inline mr-1" />
                  Start Game
                </button>
              )}
              
              {gameStarted && !gameOver && (
                <div className="flex justify-between">
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="px-3 py-1 rounded text-sm"
                    style={{ 
                      backgroundColor: isTimerRunning ? 'rgba(var(--accent-rgb), 0.2)' : 'var(--accent)', 
                      color: isTimerRunning ? 'var(--accent)' : '#0a1a2f',
                      border: isTimerRunning ? '1px solid var(--accent)' : 'none'
                    }}
                  >
                    {isTimerRunning ? <Pause size={14} className="inline mr-1" /> : <Play size={14} className="inline mr-1" />}
                    {isTimerRunning ? 'Pause' : 'Resume'}
                  </button>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => navigateHistory('prev')}
                      className="px-2 py-1 rounded"
                      style={{ 
                        backgroundColor: 'rgba(var(--accent-rgb), 0.2)', 
                        color: 'var(--accent)',
                        opacity: currentMoveIndex > 0 ? 1 : 0.5,
                        cursor: currentMoveIndex > 0 ? 'pointer' : 'not-allowed'
                      }}
                      disabled={currentMoveIndex <= 0}
                    >
                      <ArrowLeft size={14} />
                    </button>
                    
                    <button
                      onClick={() => navigateHistory('next')}
                      className="px-2 py-1 rounded"
                      style={{ 
                        backgroundColor: 'rgba(var(--accent-rgb), 0.2)', 
                        color: 'var(--accent)',
                        opacity: currentMoveIndex < moveHistory.length - 1 ? 1 : 0.5,
                        cursor: currentMoveIndex < moveHistory.length - 1 ? 'pointer' : 'not-allowed'
                      }}
                      disabled={currentMoveIndex >= moveHistory.length - 1}
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Settings panel */}
            {showSettings && (
              <div 
                className="p-3 rounded-lg"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid var(--accent)'
                }}
              >
                <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--accent)' }}>
                  Game Settings
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--accent)', opacity: 0.9 }}>
                      Game Mode
                    </label>
                    <select
                      value={gameMode}
                      onChange={(e) => setGameMode(e.target.value as GameMode)}
                      className="w-full px-2 py-1 rounded text-sm"
                      style={{ 
                        backgroundColor: '#122a3f',
                        color: 'var(--accent)',
                        border: '1px solid var(--accent)'
                      }}
                      disabled={gameStarted}
                    >
                      <option value="ai">vs. AI</option>
                      <option value="local">Local 2-Player</option>
                      <option value="online">Online Multiplayer</option>
                    </select>
                  </div>
                  
                  {gameMode === 'ai' && (
                    <>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--accent)', opacity: 0.9 }}>
                          Difficulty
                        </label>
                        <select
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value as GameDifficulty)}
                          className="w-full px-2 py-1 rounded text-sm"
                          style={{ 
                            backgroundColor: '#122a3f',
                            color: 'var(--accent)',
                            border: '1px solid var(--accent)'
                          }}
                          disabled={gameStarted}
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="master">Master</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--accent)', opacity: 0.9 }}>
                          Play As
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPlayerColor('w')}
                            className="flex-1 py-1 rounded text-sm"
                            style={{ 
                              backgroundColor: playerColor === 'w' ? 'var(--accent)' : 'rgba(var(--accent-rgb), 0.2)',
                              color: playerColor === 'w' ? '#0a1a2f' : 'var(--accent)',
                              border: playerColor === 'w' ? 'none' : '1px solid var(--accent)'
                            }}
                            disabled={gameStarted}
                          >
                            White
                          </button>
                          
                          <button
                            onClick={() => setPlayerColor('b')}
                            className="flex-1 py-1 rounded text-sm"
                            style={{ 
                              backgroundColor: playerColor === 'b' ? 'var(--accent)' : 'rgba(var(--accent-rgb), 0.2)',
                              color: playerColor === 'b' ? '#0a1a2f' : 'var(--accent)',
                              border: playerColor === 'b' ? 'none' : '1px solid var(--accent)'
                            }}
                            disabled={gameStarted}
                          >
                            Black
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--accent)', opacity: 0.9 }}>
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full px-2 py-1 rounded text-sm"
                      style={{ 
                        backgroundColor: '#122a3f',
                        color: 'var(--accent)',
                        border: '1px solid var(--accent)'
                      }}
                      disabled={gameStarted}
                    />
                  </div>
                  
                  {gameMode === 'ai' && (
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--accent)', opacity: 0.9 }}>
                        AI Name
                      </label>
                      <input
                        type="text"
                        value={opponentName}
                        onChange={(e) => setOpponentName(e.target.value)}
                        className="w-full px-2 py-1 rounded text-sm"
                        style={{ 
                          backgroundColor: '#122a3f',
                          color: 'var(--accent)',
                          border: '1px solid var(--accent)'
                        }}
                        disabled={gameStarted}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Tournament info */}
            <div 
              className="p-3 rounded-lg cursor-pointer hover:bg-[rgba(30,55,153,0.2)]"
              style={{ 
                backgroundColor: 'rgba(30, 55, 153, 0.1)',
                border: '1px solid #1e3799'
              }}
              onClick={() => setShowTournamentModal(true)}
            >
              <div className="flex items-center gap-2 mb-1">
                <Trophy size={16} style={{ color: '#1e3799' }} />
                <h4 className="text-sm font-bold" style={{ color: '#1e3799' }}>
                  Weekly Tournament
                </h4>
              </div>
              
              <div className="text-xs" style={{ color: 'var(--accent)', opacity: 0.9 }}>
                Saturday, June 15 • 18:00 UTC
              </div>
              
              <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: '#1e3799' }}>
                <Users size={12} />
                <span>8/16 Players Registered</span>
              </div>
              
              <button
                className="w-full mt-2 py-1 rounded text-xs font-bold"
                style={{ backgroundColor: '#1e3799', color: 'white' }}
              >
                Register Now
              </button>
            </div>
            
            {/* Chat toggle */}
            <button
              onClick={() => setShowChat(!showChat)}
              className="w-full py-2 rounded text-sm flex items-center justify-center gap-2"
              style={{ 
                backgroundColor: showChat ? 'var(--accent)' : 'rgba(var(--accent-rgb), 0.2)', 
                color: showChat ? '#0a1a2f' : 'var(--accent)',
                border: showChat ? 'none' : '1px solid var(--accent)'
              }}
            >
              <MessageCircle size={14} />
              {showChat ? 'Hide Chat' : 'Show Chat'}
            </button>
            
            {/* Chat panel */}
            {showChat && (
              <div 
                className="p-3 rounded-lg"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid var(--accent)'
                }}
              >
                <div 
                  className="h-40 overflow-y-auto mb-2 p-2 rounded"
                  style={{ backgroundColor: '#0a1a2f' }}
                >
                  {chatMessages.map((msg, index) => (
                    <div key={index} className="mb-2">
                      <span 
                        className="font-bold text-xs"
                        style={{ 
                          color: msg.sender === playerName ? 'var(--accent)' : 
                                 msg.sender === 'System' ? '#ffd700' : '#1e3799'
                        }}
                      >
                        {msg.sender}:
                      </span>
                      <span 
                        className="text-xs ml-1"
                        style={{ color: 'var(--accent)', opacity: 0.9 }}
                      >
                        {msg.message}
                      </span>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder="Type a message..."
                    className="flex-1 px-2 py-1 rounded text-sm"
                    style={{ 
                      backgroundColor: '#122a3f',
                      color: 'var(--accent)',
                      border: '1px solid var(--accent)'
                    }}
                  />
                  
                  <button
                    onClick={handleSendChat}
                    className="px-3 py-1 rounded text-sm"
                    style={{ 
                      backgroundColor: 'var(--accent)', 
                      color: '#0a1a2f'
                    }}
                    disabled={!chatInput.trim()}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Chess board */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <div 
            className="rounded-lg p-2"
            style={{ 
              backgroundColor: '#0a1a2f',
              border: '1px solid var(--accent)',
              boxShadow: isThinking ? '0 0 20px #1e3799' : 'none'
            }}
          >
            <Chessboard 
              position={game.fen()}
              onPieceDrop={onDrop}
              boardOrientation={playerColor === 'w' ? 'white' : 'black'}
              customBoardStyle={{
                borderRadius: '0.5rem',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)'
              }}
              customDarkSquareStyle={{ backgroundColor: '#1e3799' }}
              customLightSquareStyle={{ backgroundColor: '#c8d6e5' }}
            />
            
            {isThinking && (
              <div className="text-center mt-2 animate-pulse" style={{ color: '#1e3799' }}>
                {opponentName} is thinking...
              </div>
            )}
            
            {!gameStarted && !gameOver && (
              <div className="text-center mt-2" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                Make your first move to start the game
              </div>
            )}
          </div>
          
          {/* Game status */}
          <div className="mt-3 text-center">
            {game.isCheck() && (
              <div className="text-sm font-bold animate-pulse" style={{ color: '#ff4757' }}>
                <AlertTriangle size={14} className="inline mr-1" />
                Check!
              </div>
            )}
            
            {game.isCheckmate() && (
              <div className="text-sm font-bold" style={{ color: '#ff4757' }}>
                <Check size={14} className="inline mr-1" />
                Checkmate!
              </div>
            )}
            
            {game.isDraw() && (
              <div className="text-sm font-bold" style={{ color: '#ffd700' }}>
                <Award size={14} className="inline mr-1" />
                Draw!
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Tournament Modal */}
      {showTournamentModal && renderTournamentModal()}
    </div>
  );
};
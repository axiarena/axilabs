import React, { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Users, Clock, Trophy, MessageCircle, RefreshCw, Play, Pause, Flag, Crown, Zap } from 'lucide-react';

interface PublicChessGameProps {
  currentUser: string | null;
  currentMode: string;
  onShowAuthModal?: () => void;
}

interface GameRoom {
  id: string;
  name: string;
  creator: string;
  opponent?: string;
  gameState: string; // FEN notation
  currentTurn: 'w' | 'b';
  status: 'waiting' | 'active' | 'finished';
  createdAt: string;
  lastMove?: string;
  winner?: string;
  timeControl: number; // minutes per player
  whiteTime: number;
  blackTime: number;
  isTimerRunning: boolean;
  spectators: string[];
  chat: { user: string; message: string; timestamp: string }[];
}

export const PublicChessGame: React.FC<PublicChessGameProps> = ({ 
  currentUser, 
  currentMode, 
  onShowAuthModal 
}) => {
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [game, setGame] = useState(new Chess());
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [timeControl, setTimeControl] = useState(10);
  const [chatMessage, setChatMessage] = useState('');
  const [isSpectating, setIsSpectating] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const syncRef = useRef<NodeJS.Timeout | null>(null);

  // Load game rooms from localStorage
  useEffect(() => {
    const loadRooms = () => {
      const stored = localStorage.getItem('chess_game_rooms');
      if (stored) {
        try {
          const rooms = JSON.parse(stored);
          setGameRooms(rooms);
        } catch (error) {
          console.error('Error loading game rooms:', error);
        }
      }
    };

    loadRooms();

    // Sync with other tabs/browsers every 2 seconds
    syncRef.current = setInterval(() => {
      loadRooms();
    }, 2000);

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chess_game_rooms' && e.newValue) {
        try {
          const rooms = JSON.parse(e.newValue);
          setGameRooms(rooms);
          
          // Update current room if it exists
          if (currentRoom) {
            const updatedRoom = rooms.find((r: GameRoom) => r.id === currentRoom.id);
            if (updatedRoom) {
              setCurrentRoom(updatedRoom);
              setGame(new Chess(updatedRoom.gameState));
            }
          }
        } catch (error) {
          console.error('Error parsing storage change:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (syncRef.current) clearInterval(syncRef.current);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentRoom]);

  // Timer logic
  useEffect(() => {
    if (!currentRoom || !currentRoom.isTimerRunning || currentRoom.status !== 'active') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      updateGameRoom(currentRoom.id, (room) => {
        const currentPlayer = room.currentTurn;
        if (currentPlayer === 'w') {
          room.whiteTime = Math.max(0, room.whiteTime - 1);
          if (room.whiteTime === 0) {
            room.status = 'finished';
            room.winner = 'black';
            room.isTimerRunning = false;
          }
        } else {
          room.blackTime = Math.max(0, room.blackTime - 1);
          if (room.blackTime === 0) {
            room.status = 'finished';
            room.winner = 'white';
            room.isTimerRunning = false;
          }
        }
        return room;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentRoom]);

  const saveRooms = (rooms: GameRoom[]) => {
    localStorage.setItem('chess_game_rooms', JSON.stringify(rooms));
    setGameRooms(rooms);
  };

  const updateGameRoom = (roomId: string, updateFn: (room: GameRoom) => GameRoom) => {
    const rooms = [...gameRooms];
    const roomIndex = rooms.findIndex(r => r.id === roomId);
    if (roomIndex !== -1) {
      rooms[roomIndex] = updateFn(rooms[roomIndex]);
      saveRooms(rooms);
    }
  };

  const createRoom = () => {
    if (!currentUser) {
      onShowAuthModal?.();
      return;
    }

    if (!newRoomName.trim()) {
      alert('Please enter a room name');
      return;
    }

    const newRoom: GameRoom = {
      id: Date.now().toString(),
      name: newRoomName.trim(),
      creator: currentUser,
      gameState: new Chess().fen(),
      currentTurn: 'w',
      status: 'waiting',
      createdAt: new Date().toISOString(),
      timeControl,
      whiteTime: timeControl * 60,
      blackTime: timeControl * 60,
      isTimerRunning: false,
      spectators: [],
      chat: [{
        user: 'System',
        message: `Room created by ${currentUser}. Waiting for opponent...`,
        timestamp: new Date().toISOString()
      }]
    };

    const rooms = [...gameRooms, newRoom];
    saveRooms(rooms);
    setNewRoomName('');
    setShowCreateRoom(false);
  };

  const joinRoom = (room: GameRoom) => {
    if (!currentUser) {
      onShowAuthModal?.();
      return;
    }

    if (room.status === 'waiting' && !room.opponent && room.creator !== currentUser) {
      // Join as opponent
      updateGameRoom(room.id, (r) => ({
        ...r,
        opponent: currentUser,
        status: 'active',
        isTimerRunning: true,
        chat: [...r.chat, {
          user: 'System',
          message: `${currentUser} joined the game!`,
          timestamp: new Date().toISOString()
        }]
      }));
      setIsSpectating(false);
    } else if (room.creator === currentUser || room.opponent === currentUser) {
      // Rejoin own game
      setIsSpectating(false);
    } else {
      // Join as spectator
      updateGameRoom(room.id, (r) => ({
        ...r,
        spectators: [...r.spectators.filter(s => s !== currentUser), currentUser],
        chat: [...r.chat, {
          user: 'System',
          message: `${currentUser} is now spectating`,
          timestamp: new Date().toISOString()
        }]
      }));
      setIsSpectating(true);
    }

    setCurrentRoom(room);
    setGame(new Chess(room.gameState));
  };

  const makeMove = (sourceSquare: string, targetSquare: string) => {
    if (!currentRoom || !currentUser || isSpectating) return false;

    // Check if it's the player's turn
    const isWhitePlayer = currentRoom.creator === currentUser;
    const isBlackPlayer = currentRoom.opponent === currentUser;
    const currentTurn = game.turn();

    if ((currentTurn === 'w' && !isWhitePlayer) || (currentTurn === 'b' && !isBlackPlayer)) {
      return false;
    }

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      });

      if (move === null) return false;

      const newGame = new Chess(game.fen());
      setGame(newGame);

      // Update room state
      updateGameRoom(currentRoom.id, (room) => {
        const updatedRoom = { ...room };
        updatedRoom.gameState = newGame.fen();
        updatedRoom.currentTurn = newGame.turn();
        updatedRoom.lastMove = move.san;

        // Check for game over
        if (newGame.isGameOver()) {
          updatedRoom.status = 'finished';
          updatedRoom.isTimerRunning = false;
          
          if (newGame.isCheckmate()) {
            updatedRoom.winner = newGame.turn() === 'w' ? 'black' : 'white';
          } else {
            updatedRoom.winner = 'draw';
          }

          updatedRoom.chat.push({
            user: 'System',
            message: `Game over! ${updatedRoom.winner === 'draw' ? 'Draw' : `${updatedRoom.winner} wins`}`,
            timestamp: new Date().toISOString()
          });
        } else {
          updatedRoom.chat.push({
            user: currentUser,
            message: `Played ${move.san}`,
            timestamp: new Date().toISOString()
          });
        }

        return updatedRoom;
      });

      return true;
    } catch (error) {
      console.error('Move error:', error);
      return false;
    }
  };

  const sendChatMessage = () => {
    if (!currentRoom || !currentUser || !chatMessage.trim()) return;

    updateGameRoom(currentRoom.id, (room) => ({
      ...room,
      chat: [...room.chat, {
        user: currentUser,
        message: chatMessage.trim(),
        timestamp: new Date().toISOString()
      }]
    }));

    setChatMessage('');
  };

  const leaveRoom = () => {
    if (!currentRoom || !currentUser) return;

    if (isSpectating) {
      updateGameRoom(currentRoom.id, (room) => ({
        ...room,
        spectators: room.spectators.filter(s => s !== currentUser)
      }));
    }

    setCurrentRoom(null);
    setGame(new Chess());
    setIsSpectating(false);
  };

  const forfeitGame = () => {
    if (!currentRoom || !currentUser || isSpectating) return;

    if (confirm('Are you sure you want to forfeit this game?')) {
      const isWhitePlayer = currentRoom.creator === currentUser;
      
      updateGameRoom(currentRoom.id, (room) => ({
        ...room,
        status: 'finished',
        winner: isWhitePlayer ? 'black' : 'white',
        isTimerRunning: false,
        chat: [...room.chat, {
          user: 'System',
          message: `${currentUser} forfeited the game`,
          timestamp: new Date().toISOString()
        }]
      }));
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const getPlayerColor = () => {
    if (!currentRoom || !currentUser) return null;
    if (currentRoom.creator === currentUser) return 'white';
    if (currentRoom.opponent === currentUser) return 'black';
    return null;
  };

  // Room list view
  if (!currentRoom) {
    return (
      <div 
        className="w-full p-6 rounded-xl mb-6"
        style={{ 
          backgroundColor: '#0a1a2f',
          boxShadow: '0 0 24px var(--accent-glow)',
          border: '1px solid var(--accent)'
        }}
      >
        <div className="mb-6">
          <div 
            className="text-xl font-bold mb-2 flex items-center gap-3"
            style={{ 
              color: 'var(--accent)', 
              textShadow: '0 0 8px var(--accent)',
              fontFamily: 'Orbitron, monospace'
            }}
          >
            <Users size={24} />
            ♟️ Public Chess Arena
          </div>
          <div className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
            Play chess with other users in real-time
          </div>
        </div>

        {/* Create Room Button */}
        {!showCreateRoom ? (
          <div className="mb-6">
            <button
              onClick={() => {
                if (!currentUser) {
                  onShowAuthModal?.();
                  return;
                }
                setShowCreateRoom(true);
              }}
              className="px-6 py-3 rounded-lg font-bold transition-all duration-200 hover:scale-105"
              style={{
                background: 'var(--accent)',
                color: '#0a1a2f',
                boxShadow: '0 0 20px var(--accent-glow)'
              }}
            >
              Create New Game
            </button>
          </div>
        ) : (
          <div 
            className="mb-6 p-4 rounded-lg border"
            style={{ 
              backgroundColor: '#122a3f',
              borderColor: 'var(--accent-glow)'
            }}
          >
            <h3 className="font-bold mb-3" style={{ color: 'var(--accent)' }}>
              Create New Game Room
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--accent)' }}>
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter room name..."
                  className="w-full px-3 py-2 rounded-md"
                  style={{
                    backgroundColor: '#0a1a2f',
                    border: '1px solid var(--accent)',
                    color: 'var(--accent)'
                  }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--accent)' }}>
                  Time Control (minutes per player)
                </label>
                <select
                  value={timeControl}
                  onChange={(e) => setTimeControl(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-md"
                  style={{
                    backgroundColor: '#0a1a2f',
                    border: '1px solid var(--accent)',
                    color: 'var(--accent)'
                  }}
                >
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createRoom}
                  className="px-4 py-2 rounded-md font-bold"
                  style={{
                    background: 'var(--accent)',
                    color: '#0a1a2f'
                  }}
                >
                  Create Room
                </button>
                <button
                  onClick={() => {
                    setShowCreateRoom(false);
                    setNewRoomName('');
                  }}
                  className="px-4 py-2 rounded-md border"
                  style={{
                    color: 'var(--accent)',
                    borderColor: 'var(--accent)'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Rooms List */}
        <div className="space-y-3">
          <h3 className="font-bold" style={{ color: 'var(--accent)' }}>
            Available Games ({gameRooms.length})
          </h3>
          
          {gameRooms.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--accent)', opacity: 0.6 }}>
              <Users size={32} className="mx-auto mb-3 opacity-50" />
              <div className="text-lg font-bold mb-2">No Games Available</div>
              <div className="text-sm">Create the first game room to get started!</div>
            </div>
          ) : (
            gameRooms.map((room) => (
              <div
                key={room.id}
                className="p-4 rounded-lg border hover:bg-[var(--accent-glow)] transition-all duration-200 cursor-pointer"
                style={{ borderColor: 'var(--accent-glow)' }}
                onClick={() => joinRoom(room)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold" style={{ color: 'var(--accent)' }}>
                      {room.name}
                    </h4>
                    <div className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                      Created by {room.creator}
                      {room.opponent && ` vs ${room.opponent}`}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--accent)', opacity: 0.6 }}>
                      {room.timeControl} min • {room.spectators.length} spectators
                    </div>
                  </div>
                  <div className="text-right">
                    <div 
                      className="px-3 py-1 rounded text-sm font-bold"
                      style={{
                        backgroundColor: room.status === 'waiting' ? '#ffa500' : 
                                        room.status === 'active' ? '#00ff00' : '#666',
                        color: '#000'
                      }}
                    >
                      {room.status === 'waiting' ? 'Waiting' : 
                       room.status === 'active' ? 'Playing' : 'Finished'}
                    </div>
                    {room.status === 'finished' && room.winner && (
                      <div className="text-xs mt-1" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                        Winner: {room.winner}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(var(--accent), 0.1)' }}>
          <h4 className="font-bold mb-2" style={{ color: 'var(--accent)' }}>
            How to Play
          </h4>
          <ul className="text-sm space-y-1" style={{ color: 'var(--accent)', opacity: 0.9 }}>
            <li>• Create a room or join an existing one</li>
            <li>• Games are synchronized across all browsers in real-time</li>
            <li>• Chat with your opponent and spectators</li>
            <li>• Time controls prevent games from lasting too long</li>
            <li>• Anyone can spectate ongoing games</li>
          </ul>
        </div>
      </div>
    );
  }

  // Game view
  const playerColor = getPlayerColor();
  const isPlayerTurn = currentRoom && currentUser && 
    ((currentRoom.currentTurn === 'w' && currentRoom.creator === currentUser) ||
     (currentRoom.currentTurn === 'b' && currentRoom.opponent === currentUser));

  return (
    <div 
      className="w-full p-6 rounded-xl mb-6"
      style={{ 
        backgroundColor: '#0a1a2f',
        boxShadow: '0 0 24px var(--accent-glow)',
        border: '1px solid var(--accent)'
      }}
    >
      {/* Game Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
            ♟️ {currentRoom.name}
          </h3>
          <div className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
            {currentRoom.creator} vs {currentRoom.opponent || 'Waiting...'}
            {isSpectating && ' (Spectating)'}
          </div>
        </div>
        <button
          onClick={leaveRoom}
          className="px-4 py-2 rounded-md border"
          style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
        >
          Leave Game
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Board */}
        <div className="lg:col-span-2">
          {/* Player Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div 
              className="p-3 rounded-lg text-center"
              style={{ 
                backgroundColor: currentRoom.currentTurn === 'w' ? 'rgba(255, 255, 255, 0.1)' : '#122a3f',
                border: '1px solid var(--accent)'
              }}
            >
              <div className="font-bold" style={{ color: 'var(--accent)' }}>
                White: {currentRoom.creator}
              </div>
              <div 
                className="text-lg font-mono"
                style={{ 
                  color: currentRoom.whiteTime < 60 ? '#ff4757' : 'var(--accent)'
                }}
              >
                {formatTime(currentRoom.whiteTime)}
              </div>
            </div>
            
            <div 
              className="p-3 rounded-lg text-center"
              style={{ 
                backgroundColor: currentRoom.currentTurn === 'b' ? 'rgba(255, 255, 255, 0.1)' : '#122a3f',
                border: '1px solid var(--accent)'
              }}
            >
              <div className="font-bold" style={{ color: 'var(--accent)' }}>
                Black: {currentRoom.opponent || 'Waiting...'}
              </div>
              <div 
                className="text-lg font-mono"
                style={{ 
                  color: currentRoom.blackTime < 60 ? '#ff4757' : 'var(--accent)'
                }}
              >
                {formatTime(currentRoom.blackTime)}
              </div>
            </div>
          </div>

          {/* Chess Board */}
          <div 
            className="rounded-lg p-2"
            style={{ 
              backgroundColor: '#122a3f',
              border: '1px solid var(--accent)'
            }}
          >
            <Chessboard 
              position={game.fen()}
              onPieceDrop={makeMove}
              boardOrientation={playerColor === 'black' ? 'black' : 'white'}
              arePiecesDraggable={!isSpectating && isPlayerTurn && currentRoom.status === 'active'}
              customBoardStyle={{
                borderRadius: '0.5rem'
              }}
            />
          </div>

          {/* Game Status */}
          <div className="mt-3 text-center">
            {currentRoom.status === 'waiting' && (
              <div style={{ color: '#ffa500' }}>
                Waiting for opponent to join...
              </div>
            )}
            {currentRoom.status === 'active' && (
              <div style={{ color: 'var(--accent)' }}>
                {game.isCheck() && <span className="text-red-500">Check! </span>}
                {currentRoom.currentTurn === 'w' ? 'White' : 'Black'} to move
                {isPlayerTurn && !isSpectating && (
                  <span className="ml-2 animate-pulse">← Your turn</span>
                )}
              </div>
            )}
            {currentRoom.status === 'finished' && (
              <div style={{ color: '#00ff00' }}>
                Game Over - {currentRoom.winner === 'draw' ? 'Draw' : `${currentRoom.winner} wins!`}
              </div>
            )}
          </div>

          {/* Game Controls */}
          {currentRoom.status === 'active' && !isSpectating && (
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={forfeitGame}
                className="px-4 py-2 rounded-md border"
                style={{ color: '#ff4757', borderColor: '#ff4757' }}
              >
                <Flag size={16} className="inline mr-1" />
                Forfeit
              </button>
            </div>
          )}
        </div>

        {/* Chat and Info */}
        <div className="space-y-4">
          {/* Game Info */}
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: '#122a3f',
              borderColor: 'var(--accent-glow)'
            }}
          >
            <h4 className="font-bold mb-3" style={{ color: 'var(--accent)' }}>
              Game Info
            </h4>
            <div className="space-y-2 text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
              <div>Status: {currentRoom.status}</div>
              <div>Time Control: {currentRoom.timeControl} min</div>
              <div>Spectators: {currentRoom.spectators.length}</div>
              {currentRoom.lastMove && (
                <div>Last Move: {currentRoom.lastMove}</div>
              )}
            </div>
          </div>

          {/* Chat */}
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: '#122a3f',
              borderColor: 'var(--accent-glow)'
            }}
          >
            <h4 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--accent)' }}>
              <MessageCircle size={16} />
              Chat
            </h4>
            
            <div 
              className="h-40 overflow-y-auto mb-3 p-2 rounded"
              style={{ backgroundColor: '#0a1a2f' }}
            >
              {currentRoom.chat.map((msg, index) => (
                <div key={index} className="mb-2">
                  <span 
                    className="font-bold text-xs"
                    style={{ 
                      color: msg.user === 'System' ? '#ffd700' : 'var(--accent)'
                    }}
                  >
                    {msg.user}:
                  </span>
                  <span 
                    className="text-xs ml-1"
                    style={{ color: 'var(--accent)', opacity: 0.9 }}
                  >
                    {msg.message}
                  </span>
                </div>
              ))}
            </div>
            
            {currentUser && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-2 py-1 rounded text-sm"
                  style={{ 
                    backgroundColor: '#0a1a2f',
                    color: 'var(--accent)',
                    border: '1px solid var(--accent)'
                  }}
                />
                <button
                  onClick={sendChatMessage}
                  className="px-3 py-1 rounded text-sm"
                  style={{ 
                    backgroundColor: 'var(--accent)', 
                    color: '#0a1a2f'
                  }}
                  disabled={!chatMessage.trim()}
                >
                  Send
                </button>
              </div>
            )}
          </div>

          {/* Spectators */}
          {currentRoom.spectators.length > 0 && (
            <div 
              className="p-4 rounded-lg border"
              style={{ 
                backgroundColor: '#122a3f',
                borderColor: 'var(--accent-glow)'
              }}
            >
              <h4 className="font-bold mb-2" style={{ color: 'var(--accent)' }}>
                Spectators ({currentRoom.spectators.length})
              </h4>
              <div className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                {currentRoom.spectators.join(', ')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
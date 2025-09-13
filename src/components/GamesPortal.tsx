import React, { useState } from 'react';
import { X, Gamepad2, Trophy, Star, Zap } from 'lucide-react';

interface GamesPortalProps {
  currentMode: string;
  onClose: () => void;
}

interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'Puzzle' | 'Action' | 'Strategy';
  color: string;
  isActive: boolean;
}

export const GamesPortal: React.FC<GamesPortalProps> = ({ currentMode, onClose }) => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const games: Game[] = [
    {
      id: 'neural-crush',
      name: 'Neural Crush',
      description: 'Advanced puzzle game - Coming in Alpha release',
      icon: '🧠',
      difficulty: 'Easy',
      category: 'Puzzle',
      color: '#666',
      isActive: false
    },
    {
      id: 'axi-runner',
      name: 'AXI Runner',
      description: 'Navigate through digital dimensions as AXI',
      icon: '🎮',
      difficulty: 'Medium',
      category: 'Action',
      color: '#ff4757',
      isActive: false
    }
  ];

  const handleGameClick = (game: Game) => {
    if (!game.isActive) {
      alert(`🔒 Game Locked!\n\n"${game.name}" is coming soon.\n\nStay tuned for updates!`);
      return;
    }

    setSelectedGame(game.id);
  };


  const renderGame = () => {
    switch(selectedGame) {
      default:
        return (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
              Game Coming Soon
            </h3>
            <p style={{ color: 'var(--accent)', opacity: 0.8 }}>
              This game is being developed by the superintelligence.
            </p>
          </div>
        );
    }
  };

  if (selectedGame) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSelectedGame(null)} />
        
        <div 
          className="relative p-6 rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          style={{ 
            background: '#0a1a2f',
            boxShadow: '0 0 24px var(--accent-glow)',
            border: '2px solid var(--accent)'
          }}
        >
          <button
            onClick={() => setSelectedGame(null)}
            className="absolute top-4 right-4 p-1 rounded-md transition-all duration-200 hover:bg-[var(--accent-glow)]"
            style={{ color: 'var(--accent)' }}
          >
            <X size={20} />
          </button>

          {renderGame()}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div 
        className="relative p-6 rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{ 
          background: '#0a1a2f',
          boxShadow: '0 0 24px var(--accent-glow)',
          border: '2px solid var(--accent)'
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md transition-all duration-200 hover:bg-[var(--accent-glow)]"
          style={{ color: 'var(--accent)' }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 
            className="text-2xl font-bold mb-2 flex items-center gap-2"
            style={{ 
              color: 'var(--accent)', 
              textShadow: '0 0 8px var(--accent)',
              fontFamily: 'Orbitron, monospace'
            }}
          >
            <Gamepad2 size={24} />
            🎮 Games Portal
          </h2>
          <p style={{ color: 'var(--accent)', opacity: 0.8 }}>
            Cognitive enhancement through interactive gaming
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <div
              key={game.id}
              onClick={() => handleGameClick(game)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                game.isActive ? 'hover:scale-105 hover:bg-[var(--accent-glow)]' : 'opacity-70'
              }`}
              style={{ 
                borderColor: game.color,
                backgroundColor: `${game.color}10`
              }}
            >
              <div className="text-center">
                <div className="text-4xl mb-3">{game.icon}</div>
                <h3 
                  className="text-lg font-bold mb-2"
                  style={{ color: game.color }}
                >
                  {game.name}
                </h3>
                <p className="text-sm mb-3" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                  {game.description}
                </p>
                
                <div className="flex justify-between items-center text-xs mb-3">
                  <span 
                    className="px-2 py-1 rounded"
                    style={{ backgroundColor: game.color, color: '#fff' }}
                  >
                    {game.difficulty}
                  </span>
                  <span style={{ color: 'var(--accent)', opacity: 0.7 }}>
                    {game.category}
                  </span>
                </div>
                
                {game.isActive ? (
                  <div 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: game.color,
                      color: '#fff'
                    }}
                  >
                    <Play size={16} />
                    Play Now
                  </div>
                ) : (
                  <div className="text-xs" style={{ color: '#666' }}>
                    Coming Soon
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Gaming Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            className="p-4 rounded-lg text-center"
            style={{ 
              backgroundColor: 'rgba(var(--accent), 0.1)',
              border: '1px solid var(--accent-glow)'
            }}
          >
            <Trophy size={24} className="mx-auto mb-2" style={{ color: '#ffd700' }} />
            <div className="text-lg font-bold" style={{ color: '#ffd700' }}>
              0
            </div>
            <div className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
              Current Score
            </div>
          </div>
          
          <div 
            className="p-4 rounded-lg text-center"
            style={{ 
              backgroundColor: 'rgba(var(--accent), 0.1)',
              border: '1px solid var(--accent-glow)'
            }}
          >
            <Star size={24} className="mx-auto mb-2" style={{ color: 'var(--accent)' }} />
            <div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
              {games.filter(g => g.isActive).length}/{games.length}
            </div>
            <div className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
              Games Available
            </div>
          </div>
          
          <div 
            className="p-4 rounded-lg text-center"
            style={{ 
              backgroundColor: 'rgba(var(--accent), 0.1)',
              border: '1px solid var(--accent-glow)'
            }}
          >
            <Zap size={24} className="mx-auto mb-2" style={{ color: '#ff6b35' }} />
            <div className="text-lg font-bold" style={{ color: '#ff6b35' }}>
              Ready
            </div>
            <div className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
              For Testing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
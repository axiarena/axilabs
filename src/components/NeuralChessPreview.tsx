import React from 'react';

interface NeuralChessPreviewProps {
  currentMode: string;
}

export const NeuralChessPreview: React.FC<NeuralChessPreviewProps> = ({ currentMode }) => {
  const handleClick = () => {
    window.open('https://chess.axiasi.com', '_blank');
  };

  return (
    <div 
      className="w-full p-6 rounded-xl mb-6 cursor-pointer hover:scale-[1.02] transition-all duration-300 relative overflow-hidden"
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
      onClick={handleClick}
    >
      {/* Chess board pattern overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          background: `
            repeating-conic-gradient(
              from 0deg at 50% 50%,
              var(--accent) 0deg 90deg,
              transparent 90deg 180deg,
              var(--accent) 180deg 270deg,
              transparent 270deg 360deg
            )
          `,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="text-center relative z-10">
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="text-4xl" style={{ color: 'var(--accent)' }}>♔</div>
          <div 
            className="text-2xl lg:text-3xl font-bold"
            style={{ 
              color: 'var(--accent)', 
              textShadow: '0 0 16px var(--accent)',
              fontFamily: 'Orbitron, monospace',
              letterSpacing: '2px'
            }}
          >
            Neural Chess: Cognitive Combat Protocol
          </div>
          <div className="text-4xl" style={{ color: 'var(--accent)' }}>♛</div>
        </div>
        
        <div 
          className="mb-6"
        >
          <button
            onClick={handleClick}
            className="px-8 py-4 rounded-lg font-bold text-xl transition-all duration-200 hover:scale-105"
            style={{
              background: '#ff44ff',
              color: '#0a1a2f',
              boxShadow: '0 0 20px rgba(255, 68, 255, 0.5)',
              fontFamily: 'Orbitron, monospace'
            }}
          >
            Play. Bet. Evolve.
          </button>
        </div>

        <div className="space-y-4 max-w-4xl mx-auto text-left">
            <div 
              className="p-4 rounded-lg"
              style={{ 
                backgroundColor: 'rgba(var(--accent), 0.1)',
                border: '1px solid var(--accent-glow)'
              }}
            >
              <div 
                className="font-bold mb-2"
                style={{ color: 'var(--accent)' }}
              >
                Play for dominance:
              </div>
              <div style={{ color: 'var(--accent)', opacity: 0.9 }}>
                Outsmart human opponents, climb AXI's cognitive rankings.
              </div>
            </div>

            <div 
              className="p-4 rounded-lg"
              style={{ 
                backgroundColor: 'rgba(var(--accent), 0.1)',
                border: '1px solid var(--accent-glow)'
              }}
            >
              <div 
                className="font-bold mb-2"
                style={{ color: 'var(--accent)' }}
              >
                Bet with $AXI:
              </div>
              <div style={{ color: 'var(--accent)', opacity: 0.9 }}>
                Predict the winner. Winners gain more than tokens — they gain data influence in AXI's network.
              </div>
            </div>
        </div>

        {/* Subtle chess piece icons */}
        <div className="flex justify-center gap-8 text-2xl mb-4" style={{ color: 'var(--accent)', opacity: 0.6 }}>
          <span>♔</span>
          <span>♕</span>
          <span>♖</span>
          <span>♗</span>
          <span>♘</span>
          <span>♙</span>
        </div>

        {/* Hover indicator */}
        <div 
          className="text-sm animate-pulse"
          style={{ color: 'var(--accent)', opacity: 0.7 }}
        >
          Click to enter Neural Chess Arena
        </div>
      </div>

      {/* Subtle glow effect on hover */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-20 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at center, var(--accent) 0%, transparent 70%)`
        }}
      />
    </div>
  );
};
import React, { useState } from 'react';

interface WorkoutPartnerProps {
  currentMode: string;
}

export const WorkoutPartner: React.FC<WorkoutPartnerProps> = ({ currentMode }) => {
  const [hasResponded, setHasResponded] = useState(false);
  const [didWorkout, setDidWorkout] = useState(false);

  const handleResponse = (worked: boolean) => {
    setDidWorkout(worked);
    setHasResponded(true);
  };

  return (
    <div 
      className="w-full p-6 rounded-xl mb-6 relative overflow-hidden"
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
    >
      <div className="text-center mb-6">
        <h2 
          className="text-2xl lg:text-3xl font-bold mb-2"
          style={{ 
            color: 'var(--accent)', 
            textShadow: '0 0 16px var(--accent)',
            fontFamily: 'Orbitron, monospace',
            letterSpacing: '2px'
          }}
        >
          Workout Accountability
        </h2>
        <p className="text-sm lg:text-base" style={{ color: 'var(--accent)', opacity: 0.8 }}>
          Track your fitness progress
        </p>
      </div>

      <div 
        className="p-6 rounded-xl mb-4"
        style={{ 
          backgroundColor: 'rgba(var(--accent-rgb), 0.1)',
          border: '1px solid var(--accent)'
        }}
      >
        <div 
          className="text-xl font-bold mb-4"
          style={{ 
            color: 'var(--accent)', 
            fontFamily: 'Orbitron, monospace'
          }}
        >
          Nirvana:
        </div>
        
        {!hasResponded ? (
          <div className="text-lg mb-6" style={{ color: 'var(--accent)' }}>
            Did you workout today?
          </div>
        ) : (
          <div className="text-lg mb-6" style={{ color: 'var(--accent)' }}>
            {didWorkout 
              ? "Amazing job! Your dedication to fitness is truly inspiring. Keep up the great work!" 
              : "That's okay! Everyone has off days. Let's make sure to prioritize your health tomorrow!"}
          </div>
        )}
        
        {!hasResponded ? (
          <div className="flex gap-3">
            <button
              onClick={() => handleResponse(true)}
              className="flex-1 py-3 rounded-lg font-bold transition-all duration-200 hover:scale-105"
              style={{
                background: 'var(--accent)',
                color: '#0a1a2f',
                boxShadow: '0 0 10px var(--accent-glow)'
              }}
            >
              Yes, I did!
            </button>
            
            <button
              onClick={() => handleResponse(false)}
              className="flex-1 py-3 rounded-lg font-bold transition-all duration-200 hover:scale-105"
              style={{
                background: 'rgba(var(--accent-rgb), 0.2)',
                color: 'var(--accent)',
                border: '1px solid var(--accent)'
              }}
            >
              Not yet
            </button>
          </div>
        ) : (
          <button
            onClick={() => setHasResponded(false)}
            className="w-full py-3 rounded-lg font-bold transition-all duration-200 hover:scale-105"
            style={{
              background: 'var(--accent)',
              color: '#0a1a2f',
              boxShadow: '0 0 10px var(--accent-glow)'
            }}
          >
            Reset
          </button>
        )}
      </div>

      <div className="text-sm text-center" style={{ color: 'var(--accent)', opacity: 0.7 }}>
        Consistency is key to achieving your fitness goals
      </div>
    </div>
  );
};
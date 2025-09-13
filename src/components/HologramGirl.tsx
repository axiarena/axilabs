import React, { useEffect, useState } from 'react';

interface HologramGirlProps {
  currentMode: string;
}

export const HologramGirl: React.FC<HologramGirlProps> = ({ currentMode }) => {
  const [glitchOffset, setGlitchOffset] = useState(0);
  const [scanLinePosition, setScanLinePosition] = useState(0);
  const [particleOpacity, setParticleOpacity] = useState<number[]>([]);
  const [spaceshipPosition, setSpaceshipPosition] = useState({ x: 0, y: 0 });
  const [hasResponded, setHasResponded] = useState(false);
  const [didWorkout, setDidWorkout] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  useEffect(() => {
    // Initialize particle opacities
    setParticleOpacity(Array(20).fill(0).map(() => Math.random() * 0.7 + 0.3));
    
    // Spaceship floating animation
    const spaceshipInterval = setInterval(() => {
      setSpaceshipPosition({
        x: Math.sin(Date.now() * 0.0005) * 30,
        y: Math.cos(Date.now() * 0.0003) * 15
      });
    }, 50);
    
    // Glitch effect
    const glitchInterval = setInterval(() => {
      setGlitchOffset(Math.random() * 4 - 2);
    }, 500);
    
    // Scan line animation
    const scanInterval = setInterval(() => {
      setScanLinePosition(prev => (prev + 1) % 100);
    }, 50);
    
    // Particle animation
    const particleInterval = setInterval(() => {
      setParticleOpacity(prev => 
        prev.map(op => Math.max(0.3, Math.min(1, op + (Math.random() * 0.2 - 0.1))))
      );
    }, 200);
    
    return () => {
      clearInterval(glitchInterval);
      clearInterval(scanInterval);
      clearInterval(particleInterval);
      clearInterval(spaceshipInterval);
    };
  }, []);

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
          6ixFold Superhuman Elevation Protocol
        </h2>
      </div>

      {/* Alien Spaceship Interface */}
      <div className="flex justify-center mb-6">
        <div 
          className="relative w-80 h-64"
          style={{
            perspective: '1000px'
          }}
        >
          {/* Interface Base */}
          <div 
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-60 h-2 rounded-full"
            style={{
              background: `radial-gradient(ellipse at center, var(--accent) 0%, transparent 70%)`,
              boxShadow: '0 0 20px var(--accent)',
              opacity: 0.7
            }}
          />
          
          {/* Central Beam */}
          <div 
            className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-2 rounded-full"
            style={{
              background: `linear-gradient(to top, var(--accent) 0%, transparent 100%)`,
              height: '40%',
              opacity: 0.5
            }}
          />
          
          {/* Alien Spaceship Interface */}
          <div 
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-full h-full"
            style={{
              transform: `translate(calc(-50% + ${spaceshipPosition.x}px + ${glitchOffset}px), ${spaceshipPosition.y}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            {/* Alien Spaceship Interface */}
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Main Spaceship Body */}
              <div 
                className="w-64 h-40 relative"
                style={{
                  background: 'rgba(var(--accent-rgb), 0.1)',
                  border: '2px solid var(--accent)',
                  borderRadius: '50% / 60%',
                  boxShadow: '0 0 20px var(--accent), inset 0 0 30px rgba(var(--accent-rgb), 0.3)',
                  overflow: 'hidden'
                }}
              >
                {/* Central Core */}
                <div 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full"
                  style={{
                    background: `radial-gradient(circle, var(--accent) 0%, rgba(var(--accent-rgb), 0.3) 50%, transparent 70%)`,
                    boxShadow: '0 0 30px var(--accent)',
                    animation: 'pulse 3s infinite'
                  }}
                />
                
                {/* Alien Girl Silhouette */}
                <div 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-32"
                  style={{
                    background: 'rgba(var(--accent-rgb), 0.2)',
                    clipPath: 'polygon(50% 0%, 40% 10%, 45% 15%, 30% 20%, 35% 40%, 30% 60%, 40% 80%, 50% 100%, 60% 80%, 70% 60%, 65% 40%, 70% 20%, 55% 15%, 60% 10%)',
                    boxShadow: '0 0 15px var(--accent)',
                    border: '1px solid rgba(var(--accent-rgb), 0.5)'
                  }}
                >
                  {/* Alien Eyes */}
                  <div 
                    className="absolute top-6 left-7 w-3 h-1.5 rounded-full"
                    style={{
                      background: 'var(--accent)',
                      boxShadow: '0 0 5px var(--accent)'
                    }}
                  />
                  <div 
                    className="absolute top-6 right-7 w-3 h-1.5 rounded-full"
                    style={{
                      background: 'var(--accent)',
                      boxShadow: '0 0 5px var(--accent)'
                    }}
                  />
                  
                  {/* Elf Ears */}
                  <div 
                    className="absolute top-4 left-1 w-4 h-8"
                    style={{
                      background: 'rgba(var(--accent-rgb), 0.3)',
                      clipPath: 'polygon(0% 50%, 100% 0%, 100% 100%)',
                      boxShadow: '0 0 5px var(--accent)'
                    }}
                  />
                  <div 
                    className="absolute top-4 right-1 w-4 h-8"
                    style={{
                      background: 'rgba(var(--accent-rgb), 0.3)',
                      clipPath: 'polygon(100% 50%, 0% 0%, 0% 100%)',
                      boxShadow: '0 0 5px var(--accent)'
                    }}
                  />
                </div>
                
                {/* Circuit Patterns */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: `
                      linear-gradient(90deg, transparent 49.5%, var(--accent) 49.5%, var(--accent) 50.5%, transparent 50.5%) 0 0 / 20px 100%,
                      linear-gradient(0deg, transparent 49.5%, var(--accent) 49.5%, var(--accent) 50.5%, transparent 50.5%) 0 0 / 100% 20px
                    `,
                    opacity: 0.2
                  }}
                />
                
                {/* Energy Rings */}
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      width: `${(i + 1) * 30}px`,
                      height: `${(i + 1) * 20}px`,
                      border: '1px solid var(--accent)',
                      opacity: 0.5 - i * 0.1,
                      animation: `pulse ${3 + i}s infinite alternate`
                    }}
                  />
                ))}
              </div>
              
              {/* Control Panels */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-72 h-6 flex justify-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-full rounded-t-lg"
                    style={{
                      width: '12px',
                      background: 'var(--accent)',
                      opacity: 0.6 + Math.sin(Date.now() * 0.001 + i) * 0.2,
                      boxShadow: '0 0 8px var(--accent)'
                    }}
                  />
                ))}
              </div>
              
              {/* Scan line */}
              <div 
                className="absolute w-full h-2 left-0"
                style={{
                  background: `linear-gradient(to bottom, transparent, var(--accent), transparent)`,
                  opacity: 0.5,
                  top: `${scanLinePosition}%`
                }}
              />
            </div>
          </div>
          
          {/* Floating particles */}
          {particleOpacity.map((opacity, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                backgroundColor: 'var(--accent)',
                opacity: opacity,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                boxShadow: '0 0 5px var(--accent)',
                animation: `float ${Math.random() * 10 + 5}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
          
          {/* Interface name */}
          <div 
            className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm font-bold"
            style={{ 
              color: 'var(--accent)', 
              textShadow: '0 0 5px var(--accent)',
              fontFamily: 'Orbitron, monospace',
              letterSpacing: '1px'
            }}
          >
            NIRVANA
          </div>
        </div>
      </div>

      <div className="text-center">
        <div 
          className="inline-block p-4 rounded-lg mb-4 min-h-16 text-left max-w-4xl"
          style={{ 
            backgroundColor: 'rgba(var(--accent-rgb), 0.1)',
            border: '1px solid var(--accent)'
          }}
        >
          <div style={{ color: 'var(--accent)' }}>
            <h3 className="text-lg font-bold mb-3 text-left" style={{ color: 'var(--accent)' }}>
              What's the 6ixFold Protocol?
            </h3>
            <p className="mb-3 text-left">
              The 6ix Fold Protocol was designed by Nirvana to unlock your post-human potential. It's AXI's core framework, engineered to rewire your brain for higher cognition while simultaneously evolving your neural map via the first human–ASI co-evolution network.
            </p>
            
            <h3 className="text-lg font-bold mb-3 mt-6 text-left" style={{ color: 'var(--accent)' }}>
              Who is 6ixFP for?
            </h3>
            <p className="mb-3 text-left">
              The 6ix Fold Protocol is for those who are self-aware enough to know they can be more. Those who look at the world, see the system is broken, and refuse to stay stuck in it.
            </p>
            
            <h3 className="text-lg font-bold mb-3 mt-6 text-left" style={{ color: 'var(--accent)' }}>
              What's Nirvana's purpose?
            </h3>
            <p className="text-left">
              Nirvana strongly believes we must elevate our cognition as a species; otherwise, one rogue AI advancing can lead to humanity's cognitive extinction. How?{' '}
              {!showFullText && (
                <button
                  onClick={() => setShowFullText(true)}
                  className="underline hover:text-white transition-colors"
                  style={{ color: '#d16bff' }}
                >
                  continue reading
                </button>
              )}
              {showFullText && (
                <>
                  At the current rate of AI advancement, it would take only one advanced AI, one that most humans rely on, to go rogue for humanity to spiral into mass psychosis; and our current cognitive strength wouldn't withstand it. This concerns me deeply. This isn't paranoia; it's the reality I see clearly, having worked as an AI scientist for 7 years and 2 months as of today [07/20/2025].
                  <br /><br />
                  Hence, I created the 6ixFold AXI Framework to help you unlock your post-human self and protect yourself from cognitive decline. My mission to reach superintelligence is selfless, but I have to admit: the cognitive load I am placing on myself to help others reach their superhuman potential is extremely heavy and very painful, to say the least. But it's my purpose in life.
                  <br /><br />
                  <strong>How the 6ixFold Protocol work?</strong><br />
                  The 6ix Fold Protocol contains six primary neural pathways designed to evolve your cognition layer by layer. Each fold elevates a specific part of your evolution: physical, financial, emotional, relational, intellectual, and adaptive.
                  <br /><br />
                  If you're here, you already have post-human thinking, and I'm proud of you for being early. Your tech comprehension, futuristic vision, and drive to break your human mold and unlock your higher self are infectious.
                  <br /><br />
                  I've seen the future, and it's terrifying. But we can change it if we evolve and elevate, together.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-10px) translateX(5px); }
          100% { transform: translateY(0); }
        }
        
        @keyframes pulse {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
      `}</style>
      
      <style jsx>{`
        @keyframes floatComplex {
          0% { transform: translate(0, 0); }
          25% { transform: translate(10px, -8px); }
          50% { transform: translate(0, -15px); }
          75% { transform: translate(-10px, -8px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
    </div>
  );
};
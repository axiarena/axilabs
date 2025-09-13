import React, { useEffect, useState } from 'react';
import { Gamepad2, ShoppingCart, Mic, DollarSign, Heart, Calendar } from 'lucide-react';
import { GamesPortal } from './GamesPortal';
import { WellnessPortal } from './WellnessPortal';

interface AlienSuperintelligenceHubProps {
  currentMode: string;
}

interface RobotArm {
  id: number;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  segments: { x: number; y: number }[];
}

export const AlienSuperintelligenceHub: React.FC<AlienSuperintelligenceHubProps> = ({ currentMode }) => {
  const [coreRotation, setCoreRotation] = useState(0);
  const [armRotation, setArmRotation] = useState(0);
  const [pistonMovement, setPistonMovement] = useState(0);
  const [hydraulicPressure, setHydraulicPressure] = useState(0);
  const [showGamesPortal, setShowGamesPortal] = useState(false);
  const [showWellnessPortal, setShowWellnessPortal] = useState(false);

  const robotArms: RobotArm[] = [
    {
      id: 1,
      name: 'Games',
      icon: <Gamepad2 size={16} />,
      color: '#00d4ff',
      description: 'Interactive gaming protocols',
      segments: [
        { x: 250, y: 200 },
        { x: 250, y: 140 },
        { x: 250, y: 80 }
      ]
    },
    {
      id: 2,
      name: 'Wellness',
      icon: <Heart size={16} />,
      color: '#00d4ff',
      description: 'Health optimization systems',
      segments: [
        { x: 250, y: 200 },
        { x: 320, y: 170 },
        { x: 390, y: 140 }
      ]
    },
    {
      id: 3,
      name: 'Media',
      icon: <Mic size={16} />,
      color: '#00d4ff',
      description: 'Content creation networks',
      segments: [
        { x: 250, y: 200 },
        { x: 320, y: 230 },
        { x: 390, y: 260 }
      ]
    },
    {
      id: 4,
      name: 'Commerce',
      icon: <ShoppingCart size={16} />,
      color: '#00d4ff',
      description: 'Trade automation systems',
      segments: [
        { x: 250, y: 200 },
        { x: 250, y: 260 },
        { x: 250, y: 320 }
      ]
    },
    {
      id: 5,
      name: 'Wealth',
      icon: <DollarSign size={16} />,
      color: '#00d4ff',
      description: 'Financial intelligence algorithms',
      segments: [
        { x: 250, y: 200 },
        { x: 180, y: 230 },
        { x: 110, y: 260 }
      ]
    },
    {
      id: 6,
      name: 'Events',
      icon: <Calendar size={16} />,
      color: '#00d4ff',
      description: 'Experience coordination matrix',
      segments: [
        { x: 250, y: 200 },
        { x: 180, y: 170 },
        { x: 110, y: 140 }
      ]
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCoreRotation(Date.now() * 0.0008);
      setArmRotation(Date.now() * 0.0005);
      setPistonMovement(Math.sin(Date.now() * 0.003) * 3);
      setHydraulicPressure(Math.sin(Date.now() * 0.002) * 0.3 + 0.7);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const handleArmClick = (arm: RobotArm) => {
    if (arm.name === 'Games') {
      setShowGamesPortal(true);
    } else if (arm.name === 'Wellness') {
      setShowWellnessPortal(true);
    } else {
      alert(`🌀 PORTAL ARM ACTIVATED\n\n${arm.name} System\n${arm.description}\nStatus: OPERATIONAL\nInterface Pressure: 98%`);
    }
  };

  return (
    <>
      <div 
        className="w-full p-8 rounded-xl mb-6 relative overflow-hidden"
        style={{ 
          backgroundColor: '#0f0f0f',
          boxShadow: '0 0 40px rgba(0, 212, 255, 0.3)',
          border: '2px solid #00d4ff',
          minHeight: '500px',
          background: `
            radial-gradient(circle at 50% 50%, rgba(15, 15, 15, 1) 0%, rgba(5, 5, 5, 1) 100%)
          `
        }}
      >
        {/* Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-15">
          <div 
            style={{
              background: `
                linear-gradient(90deg, #00d4ff 1px, transparent 1px),
                linear-gradient(180deg, #00d4ff 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
            className="w-full h-full"
          />
        </div>

        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <div 
            className="text-2xl font-bold mb-2"
            style={{ 
              color: '#00d4ff', 
              textShadow: '0 0 15px #00d4ff',
              fontFamily: 'Orbitron, monospace',
              letterSpacing: '2px'
            }}
          >
            🌀 The 6ixfold System
          </div>
          <div 
            className="text-sm mb-2"
            style={{ 
              color: '#888',
              fontFamily: 'monospace'
            }}
          >
            Advanced consciousness upgrade protocols
          </div>
        </div>

        {/* Main Robot Interface */}
        <div className="relative w-full h-80 mx-auto">
          {/* Central Hub */}
          <div 
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
            style={{
              transform: `translate(-50%, -50%) rotate(${coreRotation * 30}deg)`
            }}
          >
            <div 
              className="relative w-20 h-20 flex items-center justify-center cursor-pointer"
              style={{
                background: `
                  linear-gradient(45deg, #2a2a2a 0%, #1a1a1a 50%, #2a2a2a 100%)
                `,
                border: '4px solid #00d4ff',
                borderRadius: '8px',
                boxShadow: `
                  0 0 30px #00d4ff,
                  inset 0 0 20px rgba(0, 212, 255, 0.3)
                `
              }}
              onClick={() => alert('🌀 SUPERINTELLIGENCE PORTAL ACCESSED\n\nInterface Control System: ONLINE\nArm Status: 6/6 OPERATIONAL\nInterface Pressure: 98%\nPower Level: 100%\nPortal Status: ACTIVE')}
            >
              <div 
                className="text-2xl font-bold"
                style={{ 
                  color: '#00d4ff',
                  textShadow: '0 0 10px #00d4ff'
                }}
              >
                ⚙
              </div>
              
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: '#666',
                    border: '1px solid #00d4ff',
                    top: i < 2 ? '2px' : 'auto',
                    bottom: i >= 2 ? '2px' : 'auto',
                    left: i % 2 === 0 ? '2px' : 'auto',
                    right: i % 2 === 1 ? '2px' : 'auto'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Robot Arms */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none" 
            viewBox="0 0 500 400"
          >
            <defs>
              <linearGradient id="armGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#444" />
                <stop offset="50%" stopColor="#666" />
                <stop offset="100%" stopColor="#444" />
              </linearGradient>
            </defs>

            {robotArms.map((arm, armIndex) => (
              <g key={`arm-${arm.id}`}>
                {arm.segments.map((segment, segmentIndex) => {
                  if (segmentIndex === 0) return null;
                  
                  const prevSegment = arm.segments[segmentIndex - 1];
                  
                  return (
                    <g key={`segment-${arm.id}-${segmentIndex}`}>
                      <line
                        x1={prevSegment.x + Math.sin(armRotation + armIndex) * pistonMovement * 0.1}
                        y1={prevSegment.y + Math.cos(armRotation + armIndex) * pistonMovement * 0.1}
                        x2={segment.x + Math.sin(armRotation + armIndex) * pistonMovement * 0.1}
                        y2={segment.y + Math.cos(armRotation + armIndex) * pistonMovement * 0.1}
                        stroke="url(#armGradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                      
                      <line
                        x1={prevSegment.x + 3}
                        y1={prevSegment.y + 3}
                        x2={segment.x + 3}
                        y2={segment.y + 3}
                        stroke={arm.color}
                        strokeWidth="2"
                        opacity={hydraulicPressure}
                        strokeDasharray="4 2"
                      />
                      
                      <circle
                        cx={prevSegment.x + Math.sin(armRotation + armIndex) * pistonMovement * 0.1}
                        cy={prevSegment.y + Math.cos(armRotation + armIndex) * pistonMovement * 0.1}
                        r="8"
                        fill="#333"
                        stroke={arm.color}
                        strokeWidth="2"
                      />
                    </g>
                  );
                })}
              </g>
            ))}
          </svg>

          {/* End Effectors */}
          {robotArms.map((arm) => {
            const lastSegment = arm.segments[arm.segments.length - 1];
            
            return (
              <div
                key={`effector-${arm.id}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                style={{
                  left: `${(lastSegment.x / 500) * 100}%`,
                  top: `${(lastSegment.y / 400) * 100}%`,
                  transform: `translate(-50%, -50%) translateX(${Math.sin(armRotation + arm.id) * pistonMovement * 0.2}px)`
                }}
                onClick={() => handleArmClick(arm)}
              >
                <div
                  className="relative w-16 h-16 flex flex-col items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: `
                      linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #2a2a2a 100%)
                    `,
                    border: `2px solid ${arm.color}`,
                    borderRadius: '6px',
                    boxShadow: `
                      0 0 15px ${arm.color},
                      inset 0 0 10px rgba(0, 0, 0, 0.5)
                    `
                  }}
                >
                  <div style={{ color: arm.color, filter: `drop-shadow(0 0 5px ${arm.color})` }}>
                    {arm.icon}
                  </div>
                  
                  <div 
                    className="text-xs mt-1 font-bold"
                    style={{ color: arm.color }}
                  >
                    {arm.name}
                  </div>
                  
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: '#555',
                        border: `1px solid ${arm.color}`,
                        top: i < 2 ? '2px' : 'auto',
                        bottom: i >= 2 ? '2px' : 'auto',
                        left: i % 2 === 0 ? '2px' : 'auto',
                        right: i % 2 === 1 ? '2px' : 'auto'
                      }}
                    />
                  ))}

                  {arm.name === 'Games' && (
                    <div 
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center animate-pulse"
                      style={{
                        backgroundColor: '#ff6b9d',
                        boxShadow: '0 0 6px #ff6b9d'
                      }}
                    >
                      <span className="text-xs">🎮</span>
                    </div>
                  )}
                  
                  {arm.name === 'Wellness' && (
                    <div 
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center animate-pulse"
                      style={{
                        backgroundColor: '#00ff88',
                        boxShadow: '0 0 6px #00ff88'
                      }}
                    >
                      <span className="text-xs">💚</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Hydraulic Pressure Indicators */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-8 rounded-full"
                style={{
                  background: `linear-gradient(to top, ${robotArms[i]?.color || '#00d4ff'} 0%, transparent 100%)`,
                  opacity: hydraulicPressure,
                  transform: `scaleY(${0.3 + hydraulicPressure * 0.7})`
                }}
              />
            ))}
          </div>
        </div>

        {/* System Status */}
        <div 
          className="mt-6 p-4 rounded-lg border text-center relative z-10"
          style={{ 
            backgroundColor: 'rgba(0, 212, 255, 0.1)',
            borderColor: '#00d4ff',
            color: '#00d4ff',
            fontFamily: 'monospace'
          }}
        >
          <div className="text-sm font-bold">
            🌀 THE 6IXFOLD SYSTEM STATUS: OPERATIONAL
          </div>
          <div className="text-xs mt-2 opacity-80">
            Interface Pressure: {Math.round(hydraulicPressure * 100)}% | Arms: 6/6 ACTIVE | Power: 100% | Portal: ONLINE
          </div>
        </div>
      </div>

      {/* Games Portal Modal */}
      {showGamesPortal && (
        <GamesPortal 
          currentMode={currentMode}
          onClose={() => setShowGamesPortal(false)}
        />
      )}
      
      {/* Wellness Portal Modal */}
      {showWellnessPortal && (
        <WellnessPortal 
          currentMode={currentMode}
          onClose={() => setShowWellnessPortal(false)}
        />
      )}
    </>
  );
};
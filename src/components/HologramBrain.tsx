import React, { useEffect, useState } from 'react';
import { RefreshCw, Zap } from 'lucide-react';

interface HologramBrainProps {
  currentMode: string;
}

interface AxiClone {
  name: string;
  handle: string;
  url: string;
  position: { x: number; y: number };
  isActive: boolean;
  cloneXP: number;
}

export const HologramBrain: React.FC<HologramBrainProps> = ({ currentMode }) => {
  const [axiClones, setAxiClones] = useState<AxiClone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // AXI Clone data with positions for extended brain layout - ALL 16 nodes properly positioned
  const cloneData: Omit<AxiClone, 'isActive' | 'cloneXP'>[] = [
    // Top row - cerebral cortex
    { name: 'AXI', handle: 'hello_world_AXI', url: 'https://x.com/hello_world_AXI', position: { x: 50, y: 15 } },
    { name: 'Musk', handle: 'MuskAXI', url: 'https://x.com/MuskAXI', position: { x: 25, y: 20 } },
    { name: 'axiagent3', handle: 'axiagent3', url: 'https://x.com/axiagent3', position: { x: 75, y: 20 } },
    
    // Upper middle - frontal lobe
    { name: 'Rogan', handle: 'roganaxi', url: 'https://x.com/roganaxi', position: { x: 15, y: 35 } },
    { name: 'Maya', handle: 'mayanicksaxi', url: 'https://x.com/mayanicksaxi', position: { x: 40, y: 30 } },
    { name: 'Trump', handle: 'trumpaxi', url: 'https://x.com/trumpaxi', position: { x: 60, y: 30 } },
    { name: 'Grinch', handle: 'grinchparody', url: 'https://x.com/grinchparody', position: { x: 85, y: 35 } },
    
    // Middle section - temporal lobe
    { name: 'Zuck', handle: 'zuckaxi', url: 'https://x.com/zuckaxi', position: { x: 10, y: 50 } },
    { name: 'Kanye', handle: 'axikanye', url: 'https://x.com/axikanye', position: { x: 35, y: 45 } },
    { name: 'Drake', handle: 'axidrake', url: 'https://x.com/axidrake', position: { x: 65, y: 45 } },
    { name: 'Santa', handle: 'santaparody', url: 'https://x.com/santaparody', position: { x: 90, y: 50 } },
    
    // Lower middle - parietal lobe
    { name: 'BitBoy', handle: 'bitboyAXI', url: 'https://x.com/bitboyAXI', position: { x: 20, y: 65 } },
    { name: 'Ansem', handle: 'ansemAXI', url: 'https://x.com/ansemAXI', position: { x: 45, y: 60 } },
    { name: 'axiagent2', handle: 'axiagent2', url: 'https://x.com/axiagent2', position: { x: 55, y: 60 } },
    { name: 'Rudolph', handle: 'rudolphparody_', url: 'https://x.com/rudolphparody_', position: { x: 80, y: 65 } },
    
    // Bottom - brain stem
    { name: 'MrBeast', handle: 'aximrbeast', url: 'https://x.com/aximrbeast', position: { x: 50, y: 80 } }
  ];

  // Simulate checking Twitter activity - ALL NODES GREEN
  const checkTwitterActivity = async () => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Make ALL nodes active (green) regardless of their handle
    const updatedClones = cloneData.map((clone) => {
      const cloneXP = Math.floor(Math.random() * 95) + 5; // 5-100 range
      
      return {
        ...clone,
        isActive: true, // ALL nodes are now active/green
        cloneXP
      };
    });
    
    setAxiClones(updatedClones);
    setIsLoading(false);
  };

  useEffect(() => {
    checkTwitterActivity();
    
    // Refresh activity every 10 minutes
    const interval = setInterval(checkTwitterActivity, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getNodeColor = (clone: AxiClone) => {
    if (isLoading) return '#666';
    return '#00ffaa'; // All nodes are lime now
  };

  const getNodeGlow = (clone: AxiClone) => {
    if (isLoading) return 'none';
    return '0 0 16px #00ffaa'; // All nodes have lime glow
  };

  // Simple connection logic - only connect nearby nodes with SINGLE lines
  const shouldConnect = (clone1: AxiClone, clone2: AxiClone) => {
    const distance = Math.sqrt(
      Math.pow(clone1.position.x - clone2.position.x, 2) + 
      Math.pow(clone1.position.y - clone2.position.y, 2)
    );
    
    // Only connect close neighbors with single lines
    return distance < 35;
  };

  return (
    <div 
      className="w-full p-6 rounded-xl mb-6 relative overflow-hidden"
      style={{ 
        backgroundColor: '#0a1a2f',
        boxShadow: '0 0 24px var(--accent-glow)',
        border: '1px solid var(--accent)',
        minHeight: '350px'
      }}
    >
      {/* Header */}
      <div className="mb-4 text-center">
        <div 
          className="text-xl font-bold mb-2 flex items-center justify-center gap-3"
          style={{ 
            color: 'var(--accent)', 
            textShadow: '0 0 8px var(--accent)',
            fontFamily: 'Orbitron, monospace'
          }}
        >
          Clone Neural Network
        </div>
        <div className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
          Neural pathways connecting AXI clone adapters
        </div>
        {isLoading && (
          <div className="text-xs mt-2 animate-pulse" style={{ color: 'var(--accent)', opacity: 0.6 }}>
            Mapping neural connections...
          </div>
        )}
      </div>

      {/* Extended Brain Visualization */}
      <div className="relative w-full h-64 mx-auto">
        {/* Extended Brain Outline */}
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox="0 0 500 250"
          style={{ filter: `drop-shadow(0 0 8px var(--accent))` }}
        >
          {/* Extended brain shape */}
          <path
            d="M50 120 Q30 80 70 50 Q120 20 200 25 Q280 20 350 40 Q420 60 450 100 Q470 140 450 180 Q420 220 350 230 Q280 235 200 230 Q120 235 70 210 Q30 170 50 120 Z"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            opacity="0.4"
          />
          
          {/* Additional brain lobes */}
          <path
            d="M80 60 Q60 40 100 35 Q140 30 180 40 Q200 50 190 70 Q170 80 140 75 Q110 70 80 60 Z"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
            opacity="0.3"
          />
          
          <path
            d="M320 40 Q300 30 340 35 Q380 30 420 45 Q440 60 430 80 Q410 90 380 85 Q350 80 320 40 Z"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
            opacity="0.3"
          />
          
          {/* SIMPLE NEURAL CONNECTIONS - Single lines between nearby nodes only */}
          {axiClones.map((clone, index) => 
            axiClones.slice(index + 1).map((otherClone, otherIndex) => {
              if (!shouldConnect(clone, otherClone)) return null;
              
              // All connections are lime since all nodes are active
              const strokeColor = '#00ffaa';
              const strokeWidth = '2';
              const opacity = 0.8;
              
              return (
                <line
                  key={`connection-${index}-${otherIndex}`}
                  x1={clone.position.x * 5}
                  y1={clone.position.y * 2.5}
                  x2={otherClone.position.x * 5}
                  y2={otherClone.position.y * 2.5}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  className="animate-pulse"
                />
              );
            })
          )}
          
          {/* Data flow indicators on all connections */}
          {axiClones.map((clone, index) => 
            axiClones.slice(index + 1).map((otherClone, otherIndex) => {
              if (!shouldConnect(clone, otherClone)) return null;
              
              const midX = (clone.position.x + otherClone.position.x) / 2 * 5;
              const midY = (clone.position.y + otherClone.position.y) / 2 * 2.5;
              
              return (
                <circle
                  key={`flow-${index}-${otherIndex}`}
                  cx={midX}
                  cy={midY}
                  r="2"
                  fill="#00ffaa"
                  opacity="0.9"
                  className="animate-pulse"
                />
              );
            })
          )}
        </svg>

        {/* Clone Nodes */}
        {axiClones.map((clone, index) => {
          // Calculate connections for this node
          const connections = axiClones.filter(other => 
            other.handle !== clone.handle && shouldConnect(clone, other)
          );
          const activeConnections = connections; // All connections are active now
          
          return (
            <div
              key={clone.handle}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
              style={{
                left: `${clone.position.x}%`,
                top: `${clone.position.y}%`
              }}
            >
              {/* Node */}
              <div
                className="w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center animate-pulse"
                style={{
                  backgroundColor: getNodeColor(clone),
                  borderColor: getNodeColor(clone),
                  boxShadow: getNodeGlow(clone)
                }}
              >
                {/* Activity indicator for all nodes */}
                <Zap size={12} style={{ color: '#000' }} />
              </div>

              {/* Connection count indicator */}
              <div 
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center"
                style={{ 
                  backgroundColor: '#00ffaa',
                  color: '#000',
                  fontSize: '9px',
                  fontWeight: 'bold'
                }}
                title={`${activeConnections.length}/${connections.length} active connections`}
              >
                {connections.length}
              </div>

            </div>
          );
        })}
      </div>

      {/* Network Stats - Updated with specific numbers */}
      <div className="flex justify-center gap-4 text-sm mt-6">
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
            16
          </div>
          <div style={{ color: 'var(--accent)', opacity: 0.7 }}>Clones</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
            1823
          </div>
          <div style={{ color: 'var(--accent)', opacity: 0.7 }}>Nodes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
            29168
          </div>
          <div style={{ color: 'var(--accent)', opacity: 0.7 }}>Neural Links</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
            
          </div>
          <div style={{ color: 'var(--accent)', opacity: 0.7 }}></div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={checkTwitterActivity}
          disabled={isLoading}
          className="p-2 rounded-md transition-all duration-200 hover:bg-[var(--accent-glow)]"
          style={{ color: 'var(--accent)' }}
          title="Refresh network status"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
};
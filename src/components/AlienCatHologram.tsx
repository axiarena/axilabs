import React, { useEffect, useState } from 'react';

interface AlienCatHologramProps {
  currentMode: string;
}

export const AlienCatHologram: React.FC<AlienCatHologramProps> = ({ currentMode }) => {
  const [glitchOffset, setGlitchOffset] = useState(0);
  const [eyeGlow, setEyeGlow] = useState(0);
  const [purr, setPurr] = useState(0);

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchOffset(Math.random() * 2 - 1);
    }, 300);

    const eyeInterval = setInterval(() => {
      setEyeGlow(Math.sin(Date.now() * 0.003) * 0.5 + 0.5);
    }, 50);

    const purrInterval = setInterval(() => {
      setPurr(Math.sin(Date.now() * 0.008) * 0.3 + 0.7);
    }, 100);

    return () => {
      clearInterval(glitchInterval);
      clearInterval(eyeInterval);
      clearInterval(purrInterval);
    };
  }, []);

  return (
    <div className="relative w-32 h-32 mx-auto mb-4">
      {/* Hologram Base Glow */}
      <div 
        className="absolute inset-0 rounded-full opacity-30"
        style={{
          background: `radial-gradient(circle, var(--accent) 0%, transparent 70%)`,
          filter: 'blur(12px)',
          transform: `scale(${purr})`
        }}
      />

      {/* Main Hologram Container */}
      <div 
        className="relative w-full h-full flex items-center justify-center"
        style={{
          transform: `translateX(${glitchOffset}px)`,
          transition: 'transform 0.2s ease-out'
        }}
      >
        {/* Adorable Alien Cat Face SVG */}
        <svg 
          className="w-28 h-28" 
          viewBox="0 0 120 120"
          style={{ 
            filter: `drop-shadow(0 0 12px var(--accent))`,
            opacity: 0.9
          }}
        >
          {/* Cat Ears with cute alien points */}
          <path
            d="M30 35 L25 15 L45 25 L40 35 Z"
            fill="var(--accent)"
            fillOpacity="0.3"
            stroke="var(--accent)"
            strokeWidth="2"
          />
          <path
            d="M90 35 L95 15 L75 25 L80 35 Z"
            fill="var(--accent)"
            fillOpacity="0.3"
            stroke="var(--accent)"
            strokeWidth="2"
          />

          {/* Cute alien antennae with sparkles */}
          <line
            x1="35"
            y1="20"
            x2="32"
            y2="8"
            stroke="var(--accent)"
            strokeWidth="2"
            opacity="0.8"
          />
          <circle
            cx="32"
            cy="8"
            r="3"
            fill="var(--accent)"
            opacity={0.7 + eyeGlow * 0.3}
          >
            <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
          </circle>
          
          <line
            x1="85"
            y1="20"
            x2="88"
            y2="8"
            stroke="var(--accent)"
            strokeWidth="2"
            opacity="0.8"
          />
          <circle
            cx="88"
            cy="8"
            r="3"
            fill="var(--accent)"
            opacity={0.7 + eyeGlow * 0.3}
          >
            <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" begin="1s" />
          </circle>

          {/* Adorable round cat head */}
          <circle
            cx="60"
            cy="60"
            r="25"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            opacity="0.8"
          />

          {/* Large adorable alien eyes */}
          <ellipse
            cx="50"
            cy="55"
            rx="6"
            ry="8"
            fill="var(--accent)"
            opacity={0.7 + eyeGlow * 0.3}
          />
          <ellipse
            cx="70"
            cy="55"
            rx="6"
            ry="8"
            fill="var(--accent)"
            opacity={0.7 + eyeGlow * 0.3}
          />

          {/* Cute eye pupils with sparkle */}
          <ellipse
            cx="50"
            cy="57"
            rx="2"
            ry="3"
            fill="#000"
            opacity="0.9"
          />
          <ellipse
            cx="70"
            cy="57"
            rx="2"
            ry="3"
            fill="#000"
            opacity="0.9"
          />

          {/* Eye sparkles */}
          <circle cx="48" cy="53" r="1" fill="white" opacity={eyeGlow} />
          <circle cx="68" cy="53" r="1" fill="white" opacity={eyeGlow} />

          {/* Adorable small triangle nose */}
          <path
            d="M60 65 L57 68 L63 68 Z"
            fill="var(--accent)"
            opacity="0.9"
          />

          {/* Cute cat mouth - happy expression */}
          <path
            d="M60 68 Q55 72 50 70"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            opacity="0.8"
          />
          <path
            d="M60 68 Q65 72 70 70"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            opacity="0.8"
          />

          {/* Cute whiskers */}
          <line x1="25" y1="58" x2="35" y2="60" stroke="var(--accent)" strokeWidth="1.5" opacity="0.7" />
          <line x1="25" y1="63" x2="35" y2="63" stroke="var(--accent)" strokeWidth="1.5" opacity="0.7" />
          <line x1="25" y1="68" x2="35" y2="66" stroke="var(--accent)" strokeWidth="1.5" opacity="0.7" />
          
          <line x1="95" y1="58" x2="85" y2="60" stroke="var(--accent)" strokeWidth="1.5" opacity="0.7" />
          <line x1="95" y1="63" x2="85" y2="63" stroke="var(--accent)" strokeWidth="1.5" opacity="0.7" />
          <line x1="95" y1="68" x2="85" y2="66" stroke="var(--accent)" strokeWidth="1.5" opacity="0.7" />

          {/* Cute alien markings on forehead */}
          <circle cx="60" cy="42" r="2" fill="var(--accent)" opacity="0.6">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="54" cy="38" r="1.5" fill="var(--accent)" opacity="0.5" />
          <circle cx="66" cy="38" r="1.5" fill="var(--accent)" opacity="0.5" />

          {/* Cute cheek blushes */}
          <ellipse cx="35" cy="65" rx="4" ry="2" fill="var(--accent)" opacity="0.3" />
          <ellipse cx="85" cy="65" rx="4" ry="2" fill="var(--accent)" opacity="0.3" />
        </svg>

        {/* Hologram glitch effect */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 3px,
              var(--accent) 3px,
              var(--accent) 4px
            )`,
            opacity: 0.08,
            animation: 'glitch 3s infinite'
          }}
        />
      </div>

      {/* Hologram scan lines */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 4px,
            var(--accent) 4px,
            var(--accent) 5px
          )`,
          opacity: 0.12,
          animation: 'scan 4s linear infinite'
        }}
      />

      {/* Floating heart particles for cuteness */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute text-xs animate-pulse"
            style={{
              color: 'var(--accent)',
              left: `${20 + i * 12}%`,
              top: `${15 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              opacity: 0.4
            }}
          >
            ♡
          </div>
        ))}
      </div>

      {/* Purring effect indicator */}
      <div 
        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs"
        style={{ 
          color: 'var(--accent)', 
          opacity: purr * 0.6,
          fontFamily: 'monospace'
        }}
      >
        *purr*
      </div>

      <style jsx>{`
        @keyframes glitch {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-1px); }
          40% { transform: translateX(1px); }
          60% { transform: translateX(-0.5px); }
          80% { transform: translateX(0.5px); }
        }

        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
};
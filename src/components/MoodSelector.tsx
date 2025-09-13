import React, { useState } from 'react';
import { Palette, ChevronDown } from 'lucide-react';
import { Mode } from '../types/shader';
import { modeColors } from '../constants/modes';

interface MoodSelectorProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({ currentMode, onModeChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const modes: { key: Mode; label: string; description: string }[] = [
    { key: 'pro', label: 'Pro', description: 'Professional cyan iris' },
    { key: 'gamer', label: 'Gamer', description: 'Gaming red iris' },
    { key: 'biohacker', label: 'Biohacker', description: 'Orange bio iris (no blue light)' },
    { key: 'hacker', label: 'Hacker', description: 'Matrix green iris' }
  ];

  const currentModeData = modes.find(m => m.key === currentMode) || modes[0];

  return (
    <div className="relative">
      {/* Mechanical Eye Thumbnail */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 hover:bg-[var(--accent-glow)]"
        style={{ border: '1px solid var(--accent)' }}
        title={`Current: ${currentModeData.label}`}
      >
        {/* Mechanical Eye Icon */}
        <div className="relative w-6 h-6 flex items-center justify-center">
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none"
            style={{ color: 'var(--accent)' }}
          >
            {/* Outer eye ring */}
            <circle 
              cx="12" 
              cy="12" 
              r="8" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              fill="none"
            />
            {/* Inner iris ring */}
            <circle 
              cx="12" 
              cy="12" 
              r="5" 
              stroke="currentColor" 
              strokeWidth="1" 
              fill="none"
              opacity="0.7"
            />
            {/* Pupil */}
            <circle 
              cx="12" 
              cy="12" 
              r="2" 
              fill="currentColor"
            />
            {/* Mechanical details */}
            <line x1="4" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <line x1="18" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <line x1="12" y1="4" x2="12" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <line x1="12" y1="18" x2="12" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            {/* Corner brackets */}
            <path d="M6 6 L8 6 L8 8" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M18 6 L16 6 L16 8" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M6 18 L8 18 L8 16" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M18 18 L16 18 L16 16" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
          </svg>
        </div>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--accent)' }} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-2 p-3 rounded-xl z-50 min-w-[280px]"
          style={{ 
            background: '#0a1a2f',
            boxShadow: '0 0 24px var(--accent-glow)',
            border: '1px solid var(--accent)'
          }}
        >
          <div className="mb-3 text-sm font-bold" 
               style={{ 
                 color: 'var(--accent)', 
                 textShadow: '0 0 8px var(--accent)',
                 fontFamily: 'Orbitron, monospace'
               }}>
            Change Your Iris
          </div>

          <div className="space-y-2">
            {modes.map((mode) => (
              <button
                key={mode.key}
                onClick={() => {
                  onModeChange(mode.key);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-3 rounded-md transition-all duration-200 hover:bg-[var(--accent-glow)] ${
                  currentMode === mode.key ? 'bg-[var(--accent-glow)]' : ''
                }`}
                style={{ color: 'var(--accent)' }}
              >
                <div className="flex items-center gap-3">
                  {/* Color preview */}
                  <div 
                    className="w-6 h-6 rounded-full border-2"
                    style={{ 
                      backgroundColor: modeColors[mode.key].accent,
                      borderColor: currentMode === mode.key ? 'white' : modeColors[mode.key].accent,
                      boxShadow: `0 0 8px ${modeColors[mode.key].accent}40`
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{mode.label}</div>
                    <div className="text-xs opacity-70">{mode.description}</div>
                  </div>
                  {currentMode === mode.key && (
                    <div className="text-xs px-2 py-1 rounded" 
                         style={{ backgroundColor: 'var(--accent)', color: '#0a1a2f' }}>
                      Active
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Color palette preview */}
          <div className="mt-3 pt-3 border-t border-[var(--accent-glow)]">
            <div className="text-xs mb-2" style={{ color: 'var(--accent)', opacity: 0.7 }}>
              Full Iris Palette Preview:
            </div>
            <div className="grid grid-cols-4 gap-1">
              {modes.map((mode) => (
                <div
                  key={mode.key}
                  className="h-8 rounded flex items-center justify-center text-xs font-bold cursor-pointer hover:scale-105 transition-transform"
                  style={{ 
                    background: modeColors[mode.key].bg,
                    color: modeColors[mode.key].accent,
                    border: `1px solid ${modeColors[mode.key].accent}40`
                  }}
                  onClick={() => {
                    onModeChange(mode.key);
                    setIsOpen(false);
                  }}
                  title={mode.label}
                >
                  {mode.label.charAt(0)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
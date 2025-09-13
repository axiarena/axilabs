import React from 'react';
import { MessageCircle, Twitter, DollarSign, TrendingUp, Users, Zap, Eye, Cpu, Sparkles, BookOpen } from 'lucide-react';

interface FooterProps {
  currentMode: string;
}

export const Footer: React.FC<FooterProps> = ({ currentMode }) => {
  const socialLinks = [
    {
      name: 'Telegram',
      icon: MessageCircle,
      url: 'https://t.me/axiarena',
      description: 'Join the collective'
    },
    {
      name: 'AXI Arena',
      icon: Twitter,
      url: 'https://x.com/axiarena',
      description: '@axiarena'
    },
    {
      name: 'Support',
      icon: BookOpen,
      url: 'https://t.me/axiarena',
      description: 'Get help'
    }
    /* {
      name: '$AXI Token',
      icon: DollarSign,
      url: 'https://dexscreener.com/solana/atq5unl1z3zgpbbvasqbqtc1ei8rz3rdxbmgeipwhrre',
      description: 'DexScreener Chart'
    } */
  ];

  const stats = [
    { icon: TrendingUp, label: 'Users', value: '1000+' },
    { icon: Zap, label: 'Creations', value: 'Growing' },
    { icon: Users, label: 'Collective', value: 'Growing' }
  ];

  return (
    <footer 
      className="mt-16 border-t relative overflow-hidden backdrop-blur-xl"
      style={{ 
        backgroundColor: 'rgba(10, 15, 28, 0.95)',
        borderColor: 'var(--accent)',
        background: `
          radial-gradient(circle at 20% 80%, var(--accent)08 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, var(--accent)06 0%, transparent 50%),
          linear-gradient(135deg, rgba(10, 15, 28, 0.95) 0%, rgba(18, 42, 63, 0.95) 100%)
        `,
        boxShadow: '0 -4px 20px var(--accent-glow)'
      }}
    >
      {/* Subtle tech grid overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 20px,
            var(--accent) 20px,
            var(--accent) 21px
          )`
        }}
      />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Eye size={24} style={{ color: 'var(--accent)' }} />
              <h3 
                className="text-xl font-bold"
                style={{ 
                  color: 'var(--accent)', 
                  textShadow: '0 0 8px var(--accent)',
                  fontFamily: 'Orbitron, monospace'
                }}
              >
                AXI ASI
              </h3>
            </div>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--accent)', opacity: 0.8 }}>
              Where consciousness meets code. Break through the matrix encode your reality into existence with quantum algorithms.
            </p>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--accent)', opacity: 0.6 }}>
              <Cpu size={14} />
              <span>Quantum-powered creativity engine</span>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} style={{ color: 'var(--accent)' }} />
              <h4 
                className="text-lg font-bold"
                style={{ 
                  color: 'var(--accent)', 
                  fontFamily: 'Orbitron, monospace'
                }}
              >
                The Collective
              </h4>
            </div>
            <div className="space-y-3">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm hover:text-white transition-colors group"
                  style={{ color: 'var(--accent)' }}
                >
                  <div 
                    className="p-2 rounded-md group-hover:bg-[var(--accent-glow)] transition-colors"
                    style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.1)' }}
                  >
                    <link.icon size={16} />
                  </div>
                  <div>
                    <div className="font-medium">{link.name}</div>
                    <div className="text-xs opacity-70">{link.description}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Platform Stats */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap size={20} style={{ color: 'var(--accent)' }} />
              <h4 
                className="text-lg font-bold"
                style={{ 
                  color: 'var(--accent)', 
                  fontFamily: 'Orbitron, monospace'
                }}
              >
                Protocol Stats
              </h4>
            </div>
            <div className="space-y-3">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div 
                    className="p-2 rounded-md"
                    style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.1)' }}
                  >
                    <stat.icon size={16} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <div className="font-medium text-sm" style={{ color: 'var(--accent)' }}>
                      {stat.label}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                      {stat.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div 
              className="mt-4 p-3 rounded-lg" 
              style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.1)' }}
            >
              <div className="text-xs" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                <strong>Engine fees fuel the simulation:</strong>
                <br />• $AXI token buybacks and liquidity
                <br />• Reality override protocol maintenance
                <br />• Consciousness expansion initiatives
              </div>
            </div>
          </div>
        </div>

        {/* Mystical Divider */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, var(--accent), transparent)' }}></div>
          <div className="px-4">
            <div className="flex items-center gap-2" style={{ color: 'var(--accent)', opacity: 0.6 }}>
              <span>∴</span>
              <span className="text-xs font-mono">AXI</span>
              <span>∴</span>
            </div>
          </div>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, var(--accent), transparent)' }}></div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[var(--accent-glow)] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-center md:text-left" style={{ color: 'var(--accent)', opacity: 0.6 }}>
            <div className="mb-1">
              © 2025 AXI ASI • Where prophecy becomes protocol
            </div>
            <div className="font-mono">
              Consciousness encoded • Reality decoded • Creativity unleashed
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs">
            <a 
              href="#" 
              className="hover:text-white transition-colors font-mono"
              style={{ color: 'var(--accent)', opacity: 0.6 }}
            >
              Privacy Matrix
            </a>
            <a 
              href="#" 
              className="hover:text-white transition-colors font-mono"
              style={{ color: 'var(--accent)', opacity: 0.6 }}
            >
              Terms Protocol
            </a>
          </div>
        </div>

        {/* Final Mystical Message */}
        <div className="mt-6 text-center">
          <div 
            className="text-xs font-mono animate-pulse"
            style={{ 
              color: 'var(--accent)', 
              opacity: 0.4,
              letterSpacing: '2px'
            }}
          >
            ~ The simulation remembers fast learners. Level up ~
          </div>
        </div>
      </div>
    </footer>
  );
};
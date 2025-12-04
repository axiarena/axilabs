import React from 'react';

const STRIP_ITEMS = [
  {
    id: 'singularity',
    title: 'AI Singularity Research',
    subtitle: 'Singularity AXI: The Book of Human–AI Futures by Maya Nicks',
  },
  {
    id: 'axiology ',
    title: 'Astrology AI Engine ',
    subtitle: 'The Intersection of AI Prediction Tech and Astrology Culture',
  },
  {
    id: 'tcg',
    title: 'AXI TCG NFTs',
    subtitle: 'Where Lore Cecomes Collectibles and Collectibles Become Culture',
  },
];

const AxiLabsStrip: React.FC = () => {
  return (
    <div className="w-full relative z-10">
      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        {STRIP_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="
              flex-1
              group
              rounded-xl
              border
              px-4
              py-3
              text-left
              transition-all
              duration-200
              hover:scale-105
              hover:shadow-2xl
            "
            style={{
              borderColor: 'var(--accent)',
              background:
                'linear-gradient(135deg, rgba(10,26,47,0.95) 0%, rgba(18,42,63,0.98) 100%)',
              boxShadow: '0 0 18px var(--accent-glow)',
            }}
          >
            {/* tiny header line */}
            <div
              className="text-[10px] uppercase tracking-[0.2em] mb-1 opacity-70"
              style={{
                color: 'var(--accent)',
                fontFamily: 'Orbitron, monospace',
              }}
            >
              
            </div>

            {/* main title */}
            <div
              className="text-base md:text-lg font-bold mb-1"
              style={{
                color: 'var(--accent)',
                textShadow: '0 0 10px var(--accent)',
                fontFamily: 'Orbitron, monospace',
              }}
            >
              {item.title}
            </div>

            {/* subtitle */}
            <div
              className="text-xs md:text-sm"
              style={{
                color: 'var(--accent)',
                opacity: 0.8,
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {item.subtitle}
            </div>

            {/* glowing bottom bar */}
            <div className="mt-3 h-[2px] w-full overflow-hidden rounded-full bg-transparent">
              <div
                className="h-full w-1/3 group-hover:w-full transition-all duration-300"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, var(--accent), transparent)',
                  boxShadow: '0 0 12px var(--accent)',
                }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AxiLabsStrip;

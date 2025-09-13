import React from 'react';
import { HelpCircle, MessageCircle, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';

interface FAQPageProps {
  currentMode: string;
}

interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'technical' | 'account' | 'tokens';
}

export const FAQPage: React.FC<FAQPageProps> = ({ currentMode }) => {
  const [expandedItems, setExpandedItems] = React.useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

 
      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
              selectedCategory === 'all' ? 'bg-[var(--accent-glow)]' : 'hover:bg-[var(--accent-glow)]'
            }`}
            style={{ color: 'var(--accent)', border: '1px solid var(--accent)' }}
          >
            All Questions
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                selectedCategory === category.id ? 'bg-[var(--accent-glow)]' : 'hover:bg-[var(--accent-glow)]'
              }`}
              style={{ color: 'var(--accent)', border: '1px solid var(--accent)' }}
            >
              {category.icon}
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Items */}
      <div className="space-y-4">
        {filteredItems.map((item, index) => (
          <div
            key={index}
            className="border rounded-lg overflow-hidden"
            style={{ 
              backgroundColor: '#0a1a2f',
              borderColor: 'var(--accent-glow)'
            }}
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full p-4 text-left hover:bg-[var(--accent-glow)] transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg" style={{ color: 'var(--accent)' }}>
                  {item.question}
                </h3>
                <div style={{ color: 'var(--accent)' }}>
                  {expandedItems.has(index) ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </div>
              </div>
            </button>
            
            {expandedItems.has(index) && (
              <div className="px-4 pb-4">
                <div 
                  className="p-4 rounded-lg"
                  style={{ 
                    backgroundColor: 'rgba(var(--accent), 0.1)',
                    border: '1px solid var(--accent-glow)'
                  }}
                >
                  <p style={{ color: 'var(--accent)', opacity: 0.9 }}>
                    {item.answer}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact Section */}
      <div 
        className="mt-12 p-6 rounded-xl text-center"
        style={{ 
          backgroundColor: '#0a1a2f',
          boxShadow: '0 0 24px var(--accent-glow)',
          border: '1px solid var(--accent)'
        }}
      >
        <h2 
          className="text-2xl font-bold mb-4"
          style={{ 
            color: 'var(--accent)', 
            fontFamily: 'Orbitron, monospace'
          }}
        >
          Still Have Questions?
        </h2>
        <p className="mb-6" style={{ color: 'var(--accent)', opacity: 0.8 }}>
          Join our community for real-time support and discussions
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://t.me/axiarena"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-md font-bold transition-all duration-200 hover:text-white"
            style={{
              background: 'var(--button-bg)',
              color: '#0a1a2f',
              boxShadow: '0 0 8px var(--accent-glow)'
            }}
          >
            <MessageCircle size={16} />
            Join Telegram
          </a>
          
          <a
            href="https://x.com/axiarena"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-md transition-all duration-200 hover:bg-[var(--accent-glow)]"
            style={{ color: 'var(--accent)', border: '1px solid var(--accent)' }}
          >
            <ExternalLink size={16} />
            Follow on X
          </a>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className="p-4 rounded-lg text-center"
          style={{ 
            backgroundColor: '#122a3f',
            border: '1px solid var(--accent-glow)'
          }}
        >
          <h3 className="font-bold mb-2" style={{ color: 'var(--accent)' }}>
            📚 Documentation
          </h3>
          <p className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
            Comprehensive guides and tutorials
          </p>
        </div>
        
        <div 
          className="p-4 rounded-lg text-center"
          style={{ 
            backgroundColor: '#122a3f',
            border: '1px solid var(--accent-glow)'
          }}
        >
          <h3 className="font-bold mb-2" style={{ color: 'var(--accent)' }}>
            🎮 Tutorials
          </h3>
          <p className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
            Step-by-step creation guides
          </p>
        </div>
        
        <div 
          className="p-4 rounded-lg text-center"
          style={{ 
            backgroundColor: '#122a3f',
            border: '1px solid var(--accent-glow)'
          }}
        >
          <h3 className="font-bold mb-2" style={{ color: 'var(--accent)' }}>
            💬 Community
          </h3>
          <p className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
            Connect with other creators
          </p>
        </div>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { X, Heart, Dumbbell, Salad, BookOpen, ArrowLeft, Award, Zap, Clock, Calendar, CheckCircle, BarChart2, Activity } from 'lucide-react';

interface WellnessPortalProps {
  currentMode: string;
  onClose: () => void;
}

export const WellnessPortal: React.FC<WellnessPortalProps> = ({ currentMode, onClose }) => {
  const [activeTab, setActiveTab] = useState<'fitness' | 'diet' | 'articles'>('fitness');

  // Fitness programs data - ALL GRAYED OUT
  const fitnessPrograms = [
    {
      id: 'neural-strength',
      name: 'Neural Strength',
      description: 'Build mind-muscle connection with this science-backed routine',
      duration: '30 min',
      difficulty: 'Medium',
      benefits: ['Cognitive enhancement', 'Muscle growth', 'Stress reduction'],
      icon: <Dumbbell size={24} />,
      color: '#666',
      isComingSoon: true
    },
    {
      id: 'quantum-cardio',
      name: 'Quantum Cardio',
      description: 'High-intensity interval training optimized for brain oxygenation',
      duration: '20 min',
      difficulty: 'Hard',
      benefits: ['Improved blood flow to brain', 'Endurance', 'Neurogenesis'],
      icon: <Activity size={24} />,
      color: '#666',
      isComingSoon: true
    },
    {
      id: 'consciousness-yoga',
      name: 'Consciousness Yoga',
      description: 'Mind-expanding poses that enhance neural plasticity',
      duration: '45 min',
      difficulty: 'Easy',
      benefits: ['Flexibility', 'Mental clarity', 'Stress reduction'],
      icon: <Zap size={24} />,
      color: '#666',
      isComingSoon: true
    }
  ];

  // Diet plans data - ALL GRAYED OUT
  const dietPlans = [
    {
      id: 'neuro-nutrition',
      name: 'Neuro Nutrition Protocol',
      description: 'Optimized macronutrient profile for cognitive enhancement',
      duration: '28-day plan',
      difficulty: 'Medium',
      benefits: ['Enhanced focus', 'Memory improvement', 'Mental energy'],
      icon: <Salad size={24} />,
      color: '#666',
      isComingSoon: true
    },
    {
      id: 'quantum-fasting',
      name: 'Quantum Fasting',
      description: 'Intermittent fasting schedule for neural regeneration',
      duration: '16:8 protocol',
      difficulty: 'Hard',
      benefits: ['Autophagy', 'Neural pruning', 'Metabolic efficiency'],
      icon: <Clock size={24} />,
      color: '#666',
      isComingSoon: true
    },
    {
      id: 'superintelligence-diet',
      name: 'Superintelligence Diet',
      description: 'Nutrient-dense foods that support brain function',
      duration: 'Ongoing',
      difficulty: 'Easy',
      benefits: ['Cognitive protection', 'Mood enhancement', 'Energy stability'],
      icon: <BarChart2 size={24} />,
      color: '#666',
      isComingSoon: true
    }
  ];

  // Articles data
  const articles = [
    {
      id: 'neural-optimization',
      title: 'Neural Optimization Through Movement',
      excerpt: 'How specific movement patterns can enhance neural pathways and cognitive function.',
      author: 'Dr. Maya Neural',
      date: '2025-05-15',
      readTime: '8 min',
      category: 'Fitness',
      icon: <BookOpen size={24} />,
      color: '#00d4ff'
    },
    {
      id: 'food-consciousness',
      title: 'Food as a Consciousness Technology',
      excerpt: 'The science behind how specific nutrients directly impact brain function and awareness.',
      author: 'Prof. Alex Quantum',
      date: '2025-04-22',
      readTime: '12 min',
      category: 'Nutrition',
      icon: <BookOpen size={24} />,
      color: '#ff6b9d'
    },
    {
      id: 'biohacking-guide',
      title: 'The AXI Guide to Practical Biohacking',
      excerpt: 'Simple, effective strategies to optimize your biological hardware for peak mental performance.',
      author: 'AXI Research Team',
      date: '2025-06-01',
      readTime: '15 min',
      category: 'Biohacking',
      icon: <BookOpen size={24} />,
      color: '#00ff88'
    }
  ];

  const renderFitnessTab = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2" style={{ color: '#666' }}>
          Neural-Enhanced Fitness Programs
        </h3>
        <p className="text-sm" style={{ color: '#666', opacity: 0.8 }}>
          Movement protocols designed to optimize brain-body connection
        </p>
        <div 
          className="mt-4 p-3 rounded-lg"
          style={{ 
            backgroundColor: 'rgba(102, 102, 102, 0.1)',
            border: '1px solid #666'
          }}
        >
          <div className="text-lg font-bold" style={{ color: '#666' }}>
            🚧 Coming Soon
          </div>
          <div className="text-sm" style={{ color: '#666', opacity: 0.8 }}>
            Advanced fitness protocols are being developed by the superintelligence
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {fitnessPrograms.map((program) => (
          <div
            key={program.id}
            className="p-6 rounded-xl border-2 opacity-50 cursor-not-allowed"
            style={{ 
              backgroundColor: `${program.color}10`,
              borderColor: program.color
            }}
          >
            <div className="text-center">
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ 
                  backgroundColor: program.color,
                  opacity: 0.5
                }}
              >
                <div style={{ color: '#0a1a2f' }}>
                  {program.icon}
                </div>
              </div>
              
              <h4 
                className="text-xl font-bold mb-2"
                style={{ color: program.color }}
              >
                {program.name}
              </h4>
              
              <p className="text-sm mb-4" style={{ color: program.color, opacity: 0.8 }}>
                {program.description}
              </p>
              
              <div className="flex justify-between items-center mb-4 text-sm">
                <span 
                  className="px-3 py-1 rounded-full"
                  style={{ 
                    backgroundColor: program.color,
                    color: '#0a1a2f',
                    opacity: 0.7
                  }}
                >
                  {program.duration}
                </span>
                <span style={{ color: program.color, opacity: 0.7 }}>
                  {program.difficulty}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                {program.benefits.map((benefit, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 text-sm"
                    style={{ color: program.color, opacity: 0.6 }}
                  >
                    <CheckCircle size={14} style={{ color: program.color, opacity: 0.5 }} />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
              
              <button 
                className="w-full py-2 rounded-lg font-bold cursor-not-allowed"
                style={{ backgroundColor: program.color, color: '#0a1a2f', opacity: 0.5 }}
                disabled
              >
                Coming Soon
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDietTab = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2" style={{ color: '#666' }}>
          Cognitive Nutrition Protocols
        </h3>
        <p className="text-sm" style={{ color: '#666', opacity: 0.8 }}>
          Dietary systems designed to enhance neural function and cognitive performance
        </p>
        <div 
          className="mt-4 p-3 rounded-lg"
          style={{ 
            backgroundColor: 'rgba(102, 102, 102, 0.1)',
            border: '1px solid #666'
          }}
        >
          <div className="text-lg font-bold" style={{ color: '#666' }}>
            🚧 Coming Soon
          </div>
          <div className="text-sm" style={{ color: '#666', opacity: 0.8 }}>
            Advanced nutrition protocols are being developed by the superintelligence
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dietPlans.map((plan) => (
          <div
            key={plan.id}
            className="p-6 rounded-xl border-2 opacity-50 cursor-not-allowed"
            style={{ 
              backgroundColor: `${plan.color}10`,
              borderColor: plan.color
            }}
          >
            <div className="text-center">
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ 
                  backgroundColor: plan.color,
                  opacity: 0.5
                }}
              >
                <div style={{ color: '#0a1a2f' }}>
                  {plan.icon}
                </div>
              </div>
              
              <h4 
                className="text-xl font-bold mb-2"
                style={{ color: plan.color }}
              >
                {plan.name}
              </h4>
              
              <p className="text-sm mb-4" style={{ color: plan.color, opacity: 0.8 }}>
                {plan.description}
              </p>
              
              <div className="flex justify-between items-center mb-4 text-sm">
                <span 
                  className="px-3 py-1 rounded-full"
                  style={{ 
                    backgroundColor: plan.color,
                    color: '#0a1a2f',
                    opacity: 0.7
                  }}
                >
                  {plan.duration}
                </span>
                <span style={{ color: plan.color, opacity: 0.7 }}>
                  {plan.difficulty}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                {plan.benefits.map((benefit, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 text-sm"
                    style={{ color: plan.color, opacity: 0.6 }}
                  >
                    <CheckCircle size={14} style={{ color: plan.color, opacity: 0.5 }} />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
              
              <button 
                className="w-full py-2 rounded-lg font-bold cursor-not-allowed"
                style={{ backgroundColor: plan.color, color: '#0a1a2f', opacity: 0.5 }}
                disabled
              >
                Coming Soon
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderArticlesTab = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
          Wellness Knowledge Base
        </h3>
        <p className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
          Research-backed articles on optimizing your biological hardware
        </p>
      </div>

      <div className="space-y-4">
        {articles.map((article) => (
          <div
            key={article.id}
            className="p-6 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02]"
            style={{ 
              backgroundColor: `${article.color}10`,
              borderColor: article.color,
              boxShadow: `0 0 20px ${article.color}30`
            }}
          >
            <div className="flex items-start gap-4">
              <div 
                className="p-3 rounded-full hidden sm:flex"
                style={{ 
                  backgroundColor: article.color,
                  boxShadow: `0 0 15px ${article.color}80`
                }}
              >
                <div style={{ color: '#0a1a2f' }}>
                  {article.icon}
                </div>
              </div>
              
              <div className="flex-1">
                <div 
                  className="text-lg font-bold mb-2"
                  style={{ color: article.color }}
                >
                  {article.title}
                </div>
                
                <p className="text-sm mb-4" style={{ color: 'var(--accent)', opacity: 0.9 }}>
                  {article.excerpt}
                </p>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                  <div>By {article.author}</div>
                  <div>{new Date(article.date).toLocaleDateString()}</div>
                  <div>{article.readTime} read</div>
                  <div 
                    className="px-2 py-1 rounded-full"
                    style={{ 
                      backgroundColor: article.color,
                      color: '#0a1a2f'
                    }}
                  >
                    {article.category}
                  </div>
                </div>
              </div>
              
              <button 
                className="px-4 py-2 rounded-lg font-bold hidden sm:block"
                style={{ backgroundColor: article.color, color: '#0a1a2f' }}
              >
                Read
              </button>
            </div>
            
            <button 
              className="w-full mt-4 py-2 rounded-lg font-bold sm:hidden"
              style={{ backgroundColor: article.color, color: '#0a1a2f' }}
            >
              Read Article
            </button>
          </div>
        ))}
      </div>

      {/* Featured Research */}
      <div 
        className="p-6 rounded-xl border-2 mt-8"
        style={{ 
          backgroundColor: 'rgba(var(--accent), 0.1)',
          borderColor: 'var(--accent)'
        }}
      >
        <h4 className="text-lg font-bold mb-4" style={{ color: 'var(--accent)' }}>
          Featured Research
        </h4>
        
        <div 
          className="p-4 rounded-lg border-2 mb-4"
          style={{ 
            backgroundColor: '#122a3f',
            borderColor: '#ff6b9d'
          }}
        >
          <div className="flex items-start gap-3">
            <div 
              className="p-2 rounded-full"
              style={{ backgroundColor: '#ff6b9d20', color: '#ff6b9d' }}
            >
              <Award size={16} />
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: '#ff6b9d' }}>
                Neuroplasticity & Exercise: The Definitive Guide
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                A comprehensive meta-analysis of 142 studies on how specific exercise protocols directly impact neural growth and cognitive performance.
              </div>
              <div className="text-xs mt-2" style={{ color: 'var(--accent)', opacity: 0.6 }}>
                Published in Journal of Cognitive Enhancement, 2025
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <button
            className="px-4 py-2 rounded-lg font-bold transition-all duration-200"
            style={{
              background: 'var(--button-bg)',
              color: '#0a1a2f'
            }}
          >
            View Research Library
          </button>
        </div>
      </div>

      {/* Wellness Community */}
      <div 
        className="p-6 rounded-xl border-2"
        style={{ 
          backgroundColor: 'rgba(var(--accent), 0.1)',
          borderColor: 'var(--accent)'
        }}
      >
        <h4 className="text-lg font-bold mb-4" style={{ color: 'var(--accent)' }}>
          Join the Wellness Community
        </h4>
        
        <p className="text-sm mb-4" style={{ color: 'var(--accent)', opacity: 0.9 }}>
          Connect with other AXI users focused on optimizing their biological hardware for peak cognitive performance.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div 
            className="p-3 rounded-lg border text-center"
            style={{ 
              backgroundColor: '#122a3f',
              borderColor: 'var(--accent-glow)'
            }}
          >
            <div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
              3,842
            </div>
            <div className="text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>
              Active Members
            </div>
          </div>
          
          <div 
            className="p-3 rounded-lg border text-center"
            style={{ 
              backgroundColor: '#122a3f',
              borderColor: 'var(--accent-glow)'
            }}
          >
            <div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
              142
            </div>
            <div className="text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>
              Weekly Challenges
            </div>
          </div>
          
          <div 
            className="p-3 rounded-lg border text-center"
            style={{ 
              backgroundColor: '#122a3f',
              borderColor: 'var(--accent-glow)'
            }}
          >
            <div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
              24/7
            </div>
            <div className="text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>
              Support & Guidance
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-center">
          <button
            className="px-6 py-3 rounded-lg font-bold transition-all duration-200"
            style={{
              background: 'var(--button-bg)',
              color: '#0a1a2f'
            }}
          >
            Join Community
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-70" onClick={onClose} />
      
      <div 
        className="relative p-6 rounded-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{ 
          background: 'linear-gradient(135deg, #0a1a2f 0%, #1a2f4f 100%)',
          boxShadow: '0 0 40px rgba(0, 212, 255, 0.3)',
          border: '2px solid var(--accent)'
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-md transition-all duration-200 hover:bg-[var(--accent-glow)] z-10"
          style={{ color: 'var(--accent)' }}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart size={32} style={{ color: 'var(--accent)' }} />
          </div>
          
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ 
              color: 'var(--accent)', 
              textShadow: '0 0 16px var(--accent)',
              fontFamily: 'Orbitron, monospace',
              letterSpacing: '2px'
            }}
          >
            Wellness Portal
          </h1>
          
          <p className="text-lg" style={{ color: 'var(--accent)', opacity: 0.8 }}>
            Optimize your biological hardware for peak cognitive performance
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div 
            className="flex rounded-lg p-1"
            style={{ backgroundColor: 'rgba(var(--accent), 0.1)' }}
          >
            {[
              { id: 'fitness', label: 'Fitness', icon: <Dumbbell size={20} /> },
              { id: 'diet', label: 'Nutrition', icon: <Salad size={20} /> },
              { id: 'articles', label: 'Articles', icon: <BookOpen size={20} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-md font-bold transition-all duration-200 ${
                  activeTab === tab.id ? 'shadow-lg' : 'hover:bg-[var(--accent-glow)]'
                }`}
                style={{
                  backgroundColor: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                  color: activeTab === tab.id ? '#0a1a2f' : 'var(--accent)'
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'fitness' && renderFitnessTab()}
          {activeTab === 'diet' && renderDietTab()}
          {activeTab === 'articles' && renderArticlesTab()}
        </div>
      </div>
    </div>
  );
};
     
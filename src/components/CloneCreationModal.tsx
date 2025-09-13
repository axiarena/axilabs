import React, { useState } from 'react';
import { X, Check, AlertCircle, Loader, Calendar, Mail, Globe, DollarSign, BookOpen, ShoppingCart, Heart } from 'lucide-react';

interface CloneCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateClone: (cloneData: any) => void;
  currentMode: string;
}

interface CloneTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  capabilities: string[];
  color: string;
}

export const CloneCreationModal: React.FC<CloneCreationModalProps> = ({
  isOpen,
  onClose,
  onCreateClone,
  currentMode
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [cloneName, setCloneName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState<'select' | 'configure' | 'confirm'>('select');

  const cloneTemplates: CloneTemplate[] = [
    {
      id: 'email',
      name: 'Email Assistant',
      description: 'Manages your inbox, drafts responses, and filters spam',
      icon: <Mail size={24} />,
      capabilities: ['Email sorting', 'Response drafting', 'Follow-up reminders', 'Spam filtering'],
      color: '#00d4ff'
    },
    {
      id: 'calendar',
      name: 'Calendar Manager',
      description: 'Schedules meetings, sends reminders, and optimizes your time',
      icon: <Calendar size={24} />,
      capabilities: ['Meeting scheduling', 'Time optimization', 'Event reminders', 'Conflict resolution'],
      color: '#00d4ff'
    },
    {
      id: 'social',
      name: 'Social Media Manager',
      description: 'Creates and schedules posts across your social platforms',
      icon: <Globe size={24} />,
      capabilities: ['Content creation', 'Post scheduling', 'Engagement monitoring', 'Trend analysis'],
      color: '#00d4ff'
    },
    {
      id: 'finance',
      name: 'Finance Monitor',
      description: 'Tracks expenses, monitors investments, and suggests savings',
      icon: <DollarSign size={24} />,
      capabilities: ['Expense tracking', 'Investment monitoring', 'Budget optimization', 'Financial alerts'],
      color: '#00d4ff'
    },
    {
      id: 'horoscope',
      name: 'Horoscope Assistant',
      description: 'Provides daily horoscopes, astrological insights, and cosmic guidance',
      icon: <BookOpen size={24} />,
      capabilities: ['Daily horoscopes', 'Astrological analysis', 'Cosmic guidance', 'Planetary insights'],
      color: '#00d4ff'
    },
    {
      id: 'shopping',
      name: 'Shopping Assistant',
      description: 'Finds deals, compares prices, and tracks deliveries',
      icon: <ShoppingCart size={24} />,
      capabilities: ['Deal finding', 'Price comparison', 'Delivery tracking', 'Product recommendations'],
      color: '#00d4ff'
    },
    {
      id: 'fitness',
      name: 'Fitness Tracker',
      description: 'Monitors workouts, suggests exercises, and tracks progress',
      icon: <Heart size={24} />,
      capabilities: ['Workout monitoring', 'Exercise suggestions', 'Progress tracking', 'Health insights'],
      color: '#00d4ff'
    }
  ];

  const getSelectedTemplate = () => {
    return cloneTemplates.find(template => template.id === selectedTemplate);
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = cloneTemplates.find(t => t.id === templateId);
    if (template) {
      setCloneName(`My ${template.name}`);
    }
    setCurrentStep('configure');
  };

  const handleCreateClone = () => {
    if (!selectedTemplate || !cloneName.trim()) {
      setError('Please provide a name for your clone');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      try {
        const template = getSelectedTemplate();
        if (!template) {
          throw new Error('Template not found');
        }

        const newClone = {
          name: cloneName.trim(),
          template: selectedTemplate,
          handle: selectedTemplate + '_clone',
          capabilities: template.capabilities,
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        onCreateClone(newClone);
        
        // Show coming soon message
        alert(`🤖 ${cloneName} Clone Creation\n\nYour digital clone is being prepared and will be available in the upcoming release.\n\nStay tuned for the full launch of AXI Digital Clones!`);
        
        onClose();
      } catch (err) {
        setError('Failed to create clone. Please try again.');
        console.error('Clone creation error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 1500);
  };

  const handleBack = () => {
    if (currentStep === 'configure') {
      setCurrentStep('select');
    } else if (currentStep === 'confirm') {
      setCurrentStep('configure');
    }
  };

  if (!isOpen) return null;

  const renderSelectStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
          Choose Your Digital Clone
        </h3>
        <p className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
          Select a template to start with. You can customize it in the next step.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cloneTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleSelectTemplate(template.id)}
            className="p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105"
            style={{ 
              backgroundColor: `${template.color}10`,
              borderColor: template.color
            }}
          >
            <div className="flex items-start gap-3">
              <div 
                className="p-2 rounded-md"
                style={{ 
                  backgroundColor: `${template.color}20`,
                  color: template.color
                }}
              >
                {template.icon}
              </div>
              <div>
                <h4 className="font-bold mb-1" style={{ color: template.color }}>
                  {template.name}
                </h4>
                <p className="text-sm mb-2" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                  {template.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.capabilities.slice(0, 2).map((capability, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 rounded"
                      style={{ backgroundColor: `${template.color}30`, color: template.color }}
                    >
                      {capability}
                    </span>
                  ))}
                  {template.capabilities.length > 2 && (
                    <span className="text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                      +{template.capabilities.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div 
        className="p-4 rounded-lg border text-center"
        style={{ 
          backgroundColor: 'rgba(var(--accent), 0.1)',
          borderColor: 'var(--accent)',
          color: 'var(--accent)'
        }}
      >
        <div className="text-sm font-bold mb-1">🚀 Coming Soon</div>
        <div className="text-xs opacity-80">
          Digital clones are in development and will be available in the next update
        </div>
      </div>
    </div>
  );

  const renderConfigureStep = () => {
    const template = getSelectedTemplate();
    if (!template) return null;

    return (
      <div className="space-y-6">
        <div className="text-center mb-4">
          <div 
            className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
            style={{ 
              backgroundColor: `${template.color}20`,
              color: template.color
            }}
          >
            {template.icon}
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
            Configure Your {template.name}
          </h3>
          <p className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
            Customize your digital clone to fit your needs
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
              Clone Name
            </label>
            <input
              type="text"
              value={cloneName}
              onChange={(e) => setCloneName(e.target.value)}
              className="w-full px-4 py-2 bg-[#122a3f] border border-[var(--accent)] rounded-md text-[var(--accent)] placeholder-[var(--accent)] placeholder-opacity-60"
              placeholder="Enter a name for your clone"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
              Capabilities
            </label>
            <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--accent-glow)', backgroundColor: '#122a3f' }}>
              {template.capabilities.map((capability, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 py-2 border-b last:border-b-0"
                  style={{ borderColor: 'var(--accent-glow)' }}
                >
                  <Check size={16} style={{ color: template.color }} />
                  <span style={{ color: 'var(--accent)' }}>{capability}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-2 rounded-md border transition-all duration-200"
            style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
          >
            Back
          </button>
          
          <button
            onClick={() => setCurrentStep('confirm')}
            disabled={!cloneName.trim()}
            className="flex-1 py-2 rounded-md font-bold transition-all duration-200"
            style={{
              background: !cloneName.trim() ? '#666' : 'var(--button-bg)',
              color: !cloneName.trim() ? '#ccc' : '#0a1a2f',
              opacity: !cloneName.trim() ? 0.7 : 1
            }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  };

  const renderConfirmStep = () => {
    const template = getSelectedTemplate();
    if (!template) return null;

    return (
      <div className="space-y-6">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
            Confirm Your Digital Clone
          </h3>
          <p className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
            Review your clone details before creation
          </p>
        </div>

        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: '#122a3f',
            borderColor: 'var(--accent)'
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="p-3 rounded-full"
              style={{ 
                backgroundColor: `${template.color}20`,
                color: template.color
              }}
            >
              {template.icon}
            </div>
            <div>
              <h4 className="font-bold" style={{ color: 'var(--accent)' }}>
                {cloneName}
              </h4>
              <div className="text-sm" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                {template.name} Template
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium mb-1" style={{ color: 'var(--accent)' }}>
                What This Clone Will Do:
              </div>
              <ul className="text-sm space-y-1" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                {template.capabilities.map((capability, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check size={14} style={{ color: template.color }} />
                    {capability}
                  </li>
                ))}
              </ul>
            </div>

            <div 
              className="p-3 rounded-lg border"
              style={{ 
                backgroundColor: 'rgba(255, 165, 0, 0.1)',
                borderColor: 'rgba(255, 165, 0, 0.3)',
                color: '#ffa500'
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={14} />
                <span className="font-bold text-sm">Coming Soon</span>
              </div>
              <div className="text-xs">
                Digital clones are currently in development and will be available in the next update.
                Your configuration will be saved for when the feature launches.
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-2 rounded-md border transition-all duration-200"
            style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
          >
            Back
          </button>
          
          <button
            onClick={handleCreateClone}
            disabled={isLoading}
            className="flex-1 py-2 rounded-md font-bold transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: isLoading ? '#666' : 'var(--button-bg)',
              color: isLoading ? '#ccc' : '#0a1a2f'
            }}
          >
            {isLoading ? <Loader size={16} className="animate-spin" /> : null}
            {isLoading ? 'Creating...' : 'Create Clone'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div 
        className="relative p-6 rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{ 
          background: '#0a1a2f',
          boxShadow: '0 0 24px var(--accent-glow)',
          border: '2px solid var(--accent)'
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md transition-all duration-200 hover:bg-[var(--accent-glow)]"
          style={{ color: 'var(--accent)' }}
        >
          <X size={20} />
        </button>

        {/* Error Message */}
        {error && (
          <div 
            className="mb-4 p-3 rounded-md border flex items-center gap-2"
            style={{ 
              backgroundColor: 'rgba(255, 71, 87, 0.1)', 
              borderColor: '#ff4757',
              color: '#ff4757'
            }}
          >
            <AlertCircle size={16} />
            <div className="text-sm">{error}</div>
          </div>
        )}

        {/* Steps */}
        {currentStep === 'select' && renderSelectStep()}
        {currentStep === 'configure' && renderConfigureStep()}
        {currentStep === 'confirm' && renderConfirmStep()}
      </div>
    </div>
  );
};
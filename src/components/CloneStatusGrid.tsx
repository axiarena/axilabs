import React, { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, Plus, Settings, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { CloneCreationModal } from './CloneCreationModal';
import { CloneDetailModal } from './CloneDetailModal';

interface CloneStatusGridProps {
  currentMode: string;
  onCloneClick: () => void;
}

interface AxiClone {
  name: string;
  handle: string;
  status: 'active' | 'inactive' | 'pending';
  url: string;
  lastActive?: string;
  tasks?: number;
  completedTasks?: number;
}

export const CloneStatusGrid: React.FC<CloneStatusGridProps> = ({ currentMode, onCloneClick }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedClone, setSelectedClone] = useState<AxiClone | null>(null);

  // AXI Clone data - simplified to just name, handle, and URL
  const cloneData: AxiClone[] = [
    {
      name: 'AGI Virtual Assistant',
      handle: 'hello_world_AXI',
      status: 'active',
      url: 'https://x.com/hello_world_AXI',
      lastActive: '2025-07-05T12:30:00Z',
      tasks: 24,
      completedTasks: 24
    },
    { 
      name: 'Email Assistant', 
      handle: 'email_assistant', 
      status: 'active',
      url: '#',
      lastActive: '2025-07-05T14:15:00Z',
      tasks: 18,
      completedTasks: 16
    },
    { 
      name: 'Calendar Manager', 
      handle: 'calendar_bot', 
      status: 'active',
      url: '#',
      lastActive: '2025-07-05T13:45:00Z',
      tasks: 12,
      completedTasks: 12
    },
    { 
      name: 'Social Media', 
      handle: 'social_poster', 
      status: 'active',
      url: '#',
      lastActive: '2025-07-05T11:20:00Z',
      tasks: 30,
      completedTasks: 28
    },
    { 
      name: 'News Curator', 
      handle: 'news_digest', 
      status: 'active',
      url: '#',
      lastActive: '2025-07-05T10:05:00Z',
      tasks: 15,
      completedTasks: 15
    },
    { 
      name: 'Horoscope Assistant', 
      handle: 'horoscope_bot', 
      status: 'active',
      url: '#',
      lastActive: '2025-07-05T09:30:00Z',
      tasks: 8,
      completedTasks: 7
    },
    { 
      name: 'Fitness Tracker', 
      handle: 'fitness_coach', 
      status: 'inactive',
      url: '#'
    },
    { 
      name: 'Shopping Assistant', 
      handle: 'shopping_helper', 
      status: 'inactive',
      url: '#'
    },
    { 
      name: 'Finance Monitor', 
      handle: 'finance_tracker', 
      status: 'pending',
      url: '#'
    },
    { 
      name: 'Travel Planner', 
      handle: 'travel_agent', 
      status: 'pending',
      url: '#'
    },
    { 
      name: 'Learning Assistant', 
      handle: 'study_buddy', 
      status: 'pending',
      url: '#'
    },
    { 
      name: 'Content Creator', 
      handle: 'content_maker', 
      status: 'pending',
      url: '#'
    }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleCloneClick = (clone: AxiClone) => {    
    if (clone.status === 'pending') {
      alert('🚀 Coming Soon!\n\nThis digital clone type will be available in the next update.');
      return;
    }

    setSelectedClone(clone);
    setShowDetailModal(true);
  };

  const handleCreateClone = (cloneData: any) => {
    console.log('Creating clone:', cloneData);
    // In a real app, this would send the data to the backend
    // For now, we just close the modal
    setShowCreateModal(false);
  };

  return (
    <div 
      className="w-full p-3 lg:p-4 rounded-xl mb-4 lg:mb-6"
      style={{ 
        backgroundColor: '#0a1a2f',
        boxShadow: '0 0 24px var(--accent-glow)',
        border: '1px solid var(--accent)'
      }}
    >
      {/* Header */}
      <div className="mb-3 lg:mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm lg:text-lg font-bold mb-1 flex items-center gap-2" style={{ 
            color: 'var(--accent)', 
            textShadow: '0 0 8px var(--accent)',
            fontFamily: 'Orbitron, monospace'
          }}>
            🤖 Your Digital Clones
          </div>
          <div className="text-xs" style={{ color: 'var(--accent)', opacity: 0.8 }}>
            <span className="hidden sm:inline">AI assistants that handle your daily tasks - Coming Soon</span>
            <span className="sm:hidden">AI assistants for daily tasks - Coming Soon</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-1 lg:p-2 rounded-md transition-all duration-200 hover:bg-[var(--accent-glow)]"
            style={{ color: 'var(--accent)' }}
            title="Create new clone"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => setIsLoading(true)}
            disabled={isLoading}
            className="p-1 lg:p-2 rounded-md transition-all duration-200 hover:bg-[var(--accent-glow)]"
            style={{ color: 'var(--accent)' }}
            title="Refresh clone status"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Clone Grid - 4 rows, fully responsive */}
      <div className="grid grid-cols-1 gap-2 text-xs">
        {/* Mobile: 2 columns, Tablet+: 4 columns */}
        {[0, 1, 2, 3].map(rowIndex => (
          <div key={rowIndex} className="grid grid-cols-2 sm:grid-cols-4 gap-1 lg:gap-2">
            {cloneData.slice(rowIndex * 4, (rowIndex + 1) * 4).map((clone) => (
              <div
                key={clone.handle}
                className="p-2 lg:p-3 rounded cursor-pointer hover:bg-[var(--accent-glow)] transition-all duration-200 border"
                style={{
                  backgroundColor: clone.status === 'active' ? 'rgba(0, 255, 0, 0.1)' : 
                                  clone.status === 'inactive' ? 'rgba(255, 165, 0, 0.1)' : 
                                 'rgba(128, 128, 128, 0.1)',
                  borderColor: clone.status === 'active' ? '#00ff00' : 
                              clone.status === 'inactive' ? '#ffa500' : 
                              '#808080',
                  color: clone.status === 'active' ? '#00ff00' : 
                        clone.status === 'inactive' ? '#ffa500' : 
                        '#808080'
                }}
                onClick={() => handleCloneClick(clone)}
                title={clone.status === 'pending' ? 'Coming soon' : `Manage your ${clone.name} clone`}
              >
                <div className="text-center">
                  <div className="font-medium truncate mb-1 text-xs lg:text-sm">
                    {clone.name}
                  </div>
                  <div className="flex justify-center items-center gap-1 opacity-70 text-xs">
                    {clone.status === 'active' ? (
                      <CheckCircle size={10} />
                    ) : clone.status === 'inactive' ? (
                      <AlertCircle size={10} />
                    ) : (
                      <Clock size={10} />
                    )}
                    <span style={{ color: clone.name === 'AGI Virtual Assistant' ? '#808080' : 'inherit' }}>{clone.status === 'active' ? 'Active' : 
                          clone.status === 'inactive' ? 'Inactive' : 
                          'Coming Soon'}</span>
                  </div>
                  {clone.status === 'active' && clone.tasks && (
                    <div className="mt-1 text-xs" style={{ color: clone.name === 'AGI Virtual Assistant' ? '#808080' : 'inherit' }}>
                      {clone.completedTasks}/{clone.tasks} tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Mobile-specific status summary */}
      <div className="mt-3 pt-3 border-t border-[var(--accent-glow)] sm:hidden">
        <div className="flex justify-between text-xs" style={{ color: 'var(--accent)', opacity: 0.8 }}>
          <span>Active Clones: {cloneData.filter(c => c.status === 'active').length}</span>
          <span>Coming Soon: {cloneData.filter(c => c.status === 'pending').length}</span>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="mt-4 p-3 rounded-lg border text-center" style={{ 
        backgroundColor: 'rgba(var(--accent), 0.1)',
        borderColor: 'var(--accent)',
        color: 'var(--accent)'
      }}>
        <div className="text-sm font-bold mb-1">🚀 Digital Clones Coming Soon</div>
        <div className="text-xs opacity-80">
          Your personal AI assistants that handle daily tasks while you focus on what matters
        </div>
      </div>

      {/* Modals */}
      <CloneCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateClone={handleCreateClone}
        currentMode={currentMode}
      />

      <CloneDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        clone={selectedClone}
        currentMode={currentMode}
      />
    </div>
  );
}
import React, { useState } from 'react';
import { X, Settings, Play, Pause, RefreshCw, Calendar, Mail, Clock, CheckCircle, AlertCircle, Trash2, Edit, BarChart2, Cpu } from 'lucide-react';

interface CloneDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  clone: any;
  currentMode: string;
}

interface Task {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  scheduledFor: string;
  completedAt?: string;
}

export const CloneDetailModal: React.FC<CloneDetailModalProps> = ({
  isOpen,
  onClose,
  clone,
  currentMode
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'settings'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Sample tasks for the clone
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      description: 'Check and categorize new emails',
      status: 'completed',
      scheduledFor: '2025-07-05T08:00:00Z',
      completedAt: '2025-07-05T08:15:00Z'
    },
    {
      id: '2',
      description: 'Draft response to meeting invitation',
      status: 'completed',
      scheduledFor: '2025-07-05T09:30:00Z',
      completedAt: '2025-07-05T09:45:00Z'
    },
    {
      id: '3',
      description: 'Send follow-up emails to clients',
      status: 'in_progress',
      scheduledFor: '2025-07-05T14:00:00Z'
    },
    {
      id: '4',
      description: 'Clean inbox and archive old emails',
      status: 'pending',
      scheduledFor: '2025-07-05T16:00:00Z'
    },
    {
      id: '5',
      description: 'Generate weekly email summary report',
      status: 'pending',
      scheduledFor: '2025-07-05T17:30:00Z'
    }
  ]);

  if (!isOpen || !clone) return null;

  const handlePauseClone = () => {
    setIsLoading(true);
    setTimeout(() => {
      alert(`🤖 ${clone.name} has been paused. It will not perform any tasks until reactivated.`);
      setIsLoading(false);
    }, 1000);
  };

  const handleResumeClone = () => {
    setIsLoading(true);
    setTimeout(() => {
      alert(`🤖 ${clone.name} has been activated and will resume its tasks.`);
      setIsLoading(false);
    }, 1000);
  };

  const handleDeleteClone = () => {
    if (confirm(`Are you sure you want to delete ${clone.name}? This action cannot be undone.`)) {
      setIsLoading(true);
      setTimeout(() => {
        alert(`🤖 ${clone.name} has been deleted.`);
        onClose();
      }, 1000);
    }
  };

  const handleRefreshTasks = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert(`🤖 ${clone.name}'s tasks have been refreshed.`);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#00ff00';
      case 'in_progress': return '#00d4ff';
      case 'pending': return '#ffa500';
      case 'failed': return '#ff4757';
      default: return 'var(--accent)';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} />;
      case 'in_progress': return <RefreshCw size={16} className="animate-spin" />;
      case 'pending': return <Clock size={16} />;
      case 'failed': return <AlertCircle size={16} />;
      default: return null;
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ 
            backgroundColor: clone.status === 'active' ? 'rgba(0, 255, 0, 0.2)' : 
                            clone.status === 'inactive' ? 'rgba(255, 165, 0, 0.2)' : 
                            'rgba(128, 128, 128, 0.2)',
            color: clone.status === 'active' ? '#00ff00' : 
                  clone.status === 'inactive' ? '#ffa500' : 
                  '#808080'
          }}
        >
          {clone.name === 'AGI Virtual Assistant' ? <Cpu size={32} style={{ color: '#808080' }} /> :
           clone.name === 'Email Assistant' ? <Mail size={32} /> : 
           clone.name === 'Calendar Manager' ? <Calendar size={32} /> :
           clone.name === 'Horoscope Assistant' ? <BookOpen size={32} /> :
           <Settings size={32} />}
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
            {clone.name}
          </h3>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
            <span className="flex items-center gap-1">
              {clone.status === 'active' ? (
                <CheckCircle size={14} style={{ color: clone.name === 'AGI Virtual Assistant' ? '#808080' : '#00ff00' }} />
              ) : clone.status === 'inactive' ? (
                <AlertCircle size={14} style={{ color: '#ffa500' }} />
              ) : (
                <Clock size={14} style={{ color: '#808080' }} />
              )}
              <span>
                {clone.status === 'active' ? 'Active' : 
                 clone.status === 'inactive' ? 'Inactive' : 
                 'Pending'}
              </span>
            </span>
            {clone.lastActive && (
              <span className="text-xs opacity-70">
                Last active: {new Date(clone.lastActive).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div 
        className="p-4 rounded-lg border"
        style={{ 
          backgroundColor: clone.status === 'active' ? 'rgba(0, 255, 0, 0.1)' : 
                          clone.status === 'inactive' ? 'rgba(255, 165, 0, 0.1)' : 
                          'rgba(128, 128, 128, 0.1)',
          borderColor: clone.status === 'active' ? '#00ff00' : 
                      clone.status === 'inactive' ? '#ffa500' : 
                      '#808080'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold" style={{ 
            color: clone.status === 'active' ? '#00ff00' : 
                  clone.status === 'inactive' ? '#ffa500' : 
                  '#808080' 
          }}>
            Current Status
          </div>
          {clone.status === 'active' ? (
            <button
              onClick={handlePauseClone}
              disabled={isLoading}
              className="p-1 rounded hover:bg-[rgba(255,165,0,0.2)]"
              style={{ color: '#ffa500' }}
            >
              <Pause size={16} />
            </button>
          ) : clone.status === 'inactive' ? (
            <button
              onClick={handleResumeClone}
              disabled={isLoading}
              className="p-1 rounded hover:bg-[rgba(0,255,0,0.2)]"
              style={{ color: '#00ff00' }}
            >
              <Play size={16} />
            </button>
          ) : null}
        </div>
        
        <div className="text-sm" style={{ color: 'var(--accent)', opacity: 0.9 }}>
          {clone.status === 'active' ? (
            <>This clone is actively working on your tasks.</>
          ) : clone.status === 'inactive' ? (
            <>This clone is currently paused and not performing any tasks.</>
          ) : (
            <>This clone is coming soon in a future update.</>
          )}
        </div>
        
        {clone.status === 'active' && clone.tasks && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--accent-glow)' }}>
            <div className="text-sm mb-2" style={{ color: 'var(--accent)' }}>
              Task Completion:
            </div>
            <div className="relative h-2 bg-[#122a3f] rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full rounded-full"
                style={{ 
                  width: `${(clone.completedTasks / clone.tasks) * 100}%`,
                  backgroundColor: '#00ff00'
                }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--accent)', opacity: 0.7 }}>
              <span>{clone.completedTasks} completed</span>
              <span>{clone.tasks} total</span>
            </div>
          </div>
        )}
      </div>

      {/* Capabilities */}
      <div>
        <h4 className="font-bold mb-3" style={{ color: 'var(--accent)' }}>
          Capabilities
        </h4>
        <div className="space-y-2">
          {clone.name === 'Email Assistant' ? (
            <>
              <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: '#122a3f' }}>
                <CheckCircle size={16} style={{ color: '#00ff00' }} />
                <span style={{ color: 'var(--accent)' }}>Email sorting and categorization</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: '#122a3f' }}>
                <CheckCircle size={16} style={{ color: '#00ff00' }} />
                <span style={{ color: 'var(--accent)' }}>Response drafting and suggestions</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: '#122a3f' }}>
                <CheckCircle size={16} style={{ color: '#00ff00' }} />
                <span style={{ color: 'var(--accent)' }}>Follow-up reminders</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: '#122a3f' }}>
                <CheckCircle size={16} style={{ color: '#00ff00' }} />
                <span style={{ color: 'var(--accent)' }}>Spam filtering and inbox cleaning</span>
              </div>
            </>
          ) : clone.name === 'Calendar Manager' ? (
            <>
              <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: '#122a3f' }}>
                <CheckCircle size={16} style={{ color: '#00ff00' }} />
                <span style={{ color: 'var(--accent)' }}>Meeting scheduling and optimization</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: '#122a3f' }}>
                <CheckCircle size={16} style={{ color: '#00ff00' }} />
                <span style={{ color: 'var(--accent)' }}>Event reminders and notifications</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: '#122a3f' }}>
                <CheckCircle size={16} style={{ color: '#00ff00' }} />
                <span style={{ color: 'var(--accent)' }}>Time block management</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: '#122a3f' }}>
                <CheckCircle size={16} style={{ color: '#00ff00' }} />
                <span style={{ color: 'var(--accent)' }}>Schedule conflict resolution</span>
              </div>
            </>
          ) : (
            <div className="text-center p-4" style={{ color: 'var(--accent)', opacity: 0.7 }}>
              Capabilities will be available when this clone is activated.
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      {clone.status === 'active' && (
        <div>
          <h4 className="font-bold mb-3" style={{ color: 'var(--accent)' }}>
            Performance Metrics
          </h4>
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: '#122a3f',
              borderColor: 'var(--accent-glow)'
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                  {clone.completedTasks || 0}
                </div>
                <div className="text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                  Tasks Completed
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                  98%
                </div>
                <div className="text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                  Success Rate
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                  4.2h
                </div>
                <div className="text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                  Time Saved
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                  24/7
                </div>
                <div className="text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                  Availability
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTasksTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold" style={{ color: 'var(--accent)' }}>
          Tasks
        </h3>
        <button
          onClick={handleRefreshTasks}
          disabled={isLoading}
          className="p-1 rounded hover:bg-[var(--accent-glow)]"
          style={{ color: 'var(--accent)' }}
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-3 rounded-lg border"
              style={{ 
                backgroundColor: '#122a3f',
                borderColor: 'var(--accent-glow)',
                borderLeftColor: getStatusColor(task.status),
                borderLeftWidth: '4px'
              }}
            >
              <div className="flex items-start gap-3">
                <div style={{ color: getStatusColor(task.status) }}>
                  {getStatusIcon(task.status)}
                </div>
                <div className="flex-1">
                  <div style={{ color: 'var(--accent)' }}>
                    {task.description}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                    <span>
                      Scheduled: {new Date(task.scheduledFor).toLocaleTimeString()}
                    </span>
                    {task.completedAt && (
                      <span>
                        Completed: {new Date(task.completedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
                <div 
                  className="text-xs px-2 py-1 rounded"
                  style={{ 
                    backgroundColor: `${getStatusColor(task.status)}20`,
                    color: getStatusColor(task.status)
                  }}
                >
                  {task.status === 'in_progress' ? 'In Progress' : 
                   task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8" style={{ color: 'var(--accent)', opacity: 0.6 }}>
          <Clock size={32} className="mx-auto mb-3 opacity-50" />
          <div className="text-lg font-bold mb-2">No Tasks Yet</div>
          <div className="text-sm">This clone doesn't have any tasks yet.</div>
        </div>
      )}

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
          Task management and scheduling will be available in the next update
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <h3 className="font-bold mb-4" style={{ color: 'var(--accent)' }}>
        Clone Settings
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
            Clone Name
          </label>
          <input
            type="text"
            value={clone.name}
            disabled
            className="w-full px-4 py-2 bg-[#122a3f] border border-[var(--accent)] rounded-md text-[var(--accent)] opacity-70"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
            Status
          </label>
          <select
            disabled
            className="w-full px-4 py-2 bg-[#122a3f] border border-[var(--accent)] rounded-md text-[var(--accent)] opacity-70"
            value={clone.status}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
            Notification Settings
          </label>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#122a3f' }}>
              <span style={{ color: 'var(--accent)' }}>Task completion notifications</span>
              <input type="checkbox" disabled checked className="opacity-70" />
            </div>
            <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#122a3f' }}>
              <span style={{ color: 'var(--accent)' }}>Error notifications</span>
              <input type="checkbox" disabled checked className="opacity-70" />
            </div>
            <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#122a3f' }}>
              <span style={{ color: 'var(--accent)' }}>Daily summary</span>
              <input type="checkbox" disabled checked className="opacity-70" />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t" style={{ borderColor: 'var(--accent-glow)' }}>
        <div className="flex gap-3">
          <button
            onClick={() => alert('Clone editing will be available in the next update.')}
            className="flex-1 py-2 rounded-md border transition-all duration-200 flex items-center justify-center gap-2"
            style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
            disabled
          >
            <Edit size={16} />
            Edit Clone
          </button>
          
          <button
            onClick={handleDeleteClone}
            className="flex-1 py-2 rounded-md border transition-all duration-200 flex items-center justify-center gap-2"
            style={{ color: '#ff4757', borderColor: '#ff4757' }}
          >
            <Trash2 size={16} />
            Delete Clone
          </button>
        </div>
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
          Advanced clone settings and customization will be available in the next update
        </div>
      </div>
    </div>
  );

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

        {/* Tabs */}
        <div className="flex border-b mb-6" style={{ borderColor: 'var(--accent-glow)' }}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'overview' ? 'border-b-2' : ''}`}
            style={{ 
              color: 'var(--accent)', 
              borderColor: activeTab === 'overview' ? 'var(--accent)' : 'transparent'
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'tasks' ? 'border-b-2' : ''}`}
            style={{ 
              color: 'var(--accent)', 
              borderColor: activeTab === 'tasks' ? 'var(--accent)' : 'transparent'
            }}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'settings' ? 'border-b-2' : ''}`}
            style={{ 
              color: 'var(--accent)', 
              borderColor: activeTab === 'settings' ? 'var(--accent)' : 'transparent'
            }}
          >
            Settings
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'tasks' && renderTasksTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>
    </div>
  );
};
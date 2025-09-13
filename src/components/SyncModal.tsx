import React, { useState, useEffect } from 'react';
import { X, Database, Users, Key, CheckCircle, AlertCircle, Loader, RefreshCw } from 'lucide-react';
import { 
  syncAllDataToSupabase, 
  checkSyncStatus,
  syncUserProfilesToSupabase,
  syncUserCredentialsToSupabase 
} from '../lib/supabaseSync';
import { forceSync } from '../lib/autoSync';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SyncStatus {
  localProfiles: number;
  localCredentials: number;
  supabaseProfiles: number;
  supabaseCredentials: number;
  needsSync: boolean;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [error, setError] = useState('');

  // Load sync status when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSyncStatus();
    }
  }, [isOpen]);

  const loadSyncStatus = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const status = await checkSyncStatus();
      setSyncStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check sync status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFullSync = async () => {
    setIsSyncing(true);
    setError('');
    setSyncResult(null);
    
    try {
      // Use the current user ID from localStorage
      const currentUser = localStorage.getItem('currentUser');
      let result;
      
      if (currentUser) {
        // Use the force sync function which handles retries and logging
        await forceSync(currentUser);
        result = await syncAllDataToSupabase();
      } else {
        result = await syncAllDataToSupabase();
      }
      
      setSyncResult(result);
      
      if (result.success) {
        // Refresh status
        await loadSyncStatus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleProfilesSync = async () => {
    setIsSyncing(true);
    setError('');
    setSyncResult(null);
    
    try {
      const result = await syncUserProfilesToSupabase();
      setSyncResult(result);
      
      if (result.success) {
        await loadSyncStatus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profiles sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCredentialsSync = async () => {
    setIsSyncing(true);
    setError('');
    setSyncResult(null);
    
    try {
      const result = await syncUserCredentialsToSupabase();
      setSyncResult(result);
      
      if (result.success) {
        await loadSyncStatus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credentials sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div 
        className="relative p-6 rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
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

        {/* Header */}
        <div className="mb-6">
          <h2 
            className="text-2xl font-bold mb-2 flex items-center gap-2"
            style={{ 
              color: 'var(--accent)', 
              textShadow: '0 0 8px var(--accent)',
              fontFamily: 'Orbitron, monospace'
            }}
          >
            <Database size={24} />
            Sync Data to Supabase
          </h2>
          <p style={{ color: 'var(--accent)', opacity: 0.8 }}>
            Migrate your existing user data from localStorage to Supabase for cross-device synchronization
          </p>
        </div>

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

        {/* Sync Result */}
        {syncResult && (
          <div 
            className="mb-4 p-4 rounded-md border"
            style={{ 
              backgroundColor: syncResult.success ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)', 
              borderColor: syncResult.success ? '#2ed573' : '#ff4757',
              color: syncResult.success ? '#2ed573' : '#ff4757'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              {syncResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <div className="font-bold">
                {syncResult.success ? 'Sync Completed Successfully!' : 'Sync Completed with Errors'}
              </div>
            </div>
            
            <div className="text-sm space-y-1">
              <div>• Profiles synced: {syncResult.details.profilesSynced}</div>
              <div>• Credentials synced: {syncResult.details.credentialsSynced}</div>
              <div>• Profiles skipped: {syncResult.details.profilesSkipped}</div>
              <div>• Credentials skipped: {syncResult.details.credentialsSkipped}</div>
              <div>• Total items synced: {syncResult.synced}</div>
              
              {syncResult.errors.length > 0 && (
                <div className="mt-2">
                  <div className="font-bold">Errors:</div>
                  {syncResult.errors.slice(0, 3).map((err: string, i: number) => (
                    <div key={i} className="text-xs opacity-80">• {err}</div>
                  ))}
                  {syncResult.errors.length > 3 && (
                    <div className="text-xs opacity-60">... and {syncResult.errors.length - 3} more</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <Loader size={32} className="mx-auto mb-4 animate-spin" style={{ color: 'var(--accent)' }} />
            <div style={{ color: 'var(--accent)' }}>Checking sync status...</div>
          </div>
        )}

        {/* Sync Status */}
        {syncStatus && !isLoading && (
          <div className="space-y-6">
            {/* Status Overview */}
            <div 
              className="p-4 rounded-lg border"
              style={{ 
                backgroundColor: syncStatus?.needsSync ? 'rgba(255, 165, 0, 0.1)' : 'rgba(46, 213, 115, 0.1)',
                borderColor: 'var(--accent-glow)'
              }}
            >
              <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--accent)' }}>
                Current Status
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                    {syncStatus.localProfiles}
                  </div>
                  <div className="text-sm opacity-70" style={{ color: 'var(--accent)' }}>
                    Local Profiles
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                    {syncStatus.supabaseProfiles}
                  </div>
                  <div className="text-sm opacity-70" style={{ color: 'var(--accent)' }}>
                    Supabase Profiles
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                    {syncStatus.localCredentials}
                  </div>
                  <div className="text-sm opacity-70" style={{ color: 'var(--accent)' }}>
                    Local Credentials
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                    {syncStatus.supabaseCredentials}
                  </div>
                  <div className="text-sm opacity-70" style={{ color: 'var(--accent)' }}>
                    Supabase Credentials
                  </div>
                </div>
              </div>
              
              {syncStatus.needsSync && (
                <div 
                  className="mt-4 p-3 rounded-lg border"
                  style={{ 
                    backgroundColor: 'rgba(255, 165, 0, 0.1)',
                    borderColor: 'rgba(255, 165, 0, 0.3)',
                    color: '#ffa500'
                  }}
                >
                  <div className="text-sm font-bold">⚠️ Manual Sync Available</div>
                  <div className="text-xs mt-1">
                    While data syncs automatically, you can manually sync now if needed.
                  </div>
                </div>
              )}
              
              {!syncStatus.needsSync && syncStatus.supabaseProfiles > 0 && (
                <div 
                  className="mt-4 p-3 rounded-lg border"
                  style={{ 
                    backgroundColor: 'rgba(46, 213, 115, 0.1)',
                    borderColor: 'rgba(46, 213, 115, 0.3)',
                    color: '#2ed573'
                  }}
                >
                  <div className="text-sm font-bold">✅ Data Synchronized</div>
                  <div className="text-xs mt-1">
                    Your data is automatically synced with Supabase and available across devices.
                  </div>
                </div>
              )}
            </div>

            {/* Sync Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                Sync Actions
              </h3>
              
              {/* Full Sync */}
              <div 
                className="p-4 rounded-lg border"
                style={{ 
                  backgroundColor: '#122a3f',
                  borderColor: 'var(--accent-glow)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                      <Database size={16} />
                      Manual Sync
                    </div>
                    <div className="text-sm opacity-80" style={{ color: 'var(--accent)' }}>
                      Force sync all data to Supabase now
                    </div>
                  </div>
                  
                  <button
                    onClick={handleFullSync}
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-md font-bold transition-all duration-200 flex items-center gap-2"
                    style={{
                      background: isSyncing ? '#666' : 'var(--button-bg)',
                      color: isSyncing ? '#ccc' : '#0a1a2f'
                    }}
                  >
                    {isSyncing ? <Loader size={16} className="animate-spin" /> : <Database size={16} />}
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </button>
                </div>
              </div>

              {/* Individual Sync Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profiles Sync */}
                <div 
                  className="p-4 rounded-lg border"
                  style={{ 
                    backgroundColor: '#122a3f',
                    borderColor: 'var(--accent-glow)'
                  }}
                >
                  <div className="text-center">
                    <Users size={24} className="mx-auto mb-2" style={{ color: 'var(--accent)' }} />
                    <div className="font-bold mb-1" style={{ color: 'var(--accent)' }}>
                      Sync Profiles
                    </div>
                    <div className="text-xs mb-3 opacity-80" style={{ color: 'var(--accent)' }}>
                      User profiles and AXI numbers
                    </div>
                    
                    <button
                      onClick={handleProfilesSync}
                      disabled={isSyncing}
                      className="w-full py-2 rounded-md border transition-all duration-200"
                      style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                    >
                      Sync Profiles
                    </button>
                  </div>
                </div>

                {/* Credentials Sync */}
                <div 
                  className="p-4 rounded-lg border"
                  style={{ 
                    backgroundColor: '#122a3f',
                    borderColor: 'var(--accent-glow)'
                  }}
                >
                  <div className="text-center">
                    <Key size={24} className="mx-auto mb-2" style={{ color: 'var(--accent)' }} />
                    <div className="font-bold mb-1" style={{ color: 'var(--accent)' }}>
                      Sync Credentials
                    </div>
                    <div className="text-xs mb-3 opacity-80" style={{ color: 'var(--accent)' }}>
                      Encrypted passwords and emails
                    </div>
                    
                    <button
                      onClick={handleCredentialsSync}
                      disabled={isSyncing}
                      className="w-full py-2 rounded-md border transition-all duration-200"
                      style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                    >
                      Sync Credentials
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Refresh Status */}
            <div className="text-center">
              <button
                onClick={loadSyncStatus}
                disabled={isLoading || isSyncing}
                className="px-4 py-2 rounded-md border transition-all duration-200 flex items-center gap-2 mx-auto"
                style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                Refresh Status
              </button>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 p-4 rounded-lg text-sm" style={{ backgroundColor: 'rgba(var(--accent), 0.1)', color: 'var(--accent)' }}>
          <div className="font-bold mb-2">🔒 Security & Privacy</div>
          <ul className="space-y-1 text-xs opacity-90">
            <li>• Data is automatically synchronized in the background</li>
            <li>• Passwords are encrypted with unique salts before storage</li>
            <li>• All data is transmitted securely over HTTPS</li>
            <li>• Existing users keep their AXI numbers and profiles</li>
            <li>• No data is lost during the sync process</li>
            <li>• The system falls back to localStorage if Supabase is unavailable</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
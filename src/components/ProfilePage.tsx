import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Hash, Shield, Settings, Eye, EyeOff, Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { updateUserPassword, verifyUserCredentials, validatePasswordStrength } from '../lib/passwordSecurity';
import { logSecurityEvent } from '../lib/securityAudit';

interface ProfilePageProps {
  currentUser: string | null;
  userProfile: any;
  currentMode: string;
  onShowAuthModal: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ 
  currentUser, 
  userProfile, 
  currentMode, 
  onShowAuthModal 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [username, setUsername] = useState('');
  
  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    setIsLoading(false);
    if (currentUser) {
      setUsername(currentUser.trim());
    }
  }, [currentUser]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!currentPassword.trim()) {
        throw new Error('Please enter your current password');
      }

      if (!newPassword.trim()) {
        throw new Error('Please enter a new password');
      }

      if (newPassword !== confirmNewPassword) {
        throw new Error('New passwords do not match');
      }
      
      if (currentPassword === newPassword) {
        throw new Error('New password must be different from current password');
      }

      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`Password requirements not met:\n• ${passwordValidation.errors.join('\n• ')}`);
      }

      // Verify current password first
      if (!username.trim()) {
        throw new Error('Username is required');
      }
      
      const isCurrentPasswordValid = await verifyUserCredentials(username.trim(), currentPassword);
      
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }
      
      // Update password
      const updateSuccess = await updateUserPassword(username.trim(), newPassword);
      if (updateSuccess) {
        // Log password change
        await logSecurityEvent({
          userId: username.trim(),
          eventType: 'password_change',
          details: {
            success: true
          }
        });
        
        setIsChangingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setSuccess('Password changed successfully!');
      } else {
        throw new Error('Failed to update password');
      }
    } catch (err) {
      console.error('Change password error:', err);
      
      let errorMessage = 'Failed to change password';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }
  
  // If no user is logged in, show login prompt
  if (!currentUser) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <User size={64} className="mx-auto mb-6" style={{ color: 'var(--accent)', opacity: 0.5 }} />
          <h2 
            className="text-2xl font-bold mb-4"
            style={{ 
              color: 'var(--accent)', 
              textShadow: '0 0 8px var(--accent)',
              fontFamily: 'Orbitron, monospace'
            }}
          >
            Login Required
          </h2>
          <p className="mb-6" style={{ color: 'var(--accent)', opacity: 0.8 }}>
            Please login or create an account to view your profile
          </p>
          
          <button
            onClick={onShowAuthModal}
            className="px-6 py-3 rounded-lg font-bold transition-all duration-200"
            style={{
              background: 'var(--button-bg)',
              color: '#0a1a2f',
              boxShadow: '0 0 20px var(--accent-glow)'
            }}
          >
            Login / Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-2xl mx-auto">
        <div 
          className="p-6 rounded-xl border"
          style={{ 
            background: 'var(--bg-secondary)',
            borderColor: 'var(--accent)',
            boxShadow: '0 0 24px var(--accent-glow)'
          }}
        >
          <div className="flex items-center gap-4 mb-6">
            <User size={32} style={{ color: 'var(--accent)' }} />
            <h1 
              className="text-2xl font-bold"
              style={{ 
                color: 'var(--accent)',
                fontFamily: 'Orbitron, monospace'
              }}
            >
              Profile
            </h1>
          </div>

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
              <div className="text-sm whitespace-pre-line">{error}</div>
            </div>
          )}

          {success && (
            <div 
              className="mb-4 p-3 rounded-md border flex items-center gap-2"
              style={{ 
                backgroundColor: 'rgba(46, 213, 115, 0.1)', 
                borderColor: '#2ed573',
                color: '#2ed573'
              }}
            >
              <CheckCircle size={16} />
              <div className="text-sm">{success}</div>
            </div>
          )}

          {userProfile && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
                  <User size={20} style={{ color: 'var(--accent)' }} />
                  <div>
                    <div className="text-sm opacity-70" style={{ color: 'var(--accent)' }}>Username</div>
                    <div style={{ color: 'var(--accent)' }}>{userProfile.displayName}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
                  <Hash size={20} style={{ color: 'var(--accent)' }} />
                  <div>
                    <div className="text-sm opacity-70" style={{ color: 'var(--accent)' }}>AXI Number</div>
                    <div style={{ color: 'var(--accent)' }}>#{userProfile.axiNumber}</div>
                  </div>
                </div>

                {userProfile.email && (
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
                    <Mail size={20} style={{ color: 'var(--accent)' }} />
                    <div>
                      <div className="text-sm opacity-70" style={{ color: 'var(--accent)' }}>Email</div>
                      <div style={{ color: 'var(--accent)' }}>{userProfile.email}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
                  <Calendar size={20} style={{ color: 'var(--accent)' }} />
                  <div>
                    <div className="text-sm opacity-70" style={{ color: 'var(--accent)' }}>Member Since</div>
                    <div style={{ color: 'var(--accent)' }}>
                      {new Date(userProfile.registrationDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {userProfile.authType === 'web2' && (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings size={20} style={{ color: 'var(--accent)' }} />
                    <h2 className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                      Security Settings
                    </h2>
                  </div>

                  {!isChangingPassword ? (
                    <button
                      onClick={() => setIsChangingPassword(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-md border transition-all duration-200 hover:bg-[var(--accent-glow)]"
                      style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                    >
                      <Lock size={16} />
                      Change Password
                    </button>
                  ) : (
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
                          Username
                        </label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--accent)' }} />
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[#122a3f] border border-[var(--accent)] rounded-md text-[var(--accent)] placeholder-[var(--accent)] placeholder-opacity-60"
                            placeholder="Enter your username"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
                          Current Password
                        </label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--accent)' }} />
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 bg-[#122a3f] border border-[var(--accent)] rounded-md text-[var(--accent)] placeholder-[var(--accent)] placeholder-opacity-60"
                            placeholder="Enter current password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            style={{ color: 'var(--accent)' }}
                          >
                            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
                          New Password
                        </label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--accent)' }} />
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 bg-[#122a3f] border border-[var(--accent)] rounded-md text-[var(--accent)] placeholder-[var(--accent)] placeholder-opacity-60"
                            placeholder="Enter new password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            style={{ color: 'var(--accent)' }}
                          >
                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--accent)' }} />
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[#122a3f] border border-[var(--accent)] rounded-md text-[var(--accent)] placeholder-[var(--accent)] placeholder-opacity-60"
                            placeholder="Confirm new password"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-4 py-2 rounded-md font-bold transition-all duration-200 flex items-center gap-2"
                          style={{
                            background: isLoading ? '#666' : 'var(--button-bg)',
                            color: isLoading ? '#ccc' : '#0a1a2f'
                          }}
                        >
                          {isLoading ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                          {isLoading ? 'Changing...' : 'Change Password'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsChangingPassword(false);
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmNewPassword('');
                            setError('');
                            setSuccess('');
                          }}
                          className="px-4 py-2 rounded-md border transition-all duration-200 hover:bg-[var(--accent-glow)]"
                          style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
            
          {!userProfile && currentUser && (
            <div className="text-center py-8">
              <AlertCircle size={48} className="mx-auto mb-4" style={{ color: '#ff4757' }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
                Failed to load profile
              </h3>
              <p className="mb-4" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                We couldn't load your profile information. This might be due to a network issue or database connection problem.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 rounded-md font-bold transition-all duration-200"
                style={{
                  background: 'var(--button-bg)',
                  color: '#0a1a2f'
                }}
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
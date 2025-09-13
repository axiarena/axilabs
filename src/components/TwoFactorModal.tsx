import React, { useState, useEffect } from 'react';
import { X, Shield, Smartphone, Key, Copy, Download, AlertTriangle, CheckCircle, Loader, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';
import { 
  setup2FA, 
  enable2FA, 
  disable2FA, 
  verify2FALogin, 
  is2FAEnabled, 
  generateNewBackupCodes,
  get2FAData 
} from '../lib/twoFactorAuth';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string | null;
  mode: 'setup' | 'verify' | 'manage';
  onVerified?: () => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  mode,
  onVerified
}) => {
  const [currentStep, setCurrentStep] = useState<'setup' | 'verify' | 'backup' | 'manage'>('setup');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      if (mode === 'setup') {
        handleSetup2FA();
      } else if (mode === 'manage') {
        setCurrentStep('manage');
      } else if (mode === 'verify') {
        setCurrentStep('verify');
      }
    }
  }, [isOpen, currentUser, mode]);

  const handleSetup2FA = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const setupData = await setup2FA(currentUser);
      setSecret(setupData.secret);
      setBackupCodes(setupData.backupCodes);
      
      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(setupData.qrCodeUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#00d4ff',
          light: '#0a1a2f'
        }
      });
      setQrCodeDataUrl(qrDataUrl);
      
      setCurrentStep('setup');
    } catch (err) {
      setError('Failed to setup 2FA. Please try again.');
      console.error('2FA setup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!currentUser || !secret || !verificationCode.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const success = await enable2FA(currentUser, secret, verificationCode.trim(), backupCodes);
      
      if (success) {
        setSuccess('2FA enabled successfully!');
        setCurrentStep('backup');
      } else {
        setError('Invalid verification code. Please check your authenticator app and try again.');
      }
    } catch (err) {
      setError('Failed to enable 2FA. Please try again.');
      console.error('2FA enable error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!currentUser || !verificationCode.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const success = await disable2FA(currentUser, verificationCode.trim());
      
      if (success) {
        setSuccess('2FA disabled successfully!');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError('Invalid verification code. Please check your authenticator app or use a backup code.');
      }
    } catch (err) {
      setError('Failed to disable 2FA. Please try again.');
      console.error('2FA disable error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!currentUser || !verificationCode.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const isValid = await verify2FALogin(currentUser, verificationCode.trim());
      
      if (isValid) {
        setSuccess('2FA verification successful!');
        if (onVerified) {
          onVerified();
        }
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setError('Invalid verification code. Please check your authenticator app or use a backup code.');
      }
    } catch (err) {
      setError('Failed to verify 2FA. Please try again.');
      console.error('2FA verify error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateNewBackupCodes = async () => {
    if (!currentUser || !verificationCode.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const newCodes = await generateNewBackupCodes(currentUser, verificationCode.trim());
      
      if (newCodes) {
        setBackupCodes(newCodes);
        setSuccess('New backup codes generated successfully!');
        setShowBackupCodes(true);
        setVerificationCode('');
      } else {
        setError('Invalid verification code. Please check your authenticator app.');
      }
    } catch (err) {
      setError('Failed to generate new backup codes. Please try again.');
      console.error('Backup codes generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const downloadBackupCodes = () => {
    const content = `AXI ASI LAB - 2FA Backup Codes\nUser: ${currentUser}\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\nKeep these codes safe! Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `axi-2fa-backup-codes-${currentUser}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const renderSetupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield size={48} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
          Setup Two-Factor Authentication
        </h3>
        <p className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
          Add an extra layer of security to your AXI ASI LAB account
        </p>
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <h4 className="font-bold mb-3" style={{ color: 'var(--accent)' }}>
            Step 1: Scan QR Code
          </h4>
          <p className="text-sm mb-4" style={{ color: 'var(--accent)', opacity: 0.8 }}>
            Use your authenticator app (Google Authenticator, Authy, etc.) to scan this QR code:
          </p>
          
          {qrCodeDataUrl && (
            <div className="flex justify-center mb-4">
              <img src={qrCodeDataUrl} alt="2FA QR Code" className="border-2 rounded-lg" style={{ borderColor: 'var(--accent)' }} />
            </div>
          )}
          
          <div className="text-xs" style={{ color: 'var(--accent)', opacity: 0.6 }}>
            Can't scan? Manual entry key: 
            <button
              onClick={() => copyToClipboard(secret)}
              className="ml-2 px-2 py-1 rounded hover:bg-[var(--accent-glow)]"
              style={{ color: 'var(--accent)', border: '1px solid var(--accent)' }}
            >
              <Copy size={12} className="inline mr-1" />
              {secret}
            </button>
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-3" style={{ color: 'var(--accent)' }}>
            Step 2: Enter Verification Code
          </h4>
          <p className="text-sm mb-3" style={{ color: 'var(--accent)', opacity: 0.8 }}>
            Enter the 6-digit code from your authenticator app:
          </p>
          
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full px-4 py-3 bg-[#122a3f] border border-[var(--accent)] rounded-md text-[var(--accent)] text-center text-lg tracking-widest"
            placeholder="000000"
            maxLength={6}
          />
        </div>

        <button
          onClick={handleEnable2FA}
          disabled={isLoading || verificationCode.length !== 6}
          className="w-full py-3 rounded-md font-bold transition-all duration-200 flex items-center justify-center gap-2"
          style={{
            background: (isLoading || verificationCode.length !== 6) ? '#666' : 'var(--button-bg)',
            color: (isLoading || verificationCode.length !== 6) ? '#ccc' : '#0a1a2f'
          }}
        >
          {isLoading ? <Loader size={16} className="animate-spin" /> : <Shield size={16} />}
          {isLoading ? 'Enabling 2FA...' : 'Enable 2FA'}
        </button>
      </div>
    </div>
  );

  const renderBackupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Key size={48} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
          Save Your Backup Codes
        </h3>
        <p className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
          These codes can be used if you lose access to your authenticator app
        </p>
      </div>

      <div 
        className="p-4 rounded-lg border-2"
        style={{ 
          backgroundColor: 'rgba(255, 165, 0, 0.1)',
          borderColor: 'rgba(255, 165, 0, 0.3)',
          color: '#ffa500'
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} />
          <span className="font-bold">Important Security Notice</span>
        </div>
        <ul className="text-sm space-y-1">
          <li>• Each backup code can only be used once</li>
          <li>• Store these codes in a safe place</li>
          <li>• Don't share these codes with anyone</li>
          <li>• You can generate new codes anytime</li>
        </ul>
      </div>

      <div 
        className="p-4 rounded-lg border"
        style={{ 
          backgroundColor: '#122a3f',
          borderColor: 'var(--accent)'
        }}
      >
        <div className="grid grid-cols-2 gap-2 font-mono text-sm">
          {backupCodes.map((code, index) => (
            <div
              key={index}
              className="p-2 rounded text-center cursor-pointer hover:bg-[var(--accent-glow)]"
              style={{ color: 'var(--accent)', border: '1px solid var(--accent-glow)' }}
              onClick={() => copyToClipboard(code)}
            >
              {code}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => copyToClipboard(backupCodes.join('\n'))}
          className="flex-1 py-2 rounded-md border transition-all duration-200 flex items-center justify-center gap-2"
          style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
        >
          <Copy size={16} />
          Copy All
        </button>
        
        <button
          onClick={downloadBackupCodes}
          className="flex-1 py-2 rounded-md border transition-all duration-200 flex items-center justify-center gap-2"
          style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
        >
          <Download size={16} />
          Download
        </button>
      </div>

      <button
        onClick={onClose}
        className="w-full py-3 rounded-md font-bold transition-all duration-200"
        style={{
          background: 'var(--button-bg)',
          color: '#0a1a2f'
        }}
      >
        Complete Setup
      </button>
    </div>
  );

  const renderVerifyStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Smartphone size={48} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
          Two-Factor Authentication
        </h3>
        <p className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
          Enter the 6-digit code from your authenticator app or use a backup code
        </p>
      </div>

      <div>
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase())}
          className="w-full px-4 py-3 bg-[#122a3f] border border-[var(--accent)] rounded-md text-[var(--accent)] text-center text-lg tracking-widest"
          placeholder="000000"
          maxLength={6}
          autoFocus
        />
        <div className="text-xs mt-2 text-center" style={{ color: 'var(--accent)', opacity: 0.6 }}>
          Enter 6-digit code or backup code
        </div>
      </div>

      <button
        onClick={handleVerify2FA}
        disabled={isLoading || verificationCode.length < 4}
        className="w-full py-3 rounded-md font-bold transition-all duration-200 flex items-center justify-center gap-2"
        style={{
          background: (isLoading || verificationCode.length < 4) ? '#666' : 'var(--button-bg)',
          color: (isLoading || verificationCode.length < 4) ? '#ccc' : '#0a1a2f'
        }}
      >
        {isLoading ? <Loader size={16} className="animate-spin" /> : <Shield size={16} />}
        {isLoading ? 'Verifying...' : 'Verify'}
      </button>
    </div>
  );

  const renderManageStep = () => {
    const twoFactorData = currentUser ? get2FAData(currentUser) : null;
    const isEnabled = currentUser ? is2FAEnabled(currentUser) : false;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Shield size={48} className="mx-auto mb-4" style={{ color: isEnabled ? '#00ff00' : 'var(--accent)' }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
            Manage Two-Factor Authentication
          </h3>
          <p className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
            Status: {isEnabled ? 'Enabled' : 'Disabled'}
          </p>
        </div>

        {isEnabled && (
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: 'rgba(0, 255, 0, 0.1)',
              borderColor: 'rgba(0, 255, 0, 0.3)',
              color: '#00ff00'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} />
              <span className="font-bold">2FA is Active</span>
            </div>
            <div className="text-sm">
              Your account is protected with two-factor authentication.
              {twoFactorData && (
                <div className="mt-2">
                  Backup codes remaining: {twoFactorData.backupCodes?.length || 0}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {isEnabled ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
                  Enter verification code to manage 2FA:
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 bg-[#122a3f] border border-[var(--accent)] rounded-md text-[var(--accent)] text-center text-lg tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={handleGenerateNewBackupCodes}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="py-2 rounded-md border transition-all duration-200 flex items-center justify-center gap-2"
                  style={{ 
                    color: 'var(--accent)', 
                    borderColor: 'var(--accent)',
                    opacity: (isLoading || verificationCode.length !== 6) ? 0.5 : 1
                  }}
                >
                  <RefreshCw size={16} />
                  New Backup Codes
                </button>

                <button
                  onClick={handleDisable2FA}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="py-2 rounded-md border transition-all duration-200 flex items-center justify-center gap-2"
                  style={{ 
                    color: '#ff4757', 
                    borderColor: '#ff4757',
                    opacity: (isLoading || verificationCode.length !== 6) ? 0.5 : 1
                  }}
                >
                  {isLoading ? <Loader size={16} className="animate-spin" /> : <X size={16} />}
                  Disable 2FA
                </button>
              </div>

              {showBackupCodes && backupCodes.length > 0 && (
                <div 
                  className="p-4 rounded-lg border"
                  style={{ 
                    backgroundColor: '#122a3f',
                    borderColor: 'var(--accent)'
                  }}
                >
                  <h4 className="font-bold mb-3" style={{ color: 'var(--accent)' }}>
                    New Backup Codes
                  </h4>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm mb-3">
                    {backupCodes.map((code, index) => (
                      <div
                        key={index}
                        className="p-2 rounded text-center cursor-pointer hover:bg-[var(--accent-glow)]"
                        style={{ color: 'var(--accent)', border: '1px solid var(--accent-glow)' }}
                        onClick={() => copyToClipboard(code)}
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(backupCodes.join('\n'))}
                      className="flex-1 py-1 rounded text-sm border"
                      style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                    >
                      <Copy size={12} className="inline mr-1" />
                      Copy All
                    </button>
                    <button
                      onClick={downloadBackupCodes}
                      className="flex-1 py-1 rounded text-sm border"
                      style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                    >
                      <Download size={12} className="inline mr-1" />
                      Download
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={handleSetup2FA}
              disabled={isLoading}
              className="w-full py-3 rounded-md font-bold transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: isLoading ? '#666' : 'var(--button-bg)',
                color: isLoading ? '#ccc' : '#0a1a2f'
              }}
            >
              {isLoading ? <Loader size={16} className="animate-spin" /> : <Shield size={16} />}
              {isLoading ? 'Setting up...' : 'Enable 2FA'}
            </button>
          )}
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
            <AlertTriangle size={16} />
            <div className="text-sm">{error}</div>
          </div>
        )}

        {/* Success Message */}
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

        {/* Content */}
        {currentStep === 'setup' && renderSetupStep()}
        {currentStep === 'backup' && renderBackupStep()}
        {currentStep === 'verify' && renderVerifyStep()}
        {currentStep === 'manage' && renderManageStep()}
      </div>
    </div>
  );
};
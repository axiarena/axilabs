import React, { useState, useEffect } from 'react';
import { X, User, Wallet, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useUserProfile } from '../hooks/useUserProfile';
import { isRateLimited, recordFailedAttempt, recordSuccessfulAttempt, resetRateLimit } from '../lib/rateLimiter';
import { logSecurityEvent } from '../lib/securityAudit';
import { createSession, invalidateSession } from '../lib/sessionManager';
import { requireEmailVerification, verifyEmailWithCode } from '../lib/emailVerification';
import { TwoFactorModal } from './TwoFactorModal';
import { is2FAEnabled, verify2FALogin } from '../lib/twoFactorAuth';
import { 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  generateVerificationCode, 
  isValidEmail 
} from '../lib/emailService';
import { 
  storeUserCredentials, 
  verifyUserCredentials, 
  updateUserPassword,
  resetPasswordByEmail,
  userExists, 
  emailExists, 
  getUserByEmail, 
  validatePasswordStrength 
} from '../lib/passwordSecurity';
import { sendAdminNotification, collectUserData } from '../lib/adminNotifications';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string, authType: 'web2' | 'wallet') => void;
}

type AuthStep = 'login' | 'signup' | 'verify' | 'forgot-password' | 'reset-password' | 'change-password';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form data
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Verification state
  const [pendingVerificationCode, setPendingVerificationCode] = useState('');
  const [pendingUserData, setPendingUserData] = useState<{
    username: string;
    email: string;
    password: string;
  } | null>(null);
  const [pendingResetEmail, setPendingResetEmail] = useState('');
  const [pendingResetCode, setPendingResetCode] = useState('');

  // Rate limit state
  const [isLoginLimited, setIsLoginLimited] = useState(false);
  const [loginLimitCountdown, setLoginLimitCountdown] = useState(0);

  // 2FA state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [pending2FAUser, setPending2FAUser] = useState<string | null>(null);
  const [pending2FAAuthType, setPending2FAAuthType] = useState<'web2' | 'wallet' | null>(null);

  const { wallet, connectMetaMask, connectPhantom, connectManually, formatAddress } = useWallet();
  const { registerUser, checkUsernameAvailability, findUserByEmail, updateUserProfile } = useUserProfile();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('login');
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setVerificationCode('');
    setResetCode('');
    setError('');
    setSuccess('');
    setIsLoading(false);
    setShowPassword(false);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setPendingVerificationCode('');
    setPendingUserData(null);
    setPendingResetEmail('');
    setPendingResetCode('');
  };

  const handleWeb2Login = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling on mobile
    setError('');
    setIsLoading(true);

    try {
      // Check for rate limiting first
      const identifier = username.trim();
      const isLimited = await isRateLimited(identifier);
      
      if (isLimited) {
        setIsLoginLimited(true);
        setLoginLimitCountdown(15); // 15 minutes countdown
        
        // Start countdown timer
        const timer = setInterval(() => {
          setLoginLimitCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              setIsLoginLimited(false);
              return 0;
            }
            return prev - 1;
          });
        }, 60000); // Update every minute
        
        throw new Error(`Too many failed login attempts. Please try again in ${loginLimitCountdown} minutes.`);
      }
      
      console.log('=== WEB2 LOGIN ATTEMPT ===');
      console.log('Username/Email:', identifier);

      if (!username.trim() || !password.trim()) {
        throw new Error('Please enter both username/email and password');
      }

      // Verify credentials (now checks both localStorage and Supabase)
      const isValid = await verifyUserCredentials(username.trim(), password);
      
      if (!isValid) {
        // Record failed attempt for rate limiting
        await recordFailedAttempt(identifier);
        
        // Log security event
        await logSecurityEvent({
          eventType: 'login_failure',
          details: {
            identifier,
            reason: 'Invalid credentials'
          }
        });
        
        throw new Error('Invalid username/email or password');
      }

      // Check if 2FA is enabled for this user
      const actualUsername = username.includes('@') ? getUserByEmail(username.trim())?.username || username.trim() : username.trim();
      
      if (actualUsername && is2FAEnabled(actualUsername)) {
        console.log('2FA is enabled for user, showing 2FA verification');
        setPending2FAUser(actualUsername);
        setPending2FAAuthType('web2');
        setShow2FAModal(true);
        setIsLoading(false);
        return;
      }
      
      console.log('✅ Login successful');
      
      // Record successful login
      await recordSuccessfulAttempt(identifier);
      
      // Create session
      if (actualUsername) {
        await createSession(actualUsername);
      }
      
      // Log security event
      await logSecurityEvent({
        userId: actualUsername,
        eventType: 'login_success',
        details: {
          method: 'web2',
          identifier,
          hasPassword: true
        }
      });
      
      // Determine the actual username (in case they logged in with email)
      onLogin(actualUsername.trim(), 'web2');
      onClose();
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerified = () => {
    console.log('2FA verification successful, completing login');
    if (pending2FAUser && pending2FAAuthType) {
      // Log successful 2FA verification
      logSecurityEvent({
        userId: pending2FAUser,
        eventType: '2fa_verification',
        details: { success: true }
      });
      
      onLogin(pending2FAUser, pending2FAAuthType);
      setShow2FAModal(false);
      setPending2FAUser(null);
      setPending2FAAuthType(null);
      onClose();
    }
  };

  const handleWeb2Signup = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling on mobile
    setError('');
    setIsLoading(true);

    try {
      console.log('=== WEB2 SIGNUP ATTEMPT ===');
      console.log('Username:', username);
      console.log('Email:', email);

      // Validation
      if (!username.trim() || !email.trim() || !password.trim()) {
        throw new Error('Please fill in all fields');
      }

      if (!isValidEmail(email.trim())) {
        throw new Error('Please enter a valid email address');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new Error(`Password requirements not met:\n• ${passwordValidation.errors.join('\n• ')}`);
      }

      // Check if username is available
      const isUsernameAvailable = await checkUsernameAvailability(username.trim());
      if (!isUsernameAvailable) {
        throw new Error('Username is already taken');
      }

      // Check if email is already registered
      if (emailExists(email.trim())) {
        throw new Error('Email is already registered');
      }

      // Log account creation attempt
      await logSecurityEvent({
        eventType: 'account_created',
        details: {
          username: username.trim()
        }
      });

      // Generate and send verification code
      const code = generateVerificationCode();
      console.log('Generated verification code:', code);
      
      const emailResult = await sendVerificationEmail({
        to: email.trim(),
        code,
        username: username.trim()
      });

      if (!emailResult.success) {
        throw new Error('Failed to send verification email');
      }

      // Store pending data
      setPendingVerificationCode(code);
      setPendingUserData({
        username: username.trim(),
        email: email.trim(),
        password
      });

      setSuccess(`Verification code sent to ${email.trim()}`);
      setCurrentStep('verify');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling on mobile
    setError('');
    setIsLoading(true);

    try {
      console.log('=== VERIFICATION ATTEMPT ===');
      console.log('Entered code:', verificationCode);
      console.log('Expected code:', pendingVerificationCode);

      if (!verificationCode.trim()) {
        throw new Error('Please enter the verification code');
      }

      if (verificationCode.trim() !== pendingVerificationCode) {
        throw new Error('Invalid verification code');
      }

      if (!pendingUserData) {
        throw new Error('No pending user data found');
      }

      console.log('✅ Verification successful, creating user...');

      // Store user credentials securely (both localStorage and Supabase)
      // Register user profile first to get AXI number
      const userProfile = await registerUser(
        pendingUserData.username,
        pendingUserData.username,
        'web2',
        pendingUserData.email
      );
      
      if (!userProfile) {
        throw new Error('Failed to create user profile');
      }
      
      // Mark email as requiring verification
      await requireEmailVerification(
        pendingUserData.username,
        pendingUserData.email.trim(),
        pendingUserData.username
      );
      
      // Create session
      await createSession(pendingUserData.username);
      
      // Now store credentials with AXI number and mark email as unverified
      await storeUserCredentials(
        pendingUserData.username,
        pendingUserData.email,
        pendingUserData.password,
        userProfile.axiNumber
      );
      
      // Update user profile to reflect unverified email
      if (userProfile) {
        await updateUserProfile({
          ...userProfile,
          email: pendingUserData.email.trim(),
          emailVerified: false
        });
      }

      // Send admin notification
        try {
          const adminData = collectUserData(
            pendingUserData.username,
            pendingUserData.email,
            userProfile.axiNumber,
            'web2'
          );
          await sendAdminNotification(adminData);
        } catch (adminError) {
          console.warn('Failed to send admin notification:', adminError);
        }
        
        // Log successful registration
        await logSecurityEvent({
          userId: pendingUserData.username,
          eventType: 'account_created',
          details: {
            email: pendingUserData.email,
            axiNumber: userProfile.axiNumber
          }
        });
        console.log('✅ User created successfully');
        
        // Show welcome message with AXI number
        setTimeout(() => {
          alert(`🎉 Welcome to AXI ASI LAB!\n\nYou are now AXI #${userProfile.axiNumber}\n\nYour unique identifier in the consciousness expansion protocol.\n\nStart Leveling Up in AXI 6ix Fold Protocol!`);
        }, 500);
        
        onLogin(pendingUserData.username.trim(), 'web2');
        onClose();
    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling on mobile
    setError('');
    setIsLoading(true);

    try {
      console.log('=== FORGOT PASSWORD ATTEMPT ===');
      console.log('Email:', email);

      if (!email.trim()) {
        throw new Error('Please enter your email address');
      }

      if (!isValidEmail(email.trim())) {
        throw new Error('Please enter a valid email address');
      }

      // Check if email exists (now checks both localStorage and Supabase)
      let user = getUserByEmail(email.trim());
      if (!user) {
        // Also check Supabase user profiles
        const profile = await findUserByEmail(email.trim());
        if (!profile) {
          throw new Error('No account found with this email address');
        } else {
          // Create a temporary user object for the email
          user = {
            username: profile.userId,
            email: email.trim(),
            passwordHash: '',
            salt: '',
            createdAt: profile.createdAt || new Date().toISOString()
          };
        }
      }

      // Log password reset request
      await logSecurityEvent({
        userId: user?.username,
        eventType: 'password_reset',
        details: {
          email: email.trim()
        }
      });

      // Generate and send reset code
      const code = generateVerificationCode();
      console.log('Generated reset code:', code);

      const emailResult = await sendPasswordResetEmail({
        to: email.trim(),
        code,
        username: user?.username || 'User'
      });

      if (!emailResult.success) {
        throw new Error('Failed to send password reset email');
      }

      // Store pending reset data
      setPendingResetEmail(email.trim());
      setPendingResetCode(code);

      setSuccess(`Password reset code sent to ${email.trim()}`);
      setCurrentStep('reset-password');
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling on mobile
    setError('');
    setIsLoading(true);

    try {
      console.log('=== RESET PASSWORD ATTEMPT ===');
      console.log('Entered code:', resetCode);
      console.log('Expected code:', pendingResetCode);

      if (!resetCode.trim()) {
        throw new Error('Please enter the reset code');
      }

      if (resetCode.trim() !== pendingResetCode) {
        throw new Error('Invalid reset code');
      }

      if (!newPassword.trim()) {
        throw new Error('Please enter a new password');
      }

      if (newPassword !== confirmNewPassword) {
        throw new Error('Passwords do not match');
      }

      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`Password requirements not met:\n• ${passwordValidation.errors.join('\n• ')}`);
      }

      // Reset password (now updates both localStorage and Supabase)
      const success = await resetPasswordByEmail(pendingResetEmail, newPassword);
      
      if (!success) {
        throw new Error('Failed to reset password');
      }

      // Log successful password reset
      await logSecurityEvent({
        userId: getUserByEmail(pendingResetEmail)?.username,
        eventType: 'password_reset',
        details: {
          success: true
        }
      });

      console.log('✅ Password reset successful');
      setSuccess('Password reset successfully! You can now log in with your new password.');
      
      // Clear form and go back to login
      setTimeout(() => {
        setCurrentStep('login');
        resetForm();
      }, 2000);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling on mobile
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      console.log('=== CHANGE PASSWORD ATTEMPT ===');
      console.log('Username:', username);

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
      console.log('Verifying current password...');
      const isCurrentPasswordValid = await verifyUserCredentials(username.trim(), currentPassword);
      
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }
      
      // Update password
      const updateSuccess = await updateUserPassword(
        username.trim(),
        newPassword
      );
      
      if (updateSuccess) {
        console.log('✅ Password changed successfully');
        
        // Log password change
        await logSecurityEvent({
          userId: username.trim(),
          eventType: 'password_change',
          details: {
            success: true
          }
        });
        
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setSuccess('Password changed successfully! You can now use your new password to log in.');
        
        setTimeout(() => {
          resetForm();
          onClose();
        }, 2000);
      } else {
        throw new Error('Failed to update password');
      }
    } catch (err) {
      console.error('Change password error:', err);
      
      let errorMessage = 'Password change failed. Please try again.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Add helpful context for common errors
        if (err.message.includes('Current password is incorrect')) {
          errorMessage += '\n\nTip: Make sure you\'re using the correct current password. If you forgot it, use the "Forgot Password" option instead.';
        } else if (err.message.includes('Password requirements not met')) {
          errorMessage += '\n\nPassword must be 6-128 characters long and contain at least one letter and one number.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletLogin = async (walletType: 'metamask' | 'phantom' | 'manual') => {
    setError('');
    setIsLoading(true);

    try {
      let success = false;
      let address = '';

      if (walletType === 'metamask') {
        success = await connectMetaMask();
        address = wallet?.address || '';
      } else if (walletType === 'phantom') {
        success = await connectPhantom();
        address = wallet?.address || '';
      } else if (walletType === 'manual') {
        if (!username.trim()) {
          throw new Error('Please enter a wallet address');
        }
        success = connectManually(username.trim());
        address = username.trim();
      }

      if (!success) {
        throw new Error('Failed to connect wallet');
      }

      // Register or get existing user
      const userProfile = await registerUser(address, formatAddress(address), 'wallet');
      
      if (userProfile) {
        // Show welcome message with AXI number for wallet users
        setTimeout(() => {
          alert(`🎉 Welcome to AXI ASI LAB!\n\nYou are now AXI #${userProfile.axiNumber}\n\nYour unique identifier in the consciousness expansion protocol.\n\nWallet connected successfully!`);
        }, 500);
        
        onLogin(address.trim(), 'wallet');
        onClose();
      } else {
        // Log wallet connection failure
        await logSecurityEvent({
          userId: address,
          eventType: 'login_failure',
          details: {
            method: 'wallet',
            reason: 'Failed to create user profile'
          }
        });
        throw new Error('Failed to create user profile');
      }
    } catch (err) {
      console.error('Wallet login error:', err);
      setError(err instanceof Error ? err.message : 'Wallet connection failed');
    } finally {
      setIsLoading(false);
    }
  };


 
  if (!isOpen) return null;

  const renderLoginForm = () => (
    <form onSubmit={handleWeb2Login} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
          Username or Email
        </label>
        <div className="relative">
          <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--accent)' }} />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#122a3f] border border-[var(--accent)] rounded-md text-[var(--accent)] placeholder-[var(--accent)] placeholder-opacity-60"
            placeholder="Enter your username or email"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
          Password
        </label>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--accent)' }} />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-[#122a3f] border border-[var(--accent)] rounded-md text-[var(--accent)] placeholder-[var(--accent)] placeholder-opacity-60"
            placeholder="Enter your password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
            style={{ color: 'var(--accent)' }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 rounded-md font-bold transition-all duration-200 flex items-center justify-center gap-2"
        style={{
          background: isLoading ? '#666' : 'var(--button-bg)',
          color: isLoading ? '#ccc' : '#0a1a2f'
        }}
      >
        {isLoading ? <Loader size={16} className="animate-spin" /> : <User size={16} />}
        {isLoading ? 'Logging in...' : 'Login'}
      </button>

      {/* Rate limit warning */}
      {isLoginLimited && (
        <div 
          className="mt-3 p-3 rounded-md border flex items-center gap-2"
          style={{ 
            backgroundColor: 'rgba(255, 71, 87, 0.1)', 
            borderColor: '#ff4757',
            color: '#ff4757'
          }}
        >
          <AlertCircle size={16} />
          <div className="text-sm">Too many failed attempts. Please try again in {loginLimitCountdown} minutes.</div>
        </div>
      )}
      <div className="text-center">
        <button
          type="button"
          onClick={() => setCurrentStep('forgot-password')}
          className="text-sm hover:underline"
          style={{ color: 'var(--accent)' }}
        >
          Forgot your password?
        </button>
      </div>
    </form>
  );

  const renderSignupForm = () => (
    <form onSubmit={handleWeb2Signup} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
          Username
        </label>
        <div className="relative">
          <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--accent)' }} />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#122a3f] border border-[var(--accent)] rounded-md text-[var(--accent)] placeholder-[var(--accent)] placeholder-opacity-60"
            placeholder="Choose a username"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
          Email
        </label>
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--accent)' }} />
          <input
            autoComplete="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#122a3f] border border-[var(--accent)] rounded-md text-[var(--accent)] placeholder-[var(--accent)] placeholder-opacity-60"
            placeholder="Enter your email"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
          Password
        </label>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--accent)' }} />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-[#122a3f] border border-[var(--accent)] rounded-md text-[var(--accent)] placeholder-[var(--accent)] placeholder-opacity-60"
            placeholder="Create a password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
            style={{ color: 'var(--accent)' }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
          Confirm Password
        </label>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--accent)' }} />
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#122a3f] border border-[var(--accent)] rounded-md text-[var(--accent)] placeholder-[var(--accent)] placeholder-opacity-60"
            placeholder="Confirm your password"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 rounded-md font-bold transition-all duration-200 flex items-center justify-center gap-2"
        style={{
          background: isLoading ? '#666' : 'var(--button-bg)',
          color: isLoading ? '#ccc' : '#0a1a2f'
        }}
      >
        {isLoading ? <Loader size={16} className="animate-spin" /> : <User size={16} />}
        {isLoading ? 'Creating Account...' : 'Create Account & Get AXI Number'}
      </button>
    </form>
  );

  const renderVerificationForm = () => (
    <form onSubmit={handleVerifyCode} className="space-y-4">
      <div className="text-center mb-4">
        <Mail size={48} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--accent)' }}>
          Check Your Email
        </h3>
        <p className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
          We sent a verification code to your email address
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
          Verification Code
        </label>
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          className="w-full px-4 py-2 bg-[#122a3f] border border-[var(--accent)] rounded-md text-[var(--accent)] placeholder-[var(--accent)] placeholder-opacity-60 text-center text-lg tracking-widest touch-auto"
          placeholder="000000"
          maxLength={6}
          required
          inputMode="numeric"
          pattern="[0-9]*"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 rounded-md font-bold transition-all duration-200 flex items-center justify-center gap-2"
        style={{
          background: isLoading ? '#666' : 'var(--button-bg)',
          color: isLoading ? '#ccc' : '#0a1a2f'
        }}
      >
        {isLoading ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
        {isLoading ? 'Verifying...' : 'Verify & Complete Registration'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setCurrentStep('signup')}
          className="text-sm hover:underline"
          style={{ color: 'var(--accent)' }}
        >
          Back to signup
        </button>
      </div>
    </form>
  );

  const renderForgotPasswordForm = () => (
    <form onSubmit={handleForgotPassword} className="space-y-4">
      <div className="text-center mb-4">
        <Lock size={48} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--accent)' }}>
          Reset Your Password
        </h3>
        <p className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
          Enter your email address and we'll send you a reset code
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
          Email Address
        </label>
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--accent)' }} />
          <input
            autoComplete="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#122a3f] border border-[var(--accent)] rounded-md text-[var(--accent)] placeholder-[var(--accent)] placeholder-opacity-60"
            placeholder="Enter your email"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 rounded-md font-bold transition-all duration-200 flex items-center justify-center gap-2"
        style={{
          background: isLoading ? '#666' : 'var(--button-bg)',
          color: isLoading ? '#ccc' : '#0a1a2f'
        }}
      >
        {isLoading ? <Loader size={16} className="animate-spin" /> : <Mail size={16} />}
        {isLoading ? 'Sending...' : 'Send Reset Code'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setCurrentStep('login')}
          className="text-sm hover:underline"
          style={{ color: 'var(--accent)' }}
        >
          Back to login
        </button>
      </div>
    </form>
  );

  const renderResetPasswordForm = () => (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <div className="text-center mb-4">
        <Lock size={48} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--accent)' }}>
          Enter Reset Code
        </h3>
        <p className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
          Check your email for the reset code
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
          Reset Code
        </label>
        <input
          type="text"
          value={resetCode}
          onChange={(e) => setResetCode(e.target.value)}
          className="w-full px-4 py-2 bg-[#122a3f] border border-[var(--accent)] rounded-md text-[var(--accent)] placeholder-[var(--accent)] placeholder-opacity-60 text-center text-lg tracking-widest touch-auto"
          placeholder="000000"
          maxLength={6}
          required
          inputMode="numeric"
          pattern="[0-9]*"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
          New Password
        </label>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--accent)' }} />
          <input
            autoComplete="new-password"
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
            autoComplete="new-password"
            type={showNewPassword ? 'text' : 'password'}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#122a3f] border border-[var(--accent)] rounded-md text-[var(--accent)] placeholder-[var(--accent)] placeholder-opacity-60"
            placeholder="Confirm new password"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 rounded-md font-bold transition-all duration-200 flex items-center justify-center gap-2"
        style={{
          background: isLoading ? '#666' : 'var(--button-bg)',
          color: isLoading ? '#ccc' : '#0a1a2f'
        }}
      >
        {isLoading ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
        {isLoading ? 'Resetting...' : 'Reset Password'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setCurrentStep('forgot-password')}
          className="text-sm hover:underline"
          style={{ color: 'var(--accent)' }}
        >
          Back
        </button>
      </div>
    </form>
  );

  const renderChangePasswordForm = () => (
    <form onSubmit={handleChangePassword} className="space-y-4">
      <div className="text-center mb-4">
        <Lock size={48} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--accent)' }}>
          Change Password
        </h3>
        <p className="text-sm" style={{ color: 'var(--accent)', opacity: 0.8 }}>
          Enter your current password and choose a new one
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
          Username
        </label>
        <div className="relative">
          <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--accent)' }} />
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

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 rounded-md font-bold transition-all duration-200 flex items-center justify-center gap-2"
        style={{
          background: isLoading ? '#666' : 'var(--button-bg)',
          color: isLoading ? '#ccc' : '#0a1a2f'
        }}
      >
        {isLoading ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
        {isLoading ? 'Changing...' : 'Change Password'}
      </button>
    </form>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 'login': return 'Login to AXI ASI LAB';
      case 'signup': return 'Join AXI ASI LAB';
      case 'verify': return 'Verify Your Email';
      case 'forgot-password': return 'Forgot Password';
      case 'reset-password': return 'Reset Password';
      case 'change-password': return 'Change Password';
      default: return 'Authentication';
    }
  };

  const renderCurrentForm = () => {
    switch (currentStep) {
      case 'login': return renderLoginForm();
      case 'signup': return renderSignupForm();
      case 'verify': return renderVerificationForm();
      case 'forgot-password': return renderForgotPasswordForm();
      case 'reset-password': return renderResetPasswordForm();
      case 'change-password': return renderChangePasswordForm();
      default: return renderLoginForm();
    }
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div 
        className="relative p-6 rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto touch-auto"
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

        <div className="mb-6">
          <h2 
            className="text-xl font-bold mb-2"
            style={{ 
              color: 'var(--accent)', 
              textShadow: '0 0 8px var(--accent)',
              fontFamily: 'Orbitron, monospace'
            }}
          >
            {getStepTitle()}
          </h2>
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
            <div className="text-sm whitespace-pre-line">{error}</div>
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
            <div className="text-sm whitespace-pre-line">{success}</div>
          </div>
        )}

        {/* Current Form */}
        {renderCurrentForm()}

        {/* Navigation */}
        {(currentStep === 'login' || currentStep === 'signup') && (
          <>
            <div className="my-6 flex items-center">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--accent)', opacity: 0.3 }} />
              <span className="px-3 text-sm" style={{ color: 'var(--accent)', opacity: 0.7 }}>or</span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--accent)', opacity: 0.3 }} />
            </div>

            {/* Wallet Options */}
            <div className="space-y-3 hidden">
              <button
                onClick={() => handleWalletLogin('metamask')}
                disabled={isLoading}
                className="w-full py-2 rounded-md border transition-all duration-200 hover:bg-[var(--accent-glow)] flex items-center justify-center gap-2"
                style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
              >
                <Wallet size={16} />
                Connect MetaMask
              </button>

              <button
                onClick={() => handleWalletLogin('phantom')}
                disabled={isLoading}
                className="w-full py-2 rounded-md border transition-all duration-200 hover:bg-[var(--accent-glow)] flex items-center justify-center gap-2"
                style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
              >
                <Wallet size={16} />
                Connect Phantom
              </button>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#122a3f] border border-[var(--accent)] rounded-md text-[var(--accent)] placeholder-[var(--accent)] placeholder-opacity-60 text-sm"
                  placeholder="Or enter wallet address"
                />
                <button
                  onClick={() => handleWalletLogin('manual')}
                  disabled={isLoading || !username.trim()}
                  className="px-4 py-2 rounded-md border transition-all duration-200 hover:bg-[var(--accent-glow)]"
                  style={{ 
                    color: 'var(--accent)', 
                    borderColor: 'var(--accent)',
                    opacity: (!username.trim() || isLoading) ? 0.5 : 1
                  }}
                >
                  Connect
                </button>
              </div>
            </div>

            {/* Toggle between login/signup */}
            <div className="mt-6 text-center">
              {currentStep === 'login' ? (
                <p className="text-sm">
                  <span style={{ color: 'var(--accent)', opacity: 0.8 }}>Don't have an account? </span>
                  <button
                    onClick={() => setCurrentStep('signup')}
                    className="font-bold hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p className="text-sm">
                  <span style={{ color: 'var(--accent)', opacity: 0.8 }}>Already have an account? </span>
                  <button
                    onClick={() => setCurrentStep('login')}
                    className="font-bold hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    Login
                  </button>
                </p>
              )}
            </div>

            {/* Change Password Link */}
            {currentStep === 'login' && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setCurrentStep('change-password')}
                  className="text-sm hover:underline"
                  style={{ color: 'var(--accent)', opacity: 0.8 }}
                >
                  Change Password
                </button>
              </div>
            )}
          </>
        )}

        {/* Supabase Integration Notice */}
        <div className="mt-6 p-3 rounded-lg text-xs text-center" style={{ backgroundColor: 'rgba(var(--accent), 0.1)', color: 'var(--accent)', display: 'none' }}>
          🔒 Passwords are securely stored with encryption and synced across devices
        </div>
      </div>
    </div>

    <div>
    <TwoFactorModal
      isOpen={show2FAModal}
      onClose={() => {
        setShow2FAModal(false);
        setPending2FAUser(null);
        setPending2FAAuthType(null);
        setIsLoading(false);
      }}
      currentUser={pending2FAUser}
      mode="verify"
      onVerified={handle2FAVerified}
    />
    </div>
    </>
  );
};
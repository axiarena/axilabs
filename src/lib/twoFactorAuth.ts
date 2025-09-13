// Two-Factor Authentication utilities for AXI ASI LAB
// Implements TOTP (Time-based One-Time Password) for enhanced security

interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

interface TwoFactorData {
  secret: string;
  isEnabled: boolean;
  backupCodes: string[];
  lastUsed?: string;
}

// Generate a random base32 secret for TOTP
const generateSecret = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  return secret;
};

// Generate backup codes
const generateBackupCodes = (): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    codes.push(code);
  }
  return codes;
};

// Convert base32 to bytes
const base32ToBytes = (base32: string): Uint8Array => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  
  for (const char of base32.toUpperCase()) {
    const index = alphabet.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, '0');
  }
  
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  
  return bytes;
};

// Generate TOTP code
const generateTOTP = async (secret: string, timeStep: number = Math.floor(Date.now() / 30000)): Promise<string> => {
  const key = base32ToBytes(secret);
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setUint32(4, timeStep, false);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, timeBuffer);
  const signatureArray = new Uint8Array(signature);
  
  const offset = signatureArray[19] & 0xf;
  const code = (
    ((signatureArray[offset] & 0x7f) << 24) |
    ((signatureArray[offset + 1] & 0xff) << 16) |
    ((signatureArray[offset + 2] & 0xff) << 8) |
    (signatureArray[offset + 3] & 0xff)
  ) % 1000000;
  
  return code.toString().padStart(6, '0');
};

// Verify TOTP code (allows for time drift)
export const verifyTOTP = async (secret: string, token: string): Promise<boolean> => {
  const currentTime = Math.floor(Date.now() / 30000);
  
  // Check current time and ±1 time step for clock drift
  for (let i = -1; i <= 1; i++) {
    const expectedToken = await generateTOTP(secret, currentTime + i);
    if (expectedToken === token) {
      return true;
    }
  }
  
  return false;
};

// Setup 2FA for a user
export const setup2FA = async (username: string, appName: string = 'AXI ASI LAB'): Promise<TwoFactorSetup> => {
  console.log('=== SETTING UP 2FA ===');
  console.log('Username:', username);
  
  const secret = generateSecret();
  const backupCodes = generateBackupCodes();
  
  // Create QR code URL for authenticator apps
  const issuer = encodeURIComponent(appName);
  const accountName = encodeURIComponent(`${appName}:${username}`);
  const qrCodeUrl = `otpauth://totp/${accountName}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
  
  console.log('Generated secret for user:', username);
  console.log('QR Code URL created');
  
  return {
    secret,
    qrCodeUrl,
    backupCodes
  };
};

// Enable 2FA after verification
export const enable2FA = async (username: string, secret: string, verificationCode: string, backupCodes: string[]): Promise<boolean> => {
  console.log('=== ENABLING 2FA ===');
  console.log('Username:', username);
  console.log('Verification code:', verificationCode);
  
  // Verify the code first
  const isValid = await verifyTOTP(secret, verificationCode);
  
  if (!isValid) {
    console.log('❌ Invalid verification code');
    return false;
  }
  
  // Store 2FA data
  const twoFactorData: TwoFactorData = {
    secret,
    isEnabled: true,
    backupCodes,
    lastUsed: new Date().toISOString()
  };
  
  // Store in localStorage
  localStorage.setItem(`2fa_${username}`, JSON.stringify(twoFactorData));
  
  // Also try to store in Supabase if available
  try {
    const { supabase } = await import('./supabase');
    if (supabase) {
      await supabase
        .from('user_credentials')
        .update({
          two_factor_secret: secret,
          two_factor_enabled: true,
          backup_codes: backupCodes,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', username);
      
      console.log('✅ 2FA data stored in Supabase');
    }
  } catch (error) {
    console.warn('Could not store 2FA data in Supabase:', error);
  }
  
  console.log('✅ 2FA enabled successfully');
  return true;
};

// Disable 2FA
export const disable2FA = async (username: string, verificationCode: string): Promise<boolean> => {
  console.log('=== DISABLING 2FA ===');
  console.log('Username:', username);
  
  const twoFactorData = get2FAData(username);
  if (!twoFactorData || !twoFactorData.isEnabled) {
    console.log('❌ 2FA not enabled for user');
    return false;
  }
  
  // Verify the code or backup code
  const isValidTOTP = await verifyTOTP(twoFactorData.secret, verificationCode);
  const isValidBackup = twoFactorData.backupCodes.includes(verificationCode.toUpperCase());
  
  if (!isValidTOTP && !isValidBackup) {
    console.log('❌ Invalid verification code');
    return false;
  }
  
  // Remove 2FA data
  localStorage.removeItem(`2fa_${username}`);
  
  // Also remove from Supabase if available
  try {
    const { supabase } = await import('./supabase');
    if (supabase) {
      await supabase
        .from('user_credentials')
        .update({
          two_factor_secret: null,
          two_factor_enabled: false,
          backup_codes: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', username);
      
      console.log('✅ 2FA data removed from Supabase');
    }
  } catch (error) {
    console.warn('Could not remove 2FA data from Supabase:', error);
  }
  
  console.log('✅ 2FA disabled successfully');
  return true;
};

// Verify 2FA code during login
export const verify2FALogin = async (username: string, code: string): Promise<boolean> => {
  console.log('=== VERIFYING 2FA LOGIN ===');
  console.log('Username:', username);
  console.log('Code:', code);
  
  const twoFactorData = get2FAData(username);
  if (!twoFactorData || !twoFactorData.isEnabled) {
    console.log('❌ 2FA not enabled for user');
    return true; // Allow login if 2FA is not enabled
  }
  
  // Check TOTP code
  const isValidTOTP = await verifyTOTP(twoFactorData.secret, code);
  if (isValidTOTP) {
    console.log('✅ Valid TOTP code');
    return true;
  }
  
  // Check backup codes
  const isValidBackup = twoFactorData.backupCodes.includes(code.toUpperCase());
  if (isValidBackup) {
    console.log('✅ Valid backup code used');
    
    // Remove used backup code
    const updatedBackupCodes = twoFactorData.backupCodes.filter(c => c !== code.toUpperCase());
    const updatedData = { ...twoFactorData, backupCodes: updatedBackupCodes };
    localStorage.setItem(`2fa_${username}`, JSON.stringify(updatedData));
    
    // Also update Supabase
    try {
      const { supabase } = await import('./supabase');
      if (supabase) {
        await supabase
          .from('user_credentials')
          .update({
            backup_codes: updatedBackupCodes,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', username);
      }
    } catch (error) {
      console.warn('Could not update backup codes in Supabase:', error);
    }
    
    return true;
  }
  
  console.log('❌ Invalid 2FA code');
  return false;
};

// Get 2FA data for a user
export const get2FAData = (username: string): TwoFactorData | null => {
  try {
    const data = localStorage.getItem(`2fa_${username}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading 2FA data:', error);
    return null;
  }
};

// Check if 2FA is enabled for a user
export const is2FAEnabled = (username: string): boolean => {
  const data = get2FAData(username);
  return data?.isEnabled || false;
};

// Generate new backup codes
export const generateNewBackupCodes = async (username: string, verificationCode: string): Promise<string[] | null> => {
  console.log('=== GENERATING NEW BACKUP CODES ===');
  console.log('Username:', username);
  
  const twoFactorData = get2FAData(username);
  if (!twoFactorData || !twoFactorData.isEnabled) {
    console.log('❌ 2FA not enabled for user');
    return null;
  }
  
  // Verify the code
  const isValid = await verifyTOTP(twoFactorData.secret, verificationCode);
  if (!isValid) {
    console.log('❌ Invalid verification code');
    return null;
  }
  
  // Generate new backup codes
  const newBackupCodes = generateBackupCodes();
  const updatedData = { ...twoFactorData, backupCodes: newBackupCodes };
  
  // Store updated data
  localStorage.setItem(`2fa_${username}`, JSON.stringify(updatedData));
  
  // Also update Supabase
  try {
    const { supabase } = await import('./supabase');
    if (supabase) {
      await supabase
        .from('user_credentials')
        .update({
          backup_codes: newBackupCodes,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', username);
      
      console.log('✅ New backup codes stored in Supabase');
    }
  } catch (error) {
    console.warn('Could not store new backup codes in Supabase:', error);
  }
  
  console.log('✅ New backup codes generated');
  return newBackupCodes;
};
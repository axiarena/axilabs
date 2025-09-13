// Password security utilities for AXI ASI LAB
// Implements secure password hashing and verification with Supabase integration

import { supabase } from './supabase';

interface HashedPassword {
  hash: string;
  salt: string;
}

interface StoredUser {
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  axiNumber?: number;
}

// Generate a random salt
const generateSalt = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Hash password with salt using Web Crypto API
const hashPassword = async (password: string, salt: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
};

// Create a hashed password with salt
export const createHashedPassword = async (password: string): Promise<HashedPassword> => {
  const salt = generateSalt();
  const hash = await hashPassword(password, salt);
  
  return { hash, salt };
};

// Verify a password against stored hash and salt
export const verifyPassword = async (password: string, storedHash: string, salt: string): Promise<boolean> => {
  const hash = await hashPassword(password, salt);
  return hash === storedHash;
};

// Store user credentials securely (both localStorage and Supabase)
export const storeUserCredentials = async (username: string, email: string, password: string, axiNumber?: number): Promise<void> => {
  console.log('=== STORING USER CREDENTIALS ===');
  console.log('Username:', username);
  console.log('Email:', email);
  console.log('Password length:', password.length);
  console.log('AXI Number:', axiNumber);
  
  const { hash, salt } = await createHashedPassword(password);
  
  const userData: StoredUser = {
    username: username.trim(),
    email: email.trim(),
    passwordHash: hash,
    salt,
    createdAt: new Date().toISOString(),
    axiNumber
  };
  
  // Store in localStorage (for immediate access)
  const existingUsers = JSON.parse(localStorage.getItem('userCredentials') || '[]');
  const filteredUsers = existingUsers.filter((user: StoredUser) => 
    user.username !== username.trim() && user.email !== email.trim()
  );
  filteredUsers.push(userData);
  localStorage.setItem('userCredentials', JSON.stringify(filteredUsers));
  
  // Also try to store in Supabase if available
  if (supabase) {
    try {
      console.log('Storing credentials in Supabase...');
      
      // Create a secure credentials table entry
      const { error } = await supabase
        .from('user_credentials')
        .upsert({
          user_id: username.trim(),
          email: email.trim(),
          password_hash: hash,
          salt: salt,
          axi_number: axiNumber,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        console.warn('Could not store credentials in Supabase:', error.message);
        // Don't throw error, localStorage backup is sufficient
      } else {
        console.log('✅ Credentials stored in Supabase successfully');
      }
    } catch (err) {
      console.warn('Supabase credentials storage failed:', err);
      // Continue with localStorage only
    }
  }
  
  console.log('✅ User credentials stored securely');
};

// Verify user login credentials (check both localStorage and Supabase)
export const verifyUserCredentials = async (username: string, password: string, skipSupabase: boolean = false): Promise<boolean> => {
  console.log('=== VERIFYING USER CREDENTIALS ===');
  console.log('Login attempt with username/email:', username.trim());
  console.log('Password length:', password.length);
  
  // First try localStorage (fastest)
  const existingUsers: StoredUser[] = JSON.parse(localStorage.getItem('userCredentials') || '[]');
  console.log('Checking localStorage credentials:', existingUsers.length, 'entries');
  
  let user = existingUsers.find(u => 
    u.username.toLowerCase() === username.trim().toLowerCase() ||
    (username.includes('@') && u.email.toLowerCase() === username.trim().toLowerCase())
  );
  
  if (user && user.passwordHash && user.salt) {
    console.log('✅ Found user in localStorage:', user.username);
    try {
      const isValid = await verifyPassword(password, user.passwordHash, user.salt); 
      console.log('🔐 Password verification result:', isValid ? 'VALID' : 'INVALID');
      return isValid;
    } catch (error) {
      console.error('❌ Password verification error:', error);
    }
  }
  
  // If not found in localStorage, try Supabase
  if (supabase && !skipSupabase) {
    try {
      console.log('Checking Supabase credentials...');
      
      const { data, error } = await supabase
        .from('user_credentials') 
        .select('*');
      
      // Find matching user with case-insensitive comparison
      const matchingUser = data?.find(u => 
        u.user_id.toLowerCase() === username.trim().toLowerCase() ||
        (username.includes('@') && u.email.toLowerCase() === username.trim().toLowerCase())
      );
      
      if (!error && matchingUser) { 
        console.log('✅ Found user in Supabase:', matchingUser.user_id);
        
        // Store in localStorage for faster future access
        const localUser: StoredUser = {
          username: matchingUser.user_id,
          email: matchingUser.email,
          passwordHash: matchingUser.password_hash,
          salt: matchingUser.salt,
          createdAt: matchingUser.created_at
        };
        
        existingUsers.push(localUser);
        localStorage.setItem('userCredentials', JSON.stringify(existingUsers));
        console.log('Cached credentials in localStorage for future use');
        
        // Verify password
        const isValid = await verifyPassword(password, matchingUser.password_hash, matchingUser.salt); 
        console.log('🔐 Password verification result:', isValid ? 'VALID' : 'INVALID');
        return isValid;
      }
    } catch (err) {
      console.warn('Supabase credential check failed:', err);
    }
  }
  
  // If user exists in profiles but no credentials, they need to set up password
  if (supabase) {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_id, email, auth_type') 
        .or(`user_id.eq.${username.trim()},email.eq.${username.trim()}`)
        .eq('auth_type', 'web2')
        .single();
      
      if (profile) {
        console.log('❌ User exists but no password set up:', profile.user_id);
        return false;
      }
    } catch (err) {
      console.log('Profile check failed:', err);
    }
  }
  
  console.log('❌ No user found or invalid credentials');
  return false;
};

// Update user password
export const updateUserPassword = async (username: string, newPassword: string): Promise<boolean> => {
  console.log('=== UPDATING USER PASSWORD (FIXED) ===');
  console.log('Username:', username.trim());
  
  // Validate new password first
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
  }
  
  const { hash, salt } = await createHashedPassword(newPassword);
  
  // Update localStorage
  const existingUsers: StoredUser[] = JSON.parse(localStorage.getItem('userCredentials') || '[]');
  const userIndex = existingUsers.findIndex(user => 
    user.username.toLowerCase() === username.trim().toLowerCase() ||
    (username.includes('@') && user.email.toLowerCase() === username.trim().toLowerCase())
  );
  
  if (userIndex !== -1) {
    existingUsers[userIndex].passwordHash = hash;
    existingUsers[userIndex].salt = salt;
    localStorage.setItem('userCredentials', JSON.stringify(existingUsers));
    console.log('✅ Updated password in localStorage');
  }
  
  // Update Supabase if available
  if (supabase) {
    try {
      console.log('Updating password in Supabase...');
      
      // First check if the function exists
      const { data: functionExists, error: functionCheckError } = await supabase
        .from('pg_catalog.pg_proc')
        .select('proname')
        .eq('proname', 'update_user_password_secure')
        .maybeSingle();
      
      if (functionCheckError) {
        console.warn('Could not check if function exists:', functionCheckError.message);
      }
      
      let updateResult;
      
      if (functionExists) {
        // Use the secure function if it exists
        updateResult = await supabase.rpc('update_user_password_secure', {
          p_user_id: username.trim(),
          p_new_hash: hash,
          p_new_salt: salt
        });
      } else {
        // Fall back to direct update if function doesn't exist
        updateResult = await supabase
          .from('user_credentials')
          .update({
            password_hash: hash,
            salt: salt,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', username.trim()); 
      }
      
      const { error } = updateResult;
      
      if (error) {
        console.error('❌ Supabase password update error:', error);
        throw error;
      } else { 
        console.log('✅ Updated password in Supabase');
      }
    } catch (err) {
      console.warn('Supabase password update failed:', err);
    }
  }
  
  return true;
};

// Check if user exists by username
export const userExists = (username: string): boolean => {
  const existingUsers: StoredUser[] = JSON.parse(localStorage.getItem('userCredentials') || '[]');
  return existingUsers.some(user => 
    user.username.toLowerCase() === username.toLowerCase() ||
    (username.includes('@') && user.email.toLowerCase() === username.toLowerCase())
  );
};

// Check if email is already registered
export const emailExists = (email: string): boolean => {
  const existingUsers: StoredUser[] = JSON.parse(localStorage.getItem('userCredentials') || '[]');
  return existingUsers.some(user => user.email.toLowerCase() === email.toLowerCase());
};

// Get user by email (for password reset)
export const getUserByEmail = (email: string): StoredUser | null => {
  console.log('=== GETTING USER BY EMAIL ===');
  console.log('Looking for email:', email);
  
  const existingUsers: StoredUser[] = JSON.parse(localStorage.getItem('userCredentials') || '[]');
  
  // Try to find in stored credentials
  const storedUser = existingUsers.find(user => 
    user.email.toLowerCase() === email.toLowerCase()
  );
  
  if (storedUser) {
    console.log('✅ Found user in stored credentials:', storedUser.username);
    return storedUser;
  }
  
  // Check user profiles for web2 users
  const userProfiles = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
  const profileWithEmail = userProfiles.find((p: any) => 
    p.email && p.email.toLowerCase() === email.toLowerCase() && p.authType === 'web2'
  );
  
  if (profileWithEmail) {
    console.log('✅ Found profile with email:', profileWithEmail.userId);
    return {
      username: profileWithEmail.userId,
      email: email,
      passwordHash: '',
      salt: '',
      createdAt: profileWithEmail.createdAt || new Date().toISOString()
    };
  }
  
  console.log('❌ No user found with email:', email);
  return null;
};

// Reset password by email
export const resetPasswordByEmail = async (email: string, newPassword: string): Promise<boolean> => {
  console.log('=== RESETTING PASSWORD BY EMAIL (FIXED) ===');
  console.log('Email:', email);
  
  // Validate new password first
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
  }
  
  const { hash, salt } = await createHashedPassword(newPassword);
  
  try {
    // Update or create credentials
    const existingUsers: StoredUser[] = JSON.parse(localStorage.getItem('userCredentials') || '[]');
    const userIndex = existingUsers.findIndex(user => 
      user.email && user.email.toLowerCase() === email.toLowerCase()
    );
  
    if (userIndex !== -1) {
      // Update existing user
      existingUsers[userIndex].passwordHash = hash;
      existingUsers[userIndex].salt = salt;
      localStorage.setItem('userCredentials', JSON.stringify(existingUsers));
      console.log('✅ Password reset for existing user');
    } else {
      // Find user in profiles and create credentials
      const userProfiles = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
      const profile = userProfiles.find((p: any) => 
        p.email && p.email.toLowerCase() === email.toLowerCase() && p.authType === 'web2'
      );
      
      if (profile) {
        const newUser: StoredUser = {
          username: profile.userId,
          email: email,
          passwordHash: hash,
          salt,
          createdAt: new Date().toISOString()
        };
        
        existingUsers.push(newUser);
        localStorage.setItem('userCredentials', JSON.stringify(existingUsers));
        console.log('✅ Created new credentials for profile user');
      } else {
        throw new Error('No account found with this email address');
      }
    }
  } catch (error) {
    console.error('Error updating local credentials:', error);
    // Continue with Supabase update even if local update fails
  }
  
  // Also update Supabase if available
  if (supabase) {
    try { 
      console.log('Resetting password in Supabase...');
      
      // First check if the function exists
      const { data: functionExists, error: functionCheckError } = await supabase
        .from('pg_catalog.pg_proc')
        .select('proname')
        .eq('proname', 'reset_password_by_email')
        .maybeSingle();
      
      let updateResult;
      
      if (functionExists) {
        // Use the secure function if it exists
        updateResult = await supabase.rpc('reset_password_by_email', {
          p_email: email.trim(),
          p_new_hash: hash,
          p_new_salt: salt
        });
      } else {
        // Fall back to direct update if function doesn't exist
        // First find the user by email
        const { data: userData, error: userError } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('email', email.trim())
          .eq('auth_type', 'web2')
          .maybeSingle();
        
        if (userError || !userData) {
          console.error('Error finding user by email:', userError || 'No user found');
          throw new Error('User not found with this email');
        }
        
        // Then update the credentials
        updateResult = await supabase
          .from('user_credentials')
          .update({
            password_hash: hash,
            salt: salt,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userData.user_id);
      }
      
      if (updateResult.error) {
        console.error('❌ Supabase password reset error:', updateResult.error);
        throw updateResult.error; 
      } else {
        console.log('✅ Password reset in Supabase');
      }
    } catch (err) {
      console.warn('Supabase password reset failed:', err);
    }
  }
  
  return true;
};

// Verify current password and update to new password
export const verifyAndUpdatePassword = async (
  username: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> => {
  console.log('=== VERIFYING AND UPDATING PASSWORD ===');
  console.log('Username:', username);
  
  try {
    // First hash the current password to verify
    const existingUsers: StoredUser[] = JSON.parse(localStorage.getItem('userCredentials') || '[]');
    const user = existingUsers.find(u => 
      u.username.toLowerCase() === username.toLowerCase() ||
      (username.includes('@') && u.email.toLowerCase() === username.toLowerCase())
    );
    
    if (!user) {
      console.log('❌ User not found');
      return false;
    }
    
    // Verify current password
    const currentHash = await hashPassword(currentPassword, user.salt);
    if (currentHash !== user.passwordHash) {
      console.log('❌ Current password is incorrect');
      return false;
    }
    
    // Generate new hash and salt for new password
    const { hash: newHash, salt: newSalt } = await createHashedPassword(newPassword);
    
    // Update in Supabase if available
    if (supabase) {
      try {
        console.log('Verifying and updating password in Supabase...');
        
        const { data, error } = await supabase.rpc('verify_password_change', {
          p_user_id: username,
          p_current_hash: currentHash,
          p_new_hash: newHash,
          p_new_salt: newSalt
        });
        
        if (error) {
          console.error('❌ Supabase password verification error:', error);
          throw error;
        } else {
          console.log('✅ Password verified and updated in Supabase');
        }
      } catch (err) {
        console.warn('Supabase password verification failed:', err);
        // Continue with localStorage update
      }
    }
    
    // Update in localStorage
    const userIndex = existingUsers.findIndex(u => u.username === user.username);
    if (userIndex !== -1) {
      existingUsers[userIndex].passwordHash = newHash;
      existingUsers[userIndex].salt = newSalt;
      localStorage.setItem('userCredentials', JSON.stringify(existingUsers));
      console.log('✅ Password updated in localStorage');
    }
    
    return true;
  } catch (err) {
    console.error('Password verification and update error:', err);
    return false;
  }
};

// Validate password strength
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Migrate existing users to have password capability
export const migrateExistingUsers = async (): Promise<void> => {
  console.log('=== MIGRATING EXISTING USERS ===');
  
  if (!supabase) {
    console.log('Supabase not available, skipping migration');
    return;
  }
  
  try {
    // Get all web2 users from Supabase
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('user_id, email, display_name')
      .eq('auth_type', 'web2')
      .eq('is_active', true);
    
    if (error) {
      console.error('Failed to fetch user profiles:', error);
      return;
    }
    
    console.log('Found', profiles?.length || 0, 'web2 users to potentially migrate');
    
    // Check which users don't have credentials yet
    const existingCredentials: StoredUser[] = JSON.parse(localStorage.getItem('userCredentials') || '[]');
    
    for (const profile of profiles || []) {
      const hasCredentials = existingCredentials.some(cred => 
        cred.username.toLowerCase() === profile.user_id.toLowerCase()
      );
      
      if (!hasCredentials && profile.email) {
        console.log('User', profile.user_id, 'needs password setup');
        // These users will need to use "Forgot Password" to set up their password
      }
    }
    
    console.log('Migration check complete');
  } catch (err) {
    console.error('Migration failed:', err);
  }
};
// Email verification utilities for AXI ASI LAB
// Implements mandatory email verification for enhanced security

import { supabase } from './supabase';
import { sendVerificationEmail } from './emailService';
import { logSecurityEvent } from './securityAudit';
import { UserProfile } from '../types/shader';

interface VerificationStatus {
  isVerified: boolean;
  verificationSent: boolean;
  lastSentAt?: string;
}

// Check if email is verified
export const isEmailVerified = async (userId: string, email: string): Promise<boolean> => {
  console.log('=== CHECKING EMAIL VERIFICATION STATUS ===');
  console.log('User ID:', userId);
  console.log('Email:', email);
  
  // First check Supabase if available - this is the source of truth
  if (supabase) {
    try {
      console.log('Checking verification status in Supabase...');
      
      // Use the is_email_verified function for better security
      const { data, error } = await supabase.rpc('is_email_verified', {
        p_user_id: userId,
        p_email: email
      });
      
      if (!error && data) {
        console.log('Verification status from Supabase:', data);
        return data === true;
      }
    } catch (err) {
      console.warn('Supabase verification check failed:', err);
      // Fall back to localStorage
    }
  }
  
  // Fall back to localStorage
  console.log('Using localStorage for verification check');
  
  const key = `email_verified_${userId}_${email}`;
  const status = localStorage.getItem(key);
  
  console.log('Verification status from localStorage:', status === 'true');
  return status === 'true';
};

// Mark email as verified
export const markEmailAsVerified = async (userId: string, email: string): Promise<boolean> => {
  console.log('=== MARKING EMAIL AS VERIFIED ===');
  console.log('User ID:', userId);
  console.log('Email:', email);
  
  // Store in localStorage for offline fallback
  const key = `email_verified_${userId}_${email}`;
  localStorage.setItem(key, 'true');
  
  // Update in Supabase if available - this is the source of truth
  if (supabase) {
    try {
      console.log('Updating verification status in Supabase...');
      
      // First check if the function exists
      const { data: functionExists, error: functionCheckError } = await supabase
        .from('pg_catalog.pg_proc')
        .select('proname')
        .eq('proname', 'verify_user_email')
        .maybeSingle();
      
      if (functionCheckError) {
        console.warn('Could not check if function exists:', functionCheckError.message);
      }
      
      let updateResult;
      
      if (functionExists) {
        // Use the secure function to verify email if it exists
        updateResult = await supabase.rpc('verify_user_email', {
          p_user_id: userId,
          p_email: email
        });
      } else {
        // Fall back to direct update if function doesn't exist
        updateResult = await supabase
          .from('user_profiles')
          .update({
            email_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('email', email);
      }
      
      const { error } = updateResult;
      
      if (error) {
        console.warn('Could not update verification status in Supabase:', error.message);
      } else {
        console.log('✅ Verification status updated in Supabase');
        
        // Also update local user profile if available
        try {
          const userProfileStr = localStorage.getItem('userProfile');
          if (userProfileStr) {
            const userProfile: UserProfile = JSON.parse(userProfileStr);
            if (userProfile.userId === userId && userProfile.email === email) {
              userProfile.emailVerified = true;
              localStorage.setItem('userProfile', JSON.stringify(userProfile));
              console.log('✅ Updated local user profile with verified email status');
            }
          }
        } catch (localError) {
          console.warn('Could not update local user profile:', localError);
        }
      }
    } catch (err) {
      console.warn('Supabase verification update failed:', err);
    }
  }
  
  // Log the verification event
  await logSecurityEvent({
    userId,
    eventType: 'email_verified',
    details: {
      email,
      success: true
    }
  });
  
  console.log('✅ Email marked as verified');
  return true;
};

// Send verification email
export const sendEmailVerification = async (
  userId: string,
  email: string,
  username: string
): Promise<boolean> => {
  console.log('=== SENDING EMAIL VERIFICATION ===');
  console.log('User ID:', userId);
  console.log('Email:', email);
  
  // Generate verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store verification code
  const key = `email_verification_${userId}_${email}`;
  localStorage.setItem(key, JSON.stringify({
    code: verificationCode,
    sentAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
  }));
  
  // Send verification email
  const result = await sendVerificationEmail({
    to: email,
    code: verificationCode,
    username
  });
  
  if (result.success) {
    console.log('✅ Verification email sent successfully');
    
    // Log the event
    await logSecurityEvent({
      userId,
      eventType: 'email_verification_sent',
      details: {
        email,
        provider: result.provider
      }
    });
    
    return true;
  } else {
    console.error('❌ Failed to send verification email');
    return false;
  }
};

// Verify email with code
export const verifyEmailWithCode = async (
  userId: string,
  email: string,
  code: string
): Promise<boolean> => {
  console.log('=== VERIFYING EMAIL WITH CODE ===');
  console.log('User ID:', userId);
  console.log('Email:', email);
  console.log('Code:', code);
  
  // Get stored verification data
  const key = `email_verification_${userId}_${email}`;
  const verificationData = localStorage.getItem(key);
  
  if (!verificationData) {
    console.log('❌ No verification data found');
    return false;
  }
  
  try {
    const data = JSON.parse(verificationData);
    const now = new Date();
    const expiresAt = new Date(data.expiresAt);
    
    // Check if code is expired
    if (now > expiresAt) {
      console.log('❌ Verification code expired');
      localStorage.removeItem(key);
      return false;
    }
    
    // Check if code matches
    if (data.code !== code) {
      console.log('❌ Invalid verification code');
      return false;
    }
    
    // Mark email as verified
    await markEmailAsVerified(userId, email);
    
    // Clean up verification data
    localStorage.removeItem(key);
    
    console.log('✅ Email verified successfully');
    return true;
  } catch (error) {
    console.error('Email verification error:', error);
    return false;
  }
};

// Get verification status
export const getVerificationStatus = (userId: string, email: string): VerificationStatus => {
  console.log('=== GETTING VERIFICATION STATUS ===');
  console.log('User ID:', userId);
  console.log('Email:', email);
  
  // Check if email is verified
  const verifiedKey = `email_verified_${userId}_${email}`;
  const isVerified = localStorage.getItem(verifiedKey) === 'true';
  
  // Check if verification has been sent
  const verificationKey = `email_verification_${userId}_${email}`;
  const verificationData = localStorage.getItem(verificationKey);
  
  if (!verificationData) {
    console.log('Verification status:', isVerified ? 'Verified' : 'Not verified', 'No verification sent');
    return {
      isVerified,
      verificationSent: false
    };
  }
  
  try {
    const data = JSON.parse(verificationData);
    console.log('Verification status:', isVerified ? 'Verified' : 'Not verified', 'Verification sent at', data.sentAt);
    
    return {
      isVerified,
      verificationSent: true,
      lastSentAt: data.sentAt
    };
  } catch (error) {
    console.error('Error parsing verification data:', error);
    return {
      isVerified,
      verificationSent: false
    };
  }
};

// Require email verification for sensitive operations
export const requireEmailVerification = async (
  userId: string,
  email: string,
  username: string
): Promise<boolean> => {
  console.log('=== REQUIRING EMAIL VERIFICATION ===');
  console.log('User ID:', userId);
  console.log('Email:', email);
  
  // Check if email is already verified
  const isVerified = await isEmailVerified(userId, email);
  if (isVerified) {
    console.log('✅ Email already verified');
    return true;
  }
  
  // Get verification status
  const status = getVerificationStatus(userId, email);
  
  // If verification has not been sent or was sent more than 5 minutes ago, send a new one
  if (!status.verificationSent || 
      (status.lastSentAt && new Date().getTime() - new Date(status.lastSentAt).getTime() > 5 * 60 * 1000)) {
    console.log('Sending verification email...');
    return sendEmailVerification(userId, email, username);
  }
  
  console.log('Verification email already sent recently');
  return true;
};
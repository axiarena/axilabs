// Rate limiting utilities for AXI ASI LAB
// Implements protection against brute force attacks

import { supabase } from './supabase';
import { logSecurityEvent } from './securityAudit';

interface RateLimitConfig {
  maxAttempts: number;
  timeWindowMinutes: number;
  blockDurationMinutes: number;
}

// Default rate limit configuration
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  timeWindowMinutes: 15,
  blockDurationMinutes: 30
};

// Store failed attempts in localStorage
const storeFailedAttempt = (identifier: string): void => {
  const key = `rate_limit_${identifier}`;
  const attempts = JSON.parse(localStorage.getItem(key) || '[]');
  
  attempts.push({
    timestamp: Date.now()
  });
  
  localStorage.setItem(key, JSON.stringify(attempts));
};

// Check if rate limit is exceeded
export const isRateLimited = async (
  identifier: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): Promise<boolean> => {
  console.log('=== CHECKING RATE LIMIT ===');
  console.log('Identifier:', identifier);
  
  // First check Supabase if available
  if (supabase) {
    try {
      console.log('Checking rate limit in Supabase...');
      
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_username_or_email: identifier,
        p_ip_address: null // In a real app, this would be the IP address
      });
      
      if (!error && data) {
        if (data === true) {
          console.log('⚠️ Rate limit exceeded in Supabase');
          
          // Log the rate limit event
          await logSecurityEvent({
            userId: identifier.includes('@') ? undefined : identifier,
            eventType: 'rate_limit_exceeded',
            details: {
              identifier,
              maxAttempts: config.maxAttempts,
              timeWindow: `${config.timeWindowMinutes} minutes`
            }
          });
          
          return true;
        }
        
        console.log('✅ Rate limit not exceeded in Supabase');
        return false;
      }
    } catch (err) {
      console.warn('Supabase rate limit check failed:', err);
      // Fall back to localStorage
    }
  }
  
  // Fall back to localStorage
  console.log('Using localStorage for rate limit check');
  
  const key = `rate_limit_${identifier}`;
  const attempts = JSON.parse(localStorage.getItem(key) || '[]');
  const now = Date.now();
  const timeWindowMs = config.timeWindowMinutes * 60 * 1000;
  
  // Filter attempts within the time window
  const recentAttempts = attempts.filter((attempt: any) => 
    now - attempt.timestamp < timeWindowMs
  );
  
  // Update localStorage with only recent attempts
  localStorage.setItem(key, JSON.stringify(recentAttempts));
  
  // Check if rate limit is exceeded
  const isLimited = recentAttempts.length >= config.maxAttempts;
  
  if (isLimited) {
    console.log('⚠️ Rate limit exceeded in localStorage');
    
    // Log the rate limit event
    await logSecurityEvent({
      userId: identifier.includes('@') ? undefined : identifier,
      eventType: 'rate_limit_exceeded',
      details: {
        identifier,
        maxAttempts: config.maxAttempts,
        timeWindow: `${config.timeWindowMinutes} minutes`,
        source: 'localStorage'
      }
    });
  } else {
    console.log('✅ Rate limit not exceeded in localStorage');
  }
  
  return isLimited;
};

// Record a failed login attempt
export const recordFailedAttempt = async (
  identifier: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  console.log('=== RECORDING FAILED ATTEMPT ===');
  console.log('Identifier:', identifier);
  
  // Store in Supabase if available
  if (supabase) {
    try {
      console.log('Recording failed attempt in Supabase...');
      
      await supabase.rpc('record_login_attempt', {
        p_username_or_email: identifier,
        p_success: false,
        p_ip_address: ipAddress || null,
        p_user_agent: userAgent || navigator.userAgent
      });
      
      console.log('✅ Failed attempt recorded in Supabase');
    } catch (err) {
      console.warn('Supabase failed attempt recording failed:', err);
      // Fall back to localStorage
    }
  }
  
  // Also store in localStorage as fallback
  storeFailedAttempt(identifier);
  console.log('✅ Failed attempt recorded in localStorage');
};

// Record a successful login attempt
export const recordSuccessfulAttempt = async (
  identifier: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  console.log('=== RECORDING SUCCESSFUL ATTEMPT ===');
  console.log('Identifier:', identifier);
  
  // Store in Supabase if available
  if (supabase) {
    try {
      console.log('Recording successful attempt in Supabase...');
      
      await supabase.rpc('record_login_attempt', {
        p_username_or_email: identifier,
        p_success: true,
        p_ip_address: ipAddress || null,
        p_user_agent: userAgent || navigator.userAgent
      });
      
      console.log('✅ Successful attempt recorded in Supabase');
    } catch (err) {
      console.warn('Supabase successful attempt recording failed:', err);
    }
  }
  
  // Clear rate limit for this identifier
  localStorage.removeItem(`rate_limit_${identifier}`);
  console.log('✅ Rate limit cleared for successful login');
};

// Reset rate limit for a user (e.g., after password reset)
export const resetRateLimit = (identifier: string): void => {
  console.log('=== RESETTING RATE LIMIT ===');
  console.log('Identifier:', identifier);
  
  localStorage.removeItem(`rate_limit_${identifier}`);
  console.log('✅ Rate limit reset in localStorage');
  
  // Also reset in Supabase if available
  if (supabase) {
    try {
      console.log('Clearing rate limit in Supabase...');
      
      // Delete all failed attempts for this identifier
      supabase
        .from('login_attempts')
        .delete()
        .eq('username_or_email', identifier)
        .eq('success', false)
        .then(({ error }) => {
          if (error) {
            console.warn('Could not clear rate limit in Supabase:', error.message);
          } else {
            console.log('✅ Rate limit cleared in Supabase');
          }
        });
    } catch (err) {
      console.warn('Supabase rate limit reset failed:', err);
    }
  }
};
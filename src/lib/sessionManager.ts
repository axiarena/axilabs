// Session management utilities for AXI ASI LAB
// Implements secure session handling with expiration and refresh

import { supabase } from './supabase';

interface Session {
  token: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

// Create a new session
export const createSession = async (
  userId: string,
  duration: number = 7 // days
): Promise<Session | null> => {
  console.log('=== CREATING USER SESSION ===');
  // Normalize user ID
  const normalizedUserId = userId.trim();
  console.log('User ID:', normalizedUserId);
  console.log('Duration (days):', duration);
  
  // Store session in localStorage
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + duration);
  
  // Generate a secure random token
  const tokenArray = new Uint8Array(32);
  crypto.getRandomValues(tokenArray);
  const token = Array.from(tokenArray, byte => byte.toString(16).padStart(2, '0')).join('');
  
  const session: Session = {
    token,
    userId: normalizedUserId,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString()
  };
  
  // Store in localStorage
  localStorage.setItem(`session_${normalizedUserId}`, JSON.stringify(session));
  
  // Also store in Supabase if available
  if (supabase) {
    try {
      console.log('Storing session in Supabase...');
      
      const { error } = await supabase.rpc('create_user_session', {
        p_user_id: normalizedUserId,
        p_ip_address: 'client-side', // In a real app, this would be server-side
        p_user_agent: navigator.userAgent,
        p_session_duration: `${duration} days`
      });
      
      if (error) {
        console.warn('Could not store session in Supabase:', error.message);
        // Continue with localStorage session
      } else {
        console.log('✅ Session stored in Supabase successfully');
      }
    } catch (err) {
      console.warn('Supabase session storage failed:', err);
      // Continue with localStorage session
    }
  }
  
  console.log('✅ Session created successfully');
  return session;
};

// Validate a session
export const validateSession = (userId: string): boolean => {
  console.log('=== VALIDATING USER SESSION ===');
  console.log('User ID:', userId);
  
  if (!userId) {
    console.log('❌ No user ID provided');
    return false;
  }
  
  try {
    const sessionData = localStorage.getItem(`session_${userId}`);
    if (!sessionData) {
      console.log('❌ No session found');
      return false;
    }
    
    const session: Session = JSON.parse(sessionData);
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    
    // Check if session is expired
    if (now > expiresAt) {
      console.log('❌ Session expired');
      // Clean up expired session
      localStorage.removeItem(`session_${userId}`);
      return false;
    }

    // If session is valid but will expire soon (within 1 day), refresh it
    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    
    if (expiresAt < oneDayFromNow) {
      console.log('Session valid but expiring soon, refreshing...');
      refreshSession(userId).catch(err => {
        console.warn('Failed to refresh session:', err);
      });
    }
    
    console.log('✅ Session valid');
    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
};

// Invalidate a session (logout)
export const invalidateSession = async (userId: string): Promise<boolean> => {
  console.log('=== INVALIDATING USER SESSION ===');
  console.log('User ID:', userId);
  
  // Remove from localStorage
  localStorage.removeItem(`session_${userId}`);
  
  // Also invalidate in Supabase if available
  if (supabase) {
    try {
      console.log('Invalidating session in Supabase...');
      
      // Get the session token first
      const sessionData = localStorage.getItem(`session_${userId}`);
      if (sessionData) {
        const session: Session = JSON.parse(sessionData);
        
        const { error } = await supabase.rpc('invalidate_user_session', {
          p_session_token: session.token,
          p_user_id: userId,
          p_ip_address: 'client-side',
          p_user_agent: navigator.userAgent
        });
        
        if (error) {
          console.warn('Could not invalidate session in Supabase:', error.message);
        } else {
          console.log('✅ Session invalidated in Supabase successfully');
        }
      }
    } catch (err) {
      console.warn('Supabase session invalidation failed:', err);
    }
  }
  
  console.log('✅ Session invalidated successfully');
  return true;
};

// Refresh a session
export const refreshSession = async (userId: string): Promise<Session | null> => {
  console.log('=== REFRESHING USER SESSION ===');
  console.log('User ID:', userId);
  
  // Get current session
  const sessionData = localStorage.getItem(`session_${userId}`);
  if (!sessionData) {
    console.log('No session to refresh');
    return createSession(userId);
  }
  
  try {
    const session: Session = JSON.parse(sessionData);
    
    // Extend expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    const refreshedSession: Session = {
      ...session,
      expiresAt: expiresAt.toISOString()
    };
    
    // Store refreshed session
    localStorage.setItem(`session_${userId}`, JSON.stringify(refreshedSession));
    
    // Also update in Supabase if available
    if (supabase) {
      try {
        console.log('Refreshing session in Supabase...');
        
        const { error } = await supabase.rpc('refresh_user_session', {
          p_user_id: userId,
          p_session_token: session.token,
          p_session_duration: '7 days'
        });
        
        if (error) {
          console.warn('Could not refresh session in Supabase:', error.message);
        } else {
          console.log('✅ Session refreshed in Supabase successfully');
        }
      } catch (err) {
        console.warn('Supabase session refresh failed:', err);
      }
    }
    
    console.log('✅ Session refreshed successfully');
    return refreshedSession;
  } catch (error) {
    console.error('Session refresh error:', error);
    
    // If there's an error, create a new session
    return createSession(userId);
  }
  
};

// Get all active sessions for a user
export const getUserSessions = async (userId: string): Promise<any[]> => {
  console.log('=== GETTING USER SESSIONS ===');
  console.log('User ID:', userId);
  
  if (!supabase) {
    console.log('Supabase not available, returning only local session');
    
    const sessionData = localStorage.getItem(`session_${userId}`);
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        return [{
          created_at: session.createdAt,
          expires_at: session.expiresAt,
          last_active_at: new Date().toISOString(),
          ip_address: 'local',
          user_agent: navigator.userAgent
        }];
      } catch (error) {
        console.error('Error parsing local session:', error);
      }
    }
    
    return [];
  }
  
  try {
    console.log('Fetching sessions from Supabase...');
    
    const { data, error } = await supabase.rpc('get_user_active_sessions', {
      p_user_id: userId
    });
    
    if (error) {
      console.warn('Could not fetch sessions from Supabase:', error.message);
      return [];
    }
    
    console.log('✅ Sessions fetched successfully:', data?.length || 0);
    return data || [];
  } catch (err) {
    console.warn('Supabase session fetch failed:', err);
    return [];
  }
};
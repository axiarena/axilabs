// Security audit logging for AXI ASI LAB
// Implements comprehensive security event logging

import { supabase } from './supabase';

export type SecurityEventType = 
  | 'login_success' 
  | 'login_failure' 
  | 'logout' 
  | 'password_change' 
  | 'password_reset' 
  | 'email_verified' 
  | '2fa_enabled' 
  | '2fa_disabled' 
  | '2fa_verification' 
  | 'account_created' 
  | 'profile_updated'
  | 'rate_limit_exceeded';

interface SecurityEvent {
  userId?: string;
  eventType: SecurityEventType;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// Log a security event
export const logSecurityEvent = async (event: SecurityEvent): Promise<boolean> => {
  console.log('=== LOGGING SECURITY EVENT ===');
  console.log('Event Type:', event.eventType);
  console.log('User ID:', event.userId || 'anonymous');
  console.log('Details:', event.details);
  
  // Store in localStorage for offline/fallback
  const auditLogs = JSON.parse(localStorage.getItem('security_audit_logs') || '[]');
  const logEntry = {
    id: crypto.randomUUID(),
    userId: event.userId,
    eventType: event.eventType,
    details: event.details,
    ipAddress: event.ipAddress || 'client-side',
    userAgent: event.userAgent || navigator.userAgent,
    timestamp: new Date().toISOString()
  };
  
  auditLogs.push(logEntry);
  localStorage.setItem('security_audit_logs', JSON.stringify(auditLogs));
  
  // Also log to Supabase if available
  if (supabase) {
    try {
      console.log('Logging to Supabase...');
      
      const { error } = await supabase.rpc('log_security_event', {
        p_user_id: event.userId || null,
        p_event_type: event.eventType,
        p_event_details: event.details ? JSON.stringify(event.details) : null,
        p_ip_address: event.ipAddress || 'client-side',
        p_user_agent: event.userAgent || navigator.userAgent
      });
      
      if (error) {
        console.warn('Could not log to Supabase:', error.message);
        return true; // Still succeeded locally
      }
      
      console.log('✅ Security event logged to Supabase');
      return true;
    } catch (err) {
      console.warn('Supabase logging failed:', err);
      return true; // Still succeeded locally
    }
  }
  
  console.log('✅ Security event logged locally');
  return true;
};

// Get security audit logs for a user
export const getUserSecurityLogs = async (userId: string, limit: number = 50): Promise<any[]> => {
  console.log('=== GETTING USER SECURITY LOGS ===');
  console.log('User ID:', userId);
  
  if (!supabase) {
    console.log('Supabase not available, returning local logs');
    
    const auditLogs = JSON.parse(localStorage.getItem('security_audit_logs') || '[]');
    return auditLogs
      .filter((log: any) => log.userId === userId)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
  
  try {
    console.log('Fetching logs from Supabase...');
    
    const { data, error } = await supabase
      .from('security_audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.warn('Could not fetch logs from Supabase:', error.message);
      
      // Fall back to local logs
      const auditLogs = JSON.parse(localStorage.getItem('security_audit_logs') || '[]');
      return auditLogs
        .filter((log: any) => log.userId === userId)
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    }
    
    console.log('✅ Security logs fetched successfully:', data?.length || 0);
    return data || [];
  } catch (err) {
    console.warn('Supabase log fetch failed:', err);
    
    // Fall back to local logs
    const auditLogs = JSON.parse(localStorage.getItem('security_audit_logs') || '[]');
    return auditLogs
      .filter((log: any) => log.userId === userId)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
};

// Check for suspicious activity
export const checkSuspiciousActivity = async (userId: string): Promise<boolean> => {
  console.log('=== CHECKING FOR SUSPICIOUS ACTIVITY ===');
  console.log('User ID:', userId);
  
  if (!supabase) {
    console.log('Supabase not available, skipping suspicious activity check');
    return false;
  }
  
  try {
    // Check for multiple failed login attempts
    const { data: failedLogins, error: loginError } = await supabase
      .from('login_attempts')
      .select('count')
      .eq('username_or_email', userId)
      .eq('success', false)
      .gte('attempt_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .single();
    
    if (!loginError && failedLogins && failedLogins.count > 10) {
      console.log('⚠️ Suspicious activity detected: Multiple failed login attempts');
      return true;
    }
    
    // Check for multiple password reset attempts
    const { data: passwordResets, error: resetError } = await supabase
      .from('security_audit_logs')
      .select('count')
      .eq('user_id', userId)
      .eq('event_type', 'password_reset')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .single();
    
    if (!resetError && passwordResets && passwordResets.count > 3) {
      console.log('⚠️ Suspicious activity detected: Multiple password reset attempts');
      return true;
    }
    
    // Check for logins from multiple locations
    const { data: sessions, error: sessionError } = await supabase
      .from('user_sessions')
      .select('ip_address')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours
    
    if (!sessionError && sessions) {
      const uniqueIPs = new Set(sessions.map(s => s.ip_address).filter(Boolean));
      if (uniqueIPs.size > 5) {
        console.log('⚠️ Suspicious activity detected: Logins from multiple locations');
        return true;
      }
    }
    
    console.log('✅ No suspicious activity detected');
    return false;
  } catch (err) {
    console.warn('Suspicious activity check failed:', err);
    return false;
  }
};

// Sync local audit logs to Supabase
export const syncAuditLogs = async (): Promise<boolean> => {
  console.log('=== SYNCING AUDIT LOGS TO SUPABASE ===');
  
  if (!supabase) {
    console.log('Supabase not available, skipping audit log sync');
    return false;
  }
  
  try {
    const auditLogs = JSON.parse(localStorage.getItem('security_audit_logs') || '[]');
    if (auditLogs.length === 0) {
      console.log('No local audit logs to sync');
      return true;
    }
    
    console.log('Syncing', auditLogs.length, 'audit logs to Supabase...');
    
    // Batch insert logs
    const { error } = await supabase
      .from('security_audit_logs')
      .insert(auditLogs.map((log: any) => ({
        user_id: log.userId,
        event_type: log.eventType,
        event_details: log.details,
        ip_address: log.ipAddress,
        user_agent: log.userAgent,
        created_at: log.timestamp
      })));
    
    if (error) {
      console.warn('Could not sync audit logs to Supabase:', error.message);
      return false;
    }
    
    // Clear local logs after successful sync
    localStorage.removeItem('security_audit_logs');
    console.log('✅ Audit logs synced successfully');
    return true;
  } catch (err) {
    console.warn('Audit log sync failed:', err);
    return false;
  }
};
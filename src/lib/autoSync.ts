// Automatic data synchronization with Supabase
// Handles background syncing without user intervention

import { supabase, pingDatabase } from './supabase';
import { syncAllDataToSupabase, checkSyncStatus } from './supabaseSync';
import { logSecurityEvent } from './securityAudit';

// Track sync status
let isSyncing = false;
let lastSyncAttempt = 0;
let lastSuccessfulSync = 0;
let syncInterval: number | null = null;
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const SYNC_RETRY_DELAY_MS = 30 * 1000; // 30 seconds after failure
const MAX_RETRY_COUNT = 5;
let retryCount = 0;

// Initialize automatic sync
export const initAutoSync = (userId: string | null) => {
  console.log('=== INITIALIZING AUTO SYNC ===');
  
  // Clear any existing interval
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  
  // If no user or no Supabase, don't set up sync
  if (!userId || !supabase) {
    console.log('Auto sync not initialized - no user or Supabase connection', { userId, supabase: !!supabase });
    return;
  }
  
  console.log('Setting up auto sync for user:', userId);
  
  // Perform initial sync
  performSync(userId);
  
  // Set up interval for regular syncing
  syncInterval = window.setInterval(() => {
    performSync(userId);
  }, SYNC_INTERVAL_MS);
  
  // Also sync on window focus
  window.addEventListener('focus', () => {
    // Only sync if it's been at least 1 minute since last attempt
    if (userId) {
      const now = Date.now();
      if (now - lastSyncAttempt > 60000) {
        performSync(userId);
      }
    }
  });
  
  // Sync before unload if possible
  window.addEventListener('beforeunload', () => {
    // Quick sync attempt before page unloads
    if (!isSyncing && userId) {
      syncAllDataToSupabase().catch((err) => {
        console.warn('Final sync attempt failed:', err);
      });
    }
  });
  
  console.log('Auto sync initialized successfully');
};

// Stop automatic sync
export const stopAutoSync = () => {
  console.log('=== STOPPING AUTO SYNC ===');
  
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('Auto sync stopped');
  }
};

// Perform sync with error handling
const performSync = async (userId: string) => {
  // Prevent concurrent syncs
  if (isSyncing) {
    console.log('Sync already in progress, skipping');
    return;
  }
  
  lastSyncAttempt = Date.now();
  
  try {
    console.log('=== AUTO SYNC STARTED ===');
    
    // First check if database is accessible
    const isDatabaseConnected = await pingDatabase();
    if (!isDatabaseConnected) {
      console.log('Database not accessible, skipping sync');
      throw new Error('Database not accessible');
    }
    
    isSyncing = true;
    
    // Check if sync is needed
    const status = await checkSyncStatus();
    
    if (!status.needsSync) {
      console.log('No sync needed, data already up to date');
      lastSuccessfulSync = Date.now();
      isSyncing = false;
      return;
    }
    
    console.log('Sync needed, performing automatic sync...');
    
    // Perform the sync
    const result = await syncAllDataToSupabase();
    
    if (result.success) {
      console.log('✅ Auto sync completed successfully');
      
      // Log successful sync
      await logSecurityEvent({
        userId,
        eventType: 'auto_sync_completed',
        details: {
          synced: result.synced,
          profilesSynced: result.details.profilesSynced,
          credentialsSynced: result.details.credentialsSynced
        }
      });
      
      lastSuccessfulSync = Date.now();
    } else {
      console.warn('⚠️ Auto sync completed with errors:', result.errors);
      
      // Log sync errors
      await logSecurityEvent({
        userId,
        eventType: 'auto_sync_error',
        details: {
          errors: result.errors.slice(0, 3), // Log first few errors
          errorCount: result.errors.length
        }
      });
      
      // Schedule a retry if we haven't exceeded max retries
      retryCount++;
      if (retryCount <= MAX_RETRY_COUNT) {
        setTimeout(() => {
          performSync(userId);
        }, SYNC_RETRY_DELAY_MS);
      } else {
        console.log('Max retry count exceeded, will try again later');
        // Reset retry count after a while
        setTimeout(() => { retryCount = 0; }, SYNC_INTERVAL_MS);
      }
    }
  } catch (error) {
    console.error('❌ Auto sync failed:', error);
    
    // Log sync failure
    await logSecurityEvent({
      userId,
      eventType: 'auto_sync_failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    // Schedule a retry if we haven't exceeded max retries
    retryCount++;
    if (retryCount <= MAX_RETRY_COUNT) {
      setTimeout(() => {
        performSync(userId);
      }, SYNC_RETRY_DELAY_MS);
    } else {
      console.log('Max retry count exceeded, will try again later');
      // Reset retry count after a while
      setTimeout(() => { retryCount = 0; }, SYNC_INTERVAL_MS);
    }
  } finally {
    isSyncing = false;
  }
};

// Force immediate sync
export const forceSync = async (userId: string): Promise<boolean> => {
  if (isSyncing) {
    console.log('Sync already in progress, cannot force sync');
    return false;
  }
  
  try {
    console.log('=== FORCE SYNC STARTED ===');
    await performSync(userId);
    return true;
  } catch (error) {
    console.error('Force sync failed:', error);
    return false;
  }
};

// Get last successful sync time
export const getLastSuccessfulSyncTime = (): Date | null => {
  return lastSuccessfulSync ? new Date(lastSuccessfulSync) : null;
};
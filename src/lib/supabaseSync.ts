// Supabase synchronization utilities for AXI ASI LAB
// Automatically syncs localStorage data to Supabase

import { supabase } from './supabase';
import { UserProfile } from '../types/shader';

interface LocalStoredUser {
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

interface SyncResult {
  success: boolean;
  synced: number;
  errors: string[];
  details: {
    profilesSynced: number;
    credentialsSynced: number;
    profilesSkipped: number;
    credentialsSkipped: number;
  };
}

// Sync all existing user profiles to Supabase
export const syncUserProfilesToSupabase = async (): Promise<SyncResult> => {
  console.log('=== SYNCING USER PROFILES TO SUPABASE ===');
  
  const result: SyncResult = {
    success: false,
    synced: 0,
    errors: [],
    details: {
      profilesSynced: 0,
      credentialsSynced: 0,
      profilesSkipped: 0,
      credentialsSkipped: 0
    }
  };

  if (!supabase) {
    result.errors.push('Supabase not configured');
    return result;
  }

  try {
    // Get all local user profiles
    const localProfiles: UserProfile[] = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
    console.log('Found', localProfiles.length, 'local user profiles');

    if (localProfiles.length === 0) {
      result.success = true;
      return result;
    }

    // Get existing Supabase profiles to avoid duplicates
    const { data: existingProfiles, error: fetchError } = await supabase
      .from('user_profiles')
      .select('user_id, email');

    if (fetchError) {
      console.error('Failed to fetch existing profiles:', fetchError);
      result.errors.push(`Failed to fetch existing profiles: ${fetchError.message}`);
      return result;
    }

    const existingUserIds = new Set(existingProfiles?.map(p => p.user_id) || []);
    const existingEmails = new Set(existingProfiles?.map(p => p.email).filter(Boolean) || []);

    console.log('Found', existingUserIds.size, 'existing profiles in Supabase');

    // Sync each profile
    for (const profile of localProfiles) {
      try {
        // Skip if already exists
        if (existingUserIds.has(profile.userId)) {
          console.log('Profile already exists in Supabase:', profile.userId);
          result.details.profilesSkipped++;
          continue;
        }

        // Skip if email already exists (to avoid conflicts)
        if (profile.email && existingEmails.has(profile.email)) {
          console.log('Email already exists in Supabase:', profile.email);
          result.details.profilesSkipped++;
          continue;
        }

        console.log('Syncing profile:', profile.userId);

        // Insert profile into Supabase
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: profile.userId,
            display_name: profile.displayName,
            axi_number: profile.axiNumber,
            registration_date: profile.registrationDate,
            auth_type: profile.authType,
            total_axioms: profile.totalAxioms || 0,
            total_likes: profile.totalLikes || 0,
            total_views: profile.totalViews || 0,
            is_active: profile.isActive !== false,
            email: profile.email || null,
            created_at: profile.createdAt,
            updated_at: profile.updatedAt
          });

        if (insertError) {
          console.error('Failed to sync profile:', profile.userId, insertError);
          result.errors.push(`Profile ${profile.userId}: ${insertError.message}`);
        } else {
          console.log('✅ Synced profile:', profile.userId);
          result.details.profilesSynced++;
          result.synced++;
          
          // Add to existing sets to avoid conflicts in subsequent iterations
          existingUserIds.add(profile.userId);
          if (profile.email) {
            existingEmails.add(profile.email);
          }
        }

      } catch (error) {
        console.error('Error syncing profile:', profile.userId, error);
        result.errors.push(`Profile ${profile.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    result.success = result.errors.length === 0;
    console.log('Profile sync complete:', result);
    return result;

  } catch (error) {
    console.error('Profile sync failed:', error);
    result.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
};

// Sync all existing user credentials to Supabase
export const syncUserCredentialsToSupabase = async (): Promise<SyncResult> => {
  console.log('=== SYNCING USER CREDENTIALS TO SUPABASE ===');
  
  const result: SyncResult = {
    success: false,
    synced: 0,
    errors: [],
    details: {
      profilesSynced: 0,
      credentialsSynced: 0,
      profilesSkipped: 0,
      credentialsSkipped: 0
    }
  };

  if (!supabase) {
    result.errors.push('Supabase not configured');
    return result;
  }

  try {
    // Get all local user credentials
    const localCredentials: LocalStoredUser[] = JSON.parse(localStorage.getItem('userCredentials') || '[]');
    // Get all local user profiles to match AXI numbers
    const localProfiles: UserProfile[] = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
    console.log('Found', localCredentials.length, 'local user credentials');
    console.log('Found', localProfiles.length, 'local user profiles for AXI number matching');

    if (localCredentials.length === 0) {
      result.success = true;
      return result;
    }

    // Get existing Supabase credentials to avoid duplicates
    const { data: existingCredentials, error: fetchError } = await supabase
      .from('user_credentials')
      .select('user_id, email');

    if (fetchError) {
      console.error('Failed to fetch existing credentials:', fetchError);
      result.errors.push(`Failed to fetch existing credentials: ${fetchError.message}`);
      return result;
    }

    const existingUserIds = new Set(existingCredentials?.map(c => c.user_id) || []);
    const existingEmails = new Set(existingCredentials?.map(c => c.email) || []);

    console.log('Found', existingUserIds.size, 'existing credentials in Supabase');

    // Sync each credential
    for (const credential of localCredentials) {
      try {
        // Skip if already exists
        if (existingUserIds.has(credential.username)) {
          console.log('Credentials already exist in Supabase:', credential.username);
          result.details.credentialsSkipped++;
          continue;
        }

        // Skip if email already exists (to avoid conflicts)
        if (existingEmails.has(credential.email)) {
          console.log('Email credentials already exist in Supabase:', credential.email);
          result.details.credentialsSkipped++;
          continue;
        }

        // Find matching profile to get AXI number
        const matchingProfile = localProfiles.find(p => 
          p.userId === credential.username || 
          (p.email && p.email.toLowerCase() === credential.email.toLowerCase())
        );
        
        const axiNumber = matchingProfile?.axiNumber || null;
        console.log('Syncing credentials with AXI number:', credential.username, 'AXI #' + axiNumber);
        console.log('Syncing credentials:', credential.username);

        // Insert credentials into Supabase
        const { error: insertError } = await supabase
          .from('user_credentials')
          .insert({
            user_id: credential.username,
            email: credential.email,
            password_hash: credential.passwordHash,
            salt: credential.salt,
            axi_number: axiNumber,
            created_at: credential.createdAt,
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Failed to sync credentials:', credential.username, insertError);
          result.errors.push(`Credentials ${credential.username}: ${insertError.message}`);
        } else {
          console.log('✅ Synced credentials with AXI number:', credential.username, 'AXI #' + axiNumber);
          result.details.credentialsSynced++;
          result.synced++;
          
          // Add to existing sets to avoid conflicts in subsequent iterations
          existingUserIds.add(credential.username);
          existingEmails.add(credential.email);
        }

      } catch (error) {
        console.error('Error syncing credentials:', credential.username, error);
        result.errors.push(`Credentials ${credential.username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    result.success = result.errors.length === 0;
    console.log('Credentials sync complete:', result);
    return result;

  } catch (error) {
    console.error('Credentials sync failed:', error);
    result.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
};

// Sync profile settings (emails) to user profiles
export const syncProfileSettingsToSupabase = async (): Promise<SyncResult> => {
  console.log('=== SYNCING PROFILE SETTINGS TO SUPABASE ===');
  
  const result: SyncResult = {
    success: false,
    synced: 0,
    errors: [],
    details: {
      profilesSynced: 0,
      credentialsSynced: 0,
      profilesSkipped: 0,
      credentialsSkipped: 0
    }
  };

  if (!supabase) {
    result.errors.push('Supabase not configured');
    return result;
  }

  try {
    // Get all local user profiles
    const localProfiles: UserProfile[] = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
    console.log('Found', localProfiles.length, 'local user profiles to check for email updates');

    let updatedCount = 0;

    // Check each profile for stored email settings
    for (const profile of localProfiles) {
      try {
        const profileSettings = localStorage.getItem(`profile_settings_${profile.userId}`);
        
        if (profileSettings) {
          const settings = JSON.parse(profileSettings);
          
          if (settings.email && !profile.email) {
            console.log('Updating profile with email from settings:', profile.userId, settings.email);
            
            // Update the profile in Supabase
            const { error: updateError } = await supabase
              .from('user_profiles')
              .update({ 
                email: settings.email,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', profile.userId);

            if (updateError) {
              console.error('Failed to update profile email:', profile.userId, updateError);
              result.errors.push(`Profile email update ${profile.userId}: ${updateError.message}`);
            } else {
              console.log('✅ Updated profile email:', profile.userId);
              updatedCount++;
              
              // Also update the local profile
              profile.email = settings.email;
            }
          }
        }
      } catch (error) {
        console.error('Error processing profile settings:', profile.userId, error);
        result.errors.push(`Profile settings ${profile.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Update localStorage with the updated profiles
    if (updatedCount > 0) {
      localStorage.setItem('allUserProfiles', JSON.stringify(localProfiles));
      console.log('Updated', updatedCount, 'local profiles with email data');
    }

    result.synced = updatedCount;
    result.details.profilesSynced = updatedCount;
    result.success = result.errors.length === 0;
    
    console.log('Profile settings sync complete:', result);
    return result;

  } catch (error) {
    console.error('Profile settings sync failed:', error);
    result.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
};

// Complete sync of all data to Supabase
export const syncAllDataToSupabase = async (): Promise<SyncResult> => {
  console.log('=== STARTING COMPLETE DATA SYNC TO SUPABASE ===');
  
  const combinedResult: SyncResult = {
    success: false,
    synced: 0,
    errors: [],
    details: {
      profilesSynced: 0,
      credentialsSynced: 0,
      profilesSkipped: 0,
      credentialsSkipped: 0
    }
  };

  try {
    // Step 1: Sync profile settings first (to get emails into profiles)
    console.log('Step 1: Syncing profile settings...');
    const settingsResult = await syncProfileSettingsToSupabase();
    combinedResult.errors.push(...settingsResult.errors);
    
    // Step 2: Sync user profiles
    console.log('Step 2: Syncing user profiles...');
    const profilesResult = await syncUserProfilesToSupabase();
    combinedResult.details.profilesSynced = profilesResult.details.profilesSynced;
    combinedResult.details.profilesSkipped = profilesResult.details.profilesSkipped;
    combinedResult.errors.push(...profilesResult.errors);
    
    // Step 3: Sync user credentials
    console.log('Step 3: Syncing user credentials...');
    const credentialsResult = await syncUserCredentialsToSupabase();
    combinedResult.details.credentialsSynced = credentialsResult.details.credentialsSynced;
    combinedResult.details.credentialsSkipped = credentialsResult.details.credentialsSkipped;
    combinedResult.errors.push(...credentialsResult.errors);
    
    // Calculate totals
    combinedResult.synced = 
      settingsResult.synced + 
      profilesResult.synced + 
      credentialsResult.synced;
    
    combinedResult.success = combinedResult.errors.length === 0;
    
    console.log('=== COMPLETE SYNC FINISHED ===');
    console.log('Total synced:', combinedResult.synced);
    console.log('Profiles synced:', combinedResult.details.profilesSynced);
    console.log('Credentials synced:', combinedResult.details.credentialsSynced);
    console.log('Profiles skipped:', combinedResult.details.profilesSkipped);
    console.log('Credentials skipped:', combinedResult.details.credentialsSkipped);
    console.log('Errors:', combinedResult.errors.length);
    
    return combinedResult;

  } catch (error) {
    console.error('Complete sync failed:', error);
    combinedResult.errors.push(`Complete sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return combinedResult;
  }
};

// Check sync status
export const checkSyncStatus = async (): Promise<{
  localProfiles: number;
  localCredentials: number;
  supabaseProfiles: number;
  supabaseCredentials: number;
  needsSync: boolean;
  lastSyncTime?: Date;
}> => {
  const localProfiles = JSON.parse(localStorage.getItem('allUserProfiles') || '[]').length;
  const localCredentials = JSON.parse(localStorage.getItem('userCredentials') || '[]').length;
  
  let supabaseProfiles = 0;
  let supabaseCredentials = 0;
  
  if (supabase) {
    try {
      const { count: profileCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      
      const { count: credentialCount } = await supabase
        .from('user_credentials')
        .select('*', { count: 'exact', head: true });
      
      supabaseProfiles = profileCount || 0;
      supabaseCredentials = credentialCount || 0;
    } catch (error) {
      console.error('Failed to check Supabase counts:', error);
    }
  }
  
  const needsSync = localProfiles > supabaseProfiles || localCredentials > supabaseCredentials;
  
  // Get last sync time
  const lastSyncTimeStr = localStorage.getItem('last_sync_time');
  const lastSyncTime = lastSyncTimeStr ? new Date(lastSyncTimeStr) : undefined;
  
  return {
    localProfiles,
    localCredentials,
    supabaseProfiles,
    supabaseCredentials,
    needsSync,
    lastSyncTime
  };
};

// Update last sync time
export const updateLastSyncTime = () => {
  const now = new Date();
  localStorage.setItem('last_sync_time', now.toISOString());
  return now;
};
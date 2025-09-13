import { useState, useEffect } from 'react';
import { supabase, Database } from '../lib/supabase';
import { UserProfile } from '../types/shader';
import { useLocalStorage } from './useLocalStorage'; 
import { logSecurityEvent } from '../lib/securityAudit';
import { initAutoSync } from '../lib/autoSync';

type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];

export function useUserProfile() {
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile | null>('userProfile', null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert database row to UserProfile type
  const dbToUserProfile = (row: UserProfileRow): UserProfile => ({
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    axiNumber: row.axi_number,
    registrationDate: row.registration_date,
    authType: row.auth_type,
    email: row.email || undefined,
    emailVerified: row.email_verified || false,
    totalAxioms: row.total_axioms,
    totalLikes: row.total_likes,
    totalViews: row.total_views,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });

  // Check if username is available (for web2 users)
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    if (!supabase) {
      console.warn('Supabase not configured - using local storage fallback');
      const existingProfiles = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
      return !existingProfiles.some((profile: UserProfile) => 
        profile.userId === username && profile.authType === 'web2'
      );
    }

    try {
      console.log('Checking username availability for:', username);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', username)
        .eq('auth_type', 'web2')
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors

      if (error) {
        console.error('Error checking username:', error);
        // If there's an error, assume username is available to allow fallback
        return true;
      }

      // If data is null, username is available
      const isAvailable = data === null;
      console.log('Username availability check result:', { username, isAvailable, data });
      return isAvailable;
    } catch (err) {
      console.error('Error checking username availability:', err);
      // On error, assume available to allow fallback
      return true;
    }
  };

  // Register or get existing user profile
  const registerUser = async (
    userId: string, 
    displayName: string, 
    authType: 'wallet' | 'web2',
    email?: string
  ): Promise<UserProfile | null> => {
    setIsLoading(true);
    setError(null);

    console.log('=== USER REGISTRATION ATTEMPT ===');
    console.log('User ID:', userId);
    console.log('Display Name:', displayName);
    console.log('Auth Type:', authType);
    console.log('Supabase Available:', !!supabase);

    if (!supabase) {
      console.warn('Supabase not configured, using local storage fallback');
      
      const existingProfiles = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
      const existingProfile = existingProfiles.find((p: UserProfile) => p.userId === userId);
      
      if (existingProfile) {
        console.log('Found existing local profile:', existingProfile);
        setUserProfile(existingProfile);
        setIsLoading(false);
        return existingProfile;
      }

      // Create new profile
      const mockProfile: UserProfile = {
        id: Date.now().toString(),
        userId,
        displayName,
        axiNumber: existingProfiles.length + 1,
        registrationDate: new Date().toISOString(),
        authType,
        email: email,
        totalAxioms: 0,
        totalLikes: 0,
        totalViews: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to local storage
      existingProfiles.push(mockProfile);
      localStorage.setItem('allUserProfiles', JSON.stringify(existingProfiles));
      setUserProfile(mockProfile);
      setIsLoading(false);

      console.log('Created local profile:', mockProfile);
      return mockProfile;
    }
    
    try {
      console.log('Attempting Supabase registration...');
      
      // First check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing user:', checkError);
        throw checkError;
      } 

      if (existingUser) {
        console.log('User already exists:', existingUser);
        const profile = dbToUserProfile(existingUser);
        setUserProfile(profile);
        setIsLoading(false);
        return profile;
      } 

      // User doesn't exist, create new one
      console.log('Creating new user profile...');
      const { data: newUser, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          display_name: displayName,
          auth_type: authType,
          email: email || null
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('Error creating user:', insertError);
        throw insertError;
      }

      console.log('Successfully created user:', newUser);
      const profile = dbToUserProfile(newUser);
      setUserProfile(profile);
      
      // Initialize auto sync for the new user
      initAutoSync(profile.userId);

      // Show welcome message for new users
      setTimeout(() => {
        alert(`🎉 Welcome to AXI AGI LAB!\n\nYou are user #${profile.axiNumber}\nRegistered: ${new Date(profile.registrationDate).toLocaleDateString()}\n\nStart creating amazing AXIOMs!`);
        
        // Log registration event
        logSecurityEvent({
          userId: userId,
          eventType: 'account_created',
          details: {
            displayName,
            authType,
            axiNumber: profile.axiNumber
          }
        });
      }, 1000);

      return profile; 
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to register user');
      
      // Fallback to local storage on error
      console.log('Falling back to local storage...');
      const existingProfiles = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
      const existingProfile = existingProfiles.find((p: UserProfile) => p.userId === userId);
      
      if (existingProfile) {
        setUserProfile(existingProfile);
        return existingProfile;
      }

      const fallbackProfile: UserProfile = {
        id: Date.now().toString(),
        userId,
        displayName,
        axiNumber: existingProfiles.length + 1,
        registrationDate: new Date().toISOString(),
        authType,
        email: email,
        totalAxioms: 0,
        totalLikes: 0,
        totalViews: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      existingProfiles.push(fallbackProfile);
      localStorage.setItem('allUserProfiles', JSON.stringify(existingProfiles));
      setUserProfile(fallbackProfile);
      
      console.log('Created fallback profile:', fallbackProfile);
      return fallbackProfile;
    } finally {
      setIsLoading(false);
    }
  };

  // Load user profile by ID
  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    setIsLoading(true);
    setError(null);

    console.log('=== LOADING USER PROFILE ===');
    console.log('User ID:', userId);
    console.log('Supabase Available:', !!supabase);
     
    // Normalize user ID for consistent comparison
    const normalizedUserId = userId.trim();
    console.log('Normalized User ID:', normalizedUserId);

    if (!supabase) {
      console.warn('Supabase not configured - using local storage');
      const existingProfiles = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
      const profile = existingProfiles.find((p: UserProfile) => 
        p.userId.toLowerCase() === normalizedUserId.toLowerCase()
      );
      if (profile) {
        console.log('Found local profile:', profile);
        setUserProfile(profile);
      } else {
        console.log('No local profile found for:', userId);
      }
      setIsLoading(false);
      return profile || null;
    } 

    try {
      console.log('Attempting to fetch user profile from Supabase...');
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', normalizedUserId)
        .single()
        .abortSignal(controller.signal);
        
      clearTimeout(timeoutId);

      if (error) {
        console.error('Error loading user profile:', error);
        // Don't throw on Supabase errors, fall back to local storage
        console.log('Supabase error, falling back to local storage...');
        const existingProfiles = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
        const profile = existingProfiles.find((p: UserProfile) => 
          p.userId.toLowerCase() === normalizedUserId.toLowerCase()
        );
        if (profile) {
          console.log('Found local fallback profile:', profile);
          setUserProfile(profile);
          setIsLoading(false);
          return profile;
        }
        setIsLoading(false);
        return null;
      }

      if (!data) {
        console.log('User profile not found in database:', userId);
        // Check local storage as fallback
        const existingProfiles = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
        const profile = existingProfiles.find((p: UserProfile) => 
          p.userId.toLowerCase() === normalizedUserId.toLowerCase()
        );
        if (profile) {
          console.log('Found local fallback profile:', profile);
          setUserProfile(profile);
          setIsLoading(false);
          return profile;
        }
        setIsLoading(false);
        return null;
      }
      
      console.log('Loaded user profile from database:', data);
      const profile = dbToUserProfile(data);
      setUserProfile(profile);
      return profile;
    } catch (err) {
      console.error('Error loading user profile:', err);
      
      // Check if this is a network error (Failed to fetch)
      const isNetworkError = err instanceof TypeError && err.message.includes('Failed to fetch');
      
      if (isNetworkError) {
        console.log('Network error detected, falling back to local storage...');
        // Don't set error state for network issues, just fall back silently
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load user profile');
      }
      
      // Fallback to local storage
      console.log('Attempting local storage fallback...');
      const existingProfiles = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
      const profile = existingProfiles.find((p: UserProfile) => 
        p.userId.toLowerCase() === normalizedUserId.toLowerCase()
      );
      if (profile) {
        console.log('Successfully loaded profile from local storage:', profile);
        setUserProfile(profile);
        setIsLoading(false);
        return profile;
      }
      
      console.log('No profile found in local storage either');
      setIsLoading(false);
      return null;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    console.log('=== UPDATING USER PROFILE ===');
    console.log('Updates:', updates);
    console.log('Current user profile:', userProfile);
    
    if (!supabase || !userProfile) {
      console.warn('Cannot update profile - Supabase not configured or no user profile');
      
      // Update local storage
      if (userProfile) {
        const updatedProfile = { 
          ...userProfile, 
          ...updates,
          updatedAt: new Date().toISOString()
        };
        console.log('Updating local profile:', updatedProfile);
        setUserProfile(updatedProfile);
        
        const existingProfiles = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
        const updatedProfiles = existingProfiles.map((p: UserProfile) => 
          p.userId === userProfile.userId ? updatedProfile : p
        );
        localStorage.setItem('allUserProfiles', JSON.stringify(updatedProfiles));
        console.log('✅ Local profile updated successfully');
        return true;
      }
      
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Updating user profile:', updates);
      
      const { error } = await supabase
        .from('user_profiles') 
        .update({
          display_name: updates.displayName || userProfile.displayName,
          email: updates.email || userProfile.email,
          email_verified: updates.emailVerified !== undefined ? updates.emailVerified : userProfile.emailVerified,
          // Note: bio field doesn't exist in database yet, but we'll store it locally
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userProfile.userId); 

      if (error) {
        console.error('Error updating profile:', error);
        // Don't throw error, fall back to local storage
        console.log('Supabase update failed, updating locally...');
        const updatedProfile = { 
          ...userProfile, 
          ...updates,
          updatedAt: new Date().toISOString()
        };
        setUserProfile(updatedProfile);
        
        const existingProfiles = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
        const updatedProfiles = existingProfiles.map((p: UserProfile) => 
          p.userId === userProfile.userId ? updatedProfile : p
        );
        localStorage.setItem('allUserProfiles', JSON.stringify(updatedProfiles));
        console.log('✅ Local fallback profile updated successfully');
        return true;
      }

      // Update local state
      const updatedProfile = userProfile ? { 
        ...userProfile, 
        ...updates,
        emailVerified: updates.emailVerified !== undefined ? updates.emailVerified : userProfile?.emailVerified,
        updatedAt: new Date().toISOString()
      } : null;
      setUserProfile(updatedProfile);
      
      // Also update local storage as backup
      if (updatedProfile) {
        const existingProfiles = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
        const updatedProfiles = existingProfiles.map((p: UserProfile) => 
          p.userId === userProfile.userId ? updatedProfile : p
        );
        localStorage.setItem('allUserProfiles', JSON.stringify(updatedProfiles));
      }
      
      // Log profile update
      if (userProfile) {
        logSecurityEvent({
          userId: userProfile.userId,
          eventType: 'profile_updated',
          details: updates
        });
      }
      
      console.log('Profile updated successfully');
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      
      // Fall back to local storage on any error
      console.log('Error occurred, falling back to local storage...');
      if (userProfile) {
        const updatedProfile = { 
          ...userProfile, 
          ...updates,
          updatedAt: new Date().toISOString()
        };
        setUserProfile(updatedProfile);
        
        const existingProfiles = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
        const updatedProfiles = existingProfiles.map((p: UserProfile) => 
          p.userId === userProfile.userId ? updatedProfile : p
        );
        localStorage.setItem('allUserProfiles', JSON.stringify(updatedProfiles));
        console.log('✅ Fallback profile updated successfully');
        return true;
      }
      
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Test database connection
  const testDatabaseConnection = async (): Promise<boolean> => {
    if (!supabase) {
      console.warn('Supabase not configured');
      return false;
    }

    try {
      console.log('Testing database connection...');
      const { data, error } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Database connection test failed:', error);
        return false;
      }

      console.log('Database connection successful');
      return true;
    } catch (err) {
      console.error('Database connection error:', err);
      return false;
    }
  };

  // Get top users by AXI number (earliest registrations)
  const getTopUsersByRegistration = async (limit: number = 10): Promise<UserProfile[]> => {
    if (!supabase) {
      const existingProfiles = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
      return existingProfiles
        .sort((a: UserProfile, b: UserProfile) => a.axiNumber - b.axiNumber)
        .slice(0, limit);
    }

    try {
      console.log('Fetching top users by registration...');
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('is_active', true)
        .order('axi_number', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching top users:', error);
        throw error;
      }

      console.log('Fetched top users:', data);
      return data.map(dbToUserProfile);
    } catch (err) {
      console.error('Failed to load top users:', err);
      return [];
    }
  };

  // Get user leaderboard by activity
  const getUserLeaderboard = async (limit: number = 10): Promise<UserProfile[]> => {
    console.log('=== GETTING USER LEADERBOARD ===');
    console.log('Limit:', limit);
    console.log('Supabase Available:', !!supabase, 'Using SendGrid API Key:', !!import.meta.env.VITE_EMAIL_API_KEY);
    
    if (!supabase) {
      console.log('Using local storage fallback for leaderboard');
      const existingProfiles = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
      return existingProfiles
        .sort((a: UserProfile, b: UserProfile) => 
          (b.totalLikes + b.totalAxioms * 5) - (a.totalLikes + a.totalAxioms * 5)
        )
        .slice(0, limit);
    }

    try {
      console.log('Fetching user leaderboard...');
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, display_name, axi_number, registration_date, auth_type, total_axioms, total_likes, total_views')
        .eq('is_active', true)
        .order('total_likes', { ascending: false })
        .order('total_axioms', { ascending: false })
        .limit(limit)
        .abortSignal(controller.signal);
        
      clearTimeout(timeoutId);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        console.log('Supabase error, falling back to local storage...');
        const existingProfiles = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
        return existingProfiles
          .sort((a: UserProfile, b: UserProfile) => 
            (b.totalLikes + b.totalAxioms * 5) - (a.totalLikes + a.totalAxioms * 5)
          )
          .slice(0, limit);
      }

      console.log('Fetched leaderboard:', data);
      return data.map(dbToUserProfile);
    } catch (err) {
      console.error('Failed to load user leaderboard:', err);
      console.log('Network error, falling back to local storage...');
            
      // Fallback to local storage on any error
      const existingProfiles = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
      return existingProfiles
        .sort((a: UserProfile, b: UserProfile) => 
          (b.totalLikes + b.totalAxioms * 5) - (a.totalLikes + a.totalAxioms * 5)
        )
        .slice(0, limit);
    }
  };

  // Find user by email (for password reset)
  const findUserByEmail = async (email: string): Promise<UserProfile | null> => {
    console.log('=== FINDING USER BY EMAIL ===');
    console.log('Email:', email);
    
    if (!supabase) {
      console.log('Using local storage fallback for email lookup');
      const existingProfiles = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
      const profile = existingProfiles.find((p: UserProfile) => 
        p.email === email && p.authType === 'web2'
      );
      return profile || null;
    }

    try {
      console.log('Searching Supabase for user with email:', email);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*') 
        .eq('email', email)
        .eq('auth_type', 'web2')
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error finding user by email:', error);
        // Fall back to local storage
        const existingProfiles = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
        const profile = existingProfiles.find((p: UserProfile) => 
          p.email === email && p.authType === 'web2'
        );
        return profile || null;
      }

      if (data) {
        console.log('Found user by email:', data);
        return dbToUserProfile(data);
      }

      console.log('No user found with email:', email);
      return null;
    } catch (err) {
      console.error('Error finding user by email:', err);
      // Fall back to local storage
      const existingProfiles = JSON.parse(localStorage.getItem('allUserProfiles') || '[]');
      const profile = existingProfiles.find((p: UserProfile) => 
        p.email === email && p.authType === 'web2'
      );
      return profile || null;
    }
  };

  // Clear user profile (logout)
  const clearUserProfile = () => {
    console.log('Clearing user profile');
    setUserProfile(null);
  };

  return {
    userProfile,
    isLoading,
    error,
    checkUsernameAvailability,
    registerUser,
    loadUserProfile,
    updateUserProfile,
    findUserByEmail,
    testDatabaseConnection,
    getTopUsersByRegistration,
    getUserLeaderboard,
    clearUserProfile
  };
}
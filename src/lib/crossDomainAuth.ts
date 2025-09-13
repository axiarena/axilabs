// Cross-domain authentication utilities for AXI ASI LAB
// Enables user profiles to work across axiasi.com and chess.axiasi.com

interface CrossDomainUserData {
  currentUser: string | null;
  userAuthType: 'web2' | 'wallet' | null;
  userProfile: any;
  sessionToken: string | null;
}

// Set data that works across all axiasi.com subdomains
export const setCrossDomainData = (key: string, data: any): void => {
  try {
    // Store in localStorage (for same domain)
    localStorage.setItem(key, JSON.stringify(data));
    
    // Store in cookie with domain=.axiasi.com (for all subdomains)
    const cookieValue = encodeURIComponent(JSON.stringify(data));
    document.cookie = `${key}=${cookieValue}; domain=.axiasi.com; path=/; max-age=604800; secure; samesite=lax`;
    
    console.log(`✅ Cross-domain data set for key: ${key}`);
  } catch (error) {
    console.error('Error setting cross-domain data:', error);
  }
};

// Get data that works across all axiasi.com subdomains
export const getCrossDomainData = (key: string): any => {
  try {
    // First try localStorage
    const localData = localStorage.getItem(key);
    if (localData) {
      return JSON.parse(localData);
    }
    
    // Fallback to cookie
    const cookies = document.cookie.split(';');
    const cookie = cookies.find(c => c.trim().startsWith(`${key}=`));
    
    if (cookie) {
      const cookieValue = cookie.split('=')[1];
      const decodedValue = decodeURIComponent(cookieValue);
      const data = JSON.parse(decodedValue);
      
      // Sync back to localStorage
      localStorage.setItem(key, JSON.stringify(data));
      
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting cross-domain data:', error);
    return null;
  }
};

// Remove data from both localStorage and cookies
export const removeCrossDomainData = (key: string): void => {
  try {
    // Remove from localStorage
    localStorage.removeItem(key);
    
    // Remove from cookie
    document.cookie = `${key}=; domain=.axiasi.com; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    
    console.log(`✅ Cross-domain data removed for key: ${key}`);
  } catch (error) {
    console.error('Error removing cross-domain data:', error);
  }
};

// Sync user authentication across subdomains
export const syncUserAuth = (userData: CrossDomainUserData): void => {
  setCrossDomainData('crossDomain_currentUser', userData.currentUser);
  setCrossDomainData('crossDomain_userAuthType', userData.userAuthType);
  setCrossDomainData('crossDomain_userProfile', userData.userProfile);
  setCrossDomainData('crossDomain_sessionToken', userData.sessionToken);
  
  console.log('✅ User auth synced across all axiasi.com subdomains');
};

// Get user authentication from any subdomain
export const getCrossUserAuth = (): CrossDomainUserData => {
  return {
    currentUser: getCrossDomainData('crossDomain_currentUser'),
    userAuthType: getCrossDomainData('crossDomain_userAuthType'),
    userProfile: getCrossDomainData('crossDomain_userProfile'),
    sessionToken: getCrossDomainData('crossDomain_sessionToken')
  };
};

// Clear user authentication across all subdomains
export const clearCrossUserAuth = (): void => {
  removeCrossDomainData('crossDomain_currentUser');
  removeCrossDomainData('crossDomain_userAuthType');
  removeCrossDomainData('crossDomain_userProfile');
  removeCrossDomainData('crossDomain_sessionToken');
  
  console.log('✅ User auth cleared across all axiasi.com subdomains');
};

// Initialize cross-domain auth on page load
export const initCrossDomainAuth = (): CrossDomainUserData | null => {
  console.log('=== INITIALIZING CROSS-DOMAIN AUTH ===');
  
  // Check if we have cross-domain data
  const crossData = getCrossUserAuth();
  
  if (crossData.currentUser) {
    console.log('✅ Found cross-domain user data:', crossData.currentUser);
    
    // Sync to local storage if not already there
    if (!localStorage.getItem('currentUser')) {
      localStorage.setItem('currentUser', JSON.stringify(crossData.currentUser));
    }
    if (!localStorage.getItem('userAuthType')) {
      localStorage.setItem('userAuthType', JSON.stringify(crossData.userAuthType));
    }
    if (!localStorage.getItem('userProfile')) {
      localStorage.setItem('userProfile', JSON.stringify(crossData.userProfile));
    }
    
    return crossData;
  }
  
  console.log('No cross-domain user data found');
  return null;
};
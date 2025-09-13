import { useState, useEffect } from 'react';
import { Shader, CreatorStats, GlobalStats } from '../types/shader';

// Simulated global data storage (in production, this would be a real backend)
const GLOBAL_STORAGE_KEY = 'axilab_global_data';

interface GlobalData {
  publicShaders: Shader[];
  globalCounter: number;
  creatorStats: Record<string, CreatorStats>;
  globalStats: GlobalStats;
  shaderOfTheWeek: string | null; // shader ID
  lastSync: number;
}

const defaultGlobalData: GlobalData = {
  publicShaders: [],
  globalCounter: 0,
  creatorStats: {},
  globalStats: {
    totalShaders: 0,
    totalCreators: 0,
    totalLikes: 0,
    totalViews: 0,
    engineFees: 0,
    axiTokenBuybacks: 0
  },
  shaderOfTheWeek: null,
  lastSync: Date.now()
};

export function useGlobalData() {
  const [globalData, setGlobalData] = useState<GlobalData>(() => {
    try {
      const stored = localStorage.getItem(GLOBAL_STORAGE_KEY);
      const data = stored ? JSON.parse(stored) : defaultGlobalData;
      console.log('=== GLOBAL DATA INITIALIZED ===');
      console.log('Public Shaders:', data.publicShaders.length);
      console.log('Creator Stats:', Object.keys(data.creatorStats).length);
      return data;
    } catch {
      console.log('Using default global data');
      return defaultGlobalData;
    }
  });

  const saveGlobalData = (data: GlobalData) => {
    const updatedData = { ...data, lastSync: Date.now() };
    console.log('=== SAVING GLOBAL DATA ===');
    console.log('Public Shaders:', updatedData.publicShaders.length);
    console.log('Creator Stats:', Object.keys(updatedData.creatorStats).length);
    console.log('Global Stats:', updatedData.globalStats);
    
    setGlobalData(updatedData);
    localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(updatedData));
    
    // Broadcast changes to other tabs and browsers
    window.dispatchEvent(new CustomEvent('globalDataUpdate', { detail: updatedData }));
    
    // Also save to a shared storage key that can be accessed across browsers
    // In a real app, this would be a database call
    try {
      localStorage.setItem('axilab_shared_global', JSON.stringify(updatedData));
    } catch (error) {
      console.warn('Could not save to shared storage:', error);
    }
  };

  // Listen for updates from other tabs and sync with shared storage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === GLOBAL_STORAGE_KEY || e.key === 'axilab_shared_global') && e.newValue) {
        try {
          const newData = JSON.parse(e.newValue);
          if (newData.lastSync > globalData.lastSync) {
            console.log('=== SYNCING FROM STORAGE ===');
            console.log('New data timestamp:', newData.lastSync);
            console.log('Current timestamp:', globalData.lastSync);
            setGlobalData(newData);
          }
        } catch (error) {
          console.error('Error parsing global data:', error);
        }
      }
    };

    const handleGlobalDataUpdate = (e: CustomEvent) => {
      console.log('=== RECEIVED GLOBAL DATA UPDATE ===');
      setGlobalData(e.detail);
    };

    // Sync with shared storage on load
    const syncWithSharedStorage = () => {
      try {
        const sharedData = localStorage.getItem('axilab_shared_global');
        if (sharedData) {
          const parsedData = JSON.parse(sharedData);
          if (parsedData.lastSync > globalData.lastSync) {
            console.log('=== SYNCING WITH SHARED STORAGE ===');
            setGlobalData(parsedData);
          }
        }
      } catch (error) {
        console.warn('Could not sync with shared storage:', error);
      }
    };

    // Initial sync
    syncWithSharedStorage();

    // Set up periodic sync every 5 seconds
    const syncInterval = setInterval(syncWithSharedStorage, 5000);

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('globalDataUpdate', handleGlobalDataUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('globalDataUpdate', handleGlobalDataUpdate as EventListener);
      clearInterval(syncInterval);
    };
  }, [globalData.lastSync]);

  const addPublicShader = (shader: Shader) => {
    console.log('=== ADDING PUBLIC SHADER ===');
    console.log('Shader:', shader);
    
    const newData = { ...globalData };
    const nextNumber = newData.globalCounter + 1;
    
    const newShader = {
      ...shader,
      shaderNumber: nextNumber,
      likes: 0,
      views: 0
    };

    console.log('Assigned shader number:', nextNumber);

    newData.publicShaders.push(newShader);
    newData.globalCounter = nextNumber;
    
    // Update creator stats
    const creatorAddress = shader.author || 'anonymous';
    console.log('Updating stats for creator:', creatorAddress);
    
    if (!newData.creatorStats[creatorAddress]) {
      newData.creatorStats[creatorAddress] = {
        address: creatorAddress,
        totalShaders: 0,
        totalLikes: 0,
        totalViews: 0,
        featuredCount: 0,
        rank: 0
      };
      console.log('Created new creator stats for:', creatorAddress);
    }
    newData.creatorStats[creatorAddress].totalShaders++;
    
    // Update global stats
    newData.globalStats.totalShaders++;
    if (Object.keys(newData.creatorStats).length > newData.globalStats.totalCreators) {
      newData.globalStats.totalCreators = Object.keys(newData.creatorStats).length;
    }

    // Auto-set as AXIOM of the week based on highest score
    // For now, the most recent one becomes featured if no current featured exists
    if (!newData.shaderOfTheWeek || newData.publicShaders.length === 1) {
      console.log('Setting as AXIOM of the week');
      
      // Remove featured flag from previous shader
      if (newData.shaderOfTheWeek) {
        const prevShader = newData.publicShaders.find(s => s.id === newData.shaderOfTheWeek);
        if (prevShader) {
          prevShader.featured = false;
          const prevCreatorAddress = prevShader.author || 'anonymous';
          if (newData.creatorStats[prevCreatorAddress]) {
            newData.creatorStats[prevCreatorAddress].featuredCount--;
          }
        }
      }
      
      newShader.featured = true;
      newData.shaderOfTheWeek = newShader.id;
      newData.creatorStats[creatorAddress].featuredCount++;
    }

    // Recalculate ranks
    updateCreatorRanks(newData);
    
    console.log('Final creator stats:', newData.creatorStats);
    console.log('Final global stats:', newData.globalStats);
    
    saveGlobalData(newData);
    return newShader;
  };

  const deletePublicShader = (shaderId: string) => {
    console.log('=== DELETING PUBLIC SHADER ===');
    console.log('Shader ID:', shaderId);
    
    const newData = { ...globalData };
    const shaderIndex = newData.publicShaders.findIndex(s => s.id === shaderId);
    
    if (shaderIndex !== -1) {
      const shader = newData.publicShaders[shaderIndex];
      const creatorAddress = shader.author || 'anonymous';
      
      console.log('Found shader to delete:', shader);
      console.log('Creator:', creatorAddress);
      
      // Update creator stats
      if (newData.creatorStats[creatorAddress]) {
        newData.creatorStats[creatorAddress].totalShaders--;
        newData.creatorStats[creatorAddress].totalLikes -= shader.likes || 0;
        newData.creatorStats[creatorAddress].totalViews -= shader.views || 0;
        
        if (shader.featured) {
          newData.creatorStats[creatorAddress].featuredCount--;
        }
        
        if (newData.creatorStats[creatorAddress].totalShaders === 0) {
          console.log('Removing creator stats (no more shaders)');
          delete newData.creatorStats[creatorAddress];
        }
      }
      
      // Update global stats
      newData.globalStats.totalShaders--;
      newData.globalStats.totalLikes -= shader.likes || 0;
      newData.globalStats.totalViews -= shader.views || 0;
      newData.globalStats.totalCreators = Object.keys(newData.creatorStats).length;
      
      newData.publicShaders.splice(shaderIndex, 1);
      
      // If this was AXIOM of the week, set the highest scoring one as featured
      if (newData.shaderOfTheWeek === shaderId) {
        console.log('Deleted shader was AXIOM of the week, finding new one');
        newData.shaderOfTheWeek = null;
        if (newData.publicShaders.length > 0) {
          // Find the highest scoring AXIOM (likes * 10 + views)
          const highestScoring = newData.publicShaders.reduce((best, current) => {
            const currentScore = (current.likes || 0) * 10 + (current.views || 0);
            const bestScore = (best.likes || 0) * 10 + (best.views || 0);
            return currentScore > bestScore ? current : best;
          });
          
          if (highestScoring) {
            console.log('New AXIOM of the week:', highestScoring);
            highestScoring.featured = true;
            newData.shaderOfTheWeek = highestScoring.id;
            const creatorAddr = highestScoring.author || 'anonymous';
            if (newData.creatorStats[creatorAddr]) {
              newData.creatorStats[creatorAddr].featuredCount++;
            }
          }
        }
      }
      
      updateCreatorRanks(newData);
      saveGlobalData(newData);
    } else {
      console.log('Shader not found for deletion');
    }
  };

  const likeShader = (shaderId: string) => {
    console.log('=== LIKING SHADER ===');
    console.log('Shader ID:', shaderId);
    
    const newData = { ...globalData };
    const shader = newData.publicShaders.find(s => s.id === shaderId);
    
    if (shader) {
      shader.likes = (shader.likes || 0) + 1;
      console.log('New like count:', shader.likes);
      
      // Update creator stats
      const creatorAddress = shader.author || 'anonymous';
      if (newData.creatorStats[creatorAddress]) {
        newData.creatorStats[creatorAddress].totalLikes++;
        console.log('Updated creator likes:', newData.creatorStats[creatorAddress].totalLikes);
      }
      
      // Update global stats
      newData.globalStats.totalLikes++;
      
      // Add engine fee (2.5% of a theoretical transaction)
      newData.globalStats.engineFees += 0.025;
      newData.globalStats.axiTokenBuybacks += 0.025 * 0.5; // 50% goes to buybacks
      
      // Check if this AXIOM should become AXIOM of the week (highest score)
      const currentFeatured = newData.publicShaders.find(s => s.featured);
      const currentScore = (shader.likes || 0) * 10 + (shader.views || 0);
      const featuredScore = currentFeatured ? (currentFeatured.likes || 0) * 10 + (currentFeatured.views || 0) : 0;
      
      if (!currentFeatured || currentScore > featuredScore) {
        console.log('New AXIOM of the week due to likes!');
        
        // Remove featured from current
        if (currentFeatured) {
          currentFeatured.featured = false;
          const prevCreatorAddress = currentFeatured.author || 'anonymous';
          if (newData.creatorStats[prevCreatorAddress]) {
            newData.creatorStats[prevCreatorAddress].featuredCount--;
          }
        }
        
        // Set new featured
        shader.featured = true;
        newData.shaderOfTheWeek = shader.id;
        if (newData.creatorStats[creatorAddress]) {
          newData.creatorStats[creatorAddress].featuredCount++;
        }
      }
      
      updateCreatorRanks(newData);
      saveGlobalData(newData);
    } else {
      console.log('Shader not found for liking');
    }
  };

  const viewShader = (shaderId: string) => {
    console.log('=== VIEWING SHADER ===');
    console.log('Shader ID:', shaderId);
    
    const newData = { ...globalData };
    const shader = newData.publicShaders.find(s => s.id === shaderId);
    
    if (shader) {
      shader.views = (shader.views || 0) + 1;
      console.log('New view count:', shader.views);
      
      // Update creator stats
      const creatorAddress = shader.author || 'anonymous';
      if (newData.creatorStats[creatorAddress]) {
        newData.creatorStats[creatorAddress].totalViews++;
        console.log('Updated creator views:', newData.creatorStats[creatorAddress].totalViews);
      }
      
      // Update global stats
      newData.globalStats.totalViews++;
      
      updateCreatorRanks(newData);
      saveGlobalData(newData);
    } else {
      console.log('Shader not found for viewing');
    }
  };

  const setShaderOfTheWeek = (shaderId: string | null) => {
    console.log('=== SETTING SHADER OF THE WEEK ===');
    console.log('Shader ID:', shaderId);
    
    const newData = { ...globalData };
    
    // Remove featured flag from previous shader
    if (newData.shaderOfTheWeek) {
      const prevShader = newData.publicShaders.find(s => s.id === newData.shaderOfTheWeek);
      if (prevShader) {
        prevShader.featured = false;
        const creatorAddress = prevShader.author || 'anonymous';
        if (newData.creatorStats[creatorAddress]) {
          newData.creatorStats[creatorAddress].featuredCount--;
        }
      }
    }
    
    // Set new AXIOM of the week
    newData.shaderOfTheWeek = shaderId;
    if (shaderId) {
      const shader = newData.publicShaders.find(s => s.id === shaderId);
      if (shader) {
        shader.featured = true;
        const creatorAddress = shader.author || 'anonymous';
        if (newData.creatorStats[creatorAddress]) {
          newData.creatorStats[creatorAddress].featuredCount++;
        }
      }
    }
    
    updateCreatorRanks(newData);
    saveGlobalData(newData);
  };

  const updateCreatorRanks = (data: GlobalData) => {
    console.log('=== UPDATING CREATOR RANKS ===');
    const creators = Object.values(data.creatorStats);
    console.log('Creators before ranking:', creators);
    
    creators.sort((a, b) => {
      const scoreA = a.totalLikes * 10 + a.totalViews + a.featuredCount * 100;
      const scoreB = b.totalLikes * 10 + b.totalViews + b.featuredCount * 100;
      return scoreB - scoreA;
    });
    
    creators.forEach((creator, index) => {
      creator.rank = index + 1;
    });
    
    console.log('Creators after ranking:', creators);
  };

  const getShaderOfTheWeek = (): Shader | null => {
    // Always show the highest scoring AXIOM if available
    if (globalData.publicShaders.length === 0) return null;
    
    // If there's a featured shader, show it
    if (globalData.shaderOfTheWeek) {
      const featuredShader = globalData.publicShaders.find(s => s.id === globalData.shaderOfTheWeek);
      if (featuredShader) return featuredShader;
    }
    
    // Otherwise, show the highest scoring one
    const highestScoring = globalData.publicShaders.reduce((best, current) => {
      const currentScore = (current.likes || 0) * 10 + (current.views || 0);
      const bestScore = (best.likes || 0) * 10 + (best.views || 0);
      return currentScore > bestScore ? current : best;
    });
    
    return highestScoring || null;
  };

  const getTopCreators = (): CreatorStats[] => {
    const creators = Object.values(globalData.creatorStats)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 5);
    
    console.log('=== TOP CREATORS ===');
    console.log('Returning creators:', creators);
    return creators;
  };

  const syncGlobalData = () => {
    console.log('=== SYNCING GLOBAL DATA ===');
    // Force a re-read from localStorage and shared storage to sync with other tabs/browsers
    try {
      const stored = localStorage.getItem(GLOBAL_STORAGE_KEY);
      const sharedStored = localStorage.getItem('axilab_shared_global');
      
      let latestData = globalData;
      
      if (stored) {
        const storedData = JSON.parse(stored);
        if (storedData.lastSync > latestData.lastSync) {
          console.log('Found newer data in local storage');
          latestData = storedData;
        }
      }
      
      if (sharedStored) {
        const sharedData = JSON.parse(sharedStored);
        if (sharedData.lastSync > latestData.lastSync) {
          console.log('Found newer data in shared storage');
          latestData = sharedData;
        }
      }
      
      if (latestData.lastSync > globalData.lastSync) {
        console.log('Updating global data with newer version');
        setGlobalData(latestData);
      } else {
        console.log('Global data is already up to date');
      }
    } catch (error) {
      console.error('Error syncing global data:', error);
    }
  };

  return {
    publicShaders: globalData.publicShaders,
    globalCounter: globalData.globalCounter,
    globalStats: globalData.globalStats,
    addPublicShader,
    deletePublicShader,
    likeShader,
    viewShader,
    setShaderOfTheWeek,
    getShaderOfTheWeek,
    getTopCreators,
    syncGlobalData
  };
}
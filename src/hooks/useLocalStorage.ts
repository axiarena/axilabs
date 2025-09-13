import { useState, useEffect } from 'react';
import { setCrossDomainData, getCrossDomainData } from '../lib/crossDomainAuth';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // First check cross-domain data for auth-related keys
      if (key === 'currentUser' || key === 'userAuthType' || key === 'userProfile') {
        const crossData = getCrossDomainData(`crossDomain_${key}`);
        if (crossData !== null) {
          // Sync to localStorage
          window.localStorage.setItem(key, JSON.stringify(crossData));
          return crossData;
        }
      }
      
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // Sync auth-related data across subdomains
      if (key === 'currentUser' || key === 'userAuthType' || key === 'userProfile') {
        setCrossDomainData(`crossDomain_${key}`, valueToStore);
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
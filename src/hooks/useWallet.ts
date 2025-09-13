import { useState, useEffect } from 'react';
import { WalletConnection } from '../types/shader';

declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
  }
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if wallet was previously connected
    const savedWallet = localStorage.getItem('connectedWallet');
    if (savedWallet) {
      try {
        const walletData = JSON.parse(savedWallet);
        setWallet(walletData);
      } catch (error) {
        console.error('Error parsing saved wallet:', error);
      }
    }
  }, []);

  const connectMetaMask = async (): Promise<boolean> => {
    if (!window.ethereum) {
      alert('MetaMask is not installed! Please install MetaMask to continue.');
      return false;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const walletConnection: WalletConnection = {
          address: accounts[0],
          type: 'metamask',
          connected: true,
        };
        
        setWallet(walletConnection);
        localStorage.setItem('connectedWallet', JSON.stringify(walletConnection));
        return true;
      }
    } catch (error) {
      console.error('MetaMask connection error:', error);
      alert('Failed to connect to MetaMask. Please try again.');
    } finally {
      setIsConnecting(false);
    }
    return false;
  };

  const connectPhantom = async (): Promise<boolean> => {
    if (!window.solana || !window.solana.isPhantom) {
      alert('Phantom wallet is not installed! Please install Phantom to continue.');
      return false;
    }

    setIsConnecting(true);
    try {
      const response = await window.solana.connect();
      
      if (response.publicKey) {
        const walletConnection: WalletConnection = {
          address: response.publicKey.toString(),
          type: 'phantom',
          connected: true,
        };
        
        setWallet(walletConnection);
        localStorage.setItem('connectedWallet', JSON.stringify(walletConnection));
        return true;
      }
    } catch (error) {
      console.error('Phantom connection error:', error);
      alert('Failed to connect to Phantom. Please try again.');
    } finally {
      setIsConnecting(false);
    }
    return false;
  };

  const connectManually = (address: string): boolean => {
    if (!address.trim()) {
      alert('Please enter a valid wallet address.');
      return false;
    }

    const walletConnection: WalletConnection = {
      address: address.trim(),
      type: 'manual',
      connected: true,
    };
    
    setWallet(walletConnection);
    localStorage.setItem('connectedWallet', JSON.stringify(walletConnection));
    return true;
  };

  const disconnect = () => {
    setWallet(null);
    localStorage.removeItem('connectedWallet');
  };

  const formatAddress = (address: string): string => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return {
    wallet,
    isConnecting,
    connectMetaMask,
    connectPhantom,
    connectManually,
    disconnect,
    formatAddress,
  };
}
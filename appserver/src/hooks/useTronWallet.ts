import { useState, useEffect } from 'react';

export function useTronWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const checkTronLinkConnection = () => {
      // Safely check for tronWeb existence
      if (window.tronWeb?.defaultAddress?.base58) {
        setAddress(window.tronWeb.defaultAddress.base58);
        setIsConnected(true);
      } else {
        setAddress(null);
        setIsConnected(false);
      }
    };

    // Initial check
    checkTronLinkConnection();

    // Add event listener for wallet changes
    const handleMessage = () => checkTronLinkConnection();
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const connectWallet = async () => {
    try {
      // Safely check for tronLink
      if (window.tronLink) {
        // Attempt to request accounts
        const response = await window.tronLink.request({ method: 'tron_requestAccounts' });
        
        // Check if connection was successful
        if (response.code === 200 && window.tronWeb?.defaultAddress?.base58) {
          const walletAddress = window.tronWeb.defaultAddress.base58;
          setAddress(walletAddress);
          setIsConnected(true);
          return walletAddress;
        }
      } else {
        // Prompt to install TronLink
        alert('Please install TronLink wallet');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      setIsConnected(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setIsConnected(false);
  };

  return {
    address,
    isConnected,
    connectWallet,
    disconnectWallet
  };
}
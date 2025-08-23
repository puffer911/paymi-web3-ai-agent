'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../app/invoice/[id]/page.module.css';

export function WalletConnect() {
  const [address, setAddress] = useState<string | null>(null);
  const router = useRouter();

  const connectWallet = async () => {
    if (window.tronWeb) {
      try {
        // Try multiple methods of wallet connection
        if (window.tronWeb.request) {
          await window.tronWeb.request({ method: 'tron_requestAccounts' });
        } else if (window.tronWeb.enable) {
          await window.tronWeb.enable();
        }
        
        // Check if wallet is connected
        if (window.tronWeb.isConnected()) {
          const walletAddress = window.tronWeb.defaultAddress.base58;
          setAddress(walletAddress);
          
          // Optional: Refresh the page or update UI
          router.refresh();
        }
      } catch (error) {
        console.error('Wallet connection failed', error);
        alert('Failed to connect wallet. Please try again.');
      }
    } else {
      alert('TronLink wallet not detected. Please install TronLink.');
    }
  };

  useEffect(() => {
    // Check for existing connection on component mount
    if (window.tronWeb?.isConnected()) {
      setAddress(window.tronWeb.defaultAddress.base58);
    }
  }, []);

  return (
    <div className={styles.walletConnectContainer}>
      {address ? (
        <div className={styles.walletInfo}>
          <div className={styles.walletIcon}>
            {address.substring(0, 1)}
          </div>
          <div className={styles.walletAddress}>
            {address.substring(0, 6)}...{address.substring(address.length - 4)}
          </div>
        </div>
      ) : (
        <button 
          onClick={connectWallet} 
          className={styles.connectButton}
        >
          Connect TronLink Wallet
        </button>
      )}
    </div>
  );
}
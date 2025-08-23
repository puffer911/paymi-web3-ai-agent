'use client';

import { useState, useEffect } from 'react';
import { useTronWallet } from '@/hooks/useTronWallet';
import styles from './page.module.css';
import { implementationABI } from '../../../lib/contract/abi';
import React from 'react';

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  const { address, isConnected, connectWallet } = useTronWallet();
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const CONTRACT_ADDRESS = process.env.PAYMI_INVOICE_CONTRACT_ADDRESS;

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        if (!CONTRACT_ADDRESS) return;

        // Ensure TronWeb is available
        if (window.tronWeb) {
          const contract = window.tronWeb.contract(
            [...implementationABI], 
            CONTRACT_ADDRESS
          );

          const invoiceId = BigInt(id);
          const details = await contract.getInvoiceDetails(invoiceId).call();

          setInvoiceDetails({
            invoiceId: Number(invoiceId),
            freelancer: window.tronWeb.address.fromHex(details.freelancer),
            amount: Number(details.amount) / 1_000_000, // Convert from sun
            status: Number(details.status) === 0 ? 'Unpaid' : 'Paid',
            createdAt: new Date(Number(details.createdAt) * 1000).toLocaleString()
          });
        }
      } catch (err) {
        console.error('Failed to fetch invoice details:', err);
        setError('Failed to retrieve invoice details');
      }
    };

    fetchInvoiceDetails();
  });

  const handlePayInvoice = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      if (!CONTRACT_ADDRESS) return;

      if (window.tronWeb) {
        const contract = window.tronWeb.contract(
          [...implementationABI], 
          CONTRACT_ADDRESS 
        );

        const invoiceId = BigInt(id);
        
        // Implement your payment logic
        const transaction = await contract.payInvoice(invoiceId).send({
          feeLimit: 100_000_000,
          callValue: 0
        });

        // Handle successful payment
        console.log('Payment transaction:', transaction);
        
        // Optionally refresh invoice details
        // You might want to update the invoice status after payment
      }
    } catch (error) {
      console.error('Payment failed:', error);
      setError('Payment failed');
    }
  };

  if (error) {
    return <div className={styles.errorContainer}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.walletConnectContainer}>
        {!isConnected ? (
          <button 
            className={styles.connectButton} 
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        ) : (
          <div className={styles.walletInfo}>
            <div className={styles.walletIcon}>
              {address?.substring(0, 2)}
            </div>
            <span className={styles.walletAddress}>
              {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
            </span>
          </div>
        )}
      </div>

      {invoiceDetails && (
        <div className={styles.invoiceDetails}>
          <p>
            <strong>Invoice ID:</strong> 
            <span>{invoiceDetails.invoiceId}</span>
          </p>
          <p>
            <strong>Amount:</strong> 
            <span>{invoiceDetails.amount} TRX</span>
          </p>
          <p>
            <strong>Status:</strong> 
            <span>{invoiceDetails.status}</span>
          </p>
          <button 
            className={styles.payButton}
            onClick={handlePayInvoice}
            disabled={!isConnected || invoiceDetails.status === 'Paid'}
          >
            Pay Invoice
          </button>
        </div>
      )}
    </div>
  );
}
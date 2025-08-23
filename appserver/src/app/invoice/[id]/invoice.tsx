'use client';

import { useState, useEffect } from 'react';
import { useTronWallet } from '@/hooks/useTronWallet';
import styles from './page.module.css';
import { implementationABI } from '../../../lib/contract/abi';

type InvoiceDetails = {
  invoiceId: number;
  freelancer: string;
  amount: number;
  status: 'Unpaid' | 'Paid';
  createdAt: string;
};

export default function InvoicePageClient({ id }: { id: string }) {
  const { address, isConnected, connectWallet } = useTronWallet();
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PAYMI_INVOICE_CONTRACT_ADDRESS;
  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        if (!CONTRACT_ADDRESS || !window.tronWeb || !address) return;

        const contract = window.tronWeb.contract([...implementationABI], CONTRACT_ADDRESS);
        const invoiceId = BigInt(id);
        const details = await contract.getInvoiceDetails(invoiceId).call({from: address});

        setInvoiceDetails({
          invoiceId: Number(invoiceId),
          freelancer: window.tronWeb.address.fromHex(details.freelancer),
          amount: Number(details.amount) / 1_000_000,
          status: Number(details.status) === 0 ? 'Unpaid' : 'Paid',
          createdAt: new Date(Number(details.createdAt) * 1000).toLocaleString(),
        });
      } catch (err) {
        console.error('Failed to fetch invoice details:', err);
        setError('Failed to retrieve invoice details');
      }
    };

    fetchInvoiceDetails();
  }, [id, CONTRACT_ADDRESS, address]);

  const handlePayInvoice = async () => {
  if (!isConnected) {
    alert('Please connect your wallet first');
    return;
  }

  try {
    if (!CONTRACT_ADDRESS || !window.tronWeb || !address) return;

    const contract = window.tronWeb.contract([...implementationABI], CONTRACT_ADDRESS);
    const invoiceId = BigInt(id);

    // Check USDT allowance
    const usdtContractAddress = process.env.NEXT_PUBLIC_USDT_CONTRACT_ADDRESS;
    if (!usdtContractAddress) return;


    const uabi = [
        {
          "constant": true,
          "name": "allowance",
          "outputs": [{"type": "uint256"}],
          "inputs": [
            {"name": "owner", "type": "address"},
            {"name": "spender", "type": "address"}
          ],
          "type": "function"
        },
        {
          "constant": false,
          "name": "approve",
          "outputs": [{"type": "bool"}],
          "inputs": [
            {"name": "spender", "type": "address"},
            {"name": "amount", "type": "uint256"}
          ],
          "type": "function",
          "stateMutability": "nonpayable",
        }
      ];
    
    const usdtContract = window.tronWeb.contract([...uabi], usdtContractAddress);

      // Get current invoice amount
      const invoiceDetails = await contract.getInvoiceDetails(invoiceId).call({from: address});
      const invoiceAmount = Number(invoiceDetails.amount);

      // Check current allowance
      const currentAllowance = await usdtContract.allowance(address, CONTRACT_ADDRESS).call();
      const currentAllowanceNum = Number(currentAllowance);

      console.log(currentAllowanceNum, invoiceAmount);
      console.log(CONTRACT_ADDRESS, address)
      // If allowance is insufficient, request approval
      if (currentAllowanceNum < invoiceAmount) {
        // Request approval for the exact invoice amount
        const approvalTx = await usdtContract.approve(CONTRACT_ADDRESS, BigInt(invoiceAmount)).send({
          feeLimit: 100_000_000,
          callValue: 0,
          from: address
        });

        console.log('Approval transaction:', approvalTx);
        
        // Wait a moment for the approval to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

       console.log("payment", invoiceId);

      // Proceed with invoice payment
      const transaction = await contract.payInvoice(invoiceId).send({
        feeLimit: 100_000_000,
        callValue: 0,
        from: address
      });

      console.log('Payment transaction:', transaction);

      setInvoiceDetails((prev) => (prev ? { ...prev, status: 'Paid' } : prev));
    } catch (err) {
      console.error('Payment failed:', err);
      setError(`Payment failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (error) {
    return <div className={styles.errorContainer}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.walletConnectContainer}>
        {!isConnected ? (
          <button className={styles.connectButton} onClick={connectWallet}>
            Connect Wallet
          </button>
        ) : (
          <div className={styles.walletInfo}>
            <div className={styles.walletIcon}>{address?.substring(0, 2)}</div>
            <span className={styles.walletAddress}>
              {address}
            </span>
          </div>
        )}
      </div>

      {invoiceDetails && (
        <div className={styles.invoiceDetails}>
          <p>
            <strong>Invoice ID:</strong> <span>{invoiceDetails.invoiceId}</span>
          </p>
          <p>
            <strong>Amount:</strong> <span>{invoiceDetails.amount} USDT</span>
          </p>
          <p>
            <strong>Status:</strong> <span>{invoiceDetails.status}</span>
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

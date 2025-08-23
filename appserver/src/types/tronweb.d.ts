/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Window {
    tronLink?: {
      request: (params: { method: string }) => Promise<{ code: number }>;
      connect?: () => Promise<void>;
    };
    tronWeb?: {
      defaultAddress: {
        base58: string;
      };
      isConnected: () => boolean;
      currentProvider: string;
      request?: (params: { method: string }) => Promise<{ code?: number }>;
      enable?: () => Promise<string[]>;
      
      // Add contract method to the type definition
      contract: (
        abi: any[], 
        contractAddress: string
      ) => {
        getInvoiceDetails: (invoiceId: bigint) => {
          call: (options?: { from?: string }) => Promise<any>;
        };
        payInvoice: (invoiceId: bigint) => {
          send: (options: {
            feeLimit: number;
            callValue: number;
            from?: string | null;
          }) => Promise<any>;
        };
        allowance: (owner: string, spender: string) => {
          call: (options?: { from?: string }) => Promise<bigint>;
        };
        approve: (spender: string, amount: bigint) => {
          send: (options: {
            feeLimit: number;
            callValue: number;
            from: string;
          }) => Promise<any>;
        };
      };
      
      // Add address utility method
      address: {
        fromHex: (hexAddress: string) => string;
      };
    };
  }
}

export {};
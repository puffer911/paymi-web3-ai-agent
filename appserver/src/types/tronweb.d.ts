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
          call: () => Promise<any>;
        };
        payInvoice: (invoiceId: bigint) => {
          send: (options: {
            feeLimit: number;
            callValue: number;
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
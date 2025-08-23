// Define a generic contract ABI type
type ContractABI = Array<{
  type: string;
  name?: string;
  inputs?: Array<{ type: string; name?: string }>;
  outputs?: Array<{ type: string }>;
  stateMutability?: string;
}>;

// Define a more specific contract method return type
type ContractMethodCall<T> = {
  call: (options?: { from?: string }) => Promise<T>;
};

// Define a more specific contract method send type
type ContractMethodSend = {
  send: (options: {
    feeLimit: number;
    callValue: number;
    from: string;
  }) => Promise<string>; // Typically returns transaction hash
};

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
      
      // Improved contract method type definition
      contract: (
        abi: ContractABI, 
        contractAddress: string
      ) => {
        getInvoiceDetails: (invoiceId: bigint) => ContractMethodCall<{
          freelancer: string;
          amount: bigint;
          status: number;
          createdAt: bigint;
        }>;
        payInvoice: (invoiceId: bigint) => {
          send: (options: {
            feeLimit: number;
            callValue: number;
            from?: string | null;
          }) => Promise<string>;
        };
        allowance: (owner: string, spender: string) => ContractMethodCall<bigint>;
        approve: (spender: string, amount: bigint) => {
          send: (options: {
            feeLimit: number;
            callValue: number;
            from: string;
          }) => Promise<string>;
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
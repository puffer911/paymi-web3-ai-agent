export const implementationABI = [
    {
        "inputs": [{"name": "_usdtTokenAddress", "type": "address"}],
        "stateMutability": "nonpayable", // lowercase
        "type": "constructor" // lowercase
    },
    {
        "anonymous": false,
        "inputs": [{"indexed": true, "name": "invoiceId", "type": "uint256"}],
        "name": "InvoiceCancelled",
        "type": "event" // lowercase
    },
    {
        "anonymous": false,
        "inputs": [
        {"indexed": true, "name": "invoiceId", "type": "uint256"},
        {"indexed": true, "name": "freelancer", "type": "address"},
        {"indexed": false, "name": "amount", "type": "uint256"} // Add indexed: false for non-indexed params
        ],
        "name": "InvoiceCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
        {"indexed": true, "name": "invoiceId", "type": "uint256"},
        {"indexed": false, "name": "amount", "type": "uint256"}
        ],
        "name": "InvoicePaid",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "USDT_TOKEN",
        "outputs": [{"name": "", "type": "address"}], // Add name field
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
        {"name": "_freelancerAddress", "type": "address"},
        {"name": "_amount", "type": "uint256"}
        ],
        "name": "createInvoice",
        "outputs": [{"name": "invoiceId", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
        {"name": "", "type": "address"},
        {"name": "", "type": "uint256"}
        ],
        "name": "freelancerInvoices",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "_freelancer", "type": "address"}],
        "name": "getFreelancerInvoices",
        "outputs": [{"name": "", "type": "uint256[]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "_invoiceId", "type": "uint256"}],
        "name": "getInvoiceDetails",
        "outputs": [
        {"name": "freelancer", "type": "address"},
        {"name": "amount", "type": "uint256"},
        {"name": "status", "type": "uint8"},
        {"name": "createdAt", "type": "uint256"},
        {"name": "paidAt", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "invoiceCounter",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "", "type": "uint256"}],
        "name": "invoices",
        "outputs": [
        {"name": "freelancer", "type": "address"},
        {"name": "amount", "type": "uint256"},
        {"name": "status", "type": "uint8"},
        {"name": "createdAt", "type": "uint256"},
        {"name": "paidAt", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "_invoiceId", "type": "uint256"}],
        "name": "payInvoice",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "platformWallet",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "_newPlatform", "type": "address"}],
        "name": "setPlatformWallet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;
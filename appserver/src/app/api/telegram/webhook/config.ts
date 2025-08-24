export const CONFIG = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN!,
    TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET,
    CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_PAYMI_INVOICE_CONTRACT_ADDRESS,
    TRON_FULL_NODE_URL: process.env.TRON_FULL_NODE_URL,
    TRON_ADMIN_PRIVATE_KEY: process.env.TRON_ADMIN_PRIVATE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL!,
} as const;


// Messages configuration can be moved here or kept in route.ts
export const MESSAGES = {
  INVALID_INPUT:
    "Invalid input. Please provide a valid TRON address and amount.",
  INVOICE_SUCCESS: (
    transactionHash: string,
    recipientAddress: string,
    amount: string,
    invoiceId: bigint 
  ) =>
    `✅ Invoice Created Successfully!\n\n` +
    `Transaction Hash: ${transactionHash}\n` +
    `Recipient: ${recipientAddress}\n` +
    `Amount: ${amount} USDT\n\n` +
    `Invoice Link: ${CONFIG.NEXT_PUBLIC_APP_URL}/invoice/${invoiceId}\n\n` +
    `Track your invoice on TRON blockchain.`,
  CONTRACT_ERROR:
    "Sorry, there was an error creating the invoice. Please try again.",
  NO_INVOICES: "No invoices found.",
  INVOICES_ERROR: "Sorry, could not retrieve invoices.",
};
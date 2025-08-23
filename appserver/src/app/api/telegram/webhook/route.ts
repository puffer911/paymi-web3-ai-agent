import { NextRequest, NextResponse } from "next/server";
import { TronWeb } from "tronweb";

// Messages
const MESSAGES = {
  WELCOME: "Welcome to Paymi Invoice on TRON! 💸",
  CREATE_INVOICE_PROMPT:
    "Send invoice details:\nFormat: TRON_ADDRESS AMOUNT_USDT",
  LIST_INVOICE_PROMPT:
    "Please send the TRON wallet address to list invoices:",
  INVALID_INPUT:
    "Invalid input. Please provide a valid TRON address and amount.\n\nExample: TXyz... 500",
  INVOICE_SUCCESS: (
    transactionHash: string,
    recipientAddress: string,
    amount: string
  ) =>
    `✅ Invoice Created Successfully!\n\n` +
    `Transaction Hash: ${transactionHash}\n` +
    `Recipient: ${recipientAddress}\n` +
    `Amount: ${amount} USDT\n\n` +
    `Track your invoice on TRON blockchain.`,
  CONTRACT_ERROR:
    "Sorry, there was an error creating the invoice. Please try again.",
  NO_INVOICES: "No invoices found.",
  INVOICES_ERROR: "Sorry, could not retrieve invoices.",
};

// Env vars
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const CONTRACT_ADDRESS = process.env.PAYMI_INVOICE_CONTRACT_ADDRESS;
const TRON_FULL_NODE_URL = process.env.TRON_FULL_NODE_URL;
const TRON_ADMIN_PRIVATE_KEY = process.env.TRON_ADMIN_PRIVATE_KEY;

// TRON setup
const tronWeb = new TronWeb({
  fullHost: TRON_FULL_NODE_URL,
  privateKey: TRON_ADMIN_PRIVATE_KEY,
});

// Helper to send message
async function sendMessage(chatId: number, text: string, options?: unknown) {
  const payload = { chat_id: chatId, text, ...(options as object) };
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// Helper to answer callback
async function answerCallbackQuery(callbackQueryId: string) {
  await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId }),
    }
  );
}

export async function POST(request: NextRequest) {
    // Fix 1: Properly typed ABI with correct structure
    const implementationABI = [
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
    

  try {
    // Verify webhook secret
    const webhookSecret = request.headers.get(
      "x-telegram-bot-api-secret-token"
    );
    if (webhookSecret !== TELEGRAM_WEBHOOK_SECRET) {
      console.warn("Unauthorized webhook attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const update = await request.json();

    // Handle normal messages
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const prevMessage = update.message.reply_to_message;

      if (text === "/start") {
        const keyboard = {
          inline_keyboard: [
            [
              { text: "Create Invoice 💸", callback_data: "create_invoice" },
              { text: "List Invoices 📋", callback_data: "list_invoices" },
            ],
          ],
        };

        await sendMessage(chatId, MESSAGES.WELCOME, {
          reply_markup: keyboard,
        });
        return NextResponse.json({ status: "ok" });
      }

      // Handle listing invoices
      if (prevMessage?.text === MESSAGES.LIST_INVOICE_PROMPT) {
        const userAddress = text.trim();

        if (!tronWeb.isAddress(userAddress)) {
          await sendMessage(
            chatId,
            "Invalid TRON address. Please enter a valid TRON wallet address."
          );
          return NextResponse.json({ status: "invalid_address" });
        }

        try {
          if (!CONTRACT_ADDRESS) {
            throw new Error("Contract Address is not defined");
          }

          
          const contract = await tronWeb.contract(implementationABI, CONTRACT_ADDRESS);
        //   const contract = await tronWeb.contract().at(CONTRACT_ADDRESS);
          const invoiceIds = await contract
            .methods['getFreelancerInvoices'](userAddress)
            .call();

          if (invoiceIds.length === 0) {
            await sendMessage(chatId, MESSAGES.NO_INVOICES);
            return NextResponse.json({ status: "no_invoices" });
          }

          let invoiceMessage = `📋 Invoices for ${userAddress}:\n\n`;

          for (const invoiceId of invoiceIds) {
            const invoiceDetails = await contract
              .getInvoiceDetails(invoiceId)
              .call();

            const amountInUSDT = Number(invoiceDetails.amount) / 1_000_000;
            const statusText =
              invoiceDetails.status === 1 ? "✅ Paid" : "⏳ Unpaid";
            const createdAt = new Date(
              Number(invoiceDetails.createdAt) * 1000
            ).toLocaleString();
            const paidAt =
              invoiceDetails.status === 1
                ? new Date(
                    Number(invoiceDetails.paidAt) * 1000
                  ).toLocaleString()
                : "Not paid";

            invoiceMessage += `Invoice #${invoiceId}:\n` +
              `Freelancer: ${invoiceDetails.freelancer}\n` +
              `Amount: ${amountInUSDT} USDT\n` +
              `Status: ${statusText}\n` +
              `Created: ${createdAt}\n` +
              `Paid At: ${paidAt}\n\n`;
          }

          await sendMessage(chatId, invoiceMessage);
        } catch (err) {
          console.error("Invoices Retrieval Error:", err);
          await sendMessage(chatId, MESSAGES.INVOICES_ERROR);
        }
      }

      // Handle invoice creation
      if (prevMessage?.text === MESSAGES.CREATE_INVOICE_PROMPT) {
        const [recipientAddress, amount] = text.split(" ");

        if (!tronWeb.isAddress(recipientAddress) || isNaN(Number(amount))) {
          await sendMessage(chatId, MESSAGES.INVALID_INPUT);
          return NextResponse.json({ status: "invalid_input" });
        }

        try {
          if (!CONTRACT_ADDRESS) {
            throw new Error("Contract Address is not defined");
          }

          const contract = await tronWeb.contract(implementationABI, CONTRACT_ADDRESS);
          const invoiceTx = await contract
            .methods['createInvoice'](recipientAddress, tronWeb.toSun(amount))
            .send({ feeLimit: 100_000_000, callValue: 0 });

          await sendMessage(
            chatId,
            MESSAGES.INVOICE_SUCCESS(invoiceTx, recipientAddress, amount)
          );
        } catch (err) {
          console.error("Contract Interaction Error:", err);
          await sendMessage(chatId, MESSAGES.CONTRACT_ERROR);
        }
      }
    }

    // Handle callback queries
    if (update.callback_query) {
      const chatId = update.callback_query.message.chat.id;
      const data = update.callback_query.data;

      if (data === "create_invoice") {
        await sendMessage(chatId, MESSAGES.CREATE_INVOICE_PROMPT, {
          reply_markup: { force_reply: true },
        });
      }
      if (data === "list_invoices") {
        await sendMessage(chatId, MESSAGES.LIST_INVOICE_PROMPT, {
          reply_markup: { force_reply: true },
        });
      }

      await answerCallbackQuery(update.callback_query.id);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

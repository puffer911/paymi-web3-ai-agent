import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendMessage } from './utils';
import { handleListInvoices, handleCreateInvoice, validateTronAddress } from './sc';
import { saveTelegramUserAddress, getTelegramUserAddress } from './db';
import { CONFIG } from './config';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY!);

// Intent recognition prompt
const INTENT_PROMPT = `
You are an AI assistant helping users manage TRON blockchain invoices. 
Analyze the user's message and classify the intent into one of these categories:

1. SET_ADDRESS - User wants to set or update their TRON wallet address
2. GET_ADDRESS - User wants to retrieve their current address or get guidance
3. CREATE_INVOICE - User wants to create an invoice with a recipient and amount
4. LIST_INVOICES - User wants to list their invoices
5. SHOW_BALANCE - User wants to see their USDT and TRX balance
6. UNKNOWN - Cannot determine the user's intent

Response format (JSON):
{
  "intent": "INTENT_CATEGORY",
  "details": {
    "address": "TRON_ADDRESS", // for SET_ADDRESS
    "recipientAddress": "RECIPIENT_TRON_ADDRESS", // for CREATE_INVOICE
    "amount": "INVOICE_AMOUNT" // for CREATE_INVOICE
  }
}
`;

interface TelegramUpdate {
  message: {
    chat: {
      id: number;
    };
    text: string;
    from: {
      id: number;
    };
  };
}

export async function handleMessage(update: TelegramUpdate) {
  const chatId = update.message.chat.id;
  const text = update.message.text;
  const from = update.message.from;

  try {
    // Capture intent using Gemini AI
    const intent = await captureIntent(text);

    // Handle different intents
    switch (intent.intent) {
      case 'SET_ADDRESS':
        await handleSetAddress(chatId, from.id, intent.details.address);
        break;
      case 'GET_ADDRESS':
        await handleGetAddress(chatId, from.id);
        break;
      case 'CREATE_INVOICE':
        await handleInvoiceCreation(chatId, from.id, intent.details);
        break;
      case 'LIST_INVOICES':
        await handleInvoiceList(chatId, from.id);
        break;
      default:
        await handleUnknownIntent(chatId, from.id);
    }
  } catch (error) {
    console.error('Message handling error:', error);
    await sendMessage(chatId, "Sorry, I encountered an error processing your request.");
  }
}

async function handleSetAddress(chatId: number, telegramId: number, address?: string) {
  if (!address) {
    await sendMessage(chatId, "❌ Could not extract a valid TRON address.");
    return;
  }

  // Validate address
  const validation = await validateTronAddress(address);
  
  if (!validation.isValid) {
    await sendMessage(chatId, validation.message || "Invalid address");
    return;
  }

  try {
    await saveTelegramUserAddress(telegramId, address);
    await sendMessage(chatId, `✅ Address set to: ${address}\n${validation.message}`);
  } catch (error) {
    console.log(error)
    await sendMessage(chatId, "❌ Failed to update address. Please try again.");
  }
}

async function handleGetAddress(chatId: number, telegramId: number) {
  const guidance = await generateUserGuidance(telegramId);
  await sendMessage(chatId, guidance);
}

async function handleInvoiceCreation(
  chatId: number, 
  telegramId: number, 
  details: { recipientAddress?: string; amount?: string }
) {
  // Check if user has a saved address
  const userAddress = await getTelegramUserAddress(telegramId);
  
  if (!userAddress) {
    await sendMessage(chatId, 
      "❌ You need to set your TRON address first!\n" +
      "Use 'My address is TXyz...'"
    );
    return;
  }

  if (!details.recipientAddress || !details.amount) {
    await sendMessage(chatId, "❌ Please specify both recipient address and amount.");
    return;
  }

  if (isNaN(Number(details.amount))) {
    await sendMessage(chatId, "❌ Invalid amount. Please enter a number.");
    return;
  }

  try {
    await handleCreateInvoice(chatId, details.recipientAddress, details.amount);
  } catch (error) {
    console.error("Invoice creation error:", error);
    await sendMessage(chatId, "❌ Failed to create invoice. Please try again later.");
  }
}


async function handleInvoiceList(chatId: number, telegramId: number) {
  const userAddress = await getTelegramUserAddress(telegramId);

  if (!userAddress) {
    await sendMessage(chatId, 
      "❌ You need to set your TRON address first!\n" +
      "Use 'My address is TXyz...'"
    );
    return;
  }

  await handleListInvoices(chatId, userAddress);
}

async function handleUnknownIntent(chatId: number, telegramId: number) {
  const guidance = await generateUserGuidance(telegramId);
  await sendMessage(chatId, guidance);
}

async function captureIntent(text: string) {
  try {
    const model = genAI.getGenerativeModel({ model: CONFIG.GEMINI_MODEL });
    
    const prompt = `${INTENT_PROMPT}\n\nUser Message: ${text}`;
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Remove any markdown code block formatting
    const cleanResponse = response.replace(/```json\n?|```/g, '').trim();
    
    return JSON.parse(cleanResponse);
  } catch (error) {
    console.error('Intent capture error:', error);
    throw new Error('Failed to capture intent');
  }
}

async function generateUserGuidance(telegramId: number): Promise<string> {
  const userAddress = await getTelegramUserAddress(telegramId);

  const projectIntro = 
    "Hi there! Welcome to <b>Paymi</b>, your friendly assistant for managing <b>USDT invoices</b> on the TRON blockchain. \n\n" +
    "Please use Paymi to create and manage your USDT invoices directly on <b>TRON, ensuring instant, secure, and transparent transactions</b>.\n\n";

  if (!userAddress) {
    return projectIntro +
           "❌ <b>You haven't set your TRON address yet. Please set it up to get started.</b>\n\n" +
           "To set your address, please use this command: `My address is TXyz...`\n" +
           "Paymi supports USDT invoicing on the TRON network.\n" +
           "<b>Please verify your address carefully to avoid any financial loss.</b>";
  }

  return projectIntro +
         `ℹ️ <b>Your TRON Address:</b> ${userAddress}\n\n` +
         "Here's what you can do:\n" +
         "- Create a USDT Invoice: `Create invoice for Recipient 500 USDT`\n" +
         "- List your USDT Invoices: `List my invoices`\n" +
         "- Show your Balance: `Show my balance`\n" + 
         "- Update your Address: `My address is TNewAddress`\n" +
         "<b>All invoices are settled in USDT on the TRON blockchain.</b> Have a great day!";
}


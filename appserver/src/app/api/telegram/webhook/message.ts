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
5. UNKNOWN - Cannot determine the user's intent

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
    await sendMessage(chatId, "❌ Could not extract invoice details.");
    return;
  }

  try {
    await handleCreateInvoice(chatId, details.recipientAddress, details.amount);
  } catch (error) {
    console.log(error)
    await sendMessage(chatId, "❌ Failed to create invoice.");
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
  await sendMessage(chatId, 
    "I'm not sure what you want. Here are some suggestions:\n\n" +
    guidance
  );
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
    "🚀 Paymi: USDT Invoicing on TRON Blockchain 💸\n\n" +
    "Create and manage USDT invoices directly on TRON, " +
    "with instant, secure, and transparent transactions.\n\n";

  if (!userAddress) {
    return projectIntro +
           "❌ No TRON address set. \n\n" +
           "Get started:\n" +
           "- Set TRON address: 'My address is TXyz...'\n" +
           "- Supports USDT invoicing on TRON network\n" +
           "⚠️ Verify address to prevent financial loss";
  }

  return projectIntro +
         `ℹ️ Your TRON Address: ${userAddress}\n\n` +
         "USDT Invoice Actions:\n" +
         "- Create USDT Invoice: 'Create invoice for TRecipient 500 USDT'\n" +
         "- List USDT Invoices: 'List my invoices'\n" +
         "- Update Address: 'My address is TNewAddress'\n" +
         "💡 All invoices settled in USDT on TRON blockchain";
}
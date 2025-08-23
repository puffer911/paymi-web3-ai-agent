import { NextRequest, NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { TronWeb } from 'tronweb';

// Messages
const MESSAGES = {
  WELCOME: 'Welcome to Paymi Invoice on TRON! 💸',
  CREATE_INVOICE_PROMPT: 'Send invoice details:\nFormat: TRON_ADDRESS AMOUNT_USDT',
  LIST_INVOICE_PROMPT: 'Please send the TRON wallet address to list invoices:',
  INVALID_INPUT: 'Invalid input. Please provide a valid TRON address and amount.\n\nExample: TXyz... 500',
  INVOICE_SUCCESS: (transactionHash: string, recipientAddress: string, amount: string) => 
    `✅ Invoice Created Successfully!\n\n` +
    `Transaction Hash: ${transactionHash}\n` +
    `Recipient: ${recipientAddress}\n` +
    `Amount: ${amount} USDT\n\n` +
    `Track your invoice on TRON blockchain.`,
  CONTRACT_ERROR: 'Sorry, there was an error creating the invoice. Please try again.',
  NO_INVOICES: 'No invoices found.',
  INVOICES_ERROR: 'Sorry, could not retrieve invoices.'
};

// Telegram bot setup
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('Telegram Bot Token is not defined');
}
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { webHook: true });

// TRON setup
const tronWeb = new TronWeb({
  fullHost: process.env.TRON_FULL_NODE_URL,
  privateKey: process.env.TRON_ADMIN_PRIVATE_KEY
});

const CONTRACT_ADDRESS = process.env.PAYMI_INVOICE_CONTRACT_ADDRESS;

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = request.headers.get('x-telegram-bot-api-secret-token');
    if (webhookSecret !== TELEGRAM_WEBHOOK_SECRET) {
      console.warn('Unauthorized webhook attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse the incoming webhook payload
    const update = await request.json();

    // Handle callback queries
    if (update.callback_query) {
    const chatId = update.callback_query.message.chat.id;
    const data = update.callback_query.data;

    switch(data) {
        case 'create_invoice':
        await bot.sendMessage(chatId, MESSAGES.CREATE_INVOICE_PROMPT, {
            reply_markup: {
            force_reply: true
            }
        });
        break;

        case 'list_invoices':
        await bot.sendMessage(chatId, MESSAGES.LIST_INVOICE_PROMPT, {
            reply_markup: {
            force_reply: true
            }
        });
        break;
    }

    // Always answer the callback query
    await bot.answerCallbackQuery(update.callback_query.id);
    }

    // Handle direct message after callback
    if (update.message) {
        const chatId = update.message.chat.id;
        const text = update.message.text;
        const prevMessage = update.message.reply_to_message;
        // const userId = update.message.from.id;

        // Interactive menu
        if (text === '/start') {
            const keyboard = {
                inline_keyboard: [
                    [
                    { 
                        text: "Create Invoice 💸", 
                        callback_data: "create_invoice" 
                    },
                    { 
                        text: "List Invoices 📋", 
                        callback_data: "list_invoices" 
                    }
                    ]
                ]
            };

            await bot.sendMessage(chatId, 'Welcome to Paymi Invoice on TRON! 💸', {
                reply_markup: keyboard
            });
            return NextResponse.json({ status: 'ok' });
        }


        // Handle invoice listing for user-provided address
        if (prevMessage?.text === MESSAGES.LIST_INVOICE_PROMPT) {
            const userAddress = text.trim();

            // Validate TRON address
            if (!tronWeb.isAddress(userAddress)) {
            await bot.sendMessage(chatId, 'Invalid TRON address. Please enter a valid TRON wallet address.');
            return NextResponse.json({ status: 'invalid_address' });
            }

            try {
            if (!CONTRACT_ADDRESS) {
                throw new Error('Contract Address is not defined');
            }

            // Create contract instance
            const contract = await tronWeb.contract().at(CONTRACT_ADDRESS);

            // Get invoice IDs for the provided address
            const invoiceIds = await contract.getFreelancerInvoices(userAddress).call();

            if (invoiceIds.length === 0) {
                await bot.sendMessage(chatId, MESSAGES.NO_INVOICES);
                return NextResponse.json({ status: 'no_invoices' });
            }

            // Fetch details for each invoice
            let invoiceMessage = `📋 Invoices for ${userAddress}:\n\n`;
            
            for (const invoiceId of invoiceIds) {
                // Get invoice details
                const invoiceDetails = await contract.getInvoiceDetails(invoiceId).call();

                // Convert amount from sun to USDT (assuming 6 decimal places)
                const amountInUSDT = Number(invoiceDetails.amount) / 1_000_000;

                // Determine status
                const statusText = invoiceDetails.status === 1 ? '✅ Paid' : '⏳ Unpaid';

                // Convert timestamps
                const createdAt = new Date(Number(invoiceDetails.createdAt) * 1000).toLocaleString();
                const paidAt = invoiceDetails.status === 1 
                ? new Date(Number(invoiceDetails.paidAt) * 1000).toLocaleString()
                : 'Not paid';

                invoiceMessage += `Invoice #${invoiceId}:\n` +
                `Freelancer: ${invoiceDetails.freelancer}\n` +
                `Amount: ${amountInUSDT} USDT\n` +
                `Status: ${statusText}\n` +
                `Created: ${createdAt}\n` +
                `Paid At: ${paidAt}\n\n`;
            }

            await bot.sendMessage(chatId, invoiceMessage);

            } catch (error) {
                await bot.sendMessage(chatId, MESSAGES.INVOICES_ERROR);
                console.error('Invoices Retrieval Error:', error);
            }
        }

        // Handle invoice creation
        if (prevMessage?.text === MESSAGES.CREATE_INVOICE_PROMPT) {
            const [recipientAddress, amount] = text.split(' ');

            // Validate TRON address
            if (!tronWeb.isAddress(recipientAddress) || isNaN(Number(amount))) {
                await bot.sendMessage(chatId, MESSAGES.INVALID_INPUT);
                return NextResponse.json({ status: 'invalid_input' });
            }

            try {
                if (!CONTRACT_ADDRESS) {
                    throw new Error('Contract Address is not defined');
                }

                // Create contract instance
                const contract = await tronWeb.contract().at(CONTRACT_ADDRESS);

                // Call contract method to create invoice
                const invoiceTransaction = await contract.createInvoice(
                    recipientAddress, 
                    tronWeb.toSun(amount)
                ).send({
                    feeLimit: 100_000_000,
                    callValue: 0
                });

                // Send confirmation to user
                await bot.sendMessage(chatId, 
                    MESSAGES.INVOICE_SUCCESS(invoiceTransaction, recipientAddress, amount)
                );

            } catch (contractError) {
                await bot.sendMessage(chatId, MESSAGES.CONTRACT_ERROR);
                console.error('Contract Interaction Error:', contractError);
            }
        }

    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
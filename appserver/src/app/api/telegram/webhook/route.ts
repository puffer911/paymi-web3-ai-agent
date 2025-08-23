import { NextRequest, NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

// Ensure the bot token is available
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('Telegram Bot Token is not defined');
}

// Create a bot instance (but don't start polling)
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { webHook: true });

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret for additional security
    const webhookSecret = request.headers.get('x-telegram-bot-api-secret-token');
    if (webhookSecret !== TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse the incoming webhook payload
    const update = await request.json();

    // Handle different types of updates
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;

      // Basic message handling
      if (text === '/start') {
        await bot.sendMessage(chatId, 'Welcome! I am your bot.');
      } else {
        await bot.sendMessage(chatId, `Alisa You said: ${text}`);
      }
    }

    // Handle other update types like callbacks, inline queries, etc.
    if (update.callback_query) {
      // Handle callback queries
      const callbackQueryId = update.callback_query.id;
      await bot.answerCallbackQuery(callbackQueryId, {
        text: 'Callback received!'
      });
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
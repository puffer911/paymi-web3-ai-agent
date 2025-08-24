import { CONFIG } from './config';

// Helper to send message
export async function sendMessage(chatId: number, text: string, options?: unknown) {
  const payload = { chat_id: chatId, parse_mode: "HTML", text, ...(options as object) };
  await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
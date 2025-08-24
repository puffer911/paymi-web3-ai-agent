import { NextRequest, NextResponse } from "next/server";
import { CONFIG } from './config';
import { 
  handleMessage, 
} from './message';

export async function POST(request: NextRequest) {

  try {
    // Verify webhook secret
    const webhookSecret = request.headers.get(
      "x-telegram-bot-api-secret-token"
    );
    if (webhookSecret !== CONFIG.TELEGRAM_WEBHOOK_SECRET) {
      console.warn("Unauthorized webhook attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const update = await request.json();

    // Handle normal messages
    if (update.message) {
      await handleMessage(update);
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


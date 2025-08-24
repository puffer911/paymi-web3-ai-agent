import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config';

// Supabase client initialization
const supabase = createClient(
  CONFIG.NEXT_PUBLIC_SUPABASE_URL!, 
  CONFIG.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Save recipient address for a Telegram user
export async function saveTelegramUserAddress(telegramId: number, recipientAddress: string) {
  try {
    const { error } = await supabase
      .from('telegram_users')
      .upsert({ 
        telegram_id: telegramId, 
        recipient_address: recipientAddress 
      }, {
        onConflict: 'telegram_id'
      });

    if (error) {
      console.error('Error saving recipient address:', error);
      throw error;
    }
  } catch (err) {
    console.error('Unexpected error in saveTelegramUserAddress:', err);
    throw err;
  }
}

// Get user's saved address
export async function getTelegramUserAddress(telegramId: number): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('telegram_users')
      .select('recipient_address')
      .eq('telegram_id', telegramId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No user found
      }
      throw error;
    }

    return data.recipient_address;
  } catch (err) {
    console.error('Error retrieving user address:', err);
    return null;
  }
}